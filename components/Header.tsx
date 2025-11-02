import React from 'react';
import { ViewType, User } from '../types';
import { NAV_ITEMS, Icons } from '../constants';

interface HeaderProps {
  user: User;
  currentView: ViewType;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, currentView, onLogout }) => {
  const viewTitle = NAV_ITEMS.find(item => item.view === currentView)?.name || 'Configurações';
  
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-black border-b border-slate-800">
      <h1 className="text-2xl font-bold text-white">{viewTitle}</h1>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm font-medium text-white">{user.name}</div>
            <div className="text-xs text-amber-400 capitalize">{user.role === 'superadmin' ? 'Super Admin' : `Plano ${user.plan?.name || 'Básico'}`}</div>
          </div>
          <img
            className="h-10 w-10 rounded-full object-cover border-2 border-slate-700"
            src={`https://i.pravatar.cc/100?u=${user.name}`}
            alt="User avatar"
          />
        </div>
         <button onClick={onLogout} title="Sair" className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;