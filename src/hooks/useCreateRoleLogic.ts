import { useCallback, useState } from 'react';
import type { NotificationState } from '../types/global';

export const useCreateRoleLogic = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!name.trim() || !description.trim()) {
      setNotification({ status: 'error', title: 'Campos Inválidos', message: 'Por favor, preencha todos os campos.' });
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
      const requestBody = {
        name,
        type: 'CARGO',
        description,
      };

      const response = await fetch('https://arraiaware-backend.onrender.com/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Não foi possível criar o cargo.`);
      }

      setNotification({ status: 'success', title: 'Sucesso!', message: `O cargo "${name}" foi criado.` });
      setName('');
      setDescription('');

    } catch (error) {
      setNotification({ status: 'error', title: 'Falha na Criação', message: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description]); 

  return {
    name,
    setName,
    description,
    setDescription,
    isSubmitting,
    notification,
    setNotification, 
    handleSubmit,
  };
};