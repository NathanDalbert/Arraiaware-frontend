import { useEffect, useState } from 'react';
import type { BrutalFacts } from '../types/committee';
import type { Cycle } from '../types/evaluation';

interface Notification {
  status: 'error' | 'success';
  title: string;
  message: string;
}

export function useBrutalFactsLogic() {
  const [brutalFacts, setBrutalFacts] = useState<BrutalFacts[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');

  const clearNotification = () => setNotification(null);
   useEffect(() => {
    try {
      const userDataString = localStorage.getItem('user');
      
      if (!userDataString) {
        setNotification({ 
          status: 'error', 
          title: 'Erro de Autenticação', 
          message: 'Faça login para continuar.' 
        });
        return;
      };
      
      const userData = JSON.parse(userDataString);
      if (userData && userData.sub) {
        setUserId(userData.sub);
      } else {
        throw new Error("O campo 'sub' não foi encontrado nos dados do usuário.");
      }

    } catch (e) {
      console.error('Falha ao processar dados do usuário:', e);
      setNotification({ 
        status: 'error', 
        title: 'Erro de Autenticação', 
        message: 'Seus dados de login são inválidos ou estão corrompidos.' 
      });
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function fetchCycles() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('https://arraiaware-backend.onrender.com/api/cycles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        
        const allCycles: Cycle[] = await res.json();
        setCycles(allCycles);

        const openCycle = allCycles.find(c => c.status.toLowerCase() === 'aberto');
        if (openCycle) {
          setSelectedCycleId(openCycle.id);
        } else if (allCycles.length > 0) {
          setSelectedCycleId(allCycles[0].id);
        }
        else {
            setIsLoading(false);
            setBrutalFacts([]);
        }

      } catch (e) {
        console.error('Erro ao buscar ciclos:', e);
        setNotification({ status: 'error', title: 'Erro ao carregar ciclos', message: 'Não foi possível buscar a lista de ciclos.' });
        setIsLoading(false);
      }
    }
    fetchCycles();
  }, [userId]); 

  useEffect(() => {
    const fetchBrutalFacts = async () => {
      if (!userId || !selectedCycleId) {
        return;
      }

      setIsLoading(true);
      setNotification(null); // Limpa notificações de buscas anteriores
      const token = localStorage.getItem('token');

      try {
        const url = new URL(`https://arraiaware-backend.onrender.com/api/brutal-facts/user/${userId}/cycle/${selectedCycleId}`);
        
        const response = await fetch(url.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar os dados de performance.');
        }
        
        const data: BrutalFacts[] = await response.json();
        setBrutalFacts(data);
      } catch (err) {
        if (err instanceof Error) {
          setNotification({ status: 'error', title: 'Erro de Rede', message: err.message });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBrutalFacts();
  }, [userId, selectedCycleId]); 

  return {
    brutalFacts,
    isLoading,
    notification,
    cycles,
    selectedCycleId, 
    setSelectedCycleId, 
    clearNotification
  };
}