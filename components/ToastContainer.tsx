import React, { useEffect } from 'react';
import { ToastMessage, ToastType } from '../types';

const ICONS: Record<ToastType, React.ReactNode> = {
    success: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    error: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    info: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const STYLES: Record<ToastType, { border: string, iconText: string }> = {
    success: { border: 'border-green-500', iconText: 'text-green-400' },
    error: { border: 'border-red-500', iconText: 'text-red-400' },
    info: { border: 'border-blue-500', iconText: 'text-blue-400' },
};

const TOAST_TITLES: Record<ToastType, string> = {
    success: 'Sucesso',
    error: 'Erro',
    info: 'Informação'
};


interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
  showDetails: (title: string, content: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss, showDetails }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 6000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const { border, iconText } = STYLES[toast.type];

  return (
    <div
      className={`max-w-sm w-full bg-slate-800/80 backdrop-blur-sm shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${border} mb-4 animate-fade-in-right`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconText}`}>
            {ICONS[toast.type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-white">
              {TOAST_TITLES[toast.type]}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {toast.message}
            </p>
            {toast.details && (
                <div className="mt-2">
                    <button
                        onClick={() => showDetails(TOAST_TITLES[toast.type], toast.details!)}
                        className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    >
                        Ver detalhes
                    </button>
                </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(toast.id)}
              className="inline-flex rounded-md text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600"
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
  showDetails: (title: string, content: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast, showDetails }) => {
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} showDetails={showDetails} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;