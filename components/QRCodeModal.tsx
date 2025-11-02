import React from 'react';
import Modal from './Modal';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  qrCode: string | null;
  loading: boolean;
  error: string | null;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, instanceName, qrCode, loading, error }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Conectar Instância: ${instanceName}`}>
      <div className="text-center">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64">
            <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-slate-300">Gerando QR Code, por favor aguarde...</p>
          </div>
        )}
        {error && (
           <div className="flex flex-col items-center justify-center h-64 bg-red-900/50 p-4 rounded-lg">
            <p className="font-semibold text-red-400">Erro ao gerar QR Code</p>
            <p className="mt-2 text-sm text-red-300">{error}</p>
            <p className="mt-4 text-xs text-slate-400">Verifique sua conexão e a chave de API. A instância pode já estar conectada ou em um estado inválido.</p>
          </div>
        )}
        {qrCode && !error && (
            <div className="flex flex-col items-center">
                <p className="mb-4 text-slate-300">Abra o WhatsApp no seu celular e escaneie o código abaixo para conectar a instância.</p>
                <div className="p-4 bg-white rounded-lg">
                    <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="mt-4 text-xs text-slate-500">O QR Code é atualizado automaticamente. A janela fechará ao conectar.</p>
            </div>
        )}
        <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors">Fechar</button>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal;
