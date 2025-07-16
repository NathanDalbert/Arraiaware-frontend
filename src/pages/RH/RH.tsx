import { AlertTriangle, Briefcase, CheckCircle2, ClipboardList, Clock, Import, Pencil, PlusCircle, SlidersHorizontal, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import SkeletonStatCard from '../../components/SkeletonStatCard/SkeletonStatCard';
import StatCard from '../../components/StatCard/StatCard';
import Tabs from '../../components/Tabs/Tabs';
import type { DashboardData, RHTabId } from '../../types/RH';
import type { Tab } from '../../types/tabs';
import CreateCyclePanel from './components/CreateCyclePanel';
import CreateRolePanel from './components/CreateRolePanel';
import CriteriaPanel from './components/CriteriaPanel';
import EditUserPanel from './components/EditUserPanel';
import EvaluationsPanel from './components/EvaluationsPanel';
import HistoryPanel from './components/HistoryPanel';
import OverallProgress from './components/OverallProgress';
import SignUpPanel from './components/SignUpPanel';

const rhTabOptions: Tab[] = [
  { id: 'status', label: 'Status das Avaliações', icon: <ClipboardList size={18} /> },
  { id: 'criterios', label: 'Critérios por Trilha', icon: <SlidersHorizontal size={18} /> },
  { id: 'historico', label: 'Importar Históricos', icon: <Import size={18} /> },
  { id: 'Cadastrar', label: 'Cadastrar Usuário', icon: <Users size={18} /> },
  { id: 'Editar'   , label: 'Editar Usuário'   , icon: <Pencil size={18}/>},
  { id: 'cargos', label: 'Criar Cargos', icon: <Briefcase size={18} /> },
  { id: 'ciclos', label: 'Criar Novo Ciclo de Avaliação', icon: <PlusCircle size={18} /> }
];

export default function RH() {
  const [activeTab, setActiveTab] = useState<RHTabId>('status');

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const contentPanelRef = useRef<HTMLDivElement>(null);
  
  const completedPercentage = dashboardData && dashboardData.totalEvaluations > 0
    ? Math.round((dashboardData.completedEvaluations / dashboardData.totalEvaluations) * 100)
    : 0;

   const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Autenticação necessária.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://arraiaware-backend.onrender.com/api/dashboard/overall-stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Falha ao buscar dados do dashboard.');
      
      const data: DashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Erro no dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); 

  const handleTabClick = (tabId: string) => {
      setActiveTab(tabId as RHTabId);
      setTimeout(() => {
        if (contentPanelRef.current) {
          const elementTop = contentPanelRef.current.getBoundingClientRect().top + window.scrollY;
          const offset = 150;
          window.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth'
          });
        }
      }, 0); 
    };
  
  return (
    <div className="min-h-screen bg-orange-50">
      <Header />
      <main className="pt-24">
        <section className="mb-10 pl-12 text-left">
            <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
                Acompanhamento RH <span></span>
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
                Monitore o progresso de preenchimento de todas as avaliações da empresa
            </p>
        </section>
        <div className='max-w-[1600px] mx-auto px-6 lg:px-10'>

            {isLoading || !dashboardData ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                </div>
              </>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                      title="Total de Avaliações"
                      value={dashboardData.totalEvaluations.toString()}
                      subtitle={`${dashboardData.totalActiveUsers} Colaboradores ativos`}
                      Icon={Users}
                      borderColor="border-black-500"
                      valueColor="text-black-500"
                      iconColor="text-black-500"
                  />
                  <StatCard 
                      title="Concluídas"
                      value={dashboardData.completedEvaluations.toString()}
                      subtitle={`${completedPercentage}% do total`}
                      Icon={CheckCircle2}
                      borderColor="border-green-500"
                      valueColor="text-green-500"
                      iconColor="text-green-500"
                  />
                    <StatCard
                      title="Pendentes"
                      value={dashboardData.pendingEvaluations.toString()}
                      subtitle="Aguardando conclusão"
                      Icon={Clock}
                      borderColor="border-amber-500"
                      valueColor="text-amber-500"
                      iconColor="text-amber-500"
                  />
                    <StatCard
                      title="Em Atraso"
                      value={dashboardData.overdueEvaluations.toString()}
                      subtitle="Requer atenção"
                      Icon={AlertTriangle}
                      borderColor="border-red-500"
                      valueColor="text-red-500"
                      iconColor="text-red-500"
                  />
                </div>
                <OverallProgress data={{
                  completed: dashboardData.completedEvaluations,
                  pending: dashboardData.pendingEvaluations,
                  overdue: dashboardData.overdueEvaluations,
                  total: dashboardData.totalEvaluations
                }} />
              </>
            )}
            
            <Tabs 
              tabs={rhTabOptions}
              activeTab={activeTab} 
              onTabClick={handleTabClick}
              className="mt-8 mb-4" 
            />
            <div ref={contentPanelRef} className="mt-[-1px]">
              {activeTab === 'status' && <EvaluationsPanel />}
              {activeTab === 'criterios' && <CriteriaPanel />}
              {activeTab === 'cargos' && <CreateRolePanel />}
              {activeTab === 'historico' && <HistoryPanel onImportSuccess={fetchDashboardData} />}
              {activeTab === 'Editar' && <EditUserPanel />}
              {activeTab === 'Cadastrar' && <SignUpPanel />}
              {activeTab === 'ciclos' && <CreateCyclePanel />}
            </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}