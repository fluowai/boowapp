import React, { useState, useCallback, ReactNode } from 'react';
import useApi from '../hooks/useApi';
import { GlobalChatwootSettings } from '../types';
import { NetworkError } from '../services/api';
import { useToast } from '../contexts/ToastContext';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

const StatusIcon: React.FC<{ status: TestStatus }> = ({ status }) => {
    switch (status) {
        case 'loading':
            return (
                <svg className="animate-spin h-6 w-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            );
        case 'success':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'error':
            return (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'idle':
        default:
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
    }
}

const TestCard: React.FC<{
    title: string;
    description: string;
    status: TestStatus;
    onRunTest: () => void;
    buttonText: string;
    children: ReactNode;
    isTestDisabled?: boolean;
    disabledReason?: string;
}> = ({ title, description, status, onRunTest, buttonText, children, isTestDisabled, disabledReason }) => (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
        <div>
            <div className="flex items-start space-x-4">
                <StatusIcon status={status} />
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{description}</p>
                </div>
            </div>
            <div className="mt-4 pl-10 text-sm">{children}</div>
        </div>
        <div className="mt-6 flex justify-end">
            <button
                onClick={onRunTest}
                disabled={status === 'loading' || isTestDisabled}
                title={isTestDisabled ? disabledReason : ''}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? 'Executando...' : buttonText}
            </button>
        </div>
    </div>
);


interface SystemCheckViewProps {
  api: ReturnType<typeof useApi>;
  globalChatwootSettings: GlobalChatwootSettings | null;
  serverUrl: string | null;
  proxyUrl?: string | null;
}

const SystemCheckView: React.FC<SystemCheckViewProps> = ({ api, globalChatwootSettings, serverUrl, proxyUrl }) => {
    const { addToast } = useToast();
    // Teste 1: Conexão de Leitura (GET)
    const getTestStatus: TestStatus = api.loading ? 'loading' : api.error ? 'error' : 'success';
    
    // Teste 2: Conexão de Escrita (POST)
    const [postTestState, setPostTestState] = useState<{ status: TestStatus; error: NetworkError | Error | null }>({ status: 'idle', error: null });

    const runPostTest = useCallback(async () => {
        setPostTestState({ status: 'loading', error: null });
        try {
            await api.pingServer();
            setPostTestState({ status: 'success', error: null });
            addToast("Teste de escrita (POST) bem-sucedido!", "success");
        } catch (error) {
            setPostTestState({ status: 'error', error: error as NetworkError | Error });
        }
    }, [api, addToast]);

    // Teste 3: Conexão Servidor-Servidor (Chatwoot)
    const [chatwootTestState, setChatwootTestState] = useState<{ status: TestStatus; error: Error | null }>({ status: 'idle', error: null });

    const runChatwootTest = useCallback(async () => {
        if (!globalChatwootSettings) return;
        setChatwootTestState({ status: 'loading', error: null });
        try {
            const response = await api.testGlobalChatwootConnection(globalChatwootSettings);
            setChatwootTestState({ status: 'success', error: null });
            addToast(response.message || "Conexão com o Chatwoot bem-sucedida!", "success");
        } catch (error) {
            setChatwootTestState({ status: 'error', error: error as Error });
        }
    }, [api, globalChatwootSettings, addToast]);
    
    const codeStyles = "text-amber-300 bg-amber-900/50 px-1 py-0.5 rounded";

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Diagnóstico do Sistema</h2>
                <p className="mt-2 text-slate-400">
                    Use esta ferramenta para verificar a conectividade entre o painel, a API da Evolution e as integrações.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Card 1: Teste de Leitura (GET) */}
                <TestCard
                    title="Conexão de Leitura (GET)"
                    description="Verifica se o painel consegue buscar dados (ex: lista de instâncias) da sua API da Evolution."
                    status={getTestStatus}
                    onRunTest={api.refreshInstances}
                    buttonText="Testar Novamente"
                >
                    {getTestStatus === 'success' && (
                        <p className="text-green-400">
                            Sucesso! O painel consegue se comunicar com a API em <code className={codeStyles}>{serverUrl}</code>
                            {proxyUrl && <span className="text-slate-400 text-xs block mt-1">(via proxy <code className={codeStyles}>{proxyUrl}</code>)</span>}
                            .
                        </p>
                    )}
                    {getTestStatus === 'error' && (
                        <div className="text-red-300 bg-red-900/50 p-3 rounded-md">
                            <p className="font-semibold">Falha na conexão inicial.</p>
                            <p className="mt-2 text-xs">Erro: {api.error}</p>
                            <p className="mt-2 text-xs">Isso pode indicar uma URL de API incorreta, chave de API inválida, ou que o servidor está offline.</p>
                        </div>
                    )}
                </TestCard>

                {/* Card 2: Teste de Escrita (POST) */}
                <TestCard
                    title="Conexão de Escrita (POST)"
                    description="Verifica se o painel consegue enviar dados (ex: criar instância, salvar configurações) para a sua API."
                    status={postTestState.status}
                    onRunTest={runPostTest}
                    buttonText="Executar Teste"
                >
                    {postTestState.status === 'idle' && <p className="text-slate-500">Aguardando execução do teste...</p>}
                    {postTestState.status === 'success' && (
                        <p className="text-green-400">
                            Sucesso! As requisições de escrita para a API estão funcionando.
                            {proxyUrl && <span className="text-slate-400 text-xs block mt-1">(via proxy <code className={codeStyles}>{proxyUrl}</code>)</span>}
                        </p>
                    )}
                    {postTestState.error && (
                        <div className="text-red-300 bg-red-900/50 p-3 rounded-md">
                           <p className="font-semibold">Falha na requisição de escrita!</p>
                           {postTestState.error instanceof NetworkError ? (
                                <>
                                   <p className="mt-2 text-xs">Esta é a causa mais comum de erros ao salvar ou criar dados.</p>
                                   <button onClick={() => {
                                        if (postTestState.error instanceof NetworkError) {
                                            addToast(postTestState.error.message, 'error', postTestState.error.details);
                                        }
                                    }} className="mt-3 text-sm font-medium text-amber-400 hover:text-amber-300">Ver detalhes do erro de CORS</button>
                                </>
                           ) : (
                                <p className="mt-2 text-xs">Erro: {postTestState.error.message}</p>
                           )}
                        </div>
                    )}
                </TestCard>

                {/* Card 3: Teste de Integração (Chatwoot) */}
                <TestCard
                    title="Conexão API Evolution → Chatwoot"
                    description="Verifica se o seu servidor da Evolution API consegue se comunicar com a API do Chatwoot usando as credenciais salvas."
                    status={chatwootTestState.status}
                    onRunTest={runChatwootTest}
                    buttonText="Executar Teste"
                    isTestDisabled={!globalChatwootSettings}
                    disabledReason="Salve as credenciais na aba 'Integrações' para habilitar este teste."
                >
                    {chatwootTestState.status === 'idle' && <p className="text-slate-500">{!globalChatwootSettings ? "Configure as credenciais globais na aba 'Integrações' primeiro." : "Aguardando execução do teste..."}</p>}
                    {chatwootTestState.status === 'success' && <p className="text-green-400">Sucesso! Seu servidor da Evolution API conectou-se ao Chatwoot com as credenciais fornecidas.</p>}
                    {chatwootTestState.error && (
                        <div className="text-red-300 bg-red-900/50 p-3 rounded-md">
                           <p className="font-semibold">Falha na conexão com o Chatwoot!</p>
                           <p className="mt-2 text-xs">Erro retornado pelo servidor: {chatwootTestState.error.message}</p>
                           <p className="mt-2 text-xs">Verifique se a URL, Token e ID da Conta do Chatwoot estão corretos nas configurações de 'Integrações' e se o seu servidor da Evolution API tem acesso à internet.</p>
                        </div>
                    )}
                </TestCard>

            </div>
        </div>
    );
};

export default SystemCheckView;