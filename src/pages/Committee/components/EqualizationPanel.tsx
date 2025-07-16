import { AlertTriangle, FileText, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EvaluationConsolidatedView } from '../../../types/committee';

interface EqualizationPanelProps {
  data: EvaluationConsolidatedView | null;
  isLoading: boolean;
  error: string | null;
  initialScore: string;
  initialObservation: string;
  onSave: (score: string, observation: string) => Promise<void>;
  onClose: () => void;
  collaboratorId: string;
}

export default function EqualizationPanel({ 
    data, isLoading, error: initialError, initialScore, initialObservation, onSave, onClose, collaboratorId 
}: EqualizationPanelProps) {
    
  const [score, setScore] = useState(initialScore);
  const [observation, setObservation] = useState(initialObservation);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setScore(initialScore);
    setObservation(initialObservation);
    setSaveError(null);
  }, [initialScore, initialObservation]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError(null); 

    try {
      await onSave(score, observation); 
      onClose(); 
    } catch (err) {
      if (err instanceof Error) {
        setSaveError(err.message); 
      } else {
        setSaveError("Ocorreu um erro inesperado.");
      }
    } finally {
      setIsSaving(false); 
    }
  };

  const handleExportPdf = async () => {
    if (!collaboratorId || !data?.cycleId) {
      setSaveError("Dados insuficientes para exportar o PDF.");
      return;
    }

    setIsExporting(true);
    setSaveError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setSaveError("Autenticação necessária para exportar o PDF.");
      setIsExporting(false);
      return;
    }

    try {
      const response = await fetch(`https://arraiaware-backend.onrender.com/api/equalization/consolidated-view/${collaboratorId}/export?cycleId=${data.cycleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/pdf', 
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao exportar PDF: ${errorText || response.statusText}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `avaliacao_consolidada_${data.collaboratorName}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      if (err instanceof Error) {
        setSaveError(err.message);
      } else {
        setSaveError("Ocorreu um erro inesperado ao exportar o PDF.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-4 text-gray-600">Carregando visão consolidada...</p>
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[300px] bg-red-50 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="mt-4 text-red-700 font-semibold">Erro ao carregar dados</p>
        <p className="mt-1 text-gray-600 text-sm">{initialError}</p>
      </div>
    );
  }

  if (!data) {
    return null; 
  }

  return (
    <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Seção de Critérios */}
      <section>
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Critérios Consolidados</h4>
        <div className="space-y-4">
          {data.consolidatedCriteria.map((criterion) => (
            <div key={criterion.criterionId} className={`p-4 rounded-lg shadow-sm ${criterion.hasDiscrepancy ? 'border border-red-400 bg-red-50' : 'border border-gray-200'}`}>
              <h5 className="font-bold text-gray-700">{criterion.criterionName} {criterion.hasDiscrepancy && <span className="text-red-500 text-xs font-normal">(Discrepância)</span>}</h5>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                
                {/* Autoavaliação */}
                <div>
                  <p className="font-semibold">Autoavaliação: 
                    <span className="text-blue-600 font-bold">
                      {typeof criterion.selfEvaluation?.score === 'number' 
                        ? criterion.selfEvaluation.score.toFixed(1) 
                        : '-'}
                    </span>
                  </p>
                  <p className="text-gray-600 italic">"{criterion.selfEvaluation?.justification || 'Não preenchido'}"</p>
                </div>

                {/* Pares */}
                <div>
                  <p className="font-semibold">Pares: 
                    <span className="text-green-600 font-bold">
                      {typeof criterion.peerEvaluation?.score === 'number' 
                        ? criterion.peerEvaluation.score.toFixed(1) 
                        : '-'}
                    </span>
                  </p>
                  <p className="text-gray-600 italic">"{criterion.peerEvaluation?.justification || 'Não preenchido'}"</p>
                </div>

                {/* Líder */}
                <div>
                  <p className="font-semibold">Líder: 
                    <span className="text-purple-600 font-bold">
                      {typeof criterion.leaderEvaluation?.score === 'number' 
                        ? criterion.leaderEvaluation.score.toFixed(1) 
                        : '-'}
                    </span>
                  </p>
                  <p className="text-gray-600 italic">"{criterion.leaderEvaluation?.justification || 'Não preenchido'}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seção de Feedbacks dos Pares */}
      <section>
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Feedbacks dos Pares</h4>
        {data.peerFeedbacks.length > 0 ? (
          data.peerFeedbacks.map((feedback, index) => (
            <div key={index} className="p-3 border-l-4 border-orange-400 bg-orange-50 mb-3 rounded-r-md">
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">{feedback.evaluatorName}</span> comentou:</p>
              <p className="mt-1 text-sm"><strong className="text-green-700">A explorar:</strong> {feedback.pointsToExplore}</p>
              <p className="mt-1 text-sm"><strong className="text-red-700">A melhorar:</strong> {feedback.pointsToImprove}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">Nenhum feedback de par foi registrado.</p>
        )}
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Referências</h4>
        
        {/* Referências Recebidas */}
        <h5 className="font-semibold text-gray-700 mb-2">Referências Recebidas</h5>
        {data.referencesReceived.length > 0 ? (
          data.referencesReceived.map((ref, index) => (
            <div key={`rec-${index}`} className="p-3 border-l-4 border-purple-400 bg-purple-50 mb-3 rounded-r-md">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{ref.indicatorName}</span> indicou com a justificativa:
              </p>
              <p className="mt-1 text-sm italic">"{ref.justification}"</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic mb-4">Nenhuma referência recebida.</p>
        )}

        {/*Referências Indicadas */}
        <h5 className="font-semibold text-gray-700 mt-4 mb-2">Referências Indicadas</h5>
        {data.referenceFeedbacks.length > 0 ? (
          data.referenceFeedbacks.map((ref, index) => (
            <div key={`ind-${index}`} className="p-3 border-l-4 border-cyan-400 bg-cyan-50 mb-3 rounded-r-md">
              <p className="text-sm text-gray-600">
                Feedback sobre <span className="font-semibold text-gray-800">{ref.indicatedName}</span>:
              </p>
              <p className="mt-1 text-sm italic">"{ref.justification}"</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">Nenhuma referência indicada.</p>
        )}
      </section>

      {/* 3. Edição final */}
      <section className="p-6 bg-gray-50 rounded-lg shadow-md">
        <h4 className="text-xl font-semibold text-gray-800 mb-6">Ações do Comitê</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="finalScorePanel" className="block text-sm font-medium text-gray-700">Nota Final do Comitê</label>
                <input
                    type="number" id="finalScorePanel" step="0.1"
                    className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm transition-colors focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="observationPanel" className="block text-sm font-medium text-gray-700">Observação Histórica</label>
                <textarea
                    id="observationPanel" rows={3}
                    className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm transition-colors focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Insira suas observações..."
                />
            </div>
        </div>
      </section>
      
      {saveError && (
        <div className="p-3 mt-4 text-sm text-red-800 bg-red-100 border border-red-300 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}
      
      {/* 4. Botão para salvar as alterações */}
      <div className="mt-6 pt-4 border-t flex justify-end gap-3">
        <button
          type="button" onClick={handleExportPdf} disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isExporting ? <Loader2 className="animate-spin h-5 w-5" /> : <FileText className="h-5 w-5" />}
          {isExporting ? 'Exportando...' : 'Exportar PDF'}
        </button>

        <button
          type="button" onClick={handleSaveChanges} disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300"
        >
          {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
          {isSaving ? 'Salvando...' : 'Salvar e Finalizar'}
        </button>
      </div>

    </div>
  );
}