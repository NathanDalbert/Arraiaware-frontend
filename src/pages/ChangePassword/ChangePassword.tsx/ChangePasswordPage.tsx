import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { KeyRound, Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import StatCard from '../../components/StatCard/StatCard';
import type { DecodedToken } from '../../types/context';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://arraiaware-backend.onrender.com/api';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const navigate = useNavigate();
  const contentPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Você precisa estar logado para acessar esta página.');
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setUserEmail(decoded.email);
    } catch (error) {
      toast.error('Token inválido. Faça login novamente.');
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  }, [navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      return toast.error('A nova senha e a confirmação não coincidem.');
    }

    if (newPassword.length < 8) {
      return toast.error('A nova senha deve ter pelo menos 8 caracteres.');
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Você não está autenticado. Faça login novamente.');
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      await axios.patch(
        `${API_BASE_URL}/auth/me/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      // opcional: redirecionar após sucesso
      // navigate('/home');

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;

        if (error.response?.status === 401) {
          toast.error('Senha atual incorreta.');
        } else {
          toast.error(msg || 'Erro ao alterar senha.');
        }
      } else {
        toast.error('Erro inesperado ao alterar senha.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />
      <main className="pt-24 pb-12">
        <section className="mb-10 pl-12 text-left">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <KeyRound size={36} className="text-orange-500" />
            Alterar Senha
          </h1>
          <p className="text-gray-600 mt-2 ml-3">
            Mantenha sua conta segura atualizando sua senha regularmente.
          </p>
        </section>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              title="Usuário"
              value={userEmail || 'Carregando...'}
              subtitle="Usuário autenticado"
              Icon={Lock}
              borderColor="border-blue-500"
              valueColor="text-blue-500"
              iconColor="text-blue-500"
            />
          </div>

          <div ref={contentPanelRef} className="flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
              <h2 className="text-xl font-bold mb-6 text-center">Atualizar Minha Senha</h2>
              <form onSubmit={handleChangePassword}>
                <div className="mb-4">
                  <label htmlFor="current-password" className="block text-sm font-bold mb-2 text-gray-700">
                    Senha Atual
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="new-password" className="block text-sm font-bold mb-2 text-gray-700">
                    Nova Senha
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="confirm-new-password" className="block text-sm font-bold mb-2 text-gray-700">
                    Confirmar Nova Senha
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {isLoading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </form>

              <button
                onClick={() => navigate(-1)}
                className="mt-4 text-blue-500 hover:text-blue-700 text-sm w-full text-center"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}