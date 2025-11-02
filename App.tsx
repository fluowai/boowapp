import React, { useState, useCallback } from 'react';
import { User } from './types';
import LoginView from './components/LoginView';
import MainLayout from './components/MainLayout';
import { ToastProvider } from './contexts/ToastContext';

const App: React.FC = () => {
  const [auth, setAuth] = useState<{ user: User; apiKey: string; serverUrl: string; proxyUrl?: string } | null>(null);

  const handleLogin = useCallback((loggedInUser: User, apiKey: string, serverUrl: string, proxyUrl?: string) => {
    setAuth({ user: loggedInUser, apiKey, serverUrl, proxyUrl });
  }, []);

  const handleLogout = useCallback(() => {
    setAuth(null);
  }, []);

  return (
    <ToastProvider>
      {!auth 
        ? <LoginView onLogin={handleLogin} />
        : <MainLayout 
            user={auth.user} 
            apiKey={auth.apiKey} 
            serverUrl={auth.serverUrl} 
            proxyUrl={auth.proxyUrl}
            onLogout={handleLogout} 
          />
      }
    </ToastProvider>
  );
};

export default App;