// src/pages/Dashboard.tsx
import { TrendingUp } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { FaChartLine } from 'react-icons/fa';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import EvolutionOverview from '../../components/EvolutionOverview/EvolutionOverview';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import { AuthContext } from '../../context/AuthContext';

/** DADOS DE EXEMPLO – SUBSTITUA PELA SUA API DEPOIS **/
const sampleData = [
  { name: 'Jan', Avaliações: 8, Metas: 5 },
  { name: 'Fev', Avaliações: 12, Metas: 7 },
  { name: 'Mar', Avaliações: 9, Metas: 6 },
  { name: 'Abr', Avaliações: 14, Metas: 10 },
  { name: 'Mai', Avaliações: 11, Metas: 8 },
];

interface Cycle {
  id: string;
  name: string;
  endDate: string;
  status: 'Aberto' | 'Fechado';
}

export default function Dashboard() {
  const auth = useContext(AuthContext)!;
  const { user, token } = auth;
  const [ ,setPastCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    async function loadCycles() {
      try {
        const res = await fetch('https://arraiaware-backend.onrender.com/api/cycles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erro ao carregar ciclos');
        const data: Cycle[] = await res.json();
        data.sort((a, b) => {
          if (a.status === 'Aberto' && b.status !== 'Aberto') return -1;
          if (b.status === 'Aberto' && a.status !== 'Aberto') return 1;
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        });
        setPastCycles(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadCycles();
  }, [token]);

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="fixed top-0 left-0 w-full z-50">
        <Header />
      </div>

      <main className="pt-24 px-6 lg:px-10 max-w-[1600px] mx-auto">
        {/* Saudação */}
        <section className="mb-10">
          <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
            Olá, {user?.name || 'visitante'}! <span className="wave">👋</span>
          </h1>
          <p className="text-gray-700">
            Bem-vinda ao seu painel de Dashboard, <strong>{user?.name || ''}</strong> . Aqui você pode monitorar todo o seu progresso na empresa ate agora
          </p>
        </section>

        {/* Banner de Resultados */}
        <div className="bg-orange-100 rounded-2xl p-6 mb-10">
          <div className="flex flex-row justify-between items-center gap-6">
            {/* Pontuação Geral */}
            <div className="flex-1 text-center">
              <p className="text-5xl font-bold text-orange-600">8.4</p>
              <p className="mt-1 text-gray-700">
                Pontuação Geral<br />
                <span className="text-sm text-gray-500">de 10.0</span>
              </p>
            </div>

            {/* Evolução */}
            <div className="flex-1 text-center">
              <p className="inline-flex items-center text-3xl font-semibold text-green-600">
                <TrendingUp className="w-6 h-6 mr-1" />+0.3
              </p>
              <p className="mt-1 text-gray-700">
                Evolução<br />
                <span className="text-sm text-gray-500">vs. período anterior</span>
              </p>
            </div>

            {/* Metas Atingidas */}
            <div className="flex-1 text-center">
              <p className="text-5xl font-bold text-blue-600">85%</p>
              <p className="mt-1 text-gray-700">
                Metas Atingidas<br />
                <span className="text-sm text-gray-500">17 de 20 objetivos</span>
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico de Desempenho + Visão Geral */}
        <section className="flex flex-row gap-4 mb-10">
          {/* Desempenho Mensal */}
          <div className="bg-white rounded-xl shadow-md p-10 w-[65%] h-[300px]">
            <div className="flex items-center gap-2 mb-4">
              <FaChartLine className="text-orange-500 text-2xl" />
              <h2 className="text-xl font-semibold">Desempenho Mensal</h2>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="Avaliações" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="Metas" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Visão Geral dinâmica vinda do back */}
            <div className="bg-white rounded-xl shadow-md p-6 w-[35%]">
              <EvolutionOverview />
            </div>
          </section>

        <section className="mb-10">
        <div className="bg-white rounded-xl shadow-md p-10 w-[65%] h-[300px]">
          <div className="flex items-center gap-2 mb-4">
            <FaChartLine className="text-orange-500 text-2xl" />
            <h2 className="text-xl font-semibold">Metas por Mês</h2>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sampleData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Metas" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

        
      </main>

      <Footer />
    </div>
  );
}