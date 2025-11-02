const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST /system/ping
// Este endpoint serve para testar se requisições POST do frontend estão funcionando,
// o que é um bom indicador de que a configuração de CORS está correta para escrita.
router.post('/ping', (req, res) => {
    res.json({ success: true, message: 'pong' });
});

// POST /system/test-connection (para o Chatwoot)
router.post('/test-connection', async (req, res) => {
    const { apiUrl, apiToken, accountId } = req.body;
    if (!apiUrl || !apiToken || !accountId) {
        return res.status(400).json({
            error: 'Dados insuficientes.',
            message: 'É necessário fornecer apiUrl, apiToken e accountId.'
        });
    }

    const testUrl = `${apiUrl}/api/v1/accounts/${accountId}/inboxes`;

    try {
        // Tenta fazer uma requisição simples (buscar inboxes) para validar as credenciais.
        const response = await axios.get(testUrl, {
            headers: { 'api_access_token': apiToken }
        });
        
        if (response.status === 200) {
            res.json({ success: true, message: 'Conexão com o Chatwoot bem-sucedida!' });
        } else {
            res.status(response.status).json({
                error: 'Resposta inesperada do Chatwoot.',
                message: `Status: ${response.status}`
            });
        }
    } catch (error) {
        if (error.response) {
            // A requisição foi feita e o servidor respondeu com um status de erro
            console.error('Erro de resposta da API do Chatwoot (Teste):', error.response.data);
            const status = error.response.status;
            let message = `O servidor do Chatwoot respondeu com status ${status}.`;
            if (status === 401) {
                message = "Acesso não autorizado (401). Verifique se o Token de Autenticação está correto.";
            } else if (status === 404) {
                message = "Recurso não encontrado (404). Verifique se a URL da API e o ID da Conta estão corretos.";
            }
            res.status(status).json({
                error: 'Falha na conexão com o Chatwoot.',
                message: message,
                details: error.response.data,
            });
        } else if (error.request) {
            // A requisição foi feita mas não houve resposta
            console.error('Sem resposta da API do Chatwoot (Teste):', error.request);
            res.status(504).json({ error: 'Gateway Timeout.', message:'O servidor do Chatwoot não respondeu. Verifique a URL e a conectividade de rede do seu servidor.' });
        } else {
            // Algo aconteceu ao configurar a requisição
            console.error('Erro ao configurar requisição para o Chatwoot (Teste):', error.message);
            res.status(500).json({ error: 'Erro de rede ou DNS.', message: `Não foi possível alcançar o servidor em ${apiUrl}. Verifique a URL e a conectividade.` });
        }
    }
});


module.exports = router;