import React from 'react';
import { ViewType, User } from '../types';
import { Icons, NAV_ITEMS } from '../constants';

interface SidebarProps {
  user: User;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentView, setCurrentView }) => {
  const navItemsForUser = NAV_ITEMS.filter(item => {
    // Esconde itens de super admin para não-superadmin
    const superAdminOnlyViews: ViewType[] = [
        'integrations', 'crm', 'vendas', 'ai-agents', 'contacts', 'calendar', 'instagram', 'whatsapp'
    ];
    if (user.role !== 'superadmin' && superAdminOnlyViews.includes(item.view)) {
        return false;
    }
    return true;
  });

  return (
    <aside className="w-64 flex-shrink-0 bg-black/70 backdrop-blur-lg border-r border-slate-800 flex flex-col">
      <div className="h-20 flex items-center px-4 justify-start border-b border-slate-800">
        <Icons.Logo className="h-9 w-auto" />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItemsForUser.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.name}
              onClick={() => !item.locked && setCurrentView(item.view)}
              disabled={!!item.locked}
              className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group ${
                isActive
                  ? 'bg-amber-500 text-white shadow-lg'
                  : `text-slate-400 ${item.locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-900 hover:text-slate-200'}`
              }`}
            >
              <item.icon className={`h-5 w-5 mr-3 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="flex-1 text-left">{item.name}</span>
               {item.locked && (
                <Icons.LockClosed className="h-4 w-4 text-slate-500" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-6 border-t border-slate-800">
        <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group ${
                currentView === 'settings'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
        >
            <Icons.Settings className={`h-5 w-5 mr-3 transition-colors duration-200 ${currentView === 'settings' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span>Configurações</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;