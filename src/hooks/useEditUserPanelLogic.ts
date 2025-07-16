import { useCallback, useEffect, useState } from 'react';
import type { SelectOption } from '../components/CustomSelect/CustomSelect';
import type { ApiUserResponse, User } from '../types/RH';

interface NotificationProps {
    status: 'success' | 'error';
    title: string;
    message: string;
}

interface UserApiResponse {
    data: ApiUserResponse[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
    };
}

const userTypeOptions: SelectOption[] = [
        { id: 'all', name: 'Todos' },
        { id: 'COLABORADOR', name: 'Colaborador' },
        { id: 'GESTOR', name: 'Gestor' },
        { id: 'RH', name: 'RH' },
        { id: 'COMITE', name: 'Comitê' },
    ];

const statusFilterOptions: SelectOption[] = [
    { id: 'all', name: 'Todos'} ,
    { id: 'true', name: 'Ativo' },
    { id: 'false', name: 'Inativo' },
];   

const userTypeEditOptions: SelectOption[] = userTypeOptions.filter(option => option.id !== 'all');
const statusEditOptions: SelectOption[] = statusFilterOptions.filter(option => option.id !== 'all');

export const useEditUserPanelLogic = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<NotificationProps | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState<SelectOption | null>(null);
    const [statusFilter, setStatusFilter] = useState<SelectOption | null>(null);

    const [allTracks, setAllTracks] = useState<SelectOption[]>([]);

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditingUser(null);
        setIsEditModalOpen(false);
    };

    const handleSearchChange = useCallback((term: string) => {
        setSearchTerm(term);
        setCurrentPage(1); 
    }, []);

    const handleUserTypeChange = useCallback((option: SelectOption | null) => {
        setUserTypeFilter(option);
        setCurrentPage(1); 
    }, []);

    const handleStatusChange = useCallback((option: SelectOption | null) => {
        setStatusFilter(option);
        setCurrentPage(1);
    }, []);

    const handleUpdateUser = async (userData: { id: string; name: string; email: string; unidade: string; userType: string; roles: string[] }) => {
        setIsSubmitting(true);
        setNotification(null);

        const token = localStorage.getItem('token');
        if (!token) {
            setNotification({ status: 'error', title: 'Autenticação Falhou', message: 'Token não encontrado.' });
            setIsSubmitting(false); 
            return;
        }

        try {
            const payload = {
                name: userData.name,
                email: userData.email,
                unidade: userData.unidade,
                userType: userData.userType,
                roleIds: userData.roles,
            };

            const response = await fetch(`https://arraiaware-backend.onrender.com/api/users/${userData.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao atualizar o usuário.');
            }
            
            setNotification({ status: 'success', title: 'Sucesso!', message: 'Usuário atualizado com sucesso.' });
            handleCloseEditModal();

        } catch (err) {
            if (err instanceof Error) {
                setNotification({ status: 'error', title: 'Erro na Atualização', message: err.message });
            }
        } finally {
            setIsSubmitting(false);
            setIsUpdating(prev => !prev);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
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

                if (statusFilter && statusFilter.id !== 'all') {
                    params.append('isActive', statusFilter.id);
                }

                const response = await fetch(`https://arraiaware-backend.onrender.com/api/users/paginated?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('Falha ao buscar a lista de usuários.');
                }

                const data: UserApiResponse = await response.json();
                const formattedUsers: User[] = data.data
                .filter(user => user.name !== 'Administrador do Sistema') 
                .map(user => ({                                          
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    unidade: user.unidade,
                    userType: user.userType,
                    roles: Array.isArray(user.roles) ? user.roles : [],
                    isActive: user.isActive,
                }));

                setUsers(formattedUsers);
                setTotalPages(data.pagination.totalPages);

            } catch (err) {
                if (err instanceof Error) {
                    setNotification({ status: 'error', title: 'Erro de Rede', message: err.message });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [currentPage, isUpdating, searchTerm, userTypeFilter,statusFilter]); 

    useEffect(() => {
        const fetchTracks = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            
            try {
                const response = await fetch('https://arraiaware-backend.onrender.com/api/roles/trilhas', {
                    method: "GET",
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error('Não foi possível carregar as trilhas.');
                }

                const apiTracks: { id: string, nome_da_trilha: string }[] = await response.json();
                
                const formattedTracks: SelectOption[] = apiTracks.map(track => ({
                    id: track.id,
                    name: track.nome_da_trilha, 
                }));

                setAllTracks(formattedTracks);
            } catch (err) {
                console.error(err);
                setNotification({ status: 'error', title: 'Erro de Rede', message: 'Não foi possível buscar a lista de trilhas.' });
            }
        };

        fetchTracks();
    }, []);


    return {
        users,
        isLoading,
        notification,
        setNotification,
        isEditModalOpen,
        editingUser,
        isSubmitting,
        handleOpenEditModal,
        handleCloseEditModal,
        handleUpdateUser,
        currentPage,
        totalPages,
        setCurrentPage,
        searchTerm,
        handleSearchChange,
        userTypeFilter,
        handleUserTypeChange,
        userTypeOptions,
        allTracks,
        statusFilter,
        handleStatusChange,
        statusFilterOptions,
        userTypeEditOptions,
        statusEditOptions
    };
};