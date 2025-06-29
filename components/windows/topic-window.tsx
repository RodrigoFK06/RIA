"use client"

import { useState } from "react"
import WindowFrame from "@/components/window-frame"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkspaceStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Loader2, BookOpen, Upload } from "lucide-react"
import { rsvpApi } from "@/lib/rsvpApi"
import { useAuthStore } from "@/lib/auth-store"
import { useBreakpoint } from "@/hooks/use-breakpoint"

interface TopicWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
  }
}

export default function TopicWindow({ windowData }: TopicWindowProps) {
  const [topic, setTopic] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isProcessingCustomText, setIsProcessingCustomText] = useState(false)
  const [customText, setCustomText] = useState("")
  const { addWindow } = useWorkspaceStore()
  const { toast } = useToast()
  const { token } = useAuthStore()
  const { isMobile, isTablet } = useBreakpoint()

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un tema para generar contenido.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      if (!token) throw new Error("No autenticado")
      const data = await rsvpApi.createRsvp({ topic }, token)

      addWindow("reader", {
        sessionId: data.id,
        text: data.text,
        words: data.words,
      })

      toast({
        title: "Contenido generado",
        description: "El contenido ha sido generado correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al generar el contenido. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseCustomText = async () => {
    if (!customText.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un texto personalizado.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingCustomText(true)
    try {
      if (!token) throw new Error("No autenticado")

      const sessionId = await useWorkspaceStore.getState().addSession({
        title: "Texto personalizado",
        topic: `__raw__:${customText}`,
        folderId: null,
        type: "custom",
        text: "", // no se usa, pero requerido por tipo
      }, token, useAuthStore.getState().user?.id)

      // Cargar la sesión normalmente en el reader
      await useWorkspaceStore.getState().loadSession(sessionId, token)

      toast({
        title: "Texto personalizado",
        description: "Tu texto fue cargado correctamente desde el backend.",
      })
    } catch (error) {
      console.error("❌ Error al usar texto personalizado:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al guardar el texto. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingCustomText(false)
    }
  }


  return (
    <WindowFrame
      id={windowData.id}
      title="Generador de Contenido"
      initialWidth={windowData.position.width}
      initialHeight={windowData.position.height}
      initialX={windowData.position.x}
      initialY={windowData.position.y}    >
      <div className="space-y-4">
        <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>Generador de Contenido Educativo</h2>
        <p className={`text-slate-500 dark:text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          Ingresa un tema para generar contenido educativo o carga tu propio texto para la lectura RSVP.
        </p>

        <Tabs defaultValue="generate">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className={`flex items-center gap-1 ${isMobile ? 'text-sm px-3' : ''}`}>
              <BookOpen className="h-4 w-4" /> {isMobile ? 'Generar' : 'Generar'}
            </TabsTrigger>
            <TabsTrigger value="custom" className={`flex items-center gap-1 ${isMobile ? 'text-sm px-3' : ''}`}>
              <Upload className="h-4 w-4" /> {isMobile ? 'Propio' : 'Texto Propio'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="topic" className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Tema
              </label>
              <Input
                id="topic"
                placeholder={isMobile ? "Ej: Energía solar..." : "Ej: Energía solar, Historia de Roma, Inteligencia Artificial..."}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={isMobile ? 'text-base' : ''}
              />
            </div>

            <Button
              onClick={handleGenerateContent}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-1 w-full"
              size={isMobile ? "default" : "default"}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4" />
                  {isMobile ? 'Generar' : 'Generar Contenido'}
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="customText" className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Texto Personalizado
              </label>
              <Textarea
                id="customText"
                placeholder="Pega o escribe aquí tu texto personalizado..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className={`${isMobile ? 'min-h-[120px] text-base' : 'min-h-[150px]'}`}
              />
            </div>

            <Button
              onClick={handleUseCustomText}
              disabled={isProcessingCustomText || !customText.trim()}
              className="flex items-center gap-1 w-full"
              size={isMobile ? "default" : "default"}
            >
              {isProcessingCustomText ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {isMobile ? 'Usar Texto' : 'Usar Texto Personalizado'}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </WindowFrame>
  )
}
