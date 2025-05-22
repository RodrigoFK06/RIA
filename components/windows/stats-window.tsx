"use client"

import WindowFrame from "@/components/window-frame"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkspaceStore } from "@/lib/store"
import { BarChart, BookOpen, MessageSquare, Share2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
    data?: {
      sessionId: string
      stats: {
        wpm: number
        totalTime: number
        idealTime: number
        score: number
        feedback: string
      }
      score: number
      text: string
      answers: string[]
      questions: any[]
    }
  }
}

export default function StatsWindow({ windowData }: StatsWindowProps) {
  const { addWindow } = useWorkspaceStore()

  const stats = windowData.data?.stats || {
    wpm: 0,
    totalTime: 0,
    idealTime: 0,
    score: 0,
    feedback: "",
  }

  const score = windowData.data?.score || 0
  const sessionId = windowData.data?.sessionId || ""

  const handleOpenAssistant = () => {
    addWindow("assistant", {
      sessionId,
      context: {
        text: windowData.data?.text || "",
        score,
        stats,
      },
    })
  }

  return (
    <WindowFrame
      id={windowData.id}
      title="Estadísticas y Feedback"
      initialWidth={windowData.position.width}
      initialHeight={windowData.position.height}
      initialX={windowData.position.x}
      initialY={windowData.position.y}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Estadísticas y Feedback</h2>
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleOpenAssistant}>
            <MessageSquare className="h-4 w-4" /> Asistente IA
          </Button>
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <BarChart className="h-4 w-4" /> Estadísticas
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Velocidad de Lectura</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.wpm} WPM</div>
                  <p className="text-xs text-slate-500 mt-1">Palabras por minuto</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Puntuación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{score}%</div>
                  <p className="text-xs text-slate-500 mt-1">Comprensión del texto</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo de Lectura</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(stats.totalTime / 1000)}s</div>
                  <p className="text-xs text-slate-500 mt-1">Tiempo total empleado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo Ideal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(stats.idealTime / 1000)}s</div>
                  <p className="text-xs text-slate-500 mt-1">Tiempo estimado óptimo</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Comparativa</CardTitle>
                <CardDescription>Tu rendimiento comparado con el ideal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end justify-center gap-16">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-16 bg-slate-200 dark:bg-slate-700 rounded-t-md"
                      style={{ height: `${Math.min(180, stats.totalTime / 50)}px` }}
                    ></div>
                    <span className="text-xs mt-2">Tu tiempo</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-16 bg-green-200 dark:bg-green-700 rounded-t-md"
                      style={{ height: `${Math.min(180, stats.idealTime / 50)}px` }}
                    ></div>
                    <span className="text-xs mt-2">Tiempo ideal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Personalizado</CardTitle>
                <CardDescription>Análisis de tu desempeño generado por IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p>{stats.feedback}</p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" /> Compartir Resultados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WindowFrame>
  )
}
