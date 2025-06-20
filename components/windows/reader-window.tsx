"use client"

import { useState, useEffect, useRef } from "react"
import WindowFrame from "@/components/window-frame"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useWorkspaceStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Play, Pause, SkipBack, SkipForward, CheckCircle2, AlignLeft } from "lucide-react"
import { rsvpApi } from "@/lib/rsvpApi"
import { useAuthStore } from "@/lib/auth-store"
import { Progress } from "@/components/ui/progress"

interface ReaderWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
    data?: {
      sessionId: string
      text: string
      words: string[]
    }
  }
}

export default function ReaderWindow({ windowData }: ReaderWindowProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null)
  const [readingEndTime, setReadingEndTime] = useState<number | null>(null)
  const [readingStats, setReadingStats] = useState<{
    totalTime: number
    wordsPerMinute: number
  } | null>(null)
  const [paragraphWindowId, setParagraphWindowId] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { windows, addWindow, updateWindowData } = useWorkspaceStore()
  const { toast } = useToast()
  const { token } = useAuthStore()

  // FIX: Use words from data if available, otherwise split the text.
  // This ensures the reader has content immediately if text is present.
  const text = windowData.data?.text || ""
  const words =
    windowData.data?.words && windowData.data.words.length > 0
      ? windowData.data.words
      : text.split(/\s+/).filter(Boolean)
  const sessionId = windowData.data?.sessionId || ""

  // DEBUG: Log data integrity on mount and when data changes.
  useEffect(() => {
    console.log(`[ReaderWindow] Mounted/Updated for Session ID: ${sessionId}`)
    console.log(`  - Text length: ${text.length}`)
    console.log(`  - Words array length: ${words.length}`)
    if (words.length > 0) {
      console.log(`  - First 5 words:`, words.slice(0, 5))
      console.log(`  - Last 5 words:`, words.slice(-5))
    }
  }, [sessionId, text, words])

  useEffect(() => {
    const load = async () => {
      if (!sessionId || words.length || !token) return
      try {
        const data = await rsvpApi.getRsvp(sessionId, token)
        updateWindowData(windowData.id, { text: data.text, words: data.words })
      } catch (err) {
        toast({
          title: "Error",
          description: "No se pudo cargar la sesión.",
          variant: "destructive",
        })
      }
    }
    load()
  }, [sessionId, words.length, token, updateWindowData, windowData.id, toast])

  const progress = words.length > 0 ? (currentWordIndex / words.length) * 100 : 0
  const isComplete = currentWordIndex >= words.length

  // Find the paragraph window if it exists
  useEffect(() => {
    const paragraphWindow = windows.find(
      (window) => window.type === "paragraph" && window.data?.parentId === windowData.id,
    )
    if (paragraphWindow) {
      setParagraphWindowId(paragraphWindow.id)
    } else {
      setParagraphWindowId(null)
    }
  }, [windows, windowData.id])

  // Update paragraph window when reader state changes
  useEffect(() => {
    if (paragraphWindowId) {
      updateWindowData(paragraphWindowId, {
        currentWordIndex,
        isPlaying,
      })
    }
  }, [currentWordIndex, isPlaying, paragraphWindowId, updateWindowData])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isPlaying && currentWordIndex < words.length) {
      if (!readingStartTime) {
        setReadingStartTime(Date.now())
      }

      const interval = 60000 / wpm // Calculate interval in ms based on WPM

      intervalRef.current = setInterval(() => {
        setCurrentWordIndex((prevIndex) => {
          const nextIndex = prevIndex + 1
          if (nextIndex >= words.length) {
            clearInterval(intervalRef.current!)
            setIsPlaying(false)
            setReadingEndTime(Date.now())
            return words.length
          }
          return nextIndex
        })
      }, interval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isPlaying, currentWordIndex, words.length, wpm, readingStartTime])

  useEffect(() => {
    if (readingEndTime && readingStartTime) {
      const totalTimeMs = readingEndTime - readingStartTime
      const totalTimeMinutes = totalTimeMs / 60000
      const actualWpm = words.length / totalTimeMinutes

      setReadingStats({
        totalTime: totalTimeMs,
        wordsPerMinute: Math.round(actualWpm),
      })
    }
  }, [readingEndTime, readingStartTime, words.length])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setCurrentWordIndex(0)
    setIsPlaying(false)
    setReadingStartTime(null)
    setReadingEndTime(null)
    setReadingStats(null)
  }

  const handleSkipForward = () => {
    setCurrentWordIndex((prevIndex) => Math.min(prevIndex + 10, words.length))
  }

  const handleSkipBackward = () => {
    setCurrentWordIndex((prevIndex) => Math.max(prevIndex - 10, 0))
  }

  const handleWpmChange = (value: number[]) => {
    setWpm(value[0])
  }

  const handleStartQuiz = async () => {
    try {
      if (!token) throw new Error("No autenticado")
      const data = await rsvpApi.createQuiz({ rsvp_session_id: sessionId }, token)

      addWindow("quiz", {
        sessionId,
        questions: data.questions,
        text,
      })

      toast({
        title: "Evaluación iniciada",
        description: "Responde las preguntas para evaluar tu comprensión.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las preguntas. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleOpenParagraphView = () => {
    // Si ya existe una ventana de párrafo, no crear otra
    if (paragraphWindowId) {
      toast({
        title: "Vista de párrafo",
        description: "La vista de párrafo ya está abierta.",
      })
      return
    }

    // Añadir una nueva ventana para la vista de párrafo
    const id = addWindow("paragraph", {
      sessionId,
      text,
      words,
      currentWordIndex,
      isPlaying,
      parentId: windowData.id,
    })

    setParagraphWindowId(id)
  }

  return (
    <WindowFrame
      id={windowData.id}
      title="Lector RSVP"
      initialWidth={windowData.position.width}
      initialHeight={windowData.position.height}
      initialX={windowData.position.x}
      initialY={windowData.position.y}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center">
          {isComplete ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="text-xl font-bold">¡Lectura Completada!</h3>

              {readingStats && (
                <div className="space-y-2 text-sm">
                  <p>Tiempo total: {Math.round(readingStats.totalTime / 1000)} segundos</p>
                  <p>Velocidad promedio: {readingStats.wordsPerMinute} palabras por minuto</p>
                  <p>Total de palabras: {words.length}</p>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={handleStartQuiz} className="w-full">
                  Iniciar Evaluación
                </Button>
                <Button onClick={handleReset} variant="outline" className="w-full mt-2">
                  Reiniciar Lectura
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold h-20 flex items-center justify-center">
                {words[currentWordIndex] || ""}
              </div>

              <div className="w-full mt-8">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs mt-1">
                  <span>
                    {currentWordIndex} / {words.length}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </>
          )}
        </div>

        {!isComplete && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Button variant="outline" size="icon" onClick={handleSkipBackward} disabled={currentWordIndex === 0}>
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button onClick={togglePlayPause} className="w-24">
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Pausa
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Iniciar
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipForward}
                disabled={currentWordIndex >= words.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="icon" onClick={handleOpenParagraphView} title="Ver texto completo">
                <AlignLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Velocidad: {wpm} WPM</span>
                <span className="text-xs text-slate-500">(100-800 palabras por minuto)</span>
              </div>
              <Slider value={[wpm]} min={100} max={800} step={10} onValueChange={handleWpmChange} />
            </div>
          </div>
        )}
      </div>
    </WindowFrame>
  )
}
