const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { readDb, writeDb } = require('../db');
const router = express.Router();

// Helper to generate a secure random key
const generateApiKey = () => {
    return `fluow_${crypto.randomBytes(24).toString('hex')}`;
};

// GET /api-keys/
router.get('/', async (req, res) => {
    try {
        const db = await readDb();
        // Retorna chaves com um prefixo para fins de exibição
        const partialKeys = (db.apiKeys || []).map(k => ({ 
            id: k.id,
            name: k.name,
            createdAt: k.createdAt,
            keyPrefix: k.key.substring(0, 12) // ex: "fluow_a1b2c3d4"
        }));
        res.json(partialKeys);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar chaves de API.', message: error.message });
    }
});


// POST /api-keys/generate
router.post('/generate', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome da chave é obrigatório.' });
    }

    try {
        const db = await readDb();
        if (!db.apiKeys) {
            db.apiKeys = [];
        }

        const newKey = {
            id: uuidv4(),
            name,
            key: generateApiKey(),
            createdAt: new Date().toISOString(),
        };

        db.apiKeys.push(newKey);
        await writeDb(db);

        // Retorna o objeto de chave completo uma vez na criação
        res.status(201).json(newKey);

    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar chave de API.', message: error.message });
    }
});

// DELETE /api-keys/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await readDb();
        if (!db.apiKeys) {
            return res.status(404).json({ error: `Chave de API com ID "${id}" não encontrada.` });
        }
        
        const initialLength = db.apiKeys.length;
        db.apiKeys = db.apiKeys.filter(key => key.id !== id);

        if (db.apiKeys.length === initialLength) {
            return res.status(404).json({ error: `Chave de API com ID "${id}" não encontrada.` });
        }

        await writeDb(db);
        res.json({ success: true, message: `Chave de API excluída com sucesso.` });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir chave de API.', message: error.message });
    }
});

module.exports = router;
