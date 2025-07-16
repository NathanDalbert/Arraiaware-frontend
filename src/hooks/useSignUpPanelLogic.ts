import { useCallback, useEffect, useState } from 'react';
import type { SelectOption } from '../components/CustomSelect/CustomSelect';
import type { NotificationState } from '../types/global';
import type { RoleFromApi } from '../types/RH';

const rolesOptions: SelectOption[] = [
  { id: 'COLABORADOR', name: 'Colaborador' },
  { id: 'GESTOR', name: 'Gestor' },
  { id: 'RH', name: 'RH' },
];

export const useSignUpPanelLogic = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<SelectOption | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SelectOption | null>(null);
  const [cargos, setCargos] = useState<SelectOption[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<SelectOption | null>(null);
  const [tracks, setTracks] = useState<SelectOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ status: 'error', title: 'Autenticação', message: 'Sessão inválida. Faça login novamente.' });
        setIsLoading(false);
        return;
      }
      
      try {
        const [cargosResponse, tracksResponse] = await Promise.all([
          fetch('https://arraiaware-backend.onrender.com/api/roles', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://arraiaware-backend.onrender.com/api/roles/trilhas', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!cargosResponse.ok) throw new Error('Falha ao buscar cargos');
        const allRoles: RoleFromApi[] = await cargosResponse.json();
        const filteredCargos = allRoles
          .filter(role => role.type === 'CARGO')
          .map(role => ({ id: role.id, name: role.name }));
        setCargos(filteredCargos);
        
        if (!tracksResponse.ok) throw new Error('Falha ao buscar trilhas');
        const tracksFromApi: { id: string; nome_da_trilha: string }[] = await tracksResponse.json();
        setTracks(tracksFromApi.map(track => ({ id: track.id, name: track.nome_da_trilha })));

      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        setNotification({ status: 'error', title: 'Erro de Carregamento', message: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []); 

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !selectedRole || !selectedTrack || !selectedCargo) {
      setNotification({ status: 'error', title: 'Campos Inválidos', message: 'Por favor, preencha todos os campos.' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);
    const token = localStorage.getItem('token');

    try {
      const requestBody = {
        name,
        email,
        userType: selectedRole.id,
        roleIds: [selectedTrack.id, selectedCargo.id],
      };
      
      const response = await fetch('https://arraiaware-backend.onrender.com/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Ocorreu um erro no servidor (Status: ${response.status}).`);
      }

      setNotification({
        status: 'success',
        title: 'Cadastro Realizado!',
        message: `O usuário ${name} foi criado com sucesso.`
      });

      setName('');
      setEmail('');
      setSelectedRole(null);
      setSelectedTrack(null);
      setSelectedCargo(null);
    } catch (error) {
      setNotification({
        status: 'error',
        title: 'Falha no Cadastro',
        message: (error as Error).message
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, email, selectedRole, selectedTrack, selectedCargo]);

  return {
    name, email, selectedRole, selectedTrack, cargos, selectedCargo, tracks, isSubmitting, notification, isLoading,
    setName, setEmail, setSelectedRole, setSelectedTrack, setSelectedCargo, setNotification,
    handleSubmit,
    rolesOptions,
  };
};