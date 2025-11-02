require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./authMiddleware');

const instanceRoutes = require('./routes/instanceRoutes');
const configRoutes = require('./routes/configRoutes');
const chatwootProxyRoutes = require('./routes/chatwootProxyRoutes');
const systemRoutes = require('./routes/systemRoutes');
const apiKeysRoutes = require('./routes/apiKeysRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração de CORS simplificada para resolver problemas de conexão persistentes.
// Permitir qualquer origem (`origin: '*'`) elimina erros de CORS no navegador.
// A segurança da API é garantida pelo `authMiddleware`, que exige uma `apikey` válida
// para todas as rotas protegidas.
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['apikey', 'Content-Type', 'Authorization']
}));

app.use(express.json());

// Rota de boas-vindas
app.get('/', (req, res) => {
    res.send('Servidor do Painel Fluow está no ar!');
});

// Aplica o middleware de autenticação a todas as rotas da API
app.use('/instance', authMiddleware, instanceRoutes);
app.use('/webhook', authMiddleware, configRoutes.webhookRouter);
app.use('/chatwoot', authMiddleware, configRoutes.chatwootRouter);
app.use('/openai', authMiddleware, configRoutes.openaiRouter);
app.use('/gemini', authMiddleware, configRoutes.geminiRouter);
app.use('/chatwoot', authMiddleware, chatwootProxyRoutes); // Note: this overlaps, Express handles it fine.
app.use('/system', authMiddleware, systemRoutes);
app.use('/api-keys', authMiddleware, apiKeysRoutes);

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Algo deu errado no servidor!', message: err.message });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Permitindo requisições de todas as origens (CORS: *). A segurança é gerenciada via API Key.`);
});