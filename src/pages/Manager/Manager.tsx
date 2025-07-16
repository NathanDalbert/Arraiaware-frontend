import { AlertTriangle, CheckCircle2, ClipboardList, Clock, PlusCircle, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import CreateProjectPanel from '../../components/CreateProjectPanel/CreateProjectPanel';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import SkeletonStatCard from '../../components/SkeletonStatCard/SkeletonStatCard';
import StatCard from '../../components/StatCard/StatCard';
import Tabs from '../../components/Tabs/Tabs';
import type { Question } from '../../types/evaluation';
import type { ManagerDashboardData, managerTabId } from '../../types/manager';
import type { Tab } from '../../types/tabs';
import EvaluationsPanelManager from './components/EvolutionPanelManager';
import ManagerEvaluation from './components/ManagerEvaluation';
import OverallProgressManager from './components/OverallProgressManager';


const managerTabOptions: Tab[] = [
  { id: 'status', label: 'Status dos liderados', icon: <CheckCircle2 size={18} /> },
  { id: 'evaluation', label: 'Avaliação de liderados', icon: <ClipboardList size={18} /> },
  { id: 'projeto', label: 'Crie um Projeto', icon: <PlusCircle  size={18} /> },
];

const managerQuestions: Question[] = [
  {
    id: 'deliveryScore',
    type: 'scale',
    text: 'Qualidade e pontualidade das entregas'
  },
  {
    id: 'proactivityScore',
    type: 'scale',
    text: 'Proatividade e iniciativa na resolução de problemas'
  },
  {
    id: 'collaborationScore',
    type: 'scale',
    text: 'Colaboração e trabalho em equipe'
  },
  {
    id: 'skillScore',
    type: 'scale',
    text: 'Habilidades técnicas e de negócio'
  },
  {
    id: 'justification',
    type: 'text',
    text: 'Justificativa ou observações gerais sobre o desempenho'
  }
];

export default function Manager() { 
  const [activeTab, setActiveTab] = useState<managerTabId>('status');
  const contentPanelRef = useRef<HTMLDivElement>(null);
  
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);

  const userObject = useMemo(() => {
    const storedUserString = localStorage.getItem('user');
    if (storedUserString) {
      try {
        return JSON.parse(storedUserString);
      } catch (error) {
        console.error("Erro ao converter o objeto do usuário do localStorage:", error);
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (!userObject?.sub) {
      setError("ID do gestor não encontrado. Por favor, faça o login novamente.");
      setIsLoading(false);
      return;
    }
    
    const fetchManagerData = async () => {
      setIsLoading(true); 
      setError(null);     
      const token = localStorage.getItem('token');

      if (!token) {
        setError("Você não está autenticado.");
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`https://arraiaware-backend.onrender.com/api/dashboard/manager/${userObject.sub}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Falha ao buscar os dados do gestor.");
        }
        
        const data: ManagerDashboardData = await response.json();
        setDashboardData(data);
        console.log("cycleId vindo do backend:", data.cycleId)
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchManagerData(); 
  }, [userObject]); 

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as managerTabId);
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
        <section className="mb-10 px-6 md:px-12 text-left">
          <h1 className="text-3xl md:text-4xl font-bold">
            Acompanhamento de {userObject?.name || 'Liderados'}
          </h1>
          <p className="text-gray-600">
            Monitore o progresso de preenchimento dos seus liderados
          </p>
        </section>

        <div className='max-w-[1600px] mx-auto px-6 lg:px-10'>
          {isLoading ? (
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
                  title="Total de Liderados"
                  value={dashboardData?.summary.totalCollaborators.toString() ?? '0'}
                  subtitle="Colaboradores ativos"
                  Icon={Users}
                  borderColor="border-black-500"
                  valueColor="text-black-500"
                  iconColor="text-black-500"
                />
                <StatCard 
                  title="Concluídos"
                  value={dashboardData?.summary.completed.toString() ?? '0'}
                  subtitle="Avaliações finalizadas"
                  Icon={CheckCircle2}
                  borderColor="border-green-500" 
                  valueColor="text-green-500" 
                  iconColor="text-green-500"
                />
                <StatCard 
                  title="Pendentes"
                  value={dashboardData?.summary.pending.toString() ?? '0'}
                  subtitle="Aguardando conclusão"
                  Icon={Clock}
                  borderColor="border-amber-500" 
                  valueColor="text-amber-500" 
                  iconColor="text-amber-500"
                />
                <StatCard 
                  title="Em Atraso"
                  value={dashboardData?.summary.overdue.toString() ?? '0'}
                  subtitle="Requer atenção"
                  Icon={AlertTriangle}
                  borderColor="border-red-500" 
                  valueColor="text-red-500" 
                  iconColor="text-red-500"
                />
              </div>
              
              {dashboardData && <OverallProgressManager summary={dashboardData.summary} />} 
            </>
          )}

          <Tabs 
            tabs={managerTabOptions}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            className="mt-8 mb-4" 
          />
        
          <div ref={contentPanelRef} className="mt-8">
            {activeTab === 'status' && userObject && dashboardData && (
              <EvaluationsPanelManager
                managerId={userObject.sub}
                cycleId={dashboardData.cycleId}
              />
            )}
            
            

            {activeTab === 'projeto' && userObject && dashboardData && (
            <div className="w-full  mt-2">
              <CreateProjectPanel
                managerId={userObject.sub}
                cycleId={dashboardData.cycleId}
              />
              </div>
            )}

            {activeTab === 'evaluation' && dashboardData && (           
              <div className="bg-white p-8 rounded-lg shadow-md">
                <section className="mb-10 text-left">
                  <h2 className="text-xl font-bold text-gray-800">
                    <span>Avaliação de {userObject?.name || 'seus Liderados'}</span>
                  </h2>
                  <p className="text-base text-gray-500 mt-1">
                    Avalie os seus liderados conforme seu progresso no ciclo
                </p>
                </section>
                <ManagerEvaluation
                  managerId={userObject.sub}
                  cycleId={dashboardData.cycleId}       // passe exatamente o UUID
                  questions={managerQuestions}
                />
              </div>
            )}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}