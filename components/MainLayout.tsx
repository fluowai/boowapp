import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardView from './DashboardView';
import InstancesView from './InstancesView';
import PlansView from './PlansView';
import InstanceDetailView from './InstanceDetailView';
import ChatwootConsoleView from './ChatwootConsoleView';
import IntegrationsView from './IntegrationsView';
import SystemCheckView from './SystemCheckView';
import SettingsView from './SettingsView';
import ApiKeysView from './ApiKeysView';
import WhatsAppView from './WhatsAppView'; // Importa a nova view
import { ViewType, User, Instance, GlobalChatwootSettings } from '../types';
import useApi from '../hooks/useApi';

interface MainLayoutProps {
    user: User;
    apiKey: string;
    serverUrl: string;
    proxyUrl?: string;
    onLogout: () => void;
}

const PlaceholderView: React.FC<{ viewName: string, locked?: boolean }> = ({ viewName, locked }) => (
    <div className="p-8 flex items-center justify-center h-full text-center">
        <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center space-x-3">
                <span>{viewName}</span>
                {locked && (
                    <span className="text-sm bg-slate-800 text-slate-400 px-2 py-1 rounded-md font-mono">Em Breve</span>
                )}
            </h2>
            <p className="text-slate-400">Esta funcionalidade está em desenvolvimento e será lançada em breve.</p>
        </div>
    </div>
);

const MainLayout: React.FC<MainLayoutProps> = ({ user, apiKey, serverUrl, proxyUrl, onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [managingConversationsFor, setManagingConversationsFor] = useState<Instance | null>(null);
  const [globalChatwootSettings, setGlobalChatwootSettings] = useState<GlobalChatwootSettings | null>(null);
  const api = useApi(user, apiKey, serverUrl, proxyUrl);

  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('globalChatwootSettings');
        if (savedSettings) {
            setGlobalChatwootSettings(JSON.parse(savedSettings));
        }
    } catch (error) {
        console.error("Failed to load global settings from localStorage", error);
    }
  }, []);

  const handleSaveGlobalSettings = (settings: GlobalChatwootSettings) => {
    try {
        localStorage.setItem('globalChatwootSettings', JSON.stringify(settings));
        setGlobalChatwootSettings(settings);
    } catch (error) {
        console.error("Failed to save global settings to localStorage", error);
    }
  };

  const handleManageInstance = (instance: Instance) => {
      setSelectedInstance(instance);
      setManagingConversationsFor(null);
  };

  const handleManageConversations = (instance: Instance) => {
      setManagingConversationsFor(instance);
      setSelectedInstance(null);
  };

  const handleBackToList = () => {
      setSelectedInstance(null);
      setManagingConversationsFor(null);
      // Força a atualização da lista ao voltar, para refletir quaisquer mudanças salvas.
      api.refreshInstances();
  };

  const handleBackToDetails = () => {
      setSelectedInstance(managingConversationsFor);
      setManagingConversationsFor(null);
  };

  const renderView = () => {
    // Se estiver gerenciando conversas, mostre o console do Chatwoot
    if (managingConversationsFor) {
        return <ChatwootConsoleView instance={managingConversationsFor} onBack={handleBackToDetails} api={api} />;
    }

    // Se uma instância estiver selecionada, mostre a visão de detalhes
    if (selectedInstance) {
        return <InstanceDetailView 
            instance={selectedInstance} 
            onBack={handleBackToList} 
            api={api} 
            onManageConversations={handleManageConversations}
            globalChatwootSettings={globalChatwootSettings}
        />;
    }

    // Caso contrário, mostre a visão principal selecionada
    switch (currentView) {
      case 'dashboard':
        return <DashboardView api={api} user={user} />;
      case 'instances':
        return <InstancesView 
                    api={api} 
                    user={user} 
                    onManageInstance={handleManageInstance} 
                    globalChatwootSettings={globalChatwootSettings} 
                />;
      case 'crm':
        return <PlaceholderView viewName="CRM" />;
      case 'vendas':
        return <PlaceholderView viewName="Vendas" locked />;
      case 'whatsapp':
        return <WhatsAppView api={api} />;
      case 'ai-agents':
        return <PlaceholderView viewName="Agentes de IA" />;
      case 'contacts':
        return <PlaceholderView viewName="Contatos" />;
      case 'calendar':
        return <PlaceholderView viewName="Calendário" />;
      case 'instagram':
        return <PlaceholderView viewName="Instagram" />;
      case 'plans':
        return user.role === 'client' ? <PlansView api={api} user={user} /> : <div className="p-8 text-slate-400">Super admins não gerenciam planos.</div>;
      case 'settings':
        return <SettingsView api={api} user={user} />;
      case 'system-check':
        return <SystemCheckView api={api} globalChatwootSettings={globalChatwootSettings} serverUrl={serverUrl} proxyUrl={proxyUrl}/>;
      case 'integrations':
        return user.role === 'superadmin' 
            ? <IntegrationsView settings={globalChatwootSettings} onSave={handleSaveGlobalSettings} api={api} />
            : <div className="p-8 text-slate-400">Apenas Super Admins podem configurar integrações globais.</div>;
      case 'api-keys':
        return user.role === 'superadmin'
            ? <ApiKeysView api={api} />
            : <div className="p-8 text-slate-400">Apenas Super Admins podem gerenciar chaves de API.</div>;
      default:
        return <DashboardView api={api} user={user} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar user={user} currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} currentView={currentView} onLogout={onLogout} />
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;