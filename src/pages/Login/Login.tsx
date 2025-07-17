import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';
import { FaEye, FaEyeSlash, } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import HeaderLogin from '../../components/Header/Header_login';
import { useAuth } from '../../hooks/useAuth';
import type { DecodedToken } from '../../types/context';

export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await axios.post('https://arraiaware-backend.onrender.com/api/auth/login', {
        email: email,
        password: senha
      });
      const { access_token } = response.data;
      const decodedToken = jwtDecode<DecodedToken>(access_token);
      login(access_token, decodedToken);
      navigate('/Home');
    } catch (error: unknown) {
      console.error('Erro no login:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || 'Erro desconhecido. Tente novamente.';
        alert(`Erro no login: ${errorMessage}`);
      } else if (error instanceof Error) {
        alert(`Erro no login: ${error.message}`);
      } else {
        alert('Erro no login: Ocorreu um erro inesperado.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-orange-100 flex flex-col">
      <HeaderLogin />

      <div className="flex flex-1 justify-center items-center overflow-hidden">
        {/* Coluna da esquerda */}
        <div className="w-full lg:w-2/3 flex flex-col justify-center text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Autoavaliação <span className="text-orange-500">Inteligente</span>
            </h1>
            <p className="mx-5 text-xl text-gray-600 mb-6">
                Desenvolva seu potencial profissional com nossa plataforma moderna de autoavaliação. Acompanhe seu crescimento e identifique oportunidades de melhoria.
            </p>
            <div className="flex justify-center gap-16 mb-20">
              {/* Ícones */}
            </div>
        </div>

        {/* Coluna da direita - formulário */}
        <div className="w-full lg:w-1/5 bg-white p-8 shadow-md rounded-lg mx-4 lg:mx-5">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Acesse sua conta</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-2">
              <label htmlFor="email" className="block text-gray-700">E-mail</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="seu.email@empresa.com"
                required
              />
            </div>

            <div className="mb-2 relative">
              <label htmlFor="senha" className="block text-gray-700">Senha</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                placeholder="Sua senha"
                required
              />
              <span
                className="absolute inset-y-0 right-0 pr-3 flex items-center pt-8 cursor-pointer text-gray-500"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">Lembrar-me</span>
              </div>
              {/* ATUALIZAÇÃO: Rota corrigida para /change-password */}
              <Link
                to="/change-password"
                className="text-sm text-orange-500 cursor-pointer hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full p-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Entrar
            </button>

            <p className="text-center mt-4 text-gray-600">
              Não tem uma conta?
              <a href="#" className="text-orange-500 ml-1">Fale com RH</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}