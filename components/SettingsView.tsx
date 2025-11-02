import React, { useState, useEffect, useCallback } from 'react';
import useApi from '../hooks/useApi';
import { User, ApiKeyInfo, ApiKey } from '../types';
import Modal from './Modal';
import { useToast } from '../contexts/ToastContext';

// Um nome único e interno para identificar a chave pessoal do super admin
const PERSONAL_KEY_NAME = '__personal_superadmin_key__';

interface SettingsViewProps {
  api: ReturnType<typeof useApi>;
  user: User;
}

const SettingsView: React.FC<SettingsViewProps> = ({ api, user }) => {
    const { addToast } = useToast();
    const { fetchApiKeys, generateApiKey, deleteApiKey } = api;

    const [loading, setLoading] = useState(true);
    const [personalKey, setPersonalKey] = useState<ApiKeyInfo | null>(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null);

    const findPersonalKey = useCallback(async () => {
        try {
            setLoading(true);
            const allKeys = await fetchApiKeys();
            const foundKey = allKeys.find(key => key.name === PERSONAL_KEY_NAME);
            setPersonalKey(foundKey || null);
        } catch (err) {
            addToast(`Erro ao verificar chave pessoal: ${(err as Error).message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [fetchApiKeys, addToast]);

    useEffect(() => {
        if (user.role === 'superadmin') {
            findPersonalKey();
        } else {
            setLoading(false);
        }
    }, [findPersonalKey, user.role]);
    
    const handleGenerate = async () => {
        setActionInProgress(true);
        try {
            const newKey = await generateApiKey(PERSONAL_KEY_NAME);
            setGeneratedKey(newKey);
            addToast('Chave pessoal gerada com sucesso!', 'success');
            findPersonalKey(); // Atualiza o estado
        } catch (err) {
            addToast(`Erro ao gerar chave: ${(err as Error).message}`, 'error');
        } finally {
            setActionInProgress(false);
        }
    };
    
    const handleRevokeAndGenerate = async () => {
         if (window.confirm('Você tem certeza que deseja revogar sua chave pessoal atual? Ela deixará de funcionar imediatamente. Uma nova chave será gerada.')) {
            if (!personalKey) return;
            setActionInProgress(true);
            try {
                // 1. Revoga a chave antiga
                await deleteApiKey(personalKey.id);
                addToast('Chave anterior revogada.', 'info');
                
                // 2. Gera a nova chave
                const newKey = await generateApiKey(PERSONAL_KEY_NAME);
                setGeneratedKey(newKey);
                addToast('Nova chave pessoal gerada com sucesso!', 'success');

                findPersonalKey(); // Atualiza o estado
            } catch (err) {
                addToast(`Ocorreu um erro: ${(err as Error).message}`, 'error');
            } finally {
                setActionInProgress(false);
            }
         }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addToast('Chave de API copiada!', 'success');
        }, () => {
            addToast('Falha ao copiar.', 'error');
        });
    };

    if (user.role !== 'superadmin') {
        return (
            <div className="p-8">
                <h2 className="text-2xl font-bold text-white">Configurações</h2>
                <p className="mt-4 text-slate-400">
                    Gerencie as configurações da sua conta de cliente aqui.
                </p>
            </div>
        )
    }

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-white">Configurações</h2>
            <p className="mt-2 text-slate-400">
                Gerencie suas preferências e chaves de acesso.
            </p>

            <div className="mt-8 max-w-3xl">
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-white">Chave de Acesso Pessoal (Super Admin)</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Use esta chave para autenticar scripts, testes de API ou automações que precisam de acesso total como super administrador, sem usar a chave principal do sistema.
                        </p>
                    </div>
                    
                    <div className="bg-slate-900 px-6 py-5">
                        {loading ? (
                            <p className="text-sm text-slate-500">Verificando...</p>
                        ) : personalKey ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-300">Sua chave pessoal foi gerada.</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Prefixo: <code className="font-mono text-amber-400">{personalKey.keyPrefix}...</code>
                                    </p>
                                </div>
                                <button 
                                    onClick={handleRevokeAndGenerate}
                                    disabled={actionInProgress}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors disabled:bg-red-800 disabled:cursor-wait"
                                >
                                    {actionInProgress ? 'Processando...' : 'Revogar e Gerar Nova'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-400">Você ainda não gerou uma chave de acesso pessoal.</p>
                                <button
                                    onClick={handleGenerate}
                                    disabled={actionInProgress}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:bg-amber-800 disabled:cursor-wait"
                                >
                                    {actionInProgress ? 'Gerando...' : 'Gerar Chave'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
             <Modal isOpen={!!generatedKey} onClose={() => setGeneratedKey(null)} title="Sua Nova Chave Pessoal">
                <div className="space-y-4">
                    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-md text-sm">
                        <p className="font-bold">⚠️ Atenção!</p>
                        <p className="mt-1">Esta é a **única vez** que a chave será exibida. Copie-a e guarde-a em um local seguro.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Sua chave pessoal</label>
                        <div className="flex items-center space-x-2 bg-black p-3 rounded-md border border-slate-700">
                            <pre className="text-amber-300 flex-1 overflow-x-auto text-sm"><code>{generatedKey?.key}</code></pre>
                            <button
                                onClick={() => copyToClipboard(generatedKey?.key || '')}
                                title="Copiar Chave"
                                className="p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                     <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setGeneratedKey(null)} className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors">
                            Entendi, fechar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SettingsView;
