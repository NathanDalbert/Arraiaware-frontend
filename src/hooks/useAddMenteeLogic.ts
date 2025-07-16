import { useCallback, useEffect, useState } from 'react';
import type { SelectOption } from '../components/CustomSelect/CustomSelect';
import type { ApiResponse, MenteeUser } from '../types/committee';

interface Notification {
  status: 'error' | 'success';
  title: string;
  message: string;
}

const userTypeOptions: SelectOption[] = [
        { id: 'all', name: 'Todos' },
        { id: 'COLABORADOR', name: 'Colaborador' },
        { id: 'GESTOR', name: 'Gestor' },
        { id: 'RH', name: 'RH' },
        { id: 'COMITE', name: 'Comitê' },
    ];

export function useAddMenteeLogic() {
  const [users, setUsers] = useState<MenteeUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<SelectOption | null>(null);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [associatingUserId, setAssociatingUserId] = useState<string | null>(null);

  useEffect(() => {
    const rawToken = localStorage.getItem('token');
    if (!rawToken) {
        setNotification({ status: 'error', title: 'Erro de Autenticação', message: 'Faça login para continuar.' });
        return;
    };
    
    try {
      const base64Payload = rawToken.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64Payload)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { sub } = JSON.parse(json);
      setMentorId(sub);
    } catch (e) {
      console.error('Não conseguiu decodificar token:', e);
      setNotification({ status: 'error', title: 'Erro de Autenticação', message: 'Seu token é inválido ou expirou.' });
    }
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); 
    }, []);
  
  const handleUserTypeChange = useCallback((option: SelectOption | null) => {
    setUserTypeFilter(option);
    setCurrentPage(1); 
    }, []);

  useEffect(() => {
    const fetchUsers = async () => {

      if (!mentorId) {
        setIsLoading(false); 
        return;
      }

      setIsLoading(true);
      setNotification(null); 

      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ status: 'error', title: 'Autenticação Falhou', message: 'Token não encontrado.' });
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('limit', '10'); 

        if (searchTerm) {
          params.append('search', searchTerm);
        }
        if (userTypeFilter && userTypeFilter.id !== 'all') {
            params.append('userType', userTypeFilter.id);
        }

        params.append('isActive', 'true');
        
        const response = await fetch(`https://arraiaware-backend.onrender.com/api/users/paginated?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar a lista de utilizadores.');
        }

        const data: ApiResponse = await response.json();

        setUsers(data.data);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.currentPage);

      } catch (err) {
        if (err instanceof Error) {
          setNotification({ status: 'error', title: 'Erro de Rede', message: err.message });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, searchTerm, userTypeFilter,mentorId]); 

  const associateMentor = useCallback(async (menteeId: string) => {
    if (!mentorId) {
        setNotification({ status: 'error', title: 'Ação Bloqueada', message: 'Não foi possível identificar o seu ID de mentor.' });
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        setNotification({ status: 'error', title: 'Autenticação Falhou', message: 'Token não encontrado.' });
        return;
    }

    setAssociatingUserId(menteeId); 
    setNotification(null);

    try {
        const response = await fetch(`https://arraiaware-backend.onrender.com/api/committee/users/${menteeId}/mentor`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mentorId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao associar mentor.');
        }

        setNotification({ status: 'success', title: 'Sucesso!', message: 'Usuário associado como mentorado.' });
        setUsers(currentUsers => currentUsers.filter(user => user.id !== menteeId));

    } catch (err) {
        if (err instanceof Error) {
            setNotification({ status: 'error', title: 'Erro na Operação', message: err.message });
        }
    } finally {
        setAssociatingUserId(null); 
    }
  }, [mentorId]);

  return {
    users,
    isLoading,
    notification,
    currentPage,
    totalPages,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    handleSearchChange,
    handleUserTypeChange,
    userTypeOptions,
    userTypeFilter,
    associateMentor,
    associatingUserId,
    setNotification,
  };
}
