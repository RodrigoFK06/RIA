"use client"

import { useState } from "react"
import WindowFrame from "@/components/window-frame"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspaceStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, ArrowRight, BarChart } from "lucide-react"
import { getStats } from "@/lib/api"

interface Question {
  type: "multiple_choice" | "open"
  question: string
  options?: string[]
  answer: string
}

interface QuizWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
    data?: {
      sessionId: string
      questions: Question[]
      text: string
    }
  }
}

export default function QuizWindow({ windowData }: QuizWindowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const { addWindow } = useWorkspaceStore()
  const { toast } = useToast()

  const questions = windowData.data?.questions || []
  const sessionId = windowData.data?.sessionId || ""
  const text = windowData.data?.text || ""

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

  const handleSubmit = () => {
    // Calculate score for multiple choice questions
    let correctAnswers = 0
    questions.forEach((question, index) => {
      if (question.type === "multiple_choice" && answers[index] === question.answer) {
        correctAnswers++
      }
    })

    const multipleChoiceQuestions = questions.filter((q) => q.type === "multiple_choice").length
    const calculatedScore =
      multipleChoiceQuestions > 0 ? Math.round((correctAnswers / multipleChoiceQuestions) * 100) : 0

    setScore(calculatedScore)
    setIsSubmitted(true)
  }

  const handleViewStats = async () => {
    try {
      const stats = await getStats(sessionId)

      addWindow("stats", {
        sessionId,
        stats,
        score,
        text,
        answers,
        questions,
      })

      toast({
        title: "Estadísticas cargadas",
        description: "Revisa tu desempeño y el feedback personalizado.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const isQuestionAnswered = (index: number) => {
    return answers[index] !== undefined && answers[index] !== ""
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null

    if (currentQuestion.type === "multiple_choice") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentQuestion.question}</h3>

          <RadioGroup
            value={answers[currentQuestionIndex] || ""}
            onValueChange={handleAnswerChange}
            className="space-y-2"
            disabled={isSubmitted}
          >
            {currentQuestion.options?.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-3 rounded-md border ${
                  isSubmitted
                    ? option === currentQuestion.answer
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
                {isSubmitted && option === currentQuestion.answer && <CheckCircle className="h-5 w-5 text-green-500" />}
                {isSubmitted && option !== currentQuestion.answer && answers[currentQuestionIndex] === option && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    } else if (currentQuestion.type === "open") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentQuestion.question}</h3>

          <Textarea
            value={answers[currentQuestionIndex] || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className="min-h-[150px]"
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
              <p className="text-sm">{currentQuestion.answer}</p>
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
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Evaluación de Comprensión</h2>
          <div className="text-sm text-slate-500">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </div>
        </div>

        <div className="flex space-x-2 overflow-x-auto py-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
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

        <div className="bg-white dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
          {renderQuestion()}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
            Anterior
          </Button>

          <div className="flex space-x-2">
            {isSubmitted ? (
              <Button onClick={handleViewStats} className="flex items-center gap-1">
                <BarChart className="h-4 w-4" /> Ver Estadísticas
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={answers.filter(Boolean).length !== questions.length}>
                Enviar Respuestas
              </Button>
            )}

            {!isLastQuestion && (
              <Button onClick={handleNextQuestion} className="flex items-center gap-1">
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isSubmitted && (
          <div
            className={`p-4 rounded-md text-center ${
              score >= 70
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
            }`}
          >
            <h3 className="font-bold text-lg">Puntuación: {score}%</h3>
            <p className="text-sm mt-1">
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
