import { useState, useCallback, useEffect } from 'react';
import { Instance, User, Plan, DashboardStats, InstanceStatus, WebhookConfig, ChatwootConfig, OpenAIConfig, GeminiConfig, ChatwootConversation, ChatwootMessage, GlobalChatwootSettings, ApiKey, ApiKeyInfo } from '../types';
import * as api from '../services/api';

const MOCK_PLANS: Plan[] = [
    { id: 'plan_free', name: 'Grátis', maxInstances: 1, price: 0 },
    { id: 'plan_basic', name: 'Básico', maxInstances: 5, price: 49 },
    { id: 'plan_pro', name: 'Profissional', maxInstances: 20, price: 99 },
];
const MOCK_CLIENT_PLAN = MOCK_PLANS[1];

const useApi = (user: User | null, apiKey: string | null, serverUrl: string | null, proxyUrl?: string | null) => {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const baseUrl = proxyUrl || serverUrl;

    const refreshInstances = useCallback(async () => {
        if (!user || !apiKey || !baseUrl) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const fetchedInstances = await api.fetchInstances(baseUrl, apiKey);
            setInstances(fetchedInstances);
        } catch (e) {
            setError((e as Error).message);
            setInstances([]);
        } finally {
            setLoading(false);
        }
    }, [user, apiKey, baseUrl]);

    useEffect(() => {
        refreshInstances();
    }, [refreshInstances]);

    const createInstance = useCallback(async (name: string, automationConfig?: { automate: boolean; settings: GlobalChatwootSettings }): Promise<void> => {
        if (!apiKey || !user || !baseUrl) throw new Error("Usuário, chave de API ou URL do servidor não encontrados.");
        
        if (user.role === 'client') {
            const clientPlan = user.plan || MOCK_CLIENT_PLAN;
            if (instances.length >= clientPlan.maxInstances) {
                throw new Error(`Limite de instâncias atingido para o seu plano (${clientPlan.name}). Por favor, faça um upgrade.`);
            }
        }
        await api.createInstance(baseUrl, apiKey, name, automationConfig);
        // A automação pode levar mais tempo no backend, então aumentamos o delay para o refresh
        setTimeout(() => refreshInstances(), automationConfig?.automate ? 3000 : 1000);
    }, [apiKey, user, baseUrl, instances, refreshInstances]);

    const deleteInstance = useCallback(async (instanceName: string): Promise<void> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        await api.deleteInstance(baseUrl, apiKey, instanceName);
        setTimeout(() => refreshInstances(), 500);
    }, [apiKey, baseUrl, refreshInstances]);
    
    const disconnectInstance = useCallback(async (instanceName: string): Promise<void> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        await api.disconnectInstance(baseUrl, apiKey, instanceName);
        setTimeout(() => refreshInstances(), 500);
    }, [apiKey, baseUrl, refreshInstances]);

    const connectInstance = useCallback(async (instanceName: string): Promise<string> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        const result = await api.connectInstance(baseUrl, apiKey, instanceName);

        // Função auxiliar para extrair o QR code de diferentes formatos de resposta
        const findQrCode = (data: any): string | null => {
            if (!data) return null;

            // Caso 1: String base64 direta em chaves comuns
            if (typeof data.base64 === 'string' && data.base64.length > 50) return data.base64;
            if (typeof data.qr === 'string' && data.qr.length > 50) return data.qr;
            if (typeof data.qrcode === 'string' && data.qrcode.length > 50) return data.qrcode;

            // Caso 2: Objeto aninhado
            if (data.qrcode && typeof data.qrcode.base64 === 'string' && data.qrcode.base64.length > 50) return data.qrcode.base64;
            if (data.data && typeof data.data.base64 === 'string' && data.data.base64.length > 50) return data.data.base64;
            if (data.qrCode && typeof data.qrCode.base64 === 'string' && data.qrCode.base64.length > 50) return data.qrCode.base64;

            // Caso 3: Resposta de texto puro que foi encapsulada por `makeRequest`
            if (data.message && typeof data.message === 'string' && data.message.length > 50) {
                 // Heurística para diferenciar de uma mensagem de erro simples
                if (data.message.startsWith('iVBOR') || data.message.startsWith('data:image')) {
                    return data.message;
                }
            }

            return null;
        };
        
        // Trata o caso em que a instância já está conectada
        if (result && result.instance && result.instance.state === 'open') {
            throw new Error('A instância já está conectada. Não é necessário gerar QR Code.');
        }
        
        const qrString = findQrCode(result);
        
        if (qrString) {
            // A API pode retornar a string com ou sem o prefixo. A tag <img> precisa sem.
            return qrString.replace('data:image/png;base64,', '');
        }
        
        // Se nenhum QR Code foi encontrado, lança um erro
        const resultString = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
        console.error("API Response for QR Code did not contain a valid string:", resultString);
        throw new Error("A resposta da API não continha um QR code válido ou reconhecível.");
    }, [apiKey, baseUrl]);

    // --- NOVA FUNÇÃO PARA BUSCAR MENSAGENS ---
    const fetchAllMessages = useCallback(async (instanceName: string): Promise<any[]> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        return api.fetchAllMessages(baseUrl, apiKey, instanceName);
    }, [apiKey, baseUrl]);


    // --- FUNÇÕES DE ATUALIZAÇÃO DE CONFIG ---
    const updateWebhookConfig = useCallback(async (instanceName: string, config: Partial<WebhookConfig>) => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        await api.updateWebhookConfig(baseUrl, apiKey, instanceName, config);
    }, [apiKey, baseUrl]);
    
    const updateChatwootConfig = useCallback(async (instanceName: string, config: Partial<ChatwootConfig>) => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        await api.updateChatwootConfig(baseUrl, apiKey, instanceName, config);
    }, [apiKey, baseUrl]);

    const updateOpenAIConfig = useCallback(async (instanceName: string, config: Partial<OpenAIConfig>) => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        await api.updateOpenAIConfig(baseUrl, apiKey, instanceName, config);
    }, [apiKey, baseUrl]);

    const updateGeminiConfig = useCallback(async (instanceName: string, config: Partial<GeminiConfig>) => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        await api.updateGeminiConfig(baseUrl, apiKey, instanceName, config);
    }, [apiKey, baseUrl]);
    
    // --- FUNÇÕES DE PROXY DO CHATWOOT ---
    const fetchChatwootConversations = useCallback(async (instanceName: string): Promise<ChatwootConversation[]> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        const result = await api.fetchChatwootConversations(baseUrl, apiKey, instanceName);
        // A API da Evolution pode retornar os dados dentro de uma chave 'payload' ou 'data'
        return result.payload || result.data || result;
    }, [apiKey, baseUrl]);
    
    const fetchChatwootMessages = useCallback(async (instanceName: string, conversationId: number): Promise<ChatwootMessage[]> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        const result = await api.fetchChatwootMessages(baseUrl, apiKey, instanceName, conversationId);
        return result.payload || result.data || result;
    }, [apiKey, baseUrl]);

    const sendChatwootMessage = useCallback(async (instanceName: string, conversationId: number, message: string): Promise<ChatwootMessage> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        const result = await api.sendChatwootMessage(baseUrl, apiKey, instanceName, conversationId, message);
        return result.payload || result.data || result;
    }, [apiKey, baseUrl]);

    // --- NOVAS FUNÇÕES DE DIAGNÓSTICO ---
    const pingServer = useCallback(async () => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        return api.pingServer(baseUrl, apiKey);
    }, [apiKey, baseUrl]);

    const testGlobalChatwootConnection = useCallback(async (settings: GlobalChatwootSettings) => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        return api.testGlobalChatwootConnection(baseUrl, apiKey, settings);
    }, [apiKey, baseUrl]);


    const getDashboardStats = useCallback((): DashboardStats => {
        return {
            totalInstances: instances.length,
            onlineInstances: instances.filter(inst => inst.status === InstanceStatus.ONLINE).length,
            messagesSent: user?.role === 'superadmin' ? 150782 : 18430,
            webhooksTriggered: user?.role === 'superadmin' ? 68310 : 7321,
        };
    }, [instances, user]);

    const getPlans = useCallback((): Plan[] => MOCK_PLANS, []);

    // --- NOVAS FUNÇÕES DE CHAVES DE API ---
    const fetchApiKeys = useCallback(async (): Promise<ApiKeyInfo[]> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        const result = await api.fetchApiKeys(baseUrl, apiKey);
        // FIX: The backend for this endpoint returns the array directly, without a 'payload' or 'data' wrapper.
        return result;
    }, [apiKey, baseUrl]);

    const generateApiKey = useCallback(async (name: string): Promise<ApiKey> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        return api.generateApiKey(baseUrl, apiKey, name);
    }, [apiKey, baseUrl]);

    const deleteApiKey = useCallback(async (keyId: string): Promise<void> => {
        if (!apiKey || !baseUrl) throw new Error("Chave de API ou URL do servidor não encontrados.");
        await api.deleteApiKey(baseUrl, apiKey, keyId);
    }, [apiKey, baseUrl]);
    
    return {
        instances,
        loading,
        error,
        refreshInstances,
        createInstance,
        deleteInstance,
        disconnectInstance,
        connectInstance,
        fetchAllMessages,
        getDashboardStats,
        getPlans,
        clientPlan: user?.plan || MOCK_CLIENT_PLAN,
        // Funções de atualização
        updateWebhookConfig,
        updateChatwootConfig,
        updateOpenAIConfig,
        updateGeminiConfig,
        // Funções de Proxy do Chatwoot
        fetchChatwootConversations,
        fetchChatwootMessages,
        sendChatwootMessage,
        // Funções de Diagnóstico
        pingServer,
        testGlobalChatwootConnection,
        // Funções de Chaves de API
        fetchApiKeys,
        generateApiKey,
        deleteApiKey,
    };
};

export default useApi;