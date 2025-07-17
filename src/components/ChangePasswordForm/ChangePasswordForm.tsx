import axios from 'axios';
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type NotificationState = {
  status: 'success' | 'error';
  title: string;
  message: string;
} | null;

interface ChangePasswordFormProps {
  onUpdate: (notification: NotificationState) => void;
  onClose: () => void;
  onBack: () => void; 
}

export default function ChangePasswordForm({ onUpdate, onClose, onBack }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'A nova senha deve ter no mínimo 8 caracteres.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'A nova senha deve conter pelo menos uma letra maiúscula.' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'A nova senha deve conter pelo menos uma letra minúscula.' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'A nova senha deve conter pelo menos um número.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'A nova senha deve conter pelo menos um caractere especial (ex: !@#$).' };
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onUpdate(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      onUpdate({ status: 'error', title: 'Campos Vazios', message: 'Por favor, preencha todos os campos.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      onUpdate({ status: 'error', title: 'Senhas não conferem', message: 'A nova senha e a confirmação devem ser iguais.' });
      return;
    }

    const strengthValidation = validatePasswordStrength(newPassword);
    if (!strengthValidation.valid) {
      onUpdate({ status: 'error', title: 'Senha Fraca', message: strengthValidation.message });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      onUpdate({ status: 'error', title: 'Não autenticado', message: 'Sua sessão expirou. Faça o login novamente.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await axios.patch(
        'https://arraiaware-backend.onrender.com//api/users/me/change-password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onUpdate({ status: 'success', title: 'Sucesso!', message: 'Sua senha foi alterada com sucesso.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(onClose, 2000);

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data?.message === 'Invalid current password'
          ? 'A senha atual está incorreta. Tente novamente.'
          : 'Ocorreu um erro. Verifique os dados e tente novamente.';
        onUpdate({ status: 'error', title: 'Erro ao Alterar Senha', message });
      } else {
        onUpdate({ status: 'error', title: 'Erro Inesperado', message: 'Não foi possível se comunicar com o servidor.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none";
  const labelStyles = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-md text-gray-800 flex items-center gap-2">
          <KeyRound size={18} /> Alterar Senha
        </h3>
        <button 
          type="button" 
          onClick={onBack} 
          className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      <div>
        <label htmlFor="currentPassword" className={labelStyles}>Senha Atual</label>
        <div className="relative">
          <input id="currentPassword" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputStyles} />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="newPassword" className={labelStyles}>Nova Senha</label>
        <div className="relative">
          <input id="newPassword" type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputStyles} />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Mínimo 8 caracteres, com maiúsculas, minúsculas, números e símbolos.
        </p>
      </div>
      <div>
        <label htmlFor="confirmNewPassword" className={labelStyles}>Confirmar Nova Senha</label>
        <input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className={inputStyles} />
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition disabled:opacity-50">
        {isSubmitting ? 'Salvando...' : 'Salvar Nova Senha'}
      </button>
    </form>
  );
}