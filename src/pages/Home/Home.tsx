import { CheckCircle2, Clock, Users } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { FaBullseye, FaChartLine, FaRegFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import EvolutionOverview from '../../components/EvolutionOverview/EvolutionOverview';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import StatCard from '../../components/StatCard/StatCard';
import { AuthContext } from '../../context/AuthContext';

/** ADICIONE ESTES IMPORTS **/
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Cycle {
  id: string;
  name: string;
  endDate: string;        // ex: "2024-12-01T15:30:00.000Z"
  status: 'Aberto' | 'Fechado';
}

export default function Home() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext)!;
  const { user, token } = auth;

  const [pastCycles, setPastCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    async function loadCycles() {
      try {
        const res = await fetch('https://arraiaware-backend.onrender.com/api/cycles', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('fetch /api/cycles status:', res.status);

        if (!res.ok) throw new Error('Erro ao carregar ciclos');
        const data: Cycle[] = await res.json();
        console.log('>>>> ciclos recebidos:', data);

        // primeiro Aberto, depois Fechado em ordem decrescente de endDate
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

  // Apenas para debug in-browser (remova em produção)
  // <pre className="text-xs text-gray-400">{JSON.stringify(pastCycles, null, 2)}</pre>

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="fixed top-0 left-0 w-full z-50">
        <Header />
      </div>

      <main className="pt-24">
        {/* Saudação */}
        <section className="mb-10 text-center ml-12">
          <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
            Olá, {user?.name || 'visitante'}! <span className="wave">👋</span>
          </h1>
          <p className="text-gray-700 flex items-center gap-2">
            Bem-vinda ao seu painel de autoavaliação, <strong>{user?.name || ''}</strong>. Seu cargo é{' '}
            <strong>{user?.userType || '—'}</strong>
          </p>
        </section>

        {/* Cards principais */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
            <StatCard 
              title="Avaliações Concluídas"
              value="12"
              subtitle="59% do total"
              Icon={CheckCircle2}
              borderColor="border-green-500"
              valueColor="text-green-500"
              iconColor="text-green-500"
            />
            <StatCard 
              title="Pontuação Média"
              value="8.5"
              subtitle="Colaboradores ativos"
              Icon={Users}
              borderColor="border-black-500"
              valueColor="text-black-500"
              iconColor="text-black-500"
            />
            <StatCard 
              title="Metas Atingidas"
              value="7/10"
              subtitle="Aguardando conclusão"
              Icon={FaBullseye}
              borderColor="border-amber-500"
              valueColor="text-amber-500"
              iconColor="text-amber-500"
            />
            <StatCard 
              title="Próxima Avaliação"
              value="15 Dias"
              subtitle="Requer atenção"
              Icon={Clock}
              borderColor="border-purple-500"
              valueColor="text-purple-500"
              iconColor="text-purple-500"
            />
          </div>

          {/* Seção de Avaliação em Andamento e Visão Geral */}
          <section className="flex flex-row gap-4 justify-center mb-10 mt-10">
            {/* Avaliação em Andamento */}
            <div className="bg-white rounded-xl shadow-md p-6 w-[65%]">
              <div className="flex items-center mb-4 gap-2">
                <FaRegFileAlt className="text-orange-500 text-2xl" />
                <h2 className="text-xl font-semibold">Avaliação em Andamento</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Complete sua autoavaliação trimestral até <strong>30 de dezembro</strong>.
              </p>
              <p className="text-sm font-medium mb-1">Progresso</p>
              <div className="w-full bg-gray-200 h-2 rounded-full mb-3">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }} />
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                <Badge text="Competências" checked onClick={() => navigate('/avaliacao/comportamento')} />
                <Badge text="Objetivos" checked onClick={() => navigate('/avaliacao/goals')} />
                <Badge text="Desenvolvimento" onClick={() => navigate('/avaliacao/growth')} />
                <Badge text="Feedback" onClick={() => navigate('/avaliacao/collab')} />
              </div>
              <button
                onClick={() => navigate('/avaliacao/comportamento')}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
              >
                Continuar Avaliação
              </button>
            </div>

            {/* Visão Geral dinâmica vinda do back */}
           <div className="bg-white rounded-xl shadow-md p-6 w-[35%]">
              <EvolutionOverview />
            </div>
          </section>

          {/* Avaliações Passadas + Ações Rápidas */}
          <section className="flex flex-row gap-4 justify-center mb-10">
            {/* Avaliações Passadas */}
            <div className="bg-white rounded-xl shadow-md p-6 w-[65%]">
              <div className="flex items-center mb-3 gap-2">
                <FaChartLine className="text-orange-500 text-xl" />
                <h3 className="text-lg font-semibold">Avaliações Passadas</h3>
              </div>
              
              <ul className="flex flex-col-reverse space-y-2 space-y-reverse">
                {pastCycles.length > 0 ? (
                  pastCycles.map(cycle => (
                    <li
                      key={cycle.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            cycle.status === 'Aberto' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="font-medium">{cycle.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {cycle.status === 'Fechado'
                          ? formatDistance(new Date(cycle.endDate), new Date(), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : 'Aberto'}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 p-3">Carregando ciclos…</li>
                )}
              </ul>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-xl shadow-md p-6 w-[35%]">
              <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <Action onClick={() => navigate('/avaliacao/comportamento')} icon={<FaRegFileAlt />}>
                  Nova Avaliação
                </Action>
                <Action onClick={() => navigate('/Dashboard')} icon={<FaChartLine />}>
                  Dashboard
                </Action>
                <Action onClick={() => navigate('/avaliacao/collab')} icon={<FaBullseye />}>
                  Definir Metas
                </Action>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

//////////////////// COMPONENTES AUXILIARES ////////////////////

const Badge = ({
  text,
  checked,
  onClick,
}: {
  text: string;
  checked?: boolean;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
      checked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
    } hover:brightness-95 transition`}
  >
    {text} {checked && '✓'}
  </div>
);

// Novo componente para as ações rápidas
const Action = ({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex items-center px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition cursor-pointer"
  >
    <span className="text-gray-600">{icon}</span>
    <span className="ml-3 text-gray-800">{children}</span>
  </div>
);