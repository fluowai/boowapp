import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import useApi from '../hooks/useApi';
import { Instance, InstanceStatus } from '../types';
import { useToast } from '../contexts/ToastContext';

// --- HELPERS ---
const formatDate = (timestamp: number | string) => {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts) || ts === 0) return 'Data desconhecida';
    return new Date(ts * 1000).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusClasses = (status: InstanceStatus) => {
  switch (status) {
    case InstanceStatus.ONLINE: return { text: 'text-green-400', dot: 'bg-green-400' };
    case InstanceStatus.OFFLINE: return { text: 'text-red-400', dot: 'bg-red-400' };
    case InstanceStatus.ERROR: return { text: 'text-red-400', dot: 'bg-red-400' };
    default: return { text: 'text-slate-400', dot: 'bg-slate-400' };
  }
};

const exportToCsv = (messages: any[], instanceName: string) => {
    const headers = ['ID', 'Timestamp', 'Data/Hora', 'Contato (JID)', 'Enviada?', 'Tipo', 'Conteúdo'];
    const rows = messages.map(msg => {
        const row = [
            `"${msg.key?.id || ''}"`,
            `"${msg.messageTimestamp || ''}"`,
            `"${formatDate(msg.messageTimestamp || 0)}"`,
            `"${msg.key?.remoteJid || ''}"`,
            `"${msg.key?.fromMe ? 'Sim' : 'Não'}"`,
            `"${Object.keys(msg.message || {})[0] || 'Desconhecido'}"`,
            `"${(msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Mídia]').replace(/"/g, '""')}"`
        ];
        return row.join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mensagens_${instanceName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- SUB-COMPONENTES ---
const Spinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col justify-center items-center h-full text-center p-4">
        <svg className="animate-spin h-10 w-10 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-400">{text}</p>
    </div>
);

const InstanceSelector: React.FC<{ instances: Instance[], onSelect: (instance: Instance) => void }> = ({ instances, onSelect }) => (
    <div className="p-8">
        <h2 className="text-2xl font-bold text-white text-center">Visualizador de Mensagens do WhatsApp</h2>
        <p className="mt-2 text-slate-400 text-center">Selecione uma instância para carregar e visualizar seu histórico de mensagens.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {instances.map(inst => {
                const status = getStatusClasses(inst.status);
                return (
                    <button 
                        key={inst.id} 
                        onClick={() => onSelect(inst)}
                        className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-left hover:border-amber-500 hover:bg-slate-800/50 transition-all duration-200"
                    >
                        <div className="flex justify-between items-start">
                             <h3 className="font-semibold text-white truncate">{inst.name}</h3>
                             <div className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${status.dot} bg-opacity-20 ${status.text}`}>
                                 <span className={`w-2 h-2 mr-1.5 rounded-full ${status.dot}`}></span>
                                 {inst.status}
                             </div>
                        </div>
                        <p className="text-sm text-slate-500 mt-2">Proprietário: {inst.owner || 'N/A'}</p>
                        <p className="text-sm text-slate-500">Telefone: {inst.phoneNumber || 'N/A'}</p>
                    </button>
                )
            })}
        </div>
    </div>
);

const MessagePanel: React.FC<{
    messages: any[],
    conversations: { jid: string, lastMessage: any, messageCount: number }[],
    selectedJid: string | null,
    onSelectJid: (jid: string) => void,
}> = ({ messages, conversations, selectedJid, onSelectJid }) => {
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const selectedConversationMessages = useMemo(() => {
        return messages.filter(msg => msg.key?.remoteJid === selectedJid);
    }, [messages, selectedJid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedConversationMessages]);

    return (
        <div className="flex-grow flex border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-lg font-semibold text-white">Conversas ({conversations.length})</h3>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {conversations.length > 0 ? (
                        <ul>
                            {conversations.map(convo => (
                                <li key={convo.jid} onClick={() => onSelectJid(convo.jid)}
                                    className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 ${selectedJid === convo.jid ? 'bg-amber-600/10' : ''}`}
                                >
                                    <p className="font-semibold text-white truncate">{convo.jid.split('@')[0]}</p>
                                    <p className="text-sm text-slate-400 truncate">{convo.lastMessage.message?.conversation || '[Mídia]'}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-slate-500">{formatDate(convo.lastMessage.messageTimestamp)}</span>
                                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{convo.messageCount}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="p-4 text-slate-500 text-sm">Nenhuma conversa encontrada.</p>}
                </div>
            </div>

            {/* Message Panel */}
            <div className="w-2/3 flex flex-col">
                {!selectedJid ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        Selecione uma conversa para ver as mensagens
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                            <h3 className="text-lg font-semibold text-white">{selectedJid.split('@')[0]}</h3>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto bg-black/20 space-y-4">
                            {selectedConversationMessages.map(msg => (
                                <div key={msg.key?.id} className={`flex items-end gap-2 ${msg.key?.fromMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md p-3 rounded-lg ${msg.key?.fromMe ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Mídia]'}</p>
                                        <p className={`text-xs mt-1 ${msg.key?.fromMe ? 'text-amber-200' : 'text-slate-400'} text-right`}>{formatDate(msg.messageTimestamp)}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


// --- COMPONENTE PRINCIPAL ---

interface WhatsAppViewProps {
  api: ReturnType<typeof useApi>;
}

const WhatsAppView: React.FC<WhatsAppViewProps> = ({ api }) => {
    const { addToast } = useToast();
    const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedJid, setSelectedJid] = useState<string | null>(null);

    const handleSelectInstance = useCallback(async (instance: Instance) => {
        setSelectedInstance(instance);
        setLoading(true);
        setError(null);
        setMessages([]);
        setSelectedJid(null);
        try {
            const fetchedMessages = await api.fetchAllMessages(instance.name);
            // FIX: Add type guard to ensure fetchedMessages is an array.
            // The API might return a non-array response on error, and TypeScript
            // infers the type as 'unknown', which causes a crash when accessing .sort or .length.
            if (Array.isArray(fetchedMessages)) {
                setMessages(fetchedMessages.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0)));
                addToast(`Histórico de ${fetchedMessages.length} mensagens carregado para ${instance.name}.`, 'success');
            } else {
                throw new Error("A resposta da API para mensagens não retornou uma lista válida.");
            }
        } catch (err) {
            setError((err as Error).message);
            addToast(`Erro ao buscar mensagens: ${(err as Error).message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [api, addToast]);

    const conversations = useMemo(() => {
        if (messages.length === 0) return [];
        const groups = messages.reduce((acc, msg) => {
            const jid = msg.key?.remoteJid;
            if (jid) {
                if (!acc[jid]) acc[jid] = [];
                acc[jid].push(msg);
            }
            return acc;
        }, {} as Record<string, any[]>);

        return Object.entries(groups).map(([jid, msgs]) => ({
            jid,
            lastMessage: msgs[msgs.length - 1],
            messageCount: msgs.length,
        })).sort((a, b) => (b.lastMessage.messageTimestamp || 0) - (a.lastMessage.messageTimestamp || 0));
    }, [messages]);
    
    if (!selectedInstance) {
        return <InstanceSelector instances={api.instances} onSelect={handleSelectInstance} />;
    }

    return (
        <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button onClick={() => setSelectedInstance(null)} className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        <span>Voltar para seleção de instâncias</span>
                    </button>
                    <h2 className="text-2xl font-bold text-white">Mensagens de: <span className="text-amber-400">{selectedInstance.name}</span></h2>
                </div>
                <button
                    onClick={() => exportToCsv(messages, selectedInstance.name)}
                    disabled={messages.length === 0}
                    className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-md hover:bg-slate-600 transition-colors flex items-center space-x-2 disabled:bg-slate-800 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Exportar para CSV</span>
                </button>
            </div>
            
            {loading && <Spinner text={`Carregando mensagens para ${selectedInstance.name}...`} />}
            {error && <div className="text-center py-10 text-red-400 bg-red-500/10 rounded-lg p-4"><strong>Erro:</strong> {error}</div>}
            
            {!loading && !error && (
                <MessagePanel 
                    messages={messages} 
                    conversations={conversations} 
                    selectedJid={selectedJid}
                    onSelectJid={setSelectedJid}
                />
            )}
        </div>
    );
};

export default WhatsAppView;