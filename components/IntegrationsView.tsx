import React, { useState, useEffect } from 'react';
import { GlobalChatwootSettings, InstanceStatus } from '../types';
import { useToast } from '../contexts/ToastContext';
import useApi from '../hooks/useApi';

interface IntegrationsViewProps {
  settings: GlobalChatwootSettings | null;
  onSave: (settings: GlobalChatwootSettings) => void;
  api: ReturnType<typeof useApi>;
}

const getStatusClasses = (status: InstanceStatus) => {
    switch (status) {
        case InstanceStatus.ONLINE:
            return { text: 'text-green-400', dot: 'bg-green-400' };
        case InstanceStatus.OFFLINE:
            return { text: 'text-slate-400', dot: 'bg-slate-400' };
        case InstanceStatus.ERROR:
            return { text: 'text-red-400', dot: 'bg-red-400' };
        case InstanceStatus.CONNECTING:
            return { text: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse' };
        default:
            return { text: 'text-slate-400', dot: 'bg-slate-400' };
    }
};

const IntegrationsView: React.FC<IntegrationsViewProps> = ({ settings, onSave, api }) => {
    const [formState, setFormState] = useState<GlobalChatwootSettings>({
        apiUrl: '',
        apiToken: '',
        accountId: '',
    });
    const { addToast } = useToast();
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormState(settings);
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const response = await api.testGlobalChatwootConnection(formState);
            addToast(response.message || 'Conexão com o Chatwoot bem-sucedida!', 'success');
        } catch (error) {
            addToast(`Falha na conexão: ${(error as Error).message}`, 'error');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
        addToast('Configurações de integração salvas com sucesso!', 'success');
    };
    
    const integratedInstances = api.instances.filter(inst => inst.chatwootConfig?.enabled);
    const areFieldsFilled = formState.apiUrl && formState.apiToken && formState.accountId;

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-white">Configurações de Integração Global</h2>
            <p className="mt-2 text-slate-400">
                Defina as credenciais globais para automações. Estas configurações serão usadas, por exemplo, para criar Inboxes no Chatwoot automaticamente.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6 bg-slate-900/50 border border-slate-800 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-amber-400">Chatwoot</h3>
                
                <div>
                    <label htmlFor="apiUrl" className="block text-sm font-medium text-slate-300 mb-1">URL Base da API do Chatwoot</label>
                    <input 
                        type="url" 
                        id="apiUrl" 
                        value={formState.apiUrl}
                        onChange={handleChange}
                        placeholder="https://painel.woopanel.com.br" 
                        className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="apiToken" className="block text-sm font-medium text-slate-300 mb-1">Token de Autenticação (Bearer Token)</label>
                    <input 
                        type="password" 
                        id="apiToken" 
                        value={formState.apiToken}
                        onChange={handleChange}
                        placeholder="••••••••••••••••••••" 
                        className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="accountId" className="block text-sm font-medium text-slate-300 mb-1">ID da Conta no Chatwoot</label>
                    <input 
                        type="text" 
                        id="accountId" 
                        value={formState.accountId}
                        onChange={handleChange}
                        placeholder="1" 
                        className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                        required
                    />
                </div>

                <div className="flex justify-end pt-4 space-x-3">
                     <button 
                        type="button" 
                        onClick={handleTestConnection}
                        disabled={!areFieldsFilled || isTesting}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isTesting ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Testar Conexão'}
                    </button>
                    <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:opacity-50">
                        Salvar Configurações
                    </button>
                </div>
            </form>

             <div className="mt-12 max-w-2xl">
                <h3 className="text-xl font-semibold text-white">Instâncias com Integração Ativa</h3>
                <p className="mt-1 text-slate-400">
                    Lista de instâncias que estão atualmente com a integração do Chatwoot habilitada no painel.
                </p>
                {integratedInstances.length > 0 ? (
                    <div className="mt-4 bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                        <ul role="list" className="divide-y divide-slate-800">
                            {integratedInstances.map(instance => {
                                const statusClasses = getStatusClasses(instance.status);
                                return (
                                    <li key={instance.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{instance.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Inbox ID: <span className="font-mono text-slate-300">{instance.chatwootConfig?.inboxId || 'N/A'}</span>
                                            </p>
                                        </div>
                                        <div className={`inline-flex items-center text-sm ${statusClasses.text}`}>
                                            <span className={`w-2.5 h-2.5 mr-2 rounded-full ${statusClasses.dot}`}></span>
                                            {instance.status}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : (
                    <div className="mt-4 text-center py-8 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <h4 className="mt-2 text-sm font-semibold text-slate-400">Nenhuma instância integrada</h4>
                        <p className="mt-1 text-sm text-slate-500">Crie ou edite uma instância para ativar a integração com o Chatwoot.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntegrationsView;