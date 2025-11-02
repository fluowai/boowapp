
const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

const readDb = async () => {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existir ou for inválido, retorna uma estrutura padrão
        if (error.code === 'ENOENT') {
            return { instances: [] };
        }
        throw error;
    }
};

const writeDb = async (data) => {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

module.exports = { readDb, writeDb };
