/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ManagerEvaluation/ManagerEvaluation.tsx
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../../context/AuthContext'
import type { Answer, Manager, Question } from '../../../types/evaluation'
import PeerEvaluationPanel from './ManagerEvaluyionPanel'
import ManagerQuestionList from './ManagerQuestionList'

interface ManagerEvaluationProps {
  managerId: string
  cycleId:   string
  questions: Question[]
}

export default function ManagerEvaluation({
  managerId,
  questions
}: ManagerEvaluationProps) {
  const { token } = useContext(AuthContext)!

  const [team, setTeam]               = useState<Manager[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [answers, setAnswers]         = useState<Record<string, Record<string, Answer>>>({})
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [searchName, setSearchName]   = useState<string>('')
  

  // Busca os projetos/collaborators do gestor no ciclo ativo
  useEffect(() => {
    async function fetchTeam() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `https://arraiaware-backend.onrender.com/api/teams/manager/${managerId}/projects`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        const projects: Array<{
          projectName: string
          collaborators: { id: string; name: string }[]
          cycleId:     string
        }> = await res.json()

        // Flatten e remove duplicados por colaborador
        const all: Manager[] = projects.flatMap(proj =>
          proj.collaborators.map(col => ({
            id:          col.id,
            nome:        col.name,
            cargo:       'Colaborador',
            projectName: proj.projectName,
            area:        proj.projectName,
            tempo:       '—',
            cycleId:     proj.cycleId,
          }))
        )
        const unique = Array.from(new Map(all.map(u => [u.id, u])).values())
        setTeam(unique)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTeam()
  }, [managerId, token])

  const handleAnswerChange = (
    userId:     string,
    questionId: string,
    field:      'scale' | 'justification',
    value:      string
  ) => {
    setAnswers(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [questionId]: {
          ...prev[userId]?.[questionId],
          [field]: value,
        },
      },
    }))
  }

  const handleSubmit = async () => {
    if (!evaluatingId) return
    const userAnswers = answers[evaluatingId] || {}
    const mgr = team.find(u => u.id === evaluatingId)!
    const payload = {
      leaderId:           managerId,
      collaboratorId:     evaluatingId,
      cycleId:            mgr.cycleId,
      deliveryScore:      Number(userAnswers['deliveryScore']?.scale    || 0),
      proactivityScore:   Number(userAnswers['proactivityScore']?.scale || 0),
      collaborationScore: Number(userAnswers['collaborationScore']?.scale || 0),
      skillScore:         Number(userAnswers['skillScore']?.scale       || 0),
      justification:      userAnswers['justification']?.justification   || '',
    }

    try {
      const res = await fetch('https://arraiaware-backend.onrender.com/api/evaluations/leader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg)
      }
      alert('Avaliação enviada com sucesso!')
      setEvaluatingId(null)
      
    } catch (err: any) {
      setError(`Falha ao enviar avaliação: ${err.message}`)
    }
  }

  // Filtra pelo nome
  const filteredTeam = team.filter(u =>
    u.nome.toLowerCase().includes(searchName.toLowerCase())
  )

  if (loading) return <div>Carregando sua equipe…</div>
  if (error)   return <div className="text-red-600">Erro: {error}</div>

  return (
    <div className="space-y-6">
      {evaluatingId ? (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setEvaluatingId(null)}
              className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 inline-flex items-center gap-1"
            >
              ← Voltar à lista
            </button>
          </div>
          <h2 className="text-xl font-bold">
            Avaliando: {team.find(u => u.id === evaluatingId)!.nome}
          </h2>
          <ManagerQuestionList
            questions={questions}
            answers={answers[evaluatingId] || {}}
            onAnswerChange={(qid, f, v) =>
              handleAnswerChange(evaluatingId, qid, f, v)
            }
          />
          <div className="mt-4 text-right">
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Enviar
            </button>
          </div>
        </>
      ) : (
        <PeerEvaluationPanel
          colleagues={filteredTeam.map(u => ({
            ...u,
            progresso:
              (questions.filter(q => !!answers[u.id]?.[q.id]?.scale).length /
               questions.length) * 100
          }))}
          onEvaluate={setEvaluatingId}
          sectionKey="leader"
          searchName={searchName}
          onSearchChange={setSearchName}
        />
      )}
    </div>
  )
}