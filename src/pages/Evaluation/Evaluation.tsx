/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import EvaluationTabs from './components/EvaluationTabs';
import QuestionList from './components/QuestionList';
import PeerEvaluationPanel from './components/PeerEvaluationPanel';
import ProgressSidebar from './components/ProgressSideBar';
import PeerQuestionList from './components/PeerQuestionList';
import LeaderQuestionList from './components/LeadQuestionList';
import ReferenceForm from './components/ReferenceForm';
import { useAvaliacaoLogic } from '../../hooks/useEvaluationPageLogic';
import type { ReferenceIndication } from '../../types/evaluation';
import { ConfirmationMessage } from '../../components/ConfirmationMessage/ConfirmationMessage';
import { useState } from 'react';

export default function Avaliacao() {
  const navigate = useNavigate();
  const {
    loading,
    error,
    loadingTeam,
    teamError,
    sections,
    currentSectionIndex,
    currentSectionData,
    teamMates,
    leaderColleagues,
    answers,
    peerAnswers,
    leaderAnswers,
    referencesData,
    isReferenceSectionComplete,
    avaliandoId,
    setAvaliandoId,
    colegaSelecionado,
    handleAnswerChange,
    handleEvaluate,
    handleSubmitReferences,
    getSectionProgress,
    overallProgressPercentage,
    allUsers,
    cycleName, 
    handleSubmitAll,
  } = useAvaliacaoLogic();

  // 1) Estado da modal de confirmação
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // 2) Wrapper que chama o submit e, em caso de sucesso, abre a modal
  const handleFinalSubmit = async () => {
    try {
      await handleSubmitAll();
      setIsConfirmOpen(true);
    } catch {
      // opcional: tratar erro aqui
    }
  };
  
  const handlePreviousSection = () => {
    const prevIndex = Math.max(0, currentSectionIndex - 1);
    if (prevIndex !== currentSectionIndex) {
      navigate(`/avaliacao/${sections[prevIndex].key}`);
    }
  };

  const handleNextSection = () => {
    const nextIndex = currentSectionIndex < sections.length - 1 
      ? currentSectionIndex + 1 
      : currentSectionIndex;
    if (nextIndex !== currentSectionIndex) {
      navigate(`/avaliacao/${sections[nextIndex].key}`);
    }
  };
  const onReferencesSave = async (references: ReferenceIndication[]) => {
    try {
      await handleSubmitReferences(references);
      alert('Referências salvas com sucesso!');
      handleNextSection();
    } catch (err: any) {
      console.error('Falha recebida pelo componente:', err);
    }
  };

  if (loading) return <div className="p-6">Carregando critérios...</div>;
  if (loadingTeam) return <div className="p-6">Carregando equipe...</div>;
  if (teamError) return <div className="p-6 text-red-600">Erro: {teamError}</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!currentSectionData || sections.length === 0) {
    return <div className="p-6">Seção inválida ou ainda não carregada.</div>;
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <div className="fixed top-0 left-0 w-full z-50"><Header /></div>
      <main className="flex-1 pt-32 px-6 lg:px-10">
        <div className="max-w-screen-2xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {currentSectionData.key === 'peer'
                ? `Avaliação de Pares ${cycleName}`
                : currentSectionData.key === 'leader'
                ? `Avaliação de Líderes ${cycleName}`
                : currentSectionData.key === 'reference'
                ? 'Indicação de Referências'
                : `Autoavaliação ${cycleName}`}
            </h1>
            <div className="relative bg-gray-200 h-2 rounded-full">
              <div
                className="absolute h-2 bg-orange-500 transition-all duration-500"
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>
          </header>

          <EvaluationTabs
            sections={sections}
            currentSectionIndex={currentSectionIndex}
            answers={answers}
            peerAnswers={peerAnswers}
            leaderAnswers={leaderAnswers}
            peerColleagues={teamMates}
            leaderColleagues={leaderColleagues}
            isReferenceSectionComplete={isReferenceSectionComplete}
          />

          <div className="flex gap-6">
            <section className="flex-1">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                  <span className="text-orange-500">{currentSectionData.icon}</span>
                  {currentSectionData.title}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Seção {currentSectionIndex + 1} de {sections.length}
                </p>

                {(currentSectionData.key === 'peer' || currentSectionData.key === 'leader') ? (
                  avaliandoId && colegaSelecionado ? (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-800">
                          {colegaSelecionado.nome.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-lg">
                            Avaliando: {colegaSelecionado.nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            {colegaSelecionado.cargo} • {colegaSelecionado.area} • Trabalhando juntos há {colegaSelecionado.tempo}
                          </p>
                        </div>
                        <button
                          onClick={() => setAvaliandoId(null)}
                          className="flex items-center gap-1 text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                          <ArrowLeft size={16} /> Voltar
                        </button>
                      </div>
                      {currentSectionData.key === 'peer' ? (
                      <PeerQuestionList
                        questions={currentSectionData.questions}
                        answers={peerAnswers[avaliandoId] || {}}
                        onAnswerChange={handleAnswerChange}
                      />
                    ) : (
                      <LeaderQuestionList
                        questions={currentSectionData.questions}
                        answers={leaderAnswers[avaliandoId] || {}}
                        onAnswerChange={handleAnswerChange}
                      />
                    )}
                      {(() => {
                        const pct = getSectionProgress(
                          currentSectionData.key === 'peer' ? peerAnswers : leaderAnswers,
                          currentSectionData.questions
                        )(avaliandoId);
                        return (
                          <div className="mt-8 pt-4 border-t flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-40 bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div style={{ width: `${pct}%` }} className="h-2 bg-orange-500" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{pct}% completo</span>
                            </div>
                            {pct === 100 && (
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <Check size={18} /> Avaliação completa
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                    {currentSectionData.key === 'peer' && (
                      <>
                        <PeerEvaluationPanel
                          colleagues={teamMates.map(col => ({
                            ...col,
                            progresso: getSectionProgress(peerAnswers, currentSectionData.questions)(col.id),
                          }))}
                          onEvaluate={handleEvaluate}
                          sectionKey="peer"
                        />
                        
                      </>
                    )}
                    {currentSectionData.key === 'leader' && (
                      <>
                        <PeerEvaluationPanel
                          colleagues={leaderColleagues.map(col => ({
                            ...col,
                            progresso: getSectionProgress(leaderAnswers, currentSectionData.questions)(col.id),
                          }))}
                          onEvaluate={handleEvaluate}
                          sectionKey="leader"
                        />
                
                      </>
                    )}
                    </>
                  )
                ) : currentSectionData.key === 'reference' ? (
                  <ReferenceForm
                    availableUsers={allUsers}
                    initialReferences={referencesData}
                    onSaveReferences={onReferencesSave}
                  />
                ) : (
                  <>
                    <QuestionList
                      questions={currentSectionData.questions}
                      answers={answers}
                      onAnswerChange={handleAnswerChange}
                    />
                    
                  </>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handlePreviousSection}
                    disabled={currentSectionIndex === 0}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300"
                  >
                    ← Seção Anterior
                  </button>

                  {currentSectionIndex < sections.length - 1 ? (
                    <button
                      onClick={handleNextSection}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      Próxima Seção →
                    </button>
                  ) : (
                    <button
                      onClick={handleFinalSubmit}
                      disabled={!isReferenceSectionComplete}
                      className={`px-4 py-2 text-white rounded-lg ${
                        isReferenceSectionComplete
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Enviar Tudo
                    </button>
                  )}
                </div>
              </div>
            </section>

            <ProgressSidebar
              sections={sections}
              answers={answers}
              peerAnswers={peerAnswers}
              leaderAnswers={leaderAnswers}
              colleagues={teamMates}
              leaders={leaderColleagues}
              isReferenceSectionComplete={isReferenceSectionComplete}
            />
          </div>
        </div>
      </main>
      <Footer />

      {/* 3) Modal de sucesso */}
      <ConfirmationMessage
        isOpen={isConfirmOpen}
        message="Parabéns! Sua avaliação foi finalizada com sucesso."
        onConfirm={() => {
          setIsConfirmOpen(false);
          navigate('/Home'); // ou outra rota de destino
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}