import React, { useState, useRef, useEffect } from 'react';
import { Instance, ChatwootConversation, ChatwootMessage, DebugLogEntry } from '../types';
import { useChatwootApi } from '../hooks/useChatwootApi';
import useApi from '../hooks/useApi';

const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const ErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
    if (!error) return null;
    return (
        <div className="p-4 m-4 bg-red-900/50 text-red-300 rounded-lg">
            <h3 className="font-bold">Ocorreu um Erro</h3>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">Verifique as configurações da API do Chatwoot e se há problemas de CORS no servidor de destino.</p>
        </div>
    );
};

// --- NOVO PAINEL DE DEPURAÇÃO ---
const getStatusIcon = (status: DebugLogEntry['status']) => {
  const classNames = "h-4 w-4 mr-2 flex-shrink-0";
  switch (status) {
    case 'success':
      return <svg xmlns="http://www.w3.org/2000/svg" className={`${classNames} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'error':
      return <svg xmlns="http://www.w3.org/2000/svg" className={`${classNames} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'info':
    default:
      return <svg xmlns="http://www.w3.org/2000/svg" className={`${classNames} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  }
};

const DebugPanel: React.FC<{ log: DebugLogEntry[]; onClose: () => void }> = ({ log, onClose }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [log]);

    return (
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-slate-900/95 backdrop-blur-sm border-t-2 border-amber-500 shadow-2xl p-4 flex flex-col animate-fade-in-up z-20">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h4 className="text-lg font-bold text-amber-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Log de Depuração
                </h4>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-2 text-sm pr-2">
                {log.map(entry => (
                    <div key={entry.id} className="font-mono flex items-start">
                        <span className="text-slate-500 mr-2">{entry.timestamp}</span>
                        {getStatusIcon(entry.status)}
                        <div className="flex-1">
                            <span className="text-slate-300">{entry.message}</span>
                            {entry.details && (
                                <details className="mt-1">
                                    <summary className="cursor-pointer text-xs text-amber-500 hover:text-amber-400">Ver detalhes</summary>
                                    <pre className="mt-1 p-2 bg-black/50 text-slate-400 text-xs rounded-md whitespace-pre-wrap">{entry.details}</pre>
                                </details>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface ChatwootConsoleViewProps {
    instance: Instance;
    onBack: () => void;
    api: ReturnType<typeof useApi>;
}

const ChatwootConsoleView: React.FC<ChatwootConsoleViewProps> = ({ instance, onBack, api }) => {
    const { 
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
    } = useChatwootApi({ api, instanceName: instance.name });

    const [newMessage, setNewMessage] = useState('');
    const [isDebugMode, setIsDebugMode] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sendingMessage) return;
        const success = await sendMessage(newMessage);
        if (success) {
            setNewMessage('');
        }
    };
    
    return (
        <div className="p-8 flex flex-col h-full relative">
            <div className="flex justify-between items-start mb-6">
                 <div>
                    <button onClick={onBack} className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        <span>Voltar para detalhes da instância</span>
                    </button>
                    <h2 className="text-2xl font-bold text-white">Console do Chatwoot: <span className="text-amber-400">{instance.name}</span></h2>
                </div>
                <button 
                    onClick={() => setIsDebugMode(prev => !prev)}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center space-x-2 ${isDebugMode ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>{isDebugMode ? 'Ocultar Depurador' : 'Depurar Conexão'}</span>
                </button>
            </div>

            <div className="flex-grow flex border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="text-lg font-semibold text-white">Conversas</h3>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {loadingConversations ? <Spinner /> : 
                         error ? <ErrorDisplay error={error} /> :
                         conversations.length === 0 ? <p className="p-4 text-slate-500 text-sm">Nenhuma conversa encontrada.</p> :
                         (
                            <ul>
                                {conversations.map(convo => (
                                    <li key={convo.id} onClick={() => setSelectedConversationId(convo.id)}
                                        className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 ${selectedConversationId === convo.id ? 'bg-amber-600/10' : ''}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <img src={convo.meta.sender.thumbnail} alt={convo.meta.sender.name} className="w-10 h-10 rounded-full bg-slate-700"/>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-semibold text-white truncate">{convo.meta.sender.name}</p>
                                                <p className="text-sm text-slate-400 truncate">{convo.messages[0]?.content || 'Nenhuma mensagem'}</p>
                                            </div>
                                            <span className="text-xs text-slate-500">{formatDate(convo.last_activity_at)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Message Panel */}
                <div className="w-2/3 flex flex-col">
                    {!selectedConversationId ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            Selecione uma conversa para começar
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/50">
                                <img src={selectedConversation?.meta.sender.thumbnail} alt={selectedConversation?.meta.sender.name} className="w-10 h-10 rounded-full bg-slate-700"/>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{selectedConversation?.meta.sender.name}</h3>
                                    <p className="text-sm text-green-400">Online</p>
                                </div>
                            </div>
                            {/* Messages */}
                            <div className="flex-grow p-4 overflow-y-auto bg-black/20 space-y-4">
                               {loadingMessages ? <Spinner /> : messages.map(msg => (
                                    <div key={msg.id} className={`flex items-end gap-2 ${msg.message_type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.message_type === 'incoming' && <img src={msg.sender?.thumbnail} className="w-6 h-6 rounded-full self-start" alt={msg.sender?.name} />}
                                        <div className={`max-w-md p-3 rounded-lg ${msg.message_type === 'outgoing' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.message_type === 'outgoing' ? 'text-amber-200' : 'text-slate-400'} text-right`}>{formatDate(msg.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            {/* Input */}
                            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Digite uma mensagem..."
                                        className="flex-grow bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <button type="submit" disabled={sendingMessage || !newMessage.trim()}
                                        className="bg-amber-600 text-white rounded-full p-2.5 hover:bg-amber-500 transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {isDebugMode && <DebugPanel log={debugLog} onClose={() => setIsDebugMode(false)} />}
        </div>
    );
};

export default ChatwootConsoleView;