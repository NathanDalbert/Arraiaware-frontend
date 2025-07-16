import { useCallback, useState } from 'react';
import type { NotificationState } from '../types/global';

export const useCreateCycleLogic = () => {
  const [name, setName] = useState('');

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!name.trim() || !startDate || !endDate) {
      setNotification({ 
        status: 'error', 
        title: 'Campos Incompletos', 
        message: 'Por favor, preencha o nome e as datas de início e término.' 
      });
      return;
    }

    if (startDate >= endDate) {
      setNotification({ 
        status: 'error', 
        title: 'Datas Inválidas', 
        message: 'A data de término deve ser posterior à data de início.' 
      });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setNotification({ status: 'error', title: 'Erro de Autenticação', message: 'Por favor, faça login novamente.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const finalEndDate = new Date(endDate);
      finalEndDate.setHours(23, 59, 59, 999);

      const requestBody = {
        name,
        startDate: startDate.toISOString(),
        endDate: finalEndDate.toISOString(),
      };

      const response = await fetch('https://arraiaware-backend.onrender.com/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: Não foi possível criar o ciclo.`);
      }

      setNotification({ status: 'success', title: 'Sucesso!', message: `O ciclo "${name}" foi criado.` });
      
      setName('');
      setStartDate(null);
      setEndDate(null);

    } catch (error) {
      setNotification({ status: 'error', title: 'Falha na Criação', message: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, startDate, endDate]); 

  return {
    name, setName,
    startDate, setStartDate,
    endDate, setEndDate,
    isSubmitting,
    notification, setNotification, 
    handleSubmit,
  };
};