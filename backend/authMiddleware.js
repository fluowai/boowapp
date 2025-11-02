
const { readDb } = require('./db');
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("A variável de ambiente API_KEY não está definida. O servidor não pode iniciar sem ela.");
}

const authMiddleware = async (req, res, next) => {
    const apiKeyHeader = req.headers['apikey'];
    
    if (!apiKeyHeader) {
        return res.status(401).json({ error: 'Acesso não autorizado. Chave de API (apikey) não fornecida no cabeçalho.' });
    }

    // 1. Check against the main API key from .env
    if (apiKeyHeader === API_KEY) {
        return next();
    }

    // 2. If it doesn't match, check against generated keys in the database
    try {
        const db = await readDb();
        const keyExists = db.apiKeys && db.apiKeys.some(keyObj => keyObj.key === apiKeyHeader);
        
        if (keyExists) {
            return next();
        }

        // If key is not found in either place
        return res.status(403).json({ error: 'Acesso negado. Chave de API inválida.' });

    } catch (error) {
        console.error("Erro ao ler banco de dados no middleware de autenticação:", error);
        return res.status(500).json({ error: 'Erro interno do servidor ao validar a chave de API.' });
    }
};

module.exports = authMiddleware;
