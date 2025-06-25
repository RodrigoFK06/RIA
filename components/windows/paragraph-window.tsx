"use client"

import { useState, useEffect, useRef } from "react"
import WindowFrame from "@/components/window-frame"
import { Button } from "@/components/ui/button"
import { useWorkspaceStore } from "@/lib/store"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParagraphWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
    data?: {
      sessionId: string
      text: string
      words: string[]
      currentWordIndex: number
      isPlaying: boolean
      parentId: string
    }
  }
}

export default function ParagraphWindow({ windowData }: ParagraphWindowProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(windowData.data?.currentWordIndex || 0)
  const [isPlaying, setIsPlaying] = useState(windowData.data?.isPlaying || false)
  const wordRef = useRef<HTMLSpanElement>(null)

  const { updateWindowData } = useWorkspaceStore()
  const words = windowData.data?.words || []
  const parentId = windowData.data?.parentId || ""

  // Actualizar el estado local cuando cambian los datos de la ventana
  useEffect(() => {
    if (windowData.data) {
      setCurrentWordIndex(windowData.data.currentWordIndex || 0)
      setIsPlaying(windowData.data.isPlaying || false)
    }
  }, [windowData.data])

  // Hacer scroll automático para mantener la palabra actual visible
  useEffect(() => {
    if (wordRef.current) {
      wordRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [currentWordIndex])

  // Renderizar el párrafo con la palabra actual resaltada
  const renderParagraphWithHighlight = () => {
    if (!words || words.length === 0) return null

    return (
      <div className="text-sm leading-relaxed">
        {words.map((word, index) => {
          const isCurrentWord = index === currentWordIndex
          return (
            <span
              key={index}
              ref={isCurrentWord ? wordRef : null}
              className={cn("inline-block mx-0.5", isCurrentWord && "bg-blue-500 text-white px-1 rounded")}
            >
              {word}
            </span>
          )
        })}
      </div>
    )
  }

  const handleTogglePlayPause = () => {
    const newIsPlaying = !isPlaying
    setIsPlaying(newIsPlaying)

    // Actualizar la ventana padre (lector RSVP)
    updateWindowData(parentId, {
      isPlaying: newIsPlaying,
    })
  }

  const handleSkipForward = () => {
    const newIndex = Math.min(currentWordIndex + 10, words.length - 1)
    setCurrentWordIndex(newIndex)

    // Actualizar la ventana padre (lector RSVP)
    updateWindowData(parentId, {
      currentWordIndex: newIndex,
    })
  }

  const handleSkipBackward = () => {
    const newIndex = Math.max(currentWordIndex - 10, 0)
    setCurrentWordIndex(newIndex)

    // Actualizar la ventana padre (lector RSVP)
    updateWindowData(parentId, {
      currentWordIndex: newIndex,
    })
  }

  return (
    <WindowFrame
      id={windowData.id}
      title="Vista de Párrafo"
      initialWidth={windowData.position.width}
      initialHeight={windowData.position.height}
      initialX={windowData.position.x}
      initialY={windowData.position.y}
    >
      <div className="container-responsive flex flex-col h-full">
        <div className="flex-1 overflow-auto p-4 bg-slate-800 dark:bg-slate-900 rounded-md">
          {renderParagraphWithHighlight()}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            Palabra actual: {currentWordIndex + 1} de {words.length}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSkipBackward} disabled={currentWordIndex === 0}>
              <SkipBack className="h-4 w-4 mr-1" /> Anterior
            </Button>

            <Button variant="outline" size="sm" onClick={handleTogglePlayPause}>
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-1" /> Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" /> Continuar
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipForward}
              disabled={currentWordIndex >= words.length - 1}
            >
              Siguiente <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </WindowFrame>
  )
}
