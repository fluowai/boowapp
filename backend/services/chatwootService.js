const axios = require('axios');

/**
 * Cria um novo Inbox no Chatwoot e retorna os dados do inbox e a URL do webhook gerada.
 * @param {string} instanceName - O nome da instância da Evolution API, usado para nomear o inbox.
 * @param {object} settings - As configurações globais do Chatwoot (apiUrl, apiToken, accountId).
 * @returns {Promise<{inbox: object, webhookUrl: string}>}
 */
const createChatwootInbox = async (instanceName, settings) => {
    const { apiUrl, apiToken, accountId } = settings;

    if (!apiUrl || !apiToken || !accountId) {
        throw new Error("Configurações do Chatwoot (apiUrl, apiToken, accountId) estão faltando para a automação.");
    }

    const createInboxUrl = `${apiUrl}/api/v1/accounts/${accountId}/inboxes`;
    
    // Payload para criar um canal do tipo 'API'
    const payload = {
        name: `Evo - ${instanceName}`, // Adiciona um prefixo para clareza
        channel: {
            type: 'api',
            // Algumas versões do Chatwoot exigem este campo, mesmo que vazio
            webhook_url: "" 
        }
    };

    try {
        const response = await axios.post(createInboxUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'api_access_token': apiToken
            }
        });

        // A API do Chatwoot pode aninhar a resposta em 'payload' ou retorná-la diretamente
        const inbox = response.data.payload || response.data;

        // Validação robusta da resposta
        if (!inbox || !inbox.id || !inbox.channel || !inbox.channel.webhook_url) {
            console.error("Resposta inválida da API do Chatwoot ao criar inbox:", response.data);
            throw new Error("A resposta da API do Chatwoot não retornou os dados esperados (inbox.id, channel.webhook_url). Verifique as permissões do seu token de acesso.");
        }

        // A URL do webhook é fornecida na resposta da criação do canal
        const webhookUrl = inbox.channel.webhook_url;
        
        console.log(`Inbox "${inbox.name}" (ID: ${inbox.id}) criado com sucesso no Chatwoot.`);
        
        return {
            inbox: inbox,
            webhookUrl: webhookUrl
        };

    } catch (error) {
        console.error("Erro detalhado ao criar inbox no Chatwoot:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || (Array.isArray(error.response?.data?.errors) ? error.response.data.errors.join(', ') : error.message);
        throw new Error(`Falha ao criar inbox no Chatwoot: ${errorMessage}`);
    }
};

module.exports = { createChatwootInbox };