import React, { useState, useCallback, useEffect } from 'react';
import { Instance, InstanceStatus, User, GlobalChatwootSettings } from '../types';
import Modal from './Modal';
import QRCodeModal from './QRCodeModal';
import { Icons } from '../constants';
import useApi from '../hooks/useApi';
import { useToast } from '../contexts/ToastContext';
import { NetworkError } from '../services/api';


const getStatusClasses = (status: InstanceStatus) => {
  switch (status) {
    case InstanceStatus.ONLINE:
      return { text: 'text-green-400', dot: 'bg-green-400' };
    case InstanceStatus.OFFLINE:
      return { text: 'text-red-400', dot: 'bg-red-400' };
    case InstanceStatus.ERROR:
      return { text: 'text-red-400', dot: 'bg-red-400' };
    case InstanceStatus.CONNECTING:
      return { text: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse' };
    default:
      return { text: 'text-slate-400', dot: 'bg-slate-400' };
  }
};

const InstanceRow: React.FC<{ 
    instance: Instance; 
    onDelete: (name: string) => void; 
    onManage: (instance: Instance) => void; 
    onConnect: (name: string) => void;
    onDisconnect: (name: string) => void;
    isConnecting: boolean;
}> = ({ instance, onDelete, onManage, onConnect, onDisconnect, isConnecting }) => {
  const statusClasses = getStatusClasses(instance.status);

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/50">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="font-medium text-white">{instance.name}</div>
            <div className="text-xs text-slate-500">{instance.id}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className={`inline-flex items-center text-sm ${statusClasses.text}`}>
                <span className={`w-2.5 h-2.5 mr-2 rounded-full ${statusClasses.dot}`}></span>
                {instance.status}
            </div>
        </td>
        <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">{instance.owner || 'N/A'}</td>
        <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">{instance.phoneNumber || 'N/A'}</td>
        <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">{instance.channels?.join(', ') || 'N/A'}</td>
        <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end flex-wrap gap-2">
                 <button 
                    onClick={() => onConnect(instance.name)} 
                    disabled={isConnecting}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors disabled:bg-green-800 disabled:cursor-wait"
                 >
                    {isConnecting ? 'Gerando...' : 'Conectar/QR Code'}
                 </button>
                 <button 
                    onClick={() => onDisconnect(instance.name)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 rounded-md hover:bg-orange-500 transition-colors"
                 >
                    Desconectar
                 </button>
                 <button onClick={() => onManage(instance)} className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-700 rounded-md hover:bg-slate-600 transition-colors">Gerenciar</button>
                 <button onClick={() => onDelete(instance.name)} className="px-4 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors">Excluir</button>
            </div>
        </td>
    </tr>
  );
};

const CreateInstanceModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onCreate: (name: string, automateChatwoot: boolean) => Promise<void>; 
    canAutomate: boolean;
}> = ({ isOpen, onClose, onCreate, canAutomate }) => {
    const [name, setName] = useState('');
    const [automate, setAutomate] = useState(canAutomate);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Sempre que a possibilidade de automação mudar (ex: admin preencheu as credenciais),
        // atualiza o estado padrão do checkbox.
        setAutomate(canAutomate);
    }, [canAutomate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await onCreate(name, automate && canAutomate);
            onClose();
            setName('');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Instância">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-md text-sm">{error}</div>}
                <div>
                    <label htmlFor="instanceName" className="block text-sm font-medium text-slate-300 mb-1">Nome da Instância</label>
                    <input type="text" id="instanceName" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-black border border-slate-800 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="MinhaNovaInstancia"/>
                </div>

                {canAutomate && (
                    <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-md">
                        <input 
                            type="checkbox" 
                            id="automateChatwoot" 
                            checked={automate} 
                            onChange={e => setAutomate(e.target.checked)} 
                            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="automateChatwoot" className="text-slate-300 text-sm">
                            <span className="font-semibold">Automatizar Integração com Chatwoot</span>
                            <p className="text-xs text-slate-500">Cria um Inbox no Chatwoot e configura o webhook automaticamente.</p>
                        </label>
                    </div>
                )}
                
                <div className="flex justify-end pt-4 space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isLoading || !name} className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:bg-amber-800 disabled:cursor-not-allowed">
                        {isLoading ? 'Criando...' : 'Criar Instância'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface InstancesViewProps {
  api: ReturnType<typeof useApi>;
  user: User;
  onManageInstance: (instance: Instance) => void;
  globalChatwootSettings: GlobalChatwootSettings | null;
}

const InstancesView: React.FC<InstancesViewProps> = ({ api, user, onManageInstance, globalChatwootSettings }) => {
  const { instances, loading, error, createInstance, deleteInstance, clientPlan, connectInstance, disconnectInstance } = api;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalState, setQrModalState] = useState<{
    isOpen: boolean;
    instanceName: string;
    qrCode: string | null;
    loading: boolean;
    error: string | null;
  }>({ isOpen: false, instanceName: '', qrCode: null, loading: false, error: null });
  const { addToast } = useToast();

  const handleConnect = useCallback(async (instanceName: string) => {
    setQrModalState({ isOpen: true, instanceName, loading: true, qrCode: null, error: null });
    try {
        const qrCodeString = await connectInstance(instanceName);
        setQrModalState(s => ({ ...s, loading: false, qrCode: qrCodeString }));
        
        setTimeout(() => {
            api.refreshInstances();
            setQrModalState(s => s.instanceName === instanceName ? { ...s, isOpen: false } : s);
        }, 30000);

    } catch(err) {
        setQrModalState(s => ({...s, loading: false, error: (err as Error).message }));
    }
  }, [connectInstance, api]);

  const closeQrModal = () => {
      setQrModalState({ isOpen: false, instanceName: '', loading: false, qrCode: null, error: null });
  };

  const handleCreateInstance = useCallback(async (name: string, automateChatwoot: boolean) => {
      if (automateChatwoot && globalChatwootSettings) {
          await createInstance(name, { automate: true, settings: globalChatwootSettings });
      } else {
          await createInstance(name);
      }
  }, [createInstance, globalChatwootSettings]);
  
  const handleDeleteInstance = useCallback(async (name: string) => {
      if(window.confirm(`Você tem certeza que deseja excluir a instância "${name}"? Esta ação não pode ser desfeita.`)) {
          try {
            await deleteInstance(name);
            addToast(`Instância "${name}" foi removida com sucesso.`, 'success');
          } catch (error) {
             const message = (error as Error).message || "Ocorreu um erro desconhecido";
             addToast(`Falha ao excluir instância: ${message}`, 'error', error instanceof NetworkError ? error.details : undefined);
          }
      }
  }, [deleteInstance, addToast]);

  const handleDisconnectInstance = useCallback(async (name: string) => {
      if(window.confirm(`Você tem certeza que deseja desconectar a instância "${name}"?`)) {
          await disconnectInstance(name);
      }
  }, [disconnectInstance]);

  const instancesUsed = instances.length;
  const maxInstances = clientPlan.maxInstances;
  const usagePercentage = maxInstances > 0 ? (instancesUsed / maxInstances) * 100 : 0;
  
  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10 text-slate-400">Carregando instâncias...</div>;
    }

    if (error) {
      return <div className="text-center py-10 text-red-400 bg-red-500/10 rounded-lg p-4"><strong>Erro ao carregar instâncias:</strong> {error}</div>;
    }
    
    if (instances.length === 0) {
        return <p className="text-slate-400 col-span-full text-center py-10">Nenhuma instância encontrada.</p>;
    }

    return (
       <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-slate-800 bg-slate-900">
            <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-300 uppercase bg-slate-900/70">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nome da Instância</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Proprietário</th>
                        <th scope="col" className="px-6 py-3">Telefone</th>
                        <th scope="col" className="px-6 py-3">Canal</th>
                        <th scope="col" className="px-6 py-3"><span className="sr-only">Ações</span></th>
                    </tr>
                </thead>
                <tbody>
                    {instances.map(instance => (
                        <InstanceRow 
                            key={instance.id} 
                            instance={instance} 
                            onDelete={handleDeleteInstance} 
                            onManage={onManageInstance}
                            onConnect={handleConnect}
                            onDisconnect={handleDisconnectInstance}
                            isConnecting={qrModalState.loading && qrModalState.instanceName === instance.name}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
  }

  return (
    <div className="p-8">
      {user.role === 'client' ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-xl font-semibold text-white">Suas Instâncias</h2>
                <p className="text-sm text-slate-400">Você está usando {instancesUsed} de {maxInstances} instâncias disponíveis no plano <span className="font-semibold text-amber-400">{clientPlan.name}</span>.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={user.role === 'client' && instancesUsed >= maxInstances}
              className="bg-amber-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-amber-500 transition-colors flex items-center space-x-2 disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
                <Icons.Instances className="w-5 h-5"/>
                <span>Criar Instância</span>
            </button>
          </div>
          <div className="mb-6">
              <div className="w-full bg-slate-800 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${usagePercentage}%` }}></div>
              </div>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Visão Geral de Todas as Instâncias</h2>
            <p className="text-sm text-slate-400">Como Super Admin, você tem acesso a todas as {instances.length} instâncias do sistema.</p>
          </div>
           <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-amber-500 transition-colors flex items-center space-x-2"
            >
                <Icons.Instances className="w-5 h-5"/>
                <span>Criar Instância</span>
            </button>
        </div>
      )}

      {renderContent()}
      
      <CreateInstanceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateInstance}
        canAutomate={!!globalChatwootSettings}
      />
      <QRCodeModal {...qrModalState} onClose={closeQrModal} />
    </div>
  );
};

export default InstancesView;