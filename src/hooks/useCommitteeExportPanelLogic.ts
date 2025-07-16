import { useCallback, useEffect, useState } from 'react';
import type { SelectOption } from '../components/CustomSelect/CustomSelect';
import type { Cycle } from '../types/evaluation';

export const useExportPanelLogic = () => {
  const [cycles, setCycles] = useState<SelectOption[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<SelectOption | null>(null);
  const [isLoadingCycles, setIsLoadingCycles] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCycles = async () => {
      setIsLoadingCycles(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Autenticação necessária.");
        setIsLoadingCycles(false);
        return;
      }

      try {
        const response = await fetch('https://arraiaware-backend.onrender.com/api/cycles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar ciclos de avaliação.');
        
        const data: Cycle[] = await response.json();
        const formattedCycles = data.map(cycle => ({
          id: cycle.id,
          name: cycle.name,
        }));
        setCycles(formattedCycles);
      } catch (err) {
        setError((err as Error).message);
        console.error("Erro ao buscar ciclos:", err);
      } finally {
        setIsLoadingCycles(false);
      }
    };
    fetchCycles();
  }, []); 

  const handleExport = useCallback(async () => {
    if (!selectedCycle) {
      setError("Por favor, selecione um ciclo para exportar.");
      return;
    }
    
    setIsDownloading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`https://arraiaware-backend.onrender.com/api/committee/export/cycle/${selectedCycle.id}/excel`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Falha ao exportar o arquivo (Status: ${response.status})`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Avaliacoes_Ciclo_${selectedCycle.name.replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError((err as Error).message);
      console.error("Erro ao exportar:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedCycle]); 

  return {
    cycles,
    selectedCycle,
    isLoadingCycles,
    isDownloading,
    error,
    setSelectedCycle,
    handleExport,
  };
};