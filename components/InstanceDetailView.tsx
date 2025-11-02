
import React, { useState, useCallback } from 'react';
import { Instance, WebhookConfig, ChatwootConfig, OpenAIConfig, GeminiConfig, GlobalChatwootSettings } from '../types';
import useApi from '../hooks/useApi';
import QRCodeModal from './QRCodeModal';
import { useToast } from '../contexts/ToastContext';
import { NetworkError } from '../services/api';

type Tab = 'webhooks' | 'chatwoot' | 'openai' | 'gemini';

// --- COMPONENTES DAS ABAS DE CONFIGURAÇÃO ---

interface WebhooksTabProps {
    config: WebhookConfig;
    setConfig: (config: WebhookConfig) => void;
    onSave: () => Promise<void>;
}

const WebhooksTab: React.FC<WebhooksTabProps> = ({ config, setConfig, onSave }) => {
    const [newUrl, setNewUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave();
            addToast('Configuração de Webhook salva com sucesso!', 'success');
        } catch (error) {
            if (error instanceof NetworkError) {
                addToast(error.message, 'error', error.details);
            } else {
                addToast(`Erro ao salvar: ${(error as Error).message}`, 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const addUrl = () => {
        if (newUrl && !config.urls.includes(newUrl)) {
            setConfig({ ...config, urls: [...config.urls, newUrl] });
            setNewUrl('');
        }
    };

    const removeUrl = (urlToRemove: string) => {
        setConfig({ ...config, urls: config.urls.filter(url => url !== urlToRemove) });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Gerenciar Webhooks</h3>
            <div className="flex items-center space-x-3">
                <input type="checkbox" id="webhookEnabled" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"/>
                <label htmlFor="webhookEnabled" className="text-slate-300">Ativar Webhooks</label>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Adicionar URL de Webhook</label>
                <div className="flex space-x-2">
                    <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://seu-servico.com/webhook" className="flex-grow bg-black border border-slate-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500" />
                    <button onClick={addUrl} className="px-4 py-2 text-sm font-semibold text-white bg-slate-700 rounded-md hover:bg-slate-600 transition-colors">Adicionar</button>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm text-slate-400">URLs configuradas:</p>
                {config.urls.length > 0 ? (
                    <ul className="space-y-2">
                        {config.urls.map(url => (
                            <li key={url} className="flex items-center justify-between bg-slate-800 p-2 rounded-md">
                                <span className="font-mono text-sm text-slate-300">{url}</span>
                                <button onClick={() => removeUrl(url)} className="text-red-400 hover:text-red-300">&times;</button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-slate-500">Nenhuma URL adicionada.</p>}
            </div>

            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar Configurações de Webhook'}
            </button>
        </div>
    );
};


const GenericConfigTab: React.FC<{
    title: string;
    config: any;
    setConfig: (config: any) => void;
    onSave: () => Promise<void>;
    fields: { key: string; label: string; type: string; placeholder: string; isSecret?: boolean }[];
}> = ({ title, config, setConfig, onSave, fields }) => {
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();
    
    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave();
            addToast(`${title} salvo com sucesso!`, 'success');
        } catch (error) {
            if (error instanceof NetworkError) {
                addToast(error.message, 'error', error.details);
            } else {
                addToast(`Erro ao salvar: ${(error as Error).message}`, 'error');
            }
        } finally {
            setSaving(false);
        }
    }
    
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <div className="flex items-center space-x-3">
                <input type="checkbox" id={`${fields[0].key}Enabled`} checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"/>
                <label htmlFor={`${fields[0].key}Enabled`} className="text-slate-300">Ativar {title}</label>
            </div>
            
            {fields.map(({ key, label, type, placeholder }) => (
                <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
                    <input id={key} type={type} value={config[key] || ''} onChange={e => setConfig({ ...config, [key]: e.target.value })} placeholder={placeholder} className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
            ))}

            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : `Salvar ${title}`}
            </button>
        </div>
    )
}

// --- COMPONENTES DE UI PARA O FORMULÁRIO DO CHATWOOT ---
const SettingRow: React.FC<{title: string, description: string, children: React.ReactNode}> = ({ title, description, children }) => (
    <div className="flex justify-between items-center py-4 border-b border-slate-800 last:border-b-0">
        <div>
            <h4 className="text-base font-medium text-slate-200">{title}</h4>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div>{children}</div>
    </div>
);

const ToggleSwitch: React.FC<{checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={!!checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
    </label>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({ label, id, ...props }) => (
    <div className="py-2">
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
        <input id={id} {...props} className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500 transition disabled:bg-slate-800 disabled:cursor-not-allowed" />
    </div>
);

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {label: string}> = ({ label, id, ...props }) => (
    <div className="py-2">
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
        <textarea id={id} {...props} rows={4} className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500 transition" />
    </div>
);


// --- NOVA ABA DE CONFIGURAÇÃO DO CHATWOOT ---
const ChatwootTab: React.FC<{ 
    config: ChatwootConfig; 
    setConfig: (config: ChatwootConfig) => void; 
    onSave: () => Promise<void>; 
    onManageConversations: () => void;
    globalSettings: GlobalChatwootSettings | null;
}> = ({ config, setConfig, onSave, onManageConversations, globalSettings }) => {
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();
    const isReadyForConsole = config.enabled && config.url && config.token && config.accountId && config.inboxId;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave();
            addToast('Configuração do Chatwoot salva com sucesso!', 'success');
        } catch (error) {
            if (error instanceof NetworkError) {
                addToast(error.message, 'error', error.details);
            } else {
                addToast(`Erro ao salvar: ${(error as Error).message}`, 'error');
            }
        } finally {
            setSaving(false);
        }
    };
    
    const handleToggle = (key: keyof ChatwootConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const isEnabling = key === 'enabled' && e.target.checked && !config.enabled;
        const newConfig = { ...config, [key]: e.target.checked };

        // Se estiver ativando pela primeira vez e houver configurações globais, preenche automaticamente.
        if (isEnabling && globalSettings && globalSettings.apiUrl && globalSettings.apiToken) {
            // Preenche apenas se os campos da instância estiverem vazios para não sobrescrever uma configuração manual.
            if (!newConfig.url && !newConfig.token && !newConfig.accountId) {
                newConfig.url = globalSettings.apiUrl;
                newConfig.token = globalSettings.apiToken;
                newConfig.accountId = globalSettings.accountId;
                addToast('Credenciais preenchidas a partir das configurações globais.', 'info');
            }
        }
        
        setConfig(newConfig);
    };

    const handleChange = (key: keyof ChatwootConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setConfig({ ...config, [key]: e.target.value });
    };

    const handleJidsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConfig({ ...config, ignorePhoneNumbers: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) });
    };

    return (
        <div className="space-y-6">
            <SettingRow title="Ativar Chatwoot" description="Ativar ou desativar a integração geral.">
                <ToggleSwitch checked={config.enabled} onChange={handleToggle('enabled')} />
            </SettingRow>

            {config.enabled && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                         <InputField id="chatwootUrl" label="URL do Chatwoot" type="url" placeholder="https://app.chatwoot.com" value={config.url || ''} onChange={handleChange('url')} />
                         <InputField id="chatwootAccountId" label="ID da Conta" type="text" placeholder="1" value={config.accountId || ''} onChange={handleChange('accountId')} />
                         <div>
                             <InputField 
                                id="chatwootInboxId" 
                                label="ID da Caixa (Inbox)" 
                                type="text" 
                                placeholder={config.autoCreateInbox ? "Será gerado ao salvar" : "ID existente (opcional)"} 
                                value={config.inboxId || ''} 
                                onChange={handleChange('inboxId')} 
                                disabled={config.autoCreateInbox}
                                title={config.autoCreateInbox ? "Desative a 'Criação Automática' para inserir um ID manualmente." : ""}
                            />
                            {config.autoCreateInbox &&
                                <p className="text-xs text-slate-500 -mt-1 pl-1">
                                    O ID será preenchido automaticamente.
                                </p>
                            }
                        </div>
                    </div>
                     <InputField id="chatwootToken" label="Token de Acesso do Agente" type="password" placeholder="••••••••••••••••" value={config.token || ''} onChange={handleChange('token')} />

                    <h3 className="text-lg font-semibold text-white pt-6 border-t border-slate-800">Caixa de Entrada (Inbox)</h3>
                    <InputField id="inboxName" label="Nome da Caixa de Entrada" type="text" placeholder="Atendimento WhatsApp" value={config.inboxName || ''} onChange={handleChange('inboxName')} />
                    <InputField id="companyName" label="Organização" type="text" placeholder="Nome da Sua Empresa" value={config.companyName || ''} onChange={handleChange('companyName')} />
                    <InputField id="companyLogo" label="URL do Logo" type="url" placeholder="https://sua-empresa.com/logo.png" value={config.companyLogo || ''} onChange={handleChange('companyLogo')} />
                    <SettingRow title="Criação Automática da Inbox" description="Criar automaticamente a integração com o Chatwoot ao salvar.">
                        <ToggleSwitch checked={config.autoCreateInbox} onChange={handleToggle('autoCreateInbox')} />
                    </SettingRow>

                    <h3 className="text-lg font-semibold text-white pt-6 border-t border-slate-800">Comportamento</h3>
                    <SettingRow title="Conversação Pendente" description="Conversas novas iniciarão com o status 'Pendente'.">
                        <ToggleSwitch checked={config.conversationPending} onChange={handleToggle('conversationPending')} />
                    </SettingRow>
                    <SettingRow title="Reabrir Conversa" description="Reabrir a conversa ao receber uma nova mensagem.">
                        <ToggleSwitch checked={config.reopenConversation} onChange={handleToggle('reopenConversation')} />
                    </SettingRow>
                    <SettingRow title="Assinar Mensagens" description="Assinar mensagem com o nome de usuário do agente do Chatwoot.">
                        <ToggleSwitch checked={config.signMessages} onChange={handleToggle('signMessages')} />
                    </SettingRow>
                    <InputField id="signatureDelimiter" label="Delimitador de Assinatura" type="text" placeholder="\n" value={config.signatureDelimiter || ''} onChange={handleChange('signatureDelimiter')} />

                    <h3 className="text-lg font-semibold text-white pt-6 border-t border-slate-800">Importação</h3>
                    <SettingRow title="Importar Contatos" description="Importar contatos da agenda do WhatsApp ao conectar.">
                        <ToggleSwitch checked={config.importContacts} onChange={handleToggle('importContacts')} />
                    </SettingRow>
                    <SettingRow title="Importar Mensagens" description="Importar mensagens do WhatsApp ao conectar.">
                        <ToggleSwitch checked={config.importMessages} onChange={handleToggle('importMessages')} />
                    </SettingRow>
                    <InputField id="daysToImport" label="Limite de Dias para Importação de Mensagens" type="number" placeholder="7" value={config.daysToImport || 7} onChange={handleChange('daysToImport')} />
                    <TextAreaField id="ignoreJids" label="Ignorar JIDs" placeholder={"Adicione um JID por linha. Ex:\n1234567890@s.whatsapp.net\noutro_numero@s.whatsapp.net"} value={(config.ignorePhoneNumbers || []).join('\n')} onChange={handleJidsChange} />
                </div>
            )}
            
            <div className="pt-6 flex justify-between items-center">
                <button
                    onClick={onManageConversations}
                    disabled={!isReadyForConsole}
                    title={isReadyForConsole ? "Acessar console de chat" : "Preencha todos os campos da API para habilitar"}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    Gerenciar Conversas
                </button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:opacity-50">
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
        </div>
    );
}


// --- COMPONENTE PRINCIPAL ---

interface InstanceDetailViewProps {
    instance: Instance;
    onBack: () => void;
    api: ReturnType<typeof useApi>;
    onManageConversations: (instance: Instance) => void;
    globalChatwootSettings: GlobalChatwootSettings | null;
}

const InstanceDetailView: React.FC<InstanceDetailViewProps> = ({ instance, onBack, api, onManageConversations, globalChatwootSettings }) => {
    const [activeTab, setActiveTab] = useState<Tab>('chatwoot');
    
    // Estados locais para cada configuração, inicializados a partir da instância
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(instance.webhookConfig || { enabled: false, url: '', urls: [] });
    const [chatwootConfig, setChatwootConfig] = useState<ChatwootConfig>(instance.chatwootConfig || { enabled: false, url: '', token: '', accountId: '', inboxId: '', daysToImport: 7});
    const [openAIConfig, setOpenAIConfig] = useState<OpenAIConfig>(instance.openAIConfig || { enabled: false, apiKey: '', model: 'gpt-3.5-turbo', prompt: ''});
    const [geminiConfig, setGeminiConfig] = useState<GeminiConfig>(instance.geminiConfig || { enabled: false, apiKey: '', model: 'gemini-pro', prompt: ''});
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [qrModalState, setQrModalState] = useState<{
        isOpen: boolean;
        instanceName: string;
        qrCode: string | null;
        loading: boolean;
        error: string | null;
    }>({ isOpen: false, instanceName: '', qrCode: null, loading: false, error: null });

    const { addToast } = useToast();

    const handleConnect = useCallback(async () => {
        setQrModalState({ isOpen: true, instanceName: instance.name, loading: true, qrCode: null, error: null });
        try {
            const qrCodeString = await api.connectInstance(instance.name);
            setQrModalState(s => ({ ...s, loading: false, qrCode: qrCodeString }));

            setTimeout(() => {
                api.refreshInstances();
                setQrModalState(s => ({ ...s, isOpen: false }));
            }, 30000);

        } catch(err) {
            setQrModalState(s => ({...s, loading: false, error: (err as Error).message }));
        }
    }, [api, instance.name]);

    const handleDelete = async () => {
        if (window.confirm(`Você tem certeza que deseja excluir a instância "${instance.name}"? Esta ação não pode ser desfeita e removerá todas as configurações associadas.`)) {
            setIsDeleting(true);
            try {
                await api.deleteInstance(instance.name);
                addToast(`Instância "${instance.name}" excluída com sucesso.`, 'success');
                onBack();
            } catch (error) {
                 if (error instanceof NetworkError) {
                    addToast(error.message, 'error', error.details);
                } else {
                    addToast(`Erro ao excluir instância: ${(error as Error).message}`, 'error');
                }
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const closeQrModal = () => {
        setQrModalState({ isOpen: false, instanceName: '', loading: false, qrCode: null, error: null });
    };

    const TABS: { id: Tab; label: string }[] = [
        { id: 'webhooks', label: 'Webhooks' },
        { id: 'chatwoot', label: 'Chatwoot' },
        { id: 'openai', label: 'OpenAI' },
        { id: 'gemini', label: 'Gemini' },
    ];
    
    const renderTabContent = () => {
        switch(activeTab) {
            case 'webhooks':
                return <WebhooksTab 
                    config={webhookConfig}
                    setConfig={setWebhookConfig}
                    onSave={() => api.updateWebhookConfig(instance.name, webhookConfig)}
                />;
            case 'chatwoot':
                return <ChatwootTab 
                    config={chatwootConfig}
                    setConfig={setChatwootConfig}
                    onSave={() => api.updateChatwootConfig(instance.name, chatwootConfig)}
                    onManageConversations={() => onManageConversations(instance)}
                    globalSettings={globalChatwootSettings}
                />;
            case 'openai':
                return <GenericConfigTab 
                    title="Configuração OpenAI" 
                    config={openAIConfig}
                    setConfig={setOpenAIConfig}
                    onSave={() => api.updateOpenAIConfig(instance.name, openAIConfig)}
                    fields={[
                        { key: 'apiKey', label: 'Chave de API da OpenAI', type: 'password', placeholder: 'sk-••••••••••' },
                        { key: 'model', label: 'Modelo', type: 'text', placeholder: 'gpt-4-turbo' },
                        { key: 'prompt', label: 'Prompt do Sistema', type: 'text', placeholder: 'Você é um assistente prestativo.' },
                    ]}
                />;
            case 'gemini':
                 return <GenericConfigTab 
                    title="Configuração Gemini" 
                    config={geminiConfig}
                    setConfig={setGeminiConfig}
                    onSave={() => api.updateGeminiConfig(instance.name, geminiConfig)}
                    fields={[
                        { key: 'apiKey', label: 'Chave de API do Gemini', type: 'password', placeholder: '••••••••••' },
                        { key: 'model', label: 'Modelo', type: 'text', placeholder: 'gemini-1.5-pro-latest' },
                        { key: 'prompt', label: 'Prompt do Sistema', type: 'text', placeholder: 'Aja como um especialista no assunto.' },
                    ]}
                />;
            default:
                return null;
        }
    }

    return (
        <div className="p-8">
            <button onClick={onBack} className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>Voltar para a lista de instâncias</span>
            </button>
            
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gerenciando Instância: <span className="text-amber-400">{instance.name}</span></h2>
                    <p className="text-sm text-slate-500">ID: {instance.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={handleConnect} 
                        disabled={qrModalState.loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 transition-colors disabled:bg-green-800 disabled:cursor-wait"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.875 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5A1.125 1.125 0 0113.875 9.375v-4.5zM13.875 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" /></svg>
                        <span>Conectar / QR Code</span>
                    </button>
                     <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-colors disabled:bg-red-800 disabled:cursor-wait"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.716c-1.123 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        <span>{isDeleting ? 'Excluindo...' : 'Excluir Instância'}</span>
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <div className="border-b border-slate-800">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
                                    ? 'border-amber-500 text-amber-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    {renderTabContent()}
                </div>
            </div>
            <QRCodeModal {...qrModalState} onClose={closeQrModal} />
        </div>
    );
};

export default InstanceDetailView;
