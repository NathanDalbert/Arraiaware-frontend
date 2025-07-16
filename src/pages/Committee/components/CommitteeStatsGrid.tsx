import { AlertCircle, BarChart2, FileText, Loader2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import SkeletonStatCard from '../../../components/SkeletonStatCard/SkeletonStatCard';
import StatCard from '../../../components/StatCard/StatCard';
import type { CommitteeSummary } from '../../../types/committee';

export default function CommitteeStatsGrid(){
  const [summary, setSummary] = useState<CommitteeSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Autenticação não encontrada.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('https://arraiaware-backend.onrender.com/api/committee/summary/last', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar os dados de resumo do comitê.');
        }

        const data: CommitteeSummary = await response.json();
        setSummary(data);

      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, []); 

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8 flex items-center gap-4" role="alert">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <div>
          <p className="font-bold">Ocorreu um erro</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    isLoading ? (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    ) : error ? (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8 flex items-center gap-4" role="alert">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <div>
          <p className="font-bold">Ocorreu um erro</p>
          <p>{error}</p>
        </div>
      </div>
    ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Média Geral"
          value={summary?.overallAverage.toFixed(1) ?? '0'}
          subtitle="Média das avaliações concluídas"
          Icon={BarChart2}
          borderColor="border-black-500"
          valueColor="text-black-500"
          iconColor="text-black-500"
        />
        <StatCard
          title="Avaliações Entregues"
          value={summary?.readyEvaluations.toString() ?? '0'}
          subtitle="Avaliações completadas"
          Icon={FileText}
          borderColor="border-green-500"
          valueColor="text-green-500"
          iconColor="text-green-500"
          />
        <StatCard
          title="Total de Avaliados"
          value={summary?.totalCollaborators.toString() ?? '0'}
          subtitle="Colaboradores no ciclo atual"
          Icon={Users}
          borderColor="border-orange-500"
          valueColor="text-orange-500"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Avaliações Pendentes"
          value={summary?.pendingEvaluations.toString() ?? '0'}
          subtitle="Aguardando conclusão"
          Icon={Loader2}
          borderColor="border-yellow-500"
          valueColor="text-yellow-500"
          iconColor="text-yellow-500"
        />
      </div>
    )
  );
}
