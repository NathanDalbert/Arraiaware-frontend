import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface NotificationMessagesProps {
  status: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
}

export default function NotificationMessages({ status, title, message, onClose }: NotificationMessagesProps) {

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = status === 'success';
  
  const baseClasses = 'fixed top-5 right-5 w-full max-w-sm p-4 rounded-lg shadow-lg flex items-start gap-3 z-100';
  const successClasses = 'bg-green-50 border border-green-200';
  const errorClasses = 'bg-red-50 border border-red-200';

  const iconClasses = isSuccess ? 'text-green-500' : 'text-red-500';
  const titleClasses = isSuccess ? 'text-green-800' : 'text-red-800';
  const messageClasses = isSuccess ? 'text-green-700' : 'text-red-700';

  return (
    <div className={`${baseClasses} ${isSuccess ? successClasses : errorClasses}`}>
      {/* Ícone */}
      <div className={`flex-shrink-0 ${iconClasses}`}>
        {isSuccess ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
      </div>
      
      {/* Conteúdo de Texto */}
      <div className="flex-1">
        <h4 className={`font-bold ${titleClasses}`}>{title}</h4>
        <p className={`text-sm mt-1 ${messageClasses}`}>{message}</p>
      </div>

      {/* Botão de Fechar */}
      <button onClick={onClose} className={`flex-shrink-0 ${iconClasses} opacity-70 hover:opacity-100`}>
        <X size={22} />
      </button>
    </div>
  );
}