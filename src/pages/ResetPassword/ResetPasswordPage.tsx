import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import HeaderLogin from '../../components/Header/Header_login';
import NotificationMessages from '../../components/NotificationMessages/NotificationMessages';

type NotificationState = {
  status: 'success' | 'error';
  title: string;
  message: string;
} | null;

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotification(null);

    if (!email.trim()) {
      setNotification({
        status: 'error',
        title: 'Campo Obrigatório',
        message: 'O campo de e-mail não pode estar vazio.',
      });
      return;
    }
    if (!validateEmail(email)) {
      setNotification({
        status: 'error',
        title: 'E-mail Inválido',
        message: 'Por favor, insira um formato de e-mail válido.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post('http://localhost:3000/api/users/reset-password', {
        email: email,
      });
      
      setNotification({
        status: 'success',
        title: 'Solicitação Enviada!',
        message: 'Se o e-mail existir em nossa base, um email de redefinição será enviado.',
      });
      setEmail(''); 

    } catch (err) {
      console.error('Erro ao solicitar redefinição de senha:', err);

      setNotification({
        status: 'error',
        title: 'Falha na Operação',
        message: 'Não foi possível processar sua solicitação. Tente novamente mais tarde.',
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-100 flex flex-col">
      {notification && (
        <NotificationMessages
          status={notification.status}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)} 
        />
      )}

      <HeaderLogin />

      <div className="flex flex-1 justify-center items-center">
        <div className="w-full max-w-md bg-white p-8 shadow-md rounded-lg mx-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Redefinir Senha</h2>
          <p className="text-center text-gray-600 mb-6">
            Digite seu e-mail para receber o email de redefinição.
          </p>
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="seu.email@rocketcorp.com"
                required
              />
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full p-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </button>
              
              <Link to="/login" className="text-sm text-orange-500 hover:underline">
                Voltar para o Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}