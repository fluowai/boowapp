# Servidor Backend para o Painel Fluow

Este é o servidor backend em Node.js/Express que fornece a API para o painel de controle da Evolution API.

## Funcionalidades

- Gerenciamento de Instâncias (CRUD) através de um proxy para a Evolution API.
- Autenticação baseada em API Key.
- Proxy para a API do Chatwoot para evitar problemas de CORS.
- Automação da criação de Inboxes no Chatwoot.
- Endpoints de diagnóstico do sistema.
- Persistência de dados de configuração em um arquivo `db.json`.

## Como Executar

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- [npm](https://www.npmjs.com/) (geralmente vem com o Node.js)

### 2. Instalação

Navegue até a pasta `backend/` no seu terminal e instale as dependências:

```bash
npm install
```

### 3. Configuração

Antes de iniciar, você precisa configurar suas chaves de API e a URL da Evolution API.

1.  Crie uma cópia do arquivo `.env.example` (se existir) ou crie um novo arquivo chamado `.env`.
2.  Abra o arquivo `.env` e adicione/edite as seguintes variáveis:

```
# .env

# Porta em que este servidor backend irá rodar
PORT=3001

# Chave de API principal para acessar ESTE painel.
# É esta chave que você usará na tela de login.
API_KEY=sua-chave-secreta-aqui

# URL do seu frontend para liberar o acesso (CORS).
# O valor padrão para o Google AI Studio já está pré-configurado no código.
FRONTEND_URL=https://5n4zzo8fquxjycd5n2ftyj235cc2w216p9gnabx1m7tryf4jfr-h785866787.scf.usercontent.goog

# --- CONFIGURAÇÃO DA EVOLUTION API (OBRIGATÓRIO) ---
# URL da sua instância principal da Evolution API
EVOLUTION_API_URL=https://api.boow.com.br

# Chave de API da sua instância principal da Evolution API
EVOLUTION_API_KEY=a9a0900bc2e8e79c75dd553756c8472f
```

**Importante:** A arquitetura do sistema é: **Painel (Frontend) ↔ Servidor Backend ↔ Evolution API**. Portanto, na tela de login do painel, você deve usar a URL e a `API_KEY` deste servidor backend, não as da Evolution API.

### 4. Iniciando o Servidor

Para iniciar o servidor, execute o seguinte comando no diretório `backend/`:

```bash
npm start
```

O servidor estará rodando em `http://localhost:3001` (ou na porta que você definiu).

### 5. Usando no Painel

No painel frontend, na tela de login:
1.  **URL do Servidor do Painel**: Insira a URL onde este backend está rodando (ex: `http://localhost:3001`).
2.  **Chave de API**: Insira a `API_KEY` que você definiu no arquivo `.env` do backend.
