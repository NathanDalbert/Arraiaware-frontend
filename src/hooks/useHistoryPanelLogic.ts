import { useCallback, useEffect, useState } from 'react';
import type { ImportHistoryEntry } from '../types/RH';

interface HistoryFromApi {
  id: string;
  fileName: string;
  importDate: string;
  status: string;
}

interface NotificationState {
  status: 'success' | 'error';
  title: string;
  message: string;
}

export const useHistoryPanelLogic = () => {
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [notification, setNotification] = useState<NotificationState | null>(null);

  const fetchHistory = useCallback(async () => {
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Autenticação necessária.");
      setIsLoading(false); 
      return;
    }

    try {
      const response = await fetch('https://arraiaware-backend.onrender.com/api/import-history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar histórico: ${response.statusText}`);
      }

      const apiData: HistoryFromApi[] = await response.json();
      const formattedHistory: ImportHistoryEntry[] = apiData.map(item => ({
        id: item.id,
        file: item.fileName,
        date: item.importDate,
        status: item.status,
      }));
      
      setHistory(formattedHistory);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    const loadInitialHistory = async () => {
      setIsLoading(true);
      await fetchHistory();
      setIsLoading(false);
    };

    loadInitialHistory();
  }, [fetchHistory]); 

  const handleDeleteHistory = useCallback(async (id: string) => {
   
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`https://arraiaware-backend.onrender.com/api/import-history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Falha ao excluir o registro.');
      
      await fetchHistory(); 
    } catch (err) {
      console.error(err);
      alert((err as Error).message); 
    }
  }, [fetchHistory]); 

  const handleDownload = useCallback(async (entry: ImportHistoryEntry) => {
    setDownloadingId(entry.id);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`https://arraiaware-backend.onrender.com/api/import-history/${entry.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Não foi possível baixar o arquivo.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = entry.file;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setDownloadingId(null);
    }
  }, []); 

  const handleCriteriaImport = useCallback(async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotification({
        status: 'error',
        title: 'Falha na Autenticação',
        message: 'Por favor, faça login novamente.'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://arraiaware-backend.onrender.com/api/criteria/batch-update', {
        method: 'PATCH', 
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro de rede');
      }

      setNotification({
        status: 'success',
        title: 'Sucesso!',
        message: 'Critérios processados com sucesso.',
      });

    } catch (err) {
      setNotification({
        status: 'error',
        title: 'Erro na Importação',
        message: (err as Error).message || 'Não foi possível conectar ao servidor.',
      });
    }
  }, []);
  
  // 3. Função para fechar a notificação
  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    history,
    isLoading,
    error,
    downloadingId,
    notification,
    handleDeleteHistory,
    handleDownload,
    refreshHistory: fetchHistory,
    handleCriteriaImport, 
    closeNotification,    
  };
};