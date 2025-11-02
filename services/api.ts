import { Instance, InstanceStatus, WebhookConfig, ChatwootConfig, OpenAIConfig, GeminiConfig, ChatwootConversation, ChatwootMessage, GlobalChatwootSettings, ApiKey, ApiKeyInfo } from '../types';

export class NetworkError extends Error {
    public details: string;
    constructor(message: string, details: string) {
        super(message);
        this.name = 'NetworkError';
        this.details = details;
    }
}

const mapStatus = (status: string): InstanceStatus => {
  switch (status) {
    case 'open': return InstanceStatus.ONLINE;
    case 'close': return InstanceStatus.OFFLINE;
    case 'connecting': return InstanceStatus.CONNECTING;
    default: return InstanceStatus.ERROR;
  }
};

const transformInstance = (data: any): Instance | null => {
    if (!data || !data.id || !data.name) {
        console.warn("Item de instância inválido recebido da API. Será ignorado:", data);
        return null;
    }

    const statusString = data.status || data.connectionStatus || 'close';

    // Ler dados de configuração com robustez, aceitando camelCase ou snake_case da API.
    const webhookData = data.Webhook;
    const webhookConfig: WebhookConfig = { enabled: webhookData?.enabled ?? false, url: webhookData?.url ?? '', urls: webhookData?.urls ?? [] };

    const chatwootData = data.Chatwoot;
    const chatwootConfig: ChatwootConfig = { 
        enabled: chatwootData?.enabled ?? false, 
        url: chatwootData?.url ?? '', 
        token: chatwootData?.token ?? '', 
        accountId: (chatwootData?.accountId ?? chatwootData?.account_id ?? '').toString(),
        inboxId: (chatwootData?.inboxId ?? chatwootData?.inbox_id ?? '').toString(),
        inboxName: chatwootData?.inbox_name ?? '',
        companyName: chatwootData?.company_name ?? '',
        companyLogo: chatwootData?.company_logo ?? '',
        signMessages: chatwootData?.sign_messages ?? false,
        signatureDelimiter: chatwootData?.signature_delimiter ?? '\\n',
        reopenConversation: chatwootData?.reopen_conversation ?? false,
        conversationPending: chatwootData?.conversation_pending ?? false,
        importContacts: chatwootData?.import_contacts ?? false,
        importMessages: chatwootData?.import_messages ?? false,
        daysToImport: chatwootData?.days_to_import ?? 7,
        ignorePhoneNumbers: chatwootData?.ignore_phone_numbers ?? [],
        autoCreateInbox: chatwootData?.auto_create_inbox ?? false,
    };
    
    const openAIData = data.OpenAI;
    const openAIConfig: OpenAIConfig = {
        enabled: openAIData?.enabled ?? false,
        apiKey: openAIData?.apiKey ?? openAIData?.api_key ?? '',
        model: openAIData?.model ?? 'gpt-3.5-turbo',
        prompt: openAIData?.prompt ?? ''
    };
    
    const geminiData = data.Gemini;
    const geminiConfig: GeminiConfig = {
        enabled: geminiData?.enabled ?? false,
        apiKey: geminiData?.apiKey ?? geminiData?.api_key ?? '',
        model: geminiData?.model ?? 'gemini-pro',
        prompt: geminiData?.prompt ?? ''
    };

    return {
        id: data.id,
        name: data.name,
        status: mapStatus(statusString),
        url: data.serverUrl || 'N/A', 
        apiKey: 'N/A',
        version: 'N/A',
        channels: [data.integration || 'Whatsapp'],
        createdAt: data.createdAt || new Date().toISOString(),
        owner: data.profileName,
        phoneNumber: data.ownerJid?.split('@')[0],
        webhookConfig,
        chatwootConfig,
        openAIConfig,
        geminiConfig,
    };
};

const makeRequest = async (baseUrl: string, endpoint: string, method: string, apiKey: string, body?: any) => {
    const controller = new AbortController();
    // Adiciona um timeout de 15 segundos para a requisição.
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();

        if (response.ok) {
            if (!responseText) {
                return { success: true }; // Retorno para sucesso sem conteúdo (204)
            }
            try {
                return JSON.parse(responseText);
            } catch (e) {
                // Se não for JSON, retorna o texto (ex: a API pode retornar uma string "OK")
                return { message: responseText, success: true };
            }
        }

        // Se a resposta não for 'ok' (erro 4xx, 5xx)
        let errorMessage;
        try {
            // Tenta extrair uma mensagem de erro mais específica do corpo da resposta.
            const errorJson = JSON.parse(responseText);
            errorMessage = errorJson.message || errorJson.error || errorJson.detail || responseText;
        } catch (e) {
            // O corpo do erro não é JSON, usa o texto da resposta ou o status.
            errorMessage = responseText || response.statusText || 'Ocorreu um erro no servidor';
        }
        throw new Error(`Erro ${response.status}: ${errorMessage}`);

    } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Se já for um NetworkError, apenas o relance.
        if (error instanceof NetworkError) {
            throw error;
        }
        
        if (error.name === 'AbortError') {
            throw new Error('A requisição ao servidor demorou muito para responder (timeout).');
        }
        
        // Mensagem de erro mais informativa e útil.
        const shortMessage = error.message || 'Erro de rede desconhecido.';
        
        const details = `Ocorreu um erro ao tentar se comunicar com o servidor em '${baseUrl}'.

Detalhes técnicos:
${error.toString()}

Possíveis Causas:
1.  **URL Incorreta:** Verifique se a 'URL do Servidor do Painel' (${baseUrl}) está correta na tela de login.
2.  **Servidor Offline:** O servidor do painel pode não estar em execução ou pode ter travado.
3.  **Problema de Rede/Firewall:** Verifique se não há um firewall ou problema de rede bloqueando a conexão do seu navegador ao servidor.
4.  **Erro de CORS:** Se a mensagem de erro mencionar 'CORS', a configuração de segurança do servidor precisa ser ajustada para permitir acesso do seu navegador.

Ação recomendada: Verifique o status e a URL do seu servidor de painel. Se o problema persistir, compartilhe os 'Detalhes técnicos' com o administrador do servidor.`;

        // Usa a mensagem real do erro como a mensagem principal.
        throw new NetworkError(shortMessage, details);
    }
};


export const fetchInstances = async (baseUrl: string, apiKey: string): Promise<Instance[]> => {
    const data = await makeRequest(baseUrl, '/instance/fetchInstances', 'GET', apiKey);
    
    let rawInstances: any[];
    if (Array.isArray(data)) {
        rawInstances = data;
    } else if (data && Array.isArray(data.instances)) {
        rawInstances = data.instances;
    } else {
        throw new Error("A resposta da API não contém uma lista de instâncias válida.");
    }
    
    return rawInstances.map(transformInstance).filter((instance): instance is Instance => instance !== null);
};

export const createInstance = async (
    baseUrl: string, 
    apiKey: string, 
    instanceName: string,
    automationConfig?: { automate: boolean; settings: GlobalChatwootSettings }
) => {
    // Construir o payload base que foi validado como funcional pelo usuário
    const payload: any = {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
    };
    
    // Adicionar a configuração de automação para o nosso backend processar
    if (automationConfig?.automate && automationConfig.settings) {
        payload.chatwootIntegration = {
            automate: true,
            settings: automationConfig.settings,
        };
    }
    
    // Enviar o payload combinado para o backend
    return makeRequest(baseUrl, '/instance/create', 'POST', apiKey, payload);
};

export const deleteInstance = async (baseUrl: string, apiKey: string, instanceName: string) => {
    // A chamada de exclusão na Evolution API geralmente lida com a desconexão.
    // Remover a chamada explícita de logout para evitar falhas em cascata ou
    // erros 404 se a instância já estiver offline.
    return makeRequest(baseUrl, `/instance/delete/${instanceName}`, 'DELETE', apiKey);
};

export const disconnectInstance = async (baseUrl: string, apiKey: string, instanceName: string) => {
    return makeRequest(baseUrl, `/instance/logout/${instanceName}`, 'DELETE', apiKey);
};

export const connectInstance = async (baseUrl: string, apiKey: string, instanceName:string) =>
    makeRequest(baseUrl, `/instance/connect/${instanceName}`, 'GET', apiKey);

// --- FUNÇÃO PARA BUSCAR TODAS AS MENSAGENS ---
export const fetchAllMessages = async (baseUrl: string, apiKey: string, instanceName: string): Promise<any[]> => {
    // CORREÇÃO: O endpoint correto é /message/fetchMessages, e não /messages/fetch.
    // A chamada é feita através do nosso backend proxy.
    const data = await makeRequest(baseUrl, `/instance/message/fetchMessages/${instanceName}`, 'GET', apiKey);
    
    // A API retorna um array de mensagens diretamente
    if (Array.isArray(data)) {
        return data;
    }
    // Algumas versões podem aninhar a resposta
    if (data && Array.isArray(data.messages)) {
        return data.messages;
    }
    console.warn("Resposta inesperada ao buscar mensagens:", data);
    return [];
}


// --- FUNÇÕES DE CONFIGURAÇÃO DE INTEGRAÇÃO ATUALIZADAS ---

export const updateWebhookConfig = async (baseUrl: string, apiKey: string, instanceName: string, config: Partial<WebhookConfig>) =>
    makeRequest(baseUrl, `/webhook/set/${instanceName}`, 'POST', apiKey, config);

export const updateChatwootConfig = async (baseUrl: string, apiKey: string, instanceName: string, config: Partial<ChatwootConfig>) => {
    // Transforma os dados para o formato que a API Evolution espera (snake_case, IDs como números)
    const payload = {
        enabled: config.enabled,
        url: config.url,
        token: config.token,
        account_id: config.accountId ? parseInt(config.accountId, 10) : undefined,
        inbox_id: config.inboxId ? parseInt(config.inboxId, 10) : undefined,
        inbox_name: config.inboxName,
        company_name: config.companyName,
        company_logo: config.companyLogo,
        sign_messages: config.signMessages,
        signature_delimiter: config.signatureDelimiter,
        reopen_conversation: config.reopenConversation,
        conversation_pending: config.conversationPending,
        import_contacts: config.importContacts,
        import_messages: config.importMessages,
        days_to_import: config.daysToImport ? Number(config.daysToImport) : undefined,
        ignore_phone_numbers: config.ignorePhoneNumbers,
        auto_create_inbox: config.autoCreateInbox,
    };

    if (config.accountId && isNaN(payload.account_id)) {
        throw new Error("O 'ID da Conta' do Chatwoot deve ser um número válido.");
    }
    if (config.inboxId && isNaN(payload.inbox_id)) {
        throw new Error("O 'ID da Caixa (Inbox)' do Chatwoot deve ser um número válido.");
    }

    // JSON.stringify irá omitir chaves com valor `undefined`
    return makeRequest(baseUrl, `/chatwoot/set/${instanceName}`, 'POST', apiKey, payload);
};
    
export const updateOpenAIConfig = async (baseUrl: string, apiKey: string, instanceName: string, config: Partial<OpenAIConfig>) => {
    // Transforma para snake_case
    const payload = {
        enabled: config.enabled,
        model: config.model,
        prompt: config.prompt,
        api_key: config.apiKey,
    };
    return makeRequest(baseUrl, `/openai/set/${instanceName}`, 'POST', apiKey, payload);
};

export const updateGeminiConfig = async (baseUrl: string, apiKey: string, instanceName: string, config: Partial<GeminiConfig>) => {
    // Transforma para snake_case
    const payload = {
        enabled: config.enabled,
        model: config.model,
        prompt: config.prompt,
        api_key: config.apiKey,
    };
    return makeRequest(baseUrl, `/gemini/set/${instanceName}`, 'POST', apiKey, payload);
};
    
// --- NOVAS FUNÇÕES DE PROXY PARA CHATWOOT ---
// Estas funções assumem que a Evolution API expõe endpoints para atuar como um proxy para o Chatwoot,
// resolvendo assim os problemas de CORS.

export const fetchChatwootConversations = async (baseUrl: string, apiKey: string, instanceName: string): Promise<any> => {
    return makeRequest(baseUrl, `/chatwoot/conversations/${instanceName}`, 'GET', apiKey);
};

export const fetchChatwootMessages = async (baseUrl: string, apiKey: string, instanceName: string, conversationId: number): Promise<any> => {
    return makeRequest(baseUrl, `/chatwoot/messages/${instanceName}/${conversationId}`, 'GET', apiKey);
};

export const sendChatwootMessage = async (baseUrl: string, apiKey: string, instanceName: string, conversationId: number, message: string): Promise<any> => {
    const payload = {
        content: message,
        message_type: 'outgoing',
        private: false,
    };
    return makeRequest(baseUrl, `/chatwoot/messages/${instanceName}/${conversationId}`, 'POST', apiKey, payload);
};

// --- NOVAS FUNÇÕES DE DIAGNÓSTICO ---

export const pingServer = async (baseUrl: string, apiKey: string): Promise<any> => {
    // Usamos um request POST para um endpoint simples para verificar se métodos de escrita estão bloqueados pelo CORS.
    // O endpoint em si não precisa existir; o navegador irá bloquear a requisição preflight (OPTIONS) se o CORS estiver mal configurado.
    return makeRequest(baseUrl, '/system/ping', 'POST', apiKey, { ping: 'hello' });
}

export const testGlobalChatwootConnection = async (baseUrl: string, apiKey: string, settings: GlobalChatwootSettings): Promise<any> => {
    // Esta função assume que a Evolution API tem um endpoint para testar a conexão com o Chatwoot pelo lado do servidor.
    return makeRequest(baseUrl, '/chatwoot/test-connection', 'POST', apiKey, settings);
}

// --- NOVAS FUNÇÕES DE CHAVES DE API ---

export const fetchApiKeys = async (baseUrl: string, apiKey: string): Promise<ApiKeyInfo[]> => {
    return makeRequest(baseUrl, '/api-keys', 'GET', apiKey);
};

export const generateApiKey = async (baseUrl: string, apiKey: string, name: string): Promise<ApiKey> => {
    return makeRequest(baseUrl, '/api-keys/generate', 'POST', apiKey, { name });
};

export const deleteApiKey = async (baseUrl: string, apiKey: string, keyId: string): Promise<{ success: true }> => {
    return makeRequest(baseUrl, `/api-keys/${keyId}`, 'DELETE', apiKey);
};