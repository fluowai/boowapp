import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import ToastContainer from '../components/ToastContainer';
import { ToastMessage, ToastType } from '../types';
import Modal from '../components/Modal';

interface ToastContextType {
  addToast: (message: string, type: ToastType, details?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const addToast = useCallback((message: string, type: ToastType = 'info', details?: string) => {
        const id = Date.now() + Math.random();
        setToasts(prevToasts => [...prevToasts, { id, message, type, details }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const showDetailsModal = useCallback((title: string, content: string) => {
        setModalContent({ title, content });
        setIsCopied(false);
    }, []);

    const hideDetailsModal = useCallback(() => {
        setModalContent(null);
    }, []);

    const handleCopy = useCallback(() => {
        if (modalContent?.content) {
            navigator.clipboard.writeText(modalContent.content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }
    }, [modalContent]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} showDetails={showDetailsModal} />
            <Modal
                isOpen={!!modalContent}
                onClose={hideDetailsModal}
                title={modalContent?.title || 'Detalhes do Erro'}
            >
                {modalContent && (
                    <div className="space-y-4">
                        <div className="bg-slate-800 p-4 rounded-md max-h-[60vh] overflow-y-auto">
                            <pre className="text-slate-300 whitespace-pre-wrap text-sm font-sans">{modalContent.content}</pre>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleCopy}
                                disabled={isCopied}
                                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-500 transition-all duration-200 disabled:bg-green-600 disabled:cursor-default"
                            >
                                {isCopied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copiar para Área de Transferência
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </ToastContext.Provider>
    );
};