import React, { useState } from 'react';
import { User } from '../types';
import { Icons } from '../constants';
import * as api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface LoginViewProps {
  onLogin: (user: User, apiKey: string, serverUrl: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [apiKey, setApiKey] = useState('');
    const [serverUrl, setServerUrl] = useState('http://localhost:3001'); // Guia o usuário para a configuração correta
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!apiKey || !serverUrl) {
            setError('Por favor, preencha a URL do servidor e a chave de API.');
            setLoading(false);
            return;
        }

        try {
            // Valida a conexão e a chave de API tentando buscar as instâncias
            // através do nosso backend, que agora atua como um proxy.
            await api.fetchInstances(serverUrl, apiKey);
            
            // Assume o perfil de Super Admin para simplificar o login.
            const user: User = { name: 'Super Admin', role: 'superadmin' };
            onLogin(user, apiKey, serverUrl);

        } catch (err) {
            setLoading(false);
            if (err instanceof api.NetworkError) {
                // Para erros de rede (como CORS), exibe a notificação detalhada.
                setError(err.message);
                addToast(err.message, 'error', err.details);
            } else {
                // Para outros erros (ex: 401 Unauthorized do nosso backend), mostra uma mensagem simples.
                const errorMessage = (err as Error).message || 'Chave de API inválida ou erro no servidor do painel.';
                setError(errorMessage);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl shadow-amber-500/10">
                <header className="text-center">
                    <Icons.Logo className="h-12 w-auto mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">Acesse seu Painel</h2>
                    <p className="mt-2 text-slate-400">
                        Insira a URL e a chave de API do seu servidor de painel.
                    </p>
                </header>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="serverUrl" className="block text-sm font-medium text-slate-300 mb-2">URL do Servidor do Painel</label>
                        <input 
                            id="serverUrl" 
                            type="url" 
                            value={serverUrl} 
                            onChange={(e) => setServerUrl(e.target.value)} 
                            required 
                            className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            placeholder="http://localhost:3001"
                        />
                    </div>
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">Chave de API do Painel (apikey)</label>
                        <input 
                            id="apiKey" 
                            type="password" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)} 
                            required 
                            className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            placeholder="••••••••••••••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-3 rounded-md text-center text-sm">
                            {error}
                        </div>
                    )}

                    <footer className="pt-2">
                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-wait">
                            {loading ? 'Validando...' : 'Entrar'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default LoginView;