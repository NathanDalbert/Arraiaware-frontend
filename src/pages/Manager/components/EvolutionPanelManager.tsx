// src/components/EvaluationsPanel/EvaluationsPanelManager.tsx
import { Loader2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CustomSelect, { type SelectOption } from '../../../components/CustomSelect/CustomSelect';
import Pagination from '../../../components/Pagination/Pagination';
import { useEvaluationsPanelLogic } from '../../../hooks/useEvaluationsPanelLogic';
import type { Evaluation, LeaderEvaluationRecord, PeerEvaluationRecord, ReferenceIndication, SelfEvaluationRecord, } from '../../../types/evaluation';
import EvaluationsTableSkeleton from '../../Evaluation/components/EvaluationsTableSkeleton';
import EvaluationsTableManager from './EvolutionTableManager';

interface EvaluationsPanelManagerProps {
  managerId?: string;
  cycleId: string;
}

export default function EvaluationsPanelManager({
  managerId,
}: EvaluationsPanelManagerProps) {
  const {
    searchTerm,
    statusFilter,
    cycleFilter,
    evaluations,
    isLoading,
    error,
    currentPage,
    totalPages,
    isLoadingCycles,
    cycleOptions,
    statusOptions,
    handleSearchChange,
    handleStatusSelect,
    handleCycleSelect,
    setCurrentPage,
  } = useEvaluationsPanelLogic({ managerId });

  const [userCycles, setUserCycles] = useState<SelectOption[]>([]);
  const [loadingUserCycles, setLoadingUserCycles] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Estados de detalhe
  const [selectedEvalItem, setSelectedEvalItem] = useState<Evaluation | null>(null);

  // Autoavaliação
  const [selfRecords, setSelfRecords] = useState<SelfEvaluationRecord[]>([]);
  const [loadingSelf, setLoadingSelf] = useState(false);
  const [errorSelf, setErrorSelf] = useState<string | null>(null);

  // Avaliações de pares recebidas
  const [peerRecords, setPeerRecords] = useState<PeerEvaluationRecord[]>([]);
  const [loadingPeer, setLoadingPeer] = useState(false);
  const [errorPeer, setErrorPeer] = useState<string | null>(null);

  const [leaderRecords, setLeaderRecords] = useState<LeaderEvaluationRecord[]>([]);
  const [loadingLeader, setLoadingLeader] = useState(false);
  const [errorLeader, setErrorLeader] = useState<string | null>(null);

  const [referenceRecords, setReferenceRecords] = useState<ReferenceIndication[]>([]);
  const [loadingReference, setLoadingReference] = useState(false);
  const [errorReference, setErrorReference] = useState<string | null>(null);

  // Aba ativa no detalhe
  const [activeSubTab, setActiveSubTab] = useState<'self' | 'peer' | 'leader' | 'reference'>('self');

  const API_BASE = 'https://arraiaware-backend.onrender.com';

  useEffect(() => {
   if (!selectedEvalItem) return;
   setLoadingUserCycles(true);
   fetch(`${API_BASE}/api/users/${selectedEvalItem.collaboratorId}/cycles`, {
     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
   })
     .then(res => res.json())
     .then((cycles: { id: string; name: string }[]) => {
      // já vem no formato { id, name }, que bate com SelectOption
      setUserCycles(cycles.map(c => ({ id: c.id, name: c.name })));
     })
     .finally(() => setLoadingUserCycles(false));
 }, [selectedEvalItem]);

 // 3) ainda no component, defina a função de troca de ciclo:
 function onChangeDetailCycle(opt: SelectOption) {
   if (!selectedEvalItem) return;
   setSelectedEvalItem({
     ...selectedEvalItem,
     cycleId: opt.id,
     cycleName: opt.name,
   });
 }

  // Fetch da autoavaliação
  useEffect(() => {
    if (!selectedEvalItem || activeSubTab !== 'self') return;
    setLoadingSelf(true);
    setErrorSelf(null);

    const { collaboratorId: userId, cycleId: selCycleId } = selectedEvalItem;
    const token = localStorage.getItem('token') || '';

    fetch(`${API_BASE}/api/evaluations/self/${userId}?cycleId=${selCycleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: não foi possível carregar a autoavaliação`);
        }
        return res.json() as Promise<SelfEvaluationRecord[]>;
      })
      .then(setSelfRecords)
      .catch(err => setErrorSelf(err.message))
      .finally(() => setLoadingSelf(false));
  }, [selectedEvalItem, activeSubTab]);

  // Fetch das avaliações de pares recebidas
  useEffect(() => {
    if (!selectedEvalItem || activeSubTab !== 'peer') return;
    setLoadingPeer(true);
    setErrorPeer(null);

    const { collaboratorId: evaluatedUserId, cycleId: selCycleId } = selectedEvalItem;
    const token = localStorage.getItem('token') || '';

    fetch(`${API_BASE}/api/evaluations/peer/for/${evaluatedUserId}?cycleId=${selCycleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: não foi possível carregar avaliações de pares`);
        }
        return res.json() as Promise<PeerEvaluationRecord[]>;
      })
      .then(setPeerRecords)
      .catch(err => setErrorPeer(err.message))
      .finally(() => setLoadingPeer(false));
  }, [selectedEvalItem, activeSubTab]);

  console.log("» selectedEvalItem:", selectedEvalItem);

  // Fetch da avaliação do líder
  useEffect(() => {
    if (!selectedEvalItem || activeSubTab !== 'leader') return;

    setLoadingLeader(true);
    setErrorLeader(null);

    const { collaboratorId: userId, cycleId: selCycleId } = selectedEvalItem;
    const token = localStorage.getItem('token') || '';

    fetch(
      `${API_BASE}/api/evaluations/leader-evaluation/for-user/${userId}?cycleId=${selCycleId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: não foi possível carregar avaliação do líder`);
        }
        return res.json() as Promise<LeaderEvaluationRecord[]>;
      })
      .then(data => setLeaderRecords(data))
      .catch(err => setErrorLeader(err.message))
      .finally(() => setLoadingLeader(false));
  }, [selectedEvalItem, activeSubTab]);

  // Scroll ao mudar página
  useEffect(() => {
    if (currentPage > 1 && panelRef.current) {
      const top = panelRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - 150, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Fetch das indicações recebidas
useEffect(() => {
    if (!selectedEvalItem || activeSubTab !== 'reference') return;
    setLoadingReference(true);
    setErrorReference(null);

    const { collaboratorId: userId, cycleId: selCycleId } = selectedEvalItem;
    const token = localStorage.getItem('token') || '';

    fetch(`${API_BASE}/api/evaluations/reference/for/${userId}?cycleId=${selCycleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: falha ao carregar referências`);
      }
      return res.json() as Promise<ReferenceIndication[]>;
    })
    .then(setReferenceRecords)
    .catch(err => setErrorReference(err.message))
    .finally(() => setLoadingReference(false));
  }, [selectedEvalItem, activeSubTab]);

  return (
    <div className="bg-white p-6 md:p-8 rounded-b-lg rounded-r-lg shadow-md">
      {/* Cabeçalho de lista */}
      {!selectedEvalItem && (
        <div ref={panelRef} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {managerId ? 'Avaliações das Equipes' : 'Avaliações - Arraiware'}
            </h2>
            <p className="text-base text-gray-500 mt-1">
              {managerId
                ? 'Acompanhe o progresso das avaliações de todos seus liderados'
                : 'Acompanhe o progresso de todas as avaliações em andamento'}
            </p>
          </div>
        </div>
      )}

      {/* Cabeçalho de detalhe com abas */}
      {selectedEvalItem && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-3">
                {/* prefixo do título */}
                <span>
                  {activeSubTab === 'self'
                    ? 'Autoavaliação de'
                    : activeSubTab === 'peer'
                    ? 'Avaliação de Pares de'
                    : 'Avaliação do Líder de'}
                </span>

                {/* nome do colaborador */}
                <span className="text-orange-600">
                  {selectedEvalItem.collaborator}
                </span>

                {/* dropdown de ciclos, agora DENTRO do <h3> */}
                {loadingUserCycles ? (
                  <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                ) : (
                  <div className="w-48">
                    <CustomSelect
                      options={userCycles}
                      selected={userCycles.find(o => o.id === selectedEvalItem.cycleId) || null}
                      onChange={onChangeDetailCycle}
                      placeholder="Ciclo..."
                    />
                  </div>
                )}
              </h3>

              {/* subtítulo abaixo */}
              <p className="text-sm text-gray-500">
                Ciclo: {selectedEvalItem.cycleName} 
              </p>
            </div>

            <button
              onClick={() => setSelectedEvalItem(null)}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              ← Voltar
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {(['self','peer','leader','reference'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`py-2 text-center font-medium rounded-t-lg ${
                  activeSubTab === tab
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab === 'self'      ? 'Autoavaliação'
                : tab === 'peer'     ? 'Pares'
                : tab === 'leader'   ? 'Líder'
                                    : 'Indicações'}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Conteúdo: detalhe ou lista */}
      {selectedEvalItem ? (
        activeSubTab === 'self' ? (
          <div className="space-y-4">
            {loadingSelf && <p>Carregando autoavaliação...</p>}
            {errorSelf && <p className="text-red-500">{errorSelf}</p>}
            {!loadingSelf &&
              !errorSelf &&
              selfRecords?.map(rec => (
                <div key={rec.id} className="bg-gray-50 p-4 rounded shadow-sm">
                  <h4 className="font-semibold mb-1">
                    {rec.criterion.criterionName}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Pilar: {rec.criterion.pillar}
                  </p>
                  <p className="font-medium">
                    Nota: {rec.score} ({rec.scoreDescription})
                  </p>
                  {rec.justification && (
                    <p className="mt-2 text-gray-700">
                      Justificativa: {rec.justification}
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : activeSubTab === 'peer' ? (
          <div className="space-y-4">
            {loadingPeer && <p>Carregando avaliações de pares…</p>}
            {errorPeer && <p className="text-red-500">{errorPeer}</p>}
            {!loadingPeer &&
              !errorPeer &&
              peerRecords?.map(rec => (
                <div key={rec.id} className="bg-gray-50 p-4 rounded shadow-sm">
                  <h4 className="font-semibold mb-1">Projeto: {rec.project}</h4>
                  <p>Nota geral: {rec.generalScore}</p>
                  <p>
                    Motivado a trabalhar de novo?{' '}
                    <strong>{rec.motivatedToWorkAgain}</strong>
                  </p>
                  <p>Pontos a melhorar: {rec.pointsToImprove}</p>
                  <p>Pontos a explorar: {rec.pointsToExplore}</p>
                  <p>
                    Avaliado por:{' '}
                    <span className="font-medium">{rec.evaluatorUser.name}</span>
                  </p>
                </div>
              ))}
          </div>
        ) : activeSubTab === 'leader' ? (
          <div className="space-y-4">
            {loadingLeader && <p>Carregando avaliação do gestor…</p>}
            {errorLeader && <p className="text-red-500">{errorLeader}</p>}

              {!loadingLeader && !errorLeader && leaderRecords?.length > 0
                  ? leaderRecords.map(rec => (
                  <div key={rec.id} className="bg-gray-50 p-4 rounded shadow-sm">
                    <h4 className="font-semibold mb-1">
                      {rec.criterion.criterionName}
                    </h4>
                    <p className="font-medium mb-1">
                      Nota: {rec.score} ({rec.scoreDescription})
                    </p>
                    <p className="mt-2">
                      Avaliado por: <strong>{rec.leader.name}</strong>
                    </p>
                  </div>
                ))
              : !loadingLeader && (
                  <p className="text-gray-500">
                    Nenhuma avaliação do líder encontrada.
                  </p>
                )
            }
          </div>
        ) :  activeSubTab === 'reference' ? (
          <div className="space-y-4">
            {loadingReference && <p>Carregando indicações…</p>}
            {errorReference && <p className="text-red-500">{errorReference}</p>}
            {!loadingReference && !errorReference && referenceRecords.length === 0 && (
              <p className="text-gray-500">Nenhuma indicação encontrada.</p>
            )}
            {!loadingReference && !errorReference &&
              referenceRecords.map(rec => (
                <div key={rec.id} className="bg-gray-50 p-4 rounded shadow-sm">
                  <p>
                    <strong>Indicado:</strong> {rec.indicatedUser.name}
                  </p>
                  <p className="mt-2">
                    <strong>Justificativa:</strong> {rec.justification}
                  </p>
                </div>
              ))
            }
          </div>
        ) : null
      ) : (
        <>
          {/* Filtros e Busca */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-grow" style={{ minWidth: '300px' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por colaborador, departamento ou trilha..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              <div className="w-48">
                <CustomSelect
                  options={statusOptions}
                  selected={statusFilter}
                  onChange={handleStatusSelect}
                  placeholder="Filtrar por Status"
                />
              </div>
              <div className="w-48">
                {isLoadingCycles ? (
                  <div className="flex items-center justify-center text-gray-500 border border-gray-300 px-4 py-2 rounded-lg text-sm">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" /> Carregando...
                  </div>
                ) : (
                  <CustomSelect
                    options={cycleOptions}
                    selected={cycleFilter}
                    onChange={handleCycleSelect}
                    placeholder="Filtrar por Ciclo"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Tabela e Paginação */}
          <div className="mt-8">
            {error && <p className="text-red-500">{error}</p>}
            {isLoading ? (
              <EvaluationsTableSkeleton />
            ) : (
              !error && (
                <>
                  <EvaluationsTableManager
                    evaluations={evaluations}
                    onViewEvaluation={setSelectedEvalItem}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}