import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'border-green-500 text-green-400 bg-bg-secondary shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    error: 'border-red-500 text-red-400 bg-bg-secondary shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    info: 'border-neon-blue text-neon-blue bg-bg-secondary shadow-[0_0_20px_rgba(59,130,246,0.3)]'
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-xl border-2 font-bold flex items-center gap-3 animate-in slide-in-from-right-full fade-in duration-300 ${colors[type]}`}>
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      {message}
    </div>
  );
};
