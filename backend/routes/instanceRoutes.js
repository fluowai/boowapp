const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { readDb, writeDb } = require('../db');
const { createChatwootInbox } = require('../services/chatwootService');
const router = express.Router();

const { EVOLUTION_API_URL, EVOLUTION_API_KEY } = process.env;

// Middleware para verificar a configuração da Evolution API
const checkEvolutionApiConfig = (req, res, next) => {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        return res.status(500).json({
            error: 'Configuração do servidor incompleta.',
            message: 'As variáveis de ambiente EVOLUTION_API_URL e EVOLUTION_API_KEY devem ser definidas no backend.'
        });
    }
    next();
};

const evolutionApiHeaders = { 'apikey': EVOLUTION_API_KEY };

// Função para tratar erros do Axios de forma padronizada
const handleEvolutionApiError = (error, res, action) => {
    console.error(`Erro na comunicação com a Evolution API durante a ação '${action}':`, error.response?.data || error.message);
    const status = error.response?.status || 502; // Bad Gateway
    const message = error.response?.data?.message || error.response?.data?.error || `Falha ao ${action}.`;
    res.status(status).json({ error: `Erro na API da Evolution: ${message}` });
};


// GET /instance/fetchInstances
router.get('/fetchInstances', checkEvolutionApiConfig, async (req, res) => {
    try {
        // 1. Obter instâncias da Evolution API (fonte da verdade para status)
        const evolutionResponse = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, { headers: evolutionApiHeaders });
        // A API retorna um array diretamente
        const realInstances = Array.isArray(evolutionResponse.data) ? evolutionResponse.data : [];
        const realInstanceMap = new Map(realInstances.map(inst => [inst.instance.instanceName, inst.instance]));

        // 2. Obter instâncias do nosso DB (fonte da verdade para configurações)
        const db = await readDb();
        const dbInstances = db.instances || [];
        
        // 3. Sincronizar e mesclar os dados
        let dbWasModified = false;
        const finalInstances = dbInstances.map(dbInst => {
            const realInst = realInstanceMap.get(dbInst.name);
            if (realInst) {
                // Instância existe em ambos; atualiza o status do DB com o status real
                dbInst.status = realInst.status;
                dbInst.ownerJid = realInst.owner;
                dbInst.profileName = realInst.profileName;
                realInstanceMap.delete(dbInst.name); // Remove para rastrear instâncias novas
            } else {
                // Instância só existe no nosso DB; marcar como offline
                if (dbInst.status !== 'close') {
                    dbInst.status = 'close';
                    dbWasModified = true;
                }
            }
            return dbInst;
        });

        // Adicionar instâncias que existem na Evolution API mas não no nosso DB
        for (const realInst of realInstanceMap.values()) {
            finalInstances.push({
                id: uuidv4(),
                name: realInst.instanceName,
                status: realInst.status,
                ownerJid: realInst.owner,
                profileName: realInst.profileName,
                createdAt: new Date().toISOString(),
                Webhook: { enabled: false, url: '', urls: [] },
                Chatwoot: { enabled: false, url: '', token: '', accountId: '', inboxId: '' },
                OpenAI: { enabled: false, apiKey: '', model: 'gpt-3.5-turbo', prompt: '' },
                Gemini: { enabled: false, apiKey: '', model: 'gemini-pro', prompt: '' },
            });
            dbWasModified = true;
        }

        if (dbWasModified) {
            await writeDb({ ...db, instances: finalInstances });
        }

        res.json({ instances: finalInstances });

    } catch (error) {
        handleEvolutionApiError(error, res, 'buscar instâncias');
    }
});

// POST /instance/create
router.post('/create', checkEvolutionApiConfig, async (req, res) => {
    const { instanceName, chatwootIntegration } = req.body;

    if (!instanceName) {
        return res.status(400).json({ error: 'O nome da instância é obrigatório.' });
    }

    try {
        const db = await readDb();
        if (db.instances.some(inst => inst.name === instanceName)) {
            return res.status(409).json({ error: `A instância "${instanceName}" já existe.` });
        }

        // 1. Prepara o payload para ser encaminhado para a Evolution API.
        // Começa com o corpo da requisição do frontend, que já vem no formato correto.
        const evolutionPayload = { ...req.body };
        // Remove a nossa propriedade de controle interna para não a enviar para a API externa.
        delete evolutionPayload.chatwootIntegration;

        let localInstanceConfig = {
            Webhook: { enabled: false, url: '', urls: [] },
            Chatwoot: { enabled: false, url: '', token: '', accountId: '', inboxId: '' },
            OpenAI: { enabled: false, apiKey: '', model: 'gpt-3.5-turbo', prompt: '' },
            Gemini: { enabled: false, apiKey: '', model: 'gemini-pro', prompt: '' },
        };
        
        // 2. Se a automação do Chatwoot for solicitada, lida com ela no servidor.
        if (chatwootIntegration?.automate && chatwootIntegration.settings) {
            try {
                const { inbox, webhookUrl } = await createChatwootInbox(instanceName, chatwootIntegration.settings);
                
                // Adiciona os campos ao payload que será enviado para a Evolution API, conforme a documentação
                Object.assign(evolutionPayload, {
                    chatwootUrl: chatwootIntegration.settings.apiUrl,
                    chatwootToken: chatwootIntegration.settings.apiToken,
                    chatwootAccountId: chatwootIntegration.settings.accountId,
                    chatwootNameInbox: `Evo - ${instanceName}`,
                    chatwootReopenConversation: true,
                    chatwootSignMsg: true,
                    webhook: {
                        url: webhookUrl,
                        byEvents: false,
                        enabled: true,
                    }
                });
                
                // Prepara a configuração para salvar em nosso db.json local.
                localInstanceConfig.Chatwoot = {
                    enabled: true,
                    url: chatwootIntegration.settings.apiUrl,
                    token: chatwootIntegration.settings.apiToken,
                    accountId: chatwootIntegration.settings.accountId,
                    inboxId: inbox.id.toString(),
                    inboxName: inbox.name,
                    autoCreateInbox: false,
                };
                localInstanceConfig.Webhook = {
                    enabled: true,
                    url: webhookUrl,
                    urls: [webhookUrl],
                };

            } catch (automationError) {
                console.error(`ERRO na automação do Chatwoot para "${instanceName}":`, automationError.message);
                return res.status(500).json({ error: 'Falha na automação do Chatwoot.', message: automationError.message });
            }
        }
        
        // 3. Encaminha o payload finalizado para a Evolution API.
        await axios.post(`${EVOLUTION_API_URL}/instance/create`, evolutionPayload, { headers: evolutionApiHeaders });

        // 4. Salva a nova instância em nosso banco de dados.
        const newInstance = {
            id: uuidv4(),
            name: instanceName,
            status: 'close',
            createdAt: new Date().toISOString(),
            ...localInstanceConfig,
        };

        db.instances.push(newInstance);
        await writeDb(db);

        const successMessage = chatwootIntegration?.automate
            ? `Instância ${instanceName} criada e integrada com sucesso.`
            : `Instância ${instanceName} criada com sucesso.`;

        res.status(201).json({ success: true, message: successMessage, instance: newInstance });

    } catch (error) {
        handleEvolutionApiError(error, res, 'criar instância');
    }
});


// DELETE /instance/delete/:instanceName
router.delete('/delete/:instanceName', checkEvolutionApiConfig, async (req, res) => {
    const { instanceName } = req.params;
    try {
        // 1. Deleta da Evolution API
        await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { headers: evolutionApiHeaders });

        // 2. Deleta do nosso DB
        const db = await readDb();
        db.instances = db.instances.filter(inst => inst.name !== instanceName);
        await writeDb(db);
        
        res.json({ success: true, message: `Instância ${instanceName} excluída com sucesso.` });

    } catch (error) {
        handleEvolutionApiError(error, res, 'excluir instância');
    }
});

// GET /instance/connect/:instanceName
router.get('/connect/:instanceName', checkEvolutionApiConfig, async (req, res) => {
    const { instanceName } = req.params;
    try {
        const response = await axios.get(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, { headers: evolutionApiHeaders });
        res.json(response.data);
    } catch (error) {
        handleEvolutionApiError(error, res, 'conectar instância');
    }
});

// DELETE /instance/logout/:instanceName
router.delete('/logout/:instanceName', checkEvolutionApiConfig, async (req, res) => {
    const { instanceName } = req.params;
    try {
        const response = await axios.delete(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, { headers: evolutionApiHeaders });
        res.json(response.data);
    } catch (error) {
        handleEvolutionApiError(error, res, 'fazer logout da instância');
    }
});

// ROTA CORRIGIDA: GET /instance/message/fetchMessages/:instanceName
router.get('/message/fetchMessages/:instanceName', checkEvolutionApiConfig, async (req, res) => {
    const { instanceName } = req.params;
    try {
        // CORREÇÃO: O endpoint correto é /message/fetchMessages e não /messages/fetch.
        const response = await axios.get(`${EVOLUTION_API_URL}/message/fetchMessages/${instanceName}`, { headers: evolutionApiHeaders });
        res.json(response.data);
    } catch (error) {
        handleEvolutionApiError(error, res, `buscar mensagens para ${instanceName}`);
    }
});

module.exports = router;