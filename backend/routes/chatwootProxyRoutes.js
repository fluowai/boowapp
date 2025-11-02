const express = require('express');
const axios = require('axios');
const { readDb } = require('../db');
const router = express.Router();

// Middleware para obter a configuração do Chatwoot para a instância
const getChatwootConfig = async (req, res, next) => {
    const { instanceName } = req.params;
    try {
        const db = await readDb();
        const instance = db.instances.find(inst => inst.name === instanceName);
        if (!instance || !instance.Chatwoot || !instance.Chatwoot.enabled) {
            return res.status(404).json({ error: `Instância "${instanceName}" não encontrada ou integração com Chatwoot desativada.` });
        }
        
        const { url, token, accountId, account_id } = instance.Chatwoot;
        const effectiveAccountId = accountId || account_id;

        if (!url || !token || !effectiveAccountId) {
            return res.status(400).json({ error: 'Configuração do Chatwoot para esta instância está incompleta (URL, Token ou Account ID faltando).' });
        }

        req.chatwootConfig = { url, token, accountId: effectiveAccountId };
        next();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao ler a configuração da instância.', message: error.message });
    }
};

// Função genérica para tratar erros do Axios
const handleAxiosError = (error, res) => {
    if (error.response) {
        // A requisição foi feita e o servidor respondeu com um status de erro
        console.error('Erro de resposta da API do Chatwoot:', error.response.data);
        res.status(error.response.status).json({
            error: 'Erro na comunicação com o Chatwoot.',
            details: error.response.data,
        });
    } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        console.error('Sem resposta da API do Chatwoot:', error.request);
        res.status(504).json({ error: 'Gateway Timeout. O servidor do Chatwoot não respondeu.' });
    } else {
        // Algo aconteceu ao configurar a requisição
        console.error('Erro ao configurar requisição para o Chatwoot:', error.message);
        res.status(500).json({ error: 'Erro interno ao tentar se comunicar com o Chatwoot.' });
    }
};

// GET /chatwoot/conversations/:instanceName
router.get('/conversations/:instanceName', getChatwootConfig, async (req, res) => {
    const { url, token, accountId } = req.chatwootConfig;
    const apiUrl = `${url}/api/v1/accounts/${accountId}/conversations?status=all`;
    
    try {
        const response = await axios.get(apiUrl, {
            headers: { 'api_access_token': token }
        });
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// GET /chatwoot/messages/:instanceName/:conversationId
router.get('/messages/:instanceName/:conversationId', getChatwootConfig, async (req, res) => {
    const { url, token, accountId } = req.chatwootConfig;
    const { conversationId } = req.params;
    const apiUrl = `${url}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

    try {
        const response = await axios.get(apiUrl, {
            headers: { 'api_access_token': token }
        });
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// POST /chatwoot/messages/:instanceName/:conversationId
router.post('/messages/:instanceName/:conversationId', getChatwootConfig, async (req, res) => {
    const { url, token, accountId } = req.chatwootConfig;
    const { conversationId } = req.params;
    const messagePayload = req.body;
    const apiUrl = `${url}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

    try {
        const response = await axios.post(apiUrl, messagePayload, {
            headers: {
                'Content-Type': 'application/json',
                'api_access_token': token
            }
        });
        res.status(201).json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

module.exports = router;