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
import { generateRSVPContent } from "@/lib/api"

interface TopicWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
  }
}

export default function TopicWindow({ windowData }: TopicWindowProps) {
  const [topic, setTopic] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [customText, setCustomText] = useState("")
  const { addWindow } = useWorkspaceStore()
  const { toast } = useToast()

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un tema para generar contenido.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const data = await generateRSVPContent(topic)

      // Add reader window with the generated content
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
      setIsLoading(false)
    }
  }

  const handleUseCustomText = () => {
    if (!customText.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un texto personalizado.",
        variant: "destructive",
      })
      return
    }

    // Create words array from custom text
    const words = customText.split(/\s+/).filter((word) => word.length > 0)

    // Add reader window with the custom content
    addWindow("reader", {
      sessionId: `custom-${Date.now()}`,
      text: customText,
      words: words,
    })

    toast({
      title: "Texto personalizado",
      description: "Se ha cargado tu texto personalizado.",
    })
  }

  return (
    <WindowFrame
      id={windowData.id}
      title="Generador de Contenido"
      initialWidth={windowData.position.width}
      initialHeight={windowData.position.height}
      initialX={windowData.position.x}
      initialY={windowData.position.y}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Generador de Contenido Educativo</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ingresa un tema para generar contenido educativo o carga tu propio texto para la lectura RSVP.
        </p>

        <Tabs defaultValue="generate">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Generar
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-1">
              <Upload className="h-4 w-4" /> Texto Propio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium">
                Tema
              </label>
              <Input
                id="topic"
                placeholder="Ej: Energía solar, Historia de Roma, Inteligencia Artificial..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <Button onClick={handleGenerateContent} disabled={isLoading || !topic.trim()} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Contenido"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="customText" className="text-sm font-medium">
                Texto Personalizado
              </label>
              <Textarea
                id="customText"
                placeholder="Pega o escribe aquí tu texto personalizado..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <Button onClick={handleUseCustomText} disabled={!customText.trim()} className="w-full">
              Usar Texto Personalizado
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </WindowFrame>
  )
}
