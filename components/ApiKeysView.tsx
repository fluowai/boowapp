import React, { useState, useEffect, useCallback } from 'react';
import useApi from '../hooks/useApi';
import { ApiKey, ApiKeyInfo } from '../types';
import Modal from './Modal';
import { useToast } from '../contexts/ToastContext';
import { Icons } from '../constants';

const ApiKeysView: React.FC<{ api: ReturnType<typeof useApi> }> = ({ api }) => {
    const { fetchApiKeys, generateApiKey, deleteApiKey } = api;
    const { addToast } = useToast();
    const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [generating, setGenerating] = useState(false);

    const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null);

    const loadKeys = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedKeys = await fetchApiKeys();
            setKeys(fetchedKeys);
        } catch (err) {
            setError((err as Error).message);
            addToast(`Erro ao buscar chaves: ${(err as Error).message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [fetchApiKeys, addToast]);

    useEffect(() => {
        loadKeys();
    }, [loadKeys]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const result = await generateApiKey(newKeyName);
            setGeneratedKey(result);
            setIsGenerateModalOpen(false);
            setNewKeyName('');
            addToast('Chave de API gerada com sucesso!', 'success');
            loadKeys(); // Refresh the list in the background
        } catch (err) {
            addToast(`Erro ao gerar chave: ${(err as Error).message}`, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (keyId: string, keyName: string) => {
        if (window.confirm(`Você tem certeza que deseja excluir a chave "${keyName}"? Esta ação é irreversível.`)) {
            try {
                await deleteApiKey(keyId);
                addToast(`Chave "${keyName}" excluída com sucesso.`, 'success');
                loadKeys();
            } catch (err) {
                addToast(`Erro ao excluir chave: ${(err as Error).message}`, 'error');
            }
        }
    };

    const copyToClipboard = (text: string, successMessage: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addToast(successMessage, 'success');
        }, (err) => {
            addToast('Falha ao copiar para a área de transferência.', 'error');
        });
    };
    
    const closeGeneratedKeyModal = () => {
        setGeneratedKey(null);
    };

    const renderContent = () => {
        if (loading) {
            return <div className="text-center py-10 text-slate-400">Carregando chaves de API...</div>;
        }
        if (error) {
            return <div className="text-center py-10 text-red-400 bg-red-500/10 rounded-lg p-4"><strong>Erro:</strong> {error}</div>;
        }
        if (keys.length === 0) {
            return <p className="text-slate-400 text-center py-10">Nenhuma chave de API gerada ainda.</p>;
        }
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                <ul role="list" className="divide-y divide-slate-800">
                    {keys.map((key) => (
                        <li key={key.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{key.name}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                    <span className="font-mono">{key.keyPrefix}...</span>
                                    <span className="mx-2 text-slate-600">&bull;</span>
                                    <span>Criada em: {new Date(key.createdAt).toLocaleDateString('pt-BR')}</span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => handleDelete(key.id, key.name)}
                                    className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors"
                                >
                                    Excluir
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gerenciar Chaves de API</h2>
                    <p className="mt-1 text-slate-400">Crie chaves de API para autenticar clientes ou integrações externas.</p>
                </div>
                <button
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="bg-amber-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-amber-500 transition-colors flex items-center space-x-2"
                >
                    <Icons.ApiKeys className="w-5 h-5" />
                    <span>Gerar Nova Chave</span>
                </button>
            </div>

            {renderContent()}

            {/* Modal para criar chave */}
            <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Gerar Nova Chave de API">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label htmlFor="keyName" className="block text-sm font-medium text-slate-300 mb-1">Nome da Chave</label>
                        <input
                            type="text"
                            id="keyName"
                            value={newKeyName}
                            onChange={e => setNewKeyName(e.target.value)}
                            required
                            className="w-full bg-black border border-slate-800 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            placeholder="Ex: Cliente XPTO, Integração Blip"
                        />
                        <p className="mt-1 text-xs text-slate-500">Dê um nome descritivo para identificar o uso desta chave.</p>
                    </div>
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors">Cancelar</button>
                        <button type="submit" disabled={generating || !newKeyName} className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:bg-amber-800 disabled:cursor-not-allowed">
                            {generating ? 'Gerando...' : 'Gerar Chave'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal para exibir a chave gerada */}
            <Modal isOpen={!!generatedKey} onClose={closeGeneratedKeyModal} title="Chave de API Gerada com Sucesso">
                <div className="space-y-4">
                    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-md text-sm">
                        <p className="font-bold">⚠️ Atenção!</p>
                        <p className="mt-1">Esta é a **única vez** que a chave será exibida. Copie-a e guarde-a em um local seguro. Você não poderá vê-la novamente.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Chave para "{generatedKey?.name}"</label>
                        <div className="flex items-center space-x-2 bg-black p-3 rounded-md border border-slate-700">
                            <pre className="text-amber-300 flex-1 overflow-x-auto text-sm"><code>{generatedKey?.key}</code></pre>
                            <button
                                onClick={() => copyToClipboard(generatedKey?.key || '', 'Chave de API copiada!')}
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
                        <button type="button" onClick={closeGeneratedKeyModal} className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors">
                            Entendi, fechar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ApiKeysView;
