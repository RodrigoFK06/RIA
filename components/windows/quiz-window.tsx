"use client"

import { useState, useEffect } from "react"
import WindowFrame from "@/components/window-frame"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspaceStore } from "@/lib/store"
import { useBreakpoint } from "@/hooks/use-breakpoint"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, ArrowRight, BarChart } from "lucide-react"
import { rsvpApi, QuizQuestion, QuizValidateResponse } from "@/lib/rsvpApi"
import { useAuthStore } from "@/lib/auth-store"


interface QuizWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
    data?: {
      sessionId: string
      questions: QuizQuestion[]
      text: string
    }
  }
}

export default function QuizWindow({ windowData }: QuizWindowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const { addWindow, updateSessionStats } = useWorkspaceStore()
  const { isMobile, isTablet } = useBreakpoint()
  const { toast } = useToast()
  const { token } = useAuthStore()
  const questions = windowData.data?.questions || []
  const sessionId = windowData.data?.sessionId || ""
  const text = windowData.data?.text || ""

  // Inicializar respuestas vacías para todas las preguntas
  useEffect(() => {
    if (questions.length > 0 && answers.length === 0) {
      setAnswers(new Array(questions.length).fill(""))
    }
  }, [questions.length, answers.length])

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = value
    setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const [validation, setValidation] = useState<QuizValidateResponse | null>(null)

  const handleSubmit = async () => {
    if (!token) {
      toast({ title: "Error", description: "Sesión no autenticada", variant: "destructive" })
      return
    }

    try {      const payload = {
        rsvp_session_id: sessionId,
        answers: questions.map((q, i) => ({
          question_id: q.id,
          user_answer: answers[i],
        })),
      }
      
      const res = await rsvpApi.validateQuiz(payload, token)
      setValidation(res)
      setScore(res.overall_score)
      setIsSubmitted(true)// Update session stats in local store for real-time metrics updates
      // Note: The quiz validation doesn't provide WPM/time data directly,
      // so we'll update with quiz score and get full stats from API later
      const sessionStats = {
        wpm: 0, // Will be updated from API stats refresh
        totalTime: 0, // Will be updated from API stats refresh
        idealTime: 0, // Will be updated from API stats refresh
        score: res.overall_score,
        feedback: `Comprensión: ${res.overall_score}% - Evaluación completada`
      }
      
      updateSessionStats(sessionId, sessionStats)
      
      toast({
        title: "Quiz completado",
        description: `Puntuación: ${res.overall_score}% - ¡Estadísticas actualizadas!`,
      })
    } catch (err) {
      toast({ title: "Error", description: "No se pudo enviar el quiz", variant: "destructive" })
    }
  }

  const handleViewStats = async () => {
    try {
      if (!token) throw new Error("No autenticado")
      const stats = await rsvpApi.getStats(token)

      addWindow("stats", {
        sessionId,
        stats,
        score,
        text,
        validation,
        questions,
      })

      toast({
        title: "Estadísticas cargadas",
        description: "Revisa tu desempeño y el feedback personalizado.",
      })    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const isQuestionAnswered = (index: number) => {
    const answer = answers[index]
    // Para preguntas de múltiple opción, la respuesta debe ser no vacía
    // Para preguntas abiertas, siempre se considera respondida (puede estar vacía)
    const question = questions[index]
    if (question?.question_type === "multiple_choice") {
      return answer !== undefined && answer !== null && answer !== ""
    }
    // Para preguntas abiertas, siempre está "respondida" (puede estar vacía)
    return answer !== undefined && answer !== null
  }
  const renderQuestion = () => {
    if (!currentQuestion) return null

    if (currentQuestion.question_type === "multiple_choice") {
      return (
        <div className="space-y-4">
          <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
            {currentQuestion.question_text}
          </h3>

          <RadioGroup
            value={answers[currentQuestionIndex] || ""}
            onValueChange={handleAnswerChange}
            className="space-y-2"
            disabled={isSubmitted}
          >
            {currentQuestion.options?.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 rounded-md border ${
                  isMobile ? 'p-3' : 'p-3'
                } ${
                  isSubmitted
                    ? option === currentQuestion.correct_answer
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : answers[currentQuestionIndex] === option
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-slate-200 dark:border-slate-700"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="mr-2" />
                <Label htmlFor={`option-${index}`} className="flex-1">
                  {option}
                </Label>
                {isSubmitted && option === currentQuestion.correct_answer && <CheckCircle className="h-5 w-5 text-green-500" />}
                {isSubmitted && option !== currentQuestion.correct_answer && answers[currentQuestionIndex] === option && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}          </RadioGroup>
        </div>
      )    } else if (currentQuestion.question_type === "open_ended") {
      return (
        <div className="space-y-4">
          <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
            {currentQuestion.question_text}
          </h3>

          <Textarea
            value={answers[currentQuestionIndex] || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className={`${isMobile ? 'min-h-[120px] text-base' : 'min-h-[150px]'}`}
            disabled={isSubmitted}
            onPaste={(e) => {
              e.preventDefault()
              toast({
                title: "Acción no permitida",
                description: "No se permite pegar texto en las respuestas abiertas.",
                variant: "destructive",
              })
            }}
          />

          {isSubmitted && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              <h4 className="font-medium mb-2">Respuesta sugerida:</h4>
              <p className="text-sm">{currentQuestion.correct_answer}</p>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <WindowFrame
      id={windowData.id}
      title="Evaluación de Comprensión"
      initialWidth={windowData.position.width}
      initialHeight={windowData.position.height}
      initialX={windowData.position.x}
      initialY={windowData.position.y}
    >      <div className={`space-y-4 ${isMobile ? 'space-y-3' : 'space-y-6'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'}`}>
          <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>
            Evaluación de Comprensión
          </h2>
          <div className={`text-slate-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </div>
        </div>        <div className={`flex space-x-2 overflow-x-auto py-2 ${isMobile ? 'px-2' : ''}`}>
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`flex-shrink-0 ${isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center text-xs font-medium ${
                index === currentQuestionIndex
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : isQuestionAnswered(index)
                    ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className={`bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 ${isMobile ? 'p-3' : 'p-4'}`}>
          {renderQuestion()}
        </div>

        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between'}`}>
          <Button 
            variant="outline" 
            onClick={handlePrevQuestion} 
            disabled={currentQuestionIndex === 0}
            className={isMobile ? 'w-full' : ''}
          >
            Anterior
          </Button>          <div className={`${isMobile ? 'flex flex-col space-y-2 w-full' : 'flex space-x-2'}`}>
            {isSubmitted ? (
              <Button 
                onClick={handleViewStats} 
                className={`flex items-center gap-1 ${isMobile ? 'w-full justify-center' : ''}`}
              >
                <BarChart className="h-4 w-4" /> 
                {isMobile ? 'Estadísticas' : 'Ver Estadísticas'}
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={questions.some((_, index) => !isQuestionAnswered(index))}
                className={isMobile ? 'w-full' : ''}
              >
                Enviar Respuestas
              </Button>
            )}

            {!isLastQuestion && (
              <Button 
                onClick={handleNextQuestion} 
                className={`flex items-center gap-1 ${isMobile ? 'w-full justify-center' : ''}`}
              >
                {isMobile ? 'Siguiente' : 'Siguiente'} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>        {isSubmitted && (
          <div
            className={`rounded-md text-center ${isMobile ? 'p-3' : 'p-4'} ${
              score >= 70
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
            }`}
          >
            <h3 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
              Puntuación: {score}%
            </h3>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
              {score >= 70
                ? "¡Excelente comprensión! Puedes ver tus estadísticas detalladas."
                : "Puedes mejorar tu comprensión. Revisa tus respuestas y el texto."}
            </p>
          </div>
        )}
      </div>
    </WindowFrame>
  )
}
