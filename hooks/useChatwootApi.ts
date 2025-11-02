import { useState, useCallback, useEffect } from 'react';
import { ChatwootConversation, ChatwootMessage, DebugLogEntry } from '../types';
import { useToast } from '../contexts/ToastContext';
import { NetworkError } from '../services/api';
import useApi from './useApi';

interface UseChatwootApiProps {
    api: ReturnType<typeof useApi>;
    instanceName: string;
}

export const useChatwootApi = ({ api, instanceName }: UseChatwootApiProps) => {
    const [conversations, setConversations] = useState<ChatwootConversation[]>([]);
    const [messages, setMessages] = useState<ChatwootMessage[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();
    const [debugLog, setDebugLog] = useState<DebugLogEntry[]>([]);

    const addLog = useCallback((status: DebugLogEntry['status'], message: string, details?: string | object) => {
        const newEntry: DebugLogEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
            status,
            message,
            details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined,
        };
        setDebugLog(prev => [...prev, newEntry]);
    }, []);


    useEffect(() => {
        const loadConversations = async () => {
            if (!instanceName) {
                setLoadingConversations(false);
                setError("Nome da instância não fornecido.");
                addLog('error', 'Operação abortada: Nome da instância não fornecido.');
                return;
            }
            try {
                setLoadingConversations(true);
                setError(null);
                addLog('info', `[Etapa 1/2] Painel → API Evolution: Buscando conversas para a instância '${instanceName}'.`);
                const convos = await api.fetchChatwootConversations(instanceName);
                addLog('success', `[Etapa 2/2] API Evolution → Chatwoot: Resposta recebida.`, `Encontradas ${Array.isArray(convos) ? convos.length : 0} conversas.`);
                
                if(Array.isArray(convos)) {
                    // Ordena pela atividade mais recente
                    convos.sort((a, b) => b.last_activity_at - a.last_activity_at);
                    setConversations(convos);
                } else {
                    console.warn("A resposta de conversas não foi um array:", convos);
                    addLog('error', 'A resposta da API para conversas não é um array válido.', convos);
                    setConversations([]);
                }
            } catch (err) {
                const typedError = err as Error;
                setError(typedError.message);
                const details = err instanceof NetworkError ? err.details : typedError.stack;
                addLog('error', `Falha na comunicação: ${typedError.message}`, details);
                if (err instanceof NetworkError) {
                    addToast(err.message, 'error', err.details);
                } else {
                    addToast(typedError.message, 'error');
                }
            } finally {
                setLoadingConversations(false);
            }
        };

        addLog('info', 'Iniciando console do Chatwoot...');
        loadConversations();
    }, [instanceName, api.fetchChatwootConversations, addToast, addLog]);

    useEffect(() => {
        const loadMessages = async () => {
            if (!instanceName || !selectedConversationId) {
                setMessages([]);
                return;
            }
            try {
                setLoadingMessages(true);
                 addLog('info', `[Etapa 1/2] Painel → API Evolution: Buscando mensagens para a conversa #${selectedConversationId}.`);
                const msgs = await api.fetchChatwootMessages(instanceName, selectedConversationId);
                 addLog('success', `[Etapa 2/2] API Evolution → Chatwoot: Mensagens recebidas.`, `Encontradas ${Array.isArray(msgs) ? msgs.length : 0} mensagens.`);
                setMessages(Array.isArray(msgs) ? msgs : []);
            } catch (err) {
                 const typedError = err as Error;
                 const details = err instanceof NetworkError ? err.details : typedError.stack;
                 addLog('error', `Falha ao carregar mensagens: ${typedError.message}`, details);
                 if (err instanceof NetworkError) {
                    addToast(err.message, 'error', err.details);
                } else {
                    addToast(`Erro ao carregar mensagens: ${typedError.message}`, 'error');
                }
            } finally {
                setLoadingMessages(false);
            }
        };

        loadMessages();
    }, [instanceName, selectedConversationId, api.fetchChatwootMessages, addToast, addLog]);

    const sendMessage = useCallback(async (content: string): Promise<boolean> => {
        if (!instanceName || !selectedConversationId || !content.trim()) return false;
        
        setSendingMessage(true);
        addLog('info', `[Etapa 1/2] Painel → API Evolution: Enviando mensagem para a conversa #${selectedConversationId}.`);
        try {
            const newMessage = await api.sendChatwootMessage(instanceName, selectedConversationId, content);
            addLog('success', `[Etapa 2/2] API Evolution → Chatwoot: Mensagem enviada com sucesso.`);
            setMessages(prev => [...prev, newMessage]);
            return true;
        } catch (err) {
             const typedError = err as Error;
             const details = err instanceof NetworkError ? err.details : typedError.stack;
             addLog('error', `Falha ao enviar mensagem: ${typedError.message}`, details);
             if (err instanceof NetworkError) {
                addToast(err.message, 'error', err.details);
            } else {
                addToast(`Erro ao enviar mensagem: ${typedError.message}`, 'error');
            }
            return false;
        } finally {
            setSendingMessage(false);
        }
    }, [instanceName, selectedConversationId, api.sendChatwootMessage, addToast, addLog]);

    return {
        conversations,
        messages,
        selectedConversationId,
        setSelectedConversationId,
        loadingConversations,
        loadingMessages,
        sendingMessage,
        error,
        sendMessage,
        debugLog,
    };
};