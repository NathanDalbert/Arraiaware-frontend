import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SelectOption } from '../components/CustomSelect/CustomSelect';
import type { CommitteeCollaboratorsEvaluations, CommitteePanelTable, EvaluationConsolidatedView, SummaryApiResponse } from '../types/committee';
import type { Cycle } from '../types/evaluation';

interface NotificationProps {
  status: 'success' | 'error';
  title: string;
  message: string;
}

export const useCommitteeEvaluationsLogic = () => {

    // Estados da Tabela e UI
    const [evaluations, setEvaluations] = useState<CommitteeCollaboratorsEvaluations[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState<CommitteeCollaboratorsEvaluations | null>(null);
    const [notification, setNotification] = useState<NotificationProps | null>(null);
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [isLoadingCycles, setIsLoadingCycles] = useState(false);
    const [cycleFilter, setCycleFilter] = useState<SelectOption | null>(null);

    // Estados do Modal de Resumo (IA)
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    // Estados do Modal de Observação
    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [editableObservation, setEditableObservation] = useState<string | null>(null);

    //Estados para edição de Nota
    const [editingEvaluationId, setEditingEvaluationId] = useState<string | null>(null);
    const [editableScore, setEditableScore] = useState<string>('');

    //Equalizacao
    const [isEqualizeModalOpen, setIsEqualizeModalOpen] = useState(false);
    const [equalizationData, setEqualizationData] = useState<EvaluationConsolidatedView | null>(null);
    const [isEqualizationLoading, setIsEqualizationLoading] = useState(false);
    const [equalizationError, setEqualizationError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvaluations = async () => {
            setIsLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                setNotification({
                    status: 'error',
                    title: 'Erro de Autenticação',
                    message: 'Você não está autenticado',
                });
                setIsLoading(false);
                return;
            }

            try {
                const params = new URLSearchParams();
                if (searchTerm) {
                    params.append('search', searchTerm);
                }

                if (cycleFilter) {
                    params.append('cycleId', cycleFilter.id);
                }

                params.append('page', currentPage.toString());
                params.append('limit', '10'); 

                const response = await fetch(`https://arraiaware-backend.onrender.com/api/committee/panel?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error("Falha ao buscar as avaliações do comitê.");
                }
                
                const data: CommitteePanelTable = await response.json();
                
                setEvaluations(data.evaluations);
                setTotalPages(data.pagination.totalPages);

            } catch (err) {
                if (err instanceof Error) {
                setNotification({
                    status: 'error',
                    title: 'Erro ao buscar avaliações do comitê',
                    message: err.message,
                });
            }
            } finally {
                setIsLoading(false);
            }
        };

        if (!isLoadingCycles && cycleFilter) {
            fetchEvaluations();
        }
    }, [searchTerm, currentPage,isUpdating,cycleFilter, isLoadingCycles]); 

    useEffect(() => {
        const fetchCycles = async () => {
            setIsLoadingCycles(true);
            const token = localStorage.getItem('token');
            if (!token){
                setNotification({
                    status: 'error',
                    title: 'Erro de Autenticação',
                    message: 'Você não está autenticado',
                });
                setIsLoadingCycles(false);
                return;
            } 
            try {
                const response = await fetch('https://arraiaware-backend.onrender.com/api/cycles', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar ciclos de avaliação.');
                const data: Cycle[] = await response.json();
                setCycles(data);

                if (data.length > 0) {
                    setCycleFilter(data[0]);
                }

            } catch (err) {
                if (err instanceof Error) {
                    setNotification({
                        status: 'error',
                        title: 'Erro de Rede',
                        message: err.message,
                    });
                }
            } finally {
                setIsLoadingCycles(false);
            }
        };
        fetchCycles();
    }, []);

    const validateScore = (scoreString: string): number | null => {
        if (scoreString.trim() === '') {
            return null;
        }
        const numericScore = parseFloat(scoreString);
        if (isNaN(numericScore)) {
            throw new Error("Nota inválida. Insira um valor numérico.");
        }
        
        if (numericScore < 0 || numericScore > 5) {
            throw new Error("A nota deve ser um valor entre 0 e 5.");
        }
        
        return numericScore;
    };

    const handleSaveFromPanel = async (score: string, observation: string) => {
        if (!selectedEvaluation) return;
        const finalScoreValue = validateScore(score);
        const observationContent = observation.trim() === '' ? null : observation.trim();
        
        const payload = {
            finalScore: finalScoreValue,
            observation: observationContent,
        };

        setIsUpdating(true);
        const response = await fetch(`https://arraiaware-backend.onrender.com/api/committee/panel/${selectedEvaluation.id}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Falha ao salvar a avaliação. Verifique a conexão.");
        }
        setNotification({
            status: 'success',
            title: 'Avaliação Finalizada!',
            message: `A avaliação de ${selectedEvaluation?.collaboratorName} foi salva com sucesso.`
        });

        setIsUpdating(prev => !prev); 
    };

    const cycleOptions = useMemo<SelectOption[]>(() => 
        cycles.map(c => ({ id: c.id, name: c.name }))
    , [cycles]);

    //Edicao de nota
    const handleStartEditScore = (evaluation: CommitteeCollaboratorsEvaluations) => {
        setEditingEvaluationId(evaluation.id);
        setEditableScore(evaluation.finalScore?.toString() || '');
    };

    const handleCancelEditScore = () => {
        setEditingEvaluationId(null);
        setEditableScore('');
    };

    const handleSaveScore = async () => {
        if (!editingEvaluationId) return;
        setIsUpdating(true);
        setNotification(null); 
        let hadError = false; 

        try {
            const finalScoreValue = validateScore(editableScore); 

            const payload = {
                finalScore: finalScoreValue
            };

            const response = await fetch(`https://arraiaware-backend.onrender.com/api/committee/panel/${editingEvaluationId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Por favor insira uma nota entre 0-5");
            }

            setNotification({
                status: 'success',
                title: 'Sucesso!',
                message: 'A nota foi salva corretamente.'
            });
            
            handleCancelEditScore(); 

        } catch (err) {
            hadError = true; 
            if (err instanceof Error) {
                setNotification({
                    status: 'error',
                    title: 'Erro ao salvar nota',
                    message: err.message,
                });
            }
            setIsUpdating(false); 
        } finally {
        
            if (!hadError) {
                setIsUpdating(prev => !prev);
            }
        }
    };

    const handleCycleChange = useCallback((option: SelectOption | null) => {
        setCycleFilter(option);
        setCurrentPage(1); 
    }, []);

    const handleSaveObservation = async () => {
        if (!selectedEvaluation) return;

        setIsUpdating(true);
        setNotification(null); 
        let hadError = false; 
        try {
            const observationContent = editableObservation ? editableObservation.trim() : '';
            const payload = {
                observation: observationContent,
            };

            const response = await fetch(`https://arraiaware-backend.onrender.com/api/committee/panel/${selectedEvaluation.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Falha ao salvar a observação.");
            }
            
            setNotification({
                status: 'success',
                title: 'Sucesso!',
                message: 'A observação foi salva corretamente.'
            });
            
            handleCloseObservationModal(); 

        } catch (err) {
            hadError = true; 
            if (err instanceof Error) {
                setNotification({
                    status: 'error',
                    title: 'Erro ao salvar Observação',
                    message: err.message,
                });
            }
            setIsUpdating(false); 
        } finally {
            if (!hadError) {
                setIsUpdating(prev => !prev);
            }
        }
    };

    const handleOpenObservationModal = (evaluation: CommitteeCollaboratorsEvaluations) => {
        setSelectedEvaluation(evaluation);
        setEditableObservation(evaluation.observation || null);
        setIsObservationModalOpen(true);
    };

    const handleCloseObservationModal = () => {
        setIsObservationModalOpen(false);
        setSelectedEvaluation(null);
        setEditableObservation(null);
    };

    // Resumo da IA
    const fetchSummary = async (userId: string, cycleId: string) => {
        setIsSummaryLoading(true);
        setSummaryError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
            setNotification({
                status: 'error',
                title: 'Erro de Autenticação',
                message: 'Você não está autenticado',
            });
            setIsSummaryLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://arraiaware-backend.onrender.com/api/equalization/consolidated-view/${userId}/summary?cycleId=${cycleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Falha ao buscar o resumo da avaliação.");
            }
            const data: SummaryApiResponse = await response.json();
            setSummaryContent(data.summary);

        } catch (err) {
            setSummaryError((err as Error).message);
            setSummaryContent(""); 
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleOpenSummaryModal = (evaluation: CommitteeCollaboratorsEvaluations) => {
        setSelectedEvaluation(evaluation);
        setIsSummaryModalOpen(true);
        fetchSummary(evaluation.collaboratorId, evaluation.cycleId); 
    };

    const handleCloseSummaryModal = () => {
        setIsSummaryModalOpen(false);
        setSelectedEvaluation(null);
        setSummaryContent(''); 
        setSummaryError(null);
    };

    //Equalização
    const fetchEqualizationData = async (userId: string, cycleId: string) => {
    setIsEqualizationLoading(true);
    setEqualizationError(null);
    setEqualizationData(null); 

    const token = localStorage.getItem('token');
    if (!token) {
        setEqualizationError("Você não está autenticado.");
        setIsEqualizationLoading(false);
        return;
    }

    try {
        const response = await fetch(`https://arraiaware-backend.onrender.com/api/equalization/consolidated-view/${userId}?cycleId=${cycleId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Falha ao buscar os dados consolidados da avaliação.");
        }
        const data: EvaluationConsolidatedView = await response.json();
        setEqualizationData(data);

    } catch (err) {
        if (err instanceof Error) setEqualizationError(err.message);
        else setEqualizationError("Ocorreu um erro desconhecido.");
    } finally {
        setIsEqualizationLoading(false);
    }
};

    const handleOpenEqualizeModal = (evaluation: CommitteeCollaboratorsEvaluations) => {
        setSelectedEvaluation(evaluation);
        setIsEqualizeModalOpen(true);
        fetchEqualizationData(evaluation.collaboratorId, evaluation.cycleId);
    };

    const handleCloseEqualizeModal = () => {
        setIsEqualizeModalOpen(false);
        setSelectedEvaluation(null);
        setEqualizationData(null);
        setEqualizationError(null);
    };

    const handleSearchChange = useCallback((term: string) => {
        setSearchTerm(term);
        setCurrentPage(1); 
    }, []);

    
    return {
        //UI
        evaluations, isLoading, searchTerm, currentPage, totalPages,
        handleSearchChange, setCurrentPage, isUpdating, selectedEvaluation,notification,
        setNotification,cycleOptions, cycleFilter,
        isLoadingCycles,handleCycleChange,
        
        //edicao de linha:
        editingEvaluationId,editableScore,setEditableScore,handleStartEditScore,
        handleCancelEditScore, handleSaveScore,
        // Modal de Resumo
        isSummaryModalOpen, summaryContent, isSummaryLoading, summaryError,
        handleOpenSummaryModal, handleCloseSummaryModal,
        
        // Modal de Observação
        isObservationModalOpen, editableObservation, setEditableObservation,
        handleOpenObservationModal, handleCloseObservationModal, handleSaveObservation,

        //Modal de Equalizacao
        isEqualizeModalOpen,equalizationData,isEqualizationLoading,equalizationError,
        handleOpenEqualizeModal, handleCloseEqualizeModal, handleSaveFromPanel

    };
};