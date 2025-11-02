const express = require('express');
const axios = require('axios');
const { readDb, writeDb } = require('../db');
const { createChatwootInbox } = require('../services/chatwootService');

const { EVOLUTION_API_URL, EVOLUTION_API_KEY } = process.env;
const evolutionApiHeaders = { 'apikey': EVOLUTION_API_KEY };

// Função para tratar erros do Axios de forma padronizada
const handleEvolutionApiError = (error, res, action) => {
    console.error(`Erro na comunicação com a Evolution API durante a ação '${action}':`, error.response?.data || error.message);
    const status = error.response?.status || 502; // Bad Gateway
    const message = error.response?.data?.message || error.response?.data?.error || `Falha ao ${action}.`;
    res.status(status).json({ error: `Erro na API da Evolution: ${message}` });
};


// Função genérica para atualizar uma configuração que também precisa ser enviada para a Evolution API
const createProxiedConfigUpdater = (configKey, evolutionEndpoint) => {
    const router = express.Router();
    router.post('/set/:instanceName', async (req, res) => {
        const { instanceName } = req.params;
        const configData = req.body;

        try {
            const db = await readDb();
            const instance = db.instances.find(inst => inst.name === instanceName);

            if (!instance) {
                return res.status(404).json({ error: `Instância "${instanceName}" não encontrada.` });
            }

            // 1. Atualiza a configuração no nosso banco de dados
            instance[configKey] = { ...instance[configKey], ...configData };
            
            // 2. Envia a configuração para a Evolution API real
            if (evolutionEndpoint) {
                 await axios.post(`${EVOLUTION_API_URL}/${evolutionEndpoint}/set/${instanceName}`, configData, { headers: evolutionApiHeaders });
            }
            
            await writeDb(db);
            res.json({ success: true, message: `Configuração ${configKey} para ${instanceName} atualizada com sucesso.` });

        } catch (error) {
            if (error.isAxiosError) {
                handleEvolutionApiError(error, res, `atualizar configuração ${configKey}`);
            } else {
                res.status(500).json({ error: `Erro ao atualizar configuração ${configKey}.`, message: error.message });
            }
        }
    });
    return router;
};

// Cria roteadores com proxy para a Evolution API
const webhookRouter = createProxiedConfigUpdater('Webhook', 'webhook');
const openaiRouter = createProxiedConfigUpdater('OpenAI', 'openai');
const geminiRouter = createProxiedConfigUpdater('Gemini', 'gemini');

// Roteador específico para Chatwoot para lidar com a automação e proxy duplo
const chatwootRouter = express.Router();
chatwootRouter.post('/set/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    let configData = req.body;

    try {
        const db = await readDb();
        const instance = db.instances.find(inst => inst.name === instanceName);

        if (!instance) {
            return res.status(404).json({ error: `Instância "${instanceName}" não encontrada.` });
        }
        
        const inboxIdKey = configData.inbox_id || configData.inboxId;
        if (configData.enabled && configData.auto_create_inbox && !inboxIdKey) {
            try {
                 const settings = { apiUrl: configData.url, apiToken: configData.token, accountId: configData.account_id || configData.accountId };
                 const { inbox, webhookUrl } = await createChatwootInbox(instanceName, settings);

                 configData.inbox_id = inbox.id;
                 configData.inboxId = inbox.id.toString();
                 configData.inbox_name = inbox.name;
                 
                 instance.Webhook = { enabled: true, url: webhookUrl, urls: [webhookUrl] };

                 // Atualiza o webhook na Evolution API também
                 await axios.post(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, instance.Webhook, { headers: evolutionApiHeaders });
                 console.log(`Webhook para "${instanceName}" atualizado na Evolution API.`);

            } catch (automationError) {
                 return res.status(500).json({ error: 'Falha na automação do Chatwoot.', message: automationError.message });
            }
        }
        
        // Atualiza a configuração do Chatwoot no nosso DB
        instance.Chatwoot = { ...instance.Chatwoot, ...configData };
        
        // Envia a configuração do Chatwoot para a Evolution API
        await axios.post(`${EVOLUTION_API_URL}/chatwoot/set/${instanceName}`, configData, { headers: evolutionApiHeaders });
        
        await writeDb(db);
        res.json({ success: true, message: `Configuração Chatwoot para ${instanceName} atualizada com sucesso.` });

    } catch (error) {
        if (error.isAxiosError) {
            handleEvolutionApiError(error, res, 'atualizar configuração Chatwoot');
        } else {
            res.status(500).json({ error: `Erro ao atualizar configuração Chatwoot.`, message: error.message });
        }
    }
});

module.exports = {
    webhookRouter,
    chatwootRouter,
    openaiRouter,
    geminiRouter
};
