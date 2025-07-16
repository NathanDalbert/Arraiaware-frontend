import { useEffect, useState } from 'react';
import type { Criterion, ExistingCriterionData, NewCriterionData, Track, TracksFromApi } from '../types/RH';
import type { NotificationState } from '../types/global';

export function useCriteriaPanelLogic() {
  const [viewMode, setViewMode] = useState<'manage' | 'create'>('manage');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackSearchTerm, setTrackSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<{ trackId: string; criterion: Criterion } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [allCriteria, setAllCriteria] = useState<Criterion[]>([]);
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [associatingTrack, setAssociatingTrack] = useState<Track | null>(null);

  const filteredTracks = tracks.filter(track =>
    track.name && track.name.toLowerCase().includes(trackSearchTerm.toLowerCase())
  );

  const fetchAllCriteria = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Autenticação necessária.");
      return;
    }

    try {
      const response = await fetch('https://arraiaware-backend.onrender.com/api/criteria', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Falha ao buscar a lista de critérios.');
      const criteria: Criterion[] = await response.json();
      setAllCriteria(criteria);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTracks = async () => {
  setError(null);
  const token = localStorage.getItem('token');
  if (!token) {
    setError("Autenticação necessária.");
    return;
  }
  
  try {
    const response = await fetch('https://arraiaware-backend.onrender.com/api/roles/trilhas', {
      method: "GET",
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar trilhas: ${response.statusText}`);
    }

    const apiTracks: TracksFromApi[] = await response.json();
    const formattedTracks: Track[] = apiTracks.map(trackFromApi => ({
      id: trackFromApi.id,
      name: trackFromApi.nome_da_trilha, 
      department: trackFromApi.department || 'Departamento não informado', 
      criteria: trackFromApi.criterios, 
    }));

    setTracks(formattedTracks);
  } catch (err) {
    setError((err as Error).message);
  }
};

  const handleAssociateCriterionSubmit = async (trackId: string, criterionIds: string[]) => {
  setIsSubmitting(true);
  setNotification(null);
  const token = localStorage.getItem('token');
  if (!token) {
    setError("Autenticação necessária.");
    setIsSubmitting(false);
    return;
  }
  const endpoint = `https://arraiaware-backend.onrender.com/api/criteria/roles/${trackId}/criteria`;

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ criterionIds: criterionIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status} ao associar critérios.`);
    }

    setNotification({ status: 'success', title: 'Sucesso!', message: 'Critérios da trilha atualizados com sucesso!' });
    handleCloseAssociateModal(); 
    fetchTracks();

  } catch (error) {
    setNotification({ status: 'error', title: 'Falha na Associação', message: (error as Error).message });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleFormSubmit = async (trackId: string, data: NewCriterionData | ExistingCriterionData) => {
  setIsSubmitting(true);
  setNotification(null);
  const token = localStorage.getItem('token');
  
  if (!token) {
    setNotification({ status: 'error', title: 'Erro de Autenticação', message: 'Por favor, faça login.' });
    setIsSubmitting(false);
    return;
  }
  const isEditing = 'id' in data;
  
  try {
    if (isEditing) {
      const endpoint = `https://arraiaware-backend.onrender.com/api/criteria/${data.id}`;
      const requestBody = {
        criterionName: data.name,
        description: data.description,
        pillar: data.type,
      };

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status} ao atualizar.`);
      }

      setNotification({ status: 'success', title: 'Sucesso!', message: 'Critério atualizado com sucesso.' });

    } else {
      const createEndpoint = 'https://arraiaware-backend.onrender.com/api/criteria';
      const createRequestBody = {
        criterionName: data.name,
        description: data.description,
        pillar: data.type,
      };

      const createResponse = await fetch(createEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(createRequestBody)
      });

      if (!createResponse.ok) {
        throw new Error('Falha ao criar o novo critério.');
      }
      
      const newCriterion: Criterion = await createResponse.json();
      const associateEndpoint = `https://arraiaware-backend.onrender.com/api/criteria/roles/${trackId}/associate-criteria`;
      const associateRequestBody = { criterionIds: [newCriterion.id] }; 

      const associateResponse = await fetch(associateEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(associateRequestBody)
      });
      
      if (!associateResponse.ok) {
        throw new Error('Critério foi criado, mas ocorreu uma falha ao associá-lo à trilha.');
      }
      setNotification({ status: 'success', title: 'Sucesso!', message: 'Critério criado e associado à trilha com sucesso!' });
    }
    handleCloseModal();
    fetchTracks();

  } catch (error) {
    setNotification({ status: 'error', title: 'Falha na Operação', message: (error as Error).message });
  } finally {
    setIsSubmitting(false);
  }
};

const handleCreateTrackSubmit = async (data: { name: string; description: string }) => {
  setIsSubmitting(true);
  setNotification(null);
  const token = localStorage.getItem('token');
  
  if (!token) {
    setNotification({ status: 'error', title: 'Erro de Autenticação', message: 'Por favor, faça login novamente.' });
    setIsSubmitting(false);
    return;
  }

  try {
    const requestBody = {
      name: data.name,
      type: 'TRILHA', 
      description: data.description,
    };

    const response = await fetch('https://arraiaware-backend.onrender.com/api/roles', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Não foi possível criar a trilha.`);
    }

    setNotification({ status: 'success', title: 'Sucesso!', message: `A trilha "${data.name}" foi criada.` });
    setViewMode('manage'); 
    fetchTracks(); 

  } catch (error) {
    setNotification({ status: 'error', title: 'Falha na Criação', message: (error as Error).message });
  } finally {
    setIsSubmitting(false);
  }
};
  const handleDeleteCriterion = async (trackId: string, criterionId: string) => {
    setIsSubmitting(true);
    setNotification(null);
    const token = localStorage.getItem('token');

    if (!token) {
      setNotification({ status: 'error', title: 'Erro de Autenticação', message: 'Por favor, faça login novamente.' });
      setIsSubmitting(false);
      return;
    }

    const endpoint = `https://arraiaware-backend.onrender.com/api/criteria/${criterionId}/disassociate-role`;
    const requestBody = { roleId: trackId };

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status} ao desassociar o critério.`);
      }

      setNotification({ status: 'success', title: 'Sucesso!', message: 'Critério desassociado da trilha.' });
      fetchTracks();

    } catch (error) {
      setNotification({ status: 'error', title: 'Falha na Operação', message: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
};

  const handleOpenCreateModal = () => {
    setEditingCriterion(null); 
    setIsModalOpen(true);      
  };

  const handleOpenEditModal = (trackId: string, criterion: Criterion) => {
    setEditingCriterion({ trackId, criterion }); 
    setIsModalOpen(true);                       
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCriterion(null);
  };

  const handleOpenAssociateModal = (track: Track) => {
    setAssociatingTrack(track);
    setIsAssociateModalOpen(true);
  };

  const handleCloseAssociateModal = () => {
    setIsAssociateModalOpen(false);
    setAssociatingTrack(null);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTracks(), fetchAllCriteria()]);
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  
  return {
    viewMode,
    tracks,
    isLoading,
    error,
    trackSearchTerm,
    isModalOpen,
    editingCriterion,
    isSubmitting,
    notification,
    allCriteria,
    isAssociateModalOpen,
    associatingTrack,
    filteredTracks,
    setViewMode,
    setTrackSearchTerm,
    setNotification,
    handleAssociateCriterionSubmit,
    handleFormSubmit,
    handleCreateTrackSubmit,
    handleDeleteCriterion,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleOpenAssociateModal,
    handleCloseAssociateModal,
  };
}