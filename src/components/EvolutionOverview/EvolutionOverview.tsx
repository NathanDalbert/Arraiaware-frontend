import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Progress from '../Progress/progress';
import Spinner from '../Spinner/Spinner';

interface EvolutionEntry {
  cycleName: string;
  averages: Record<string, number>;    // nota já de 0–5
  finalEqualizationScore: number | null; // também 0–5
}

export default function EvolutionOverview() {
  const { user, token } = useContext(AuthContext)!;
  const [evolution, setEvolution] = useState<EvolutionEntry[] | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    const userId = (user as any)?.sub;
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    fetch(`https://arraiaware-backend.onrender.com/api/dashboard/user-evolution/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json() as Promise<EvolutionEntry[]>;
      })
      .then(data => setEvolution(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [(user as any)?.sub, token]);

  if (loading) return <Spinner />;
  if (error)   return <p className="text-red-600 text-center">Erro: {error}</p>;
  if (!evolution?.length) {
    return <p className="text-gray-500 text-center">Nenhuma avaliação encontrada.</p>;
  }

  const last = evolution[evolution.length - 1];

  return (
    <div>
      <h2 className="text-center text-lg font-semibold mb-4">
        Visão Geral ({last.cycleName})
      </h2>

      {Object.entries(last.averages).map(([pillar, score]) => (
        <Progress
          key={pillar}
          title={pillar}
          value={score}        // já de 0–5
          /* max não precisa, vai usar o default 5 */
        />
      ))}

      {last.finalEqualizationScore != null && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          Score Final: {Math.round(last.finalEqualizationScore * 10) / 10}/5
        </div>
      )}
    </div>
  );
}