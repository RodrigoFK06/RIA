"use client"

import WindowFrame from "@/components/window-frame"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkspaceStore } from "@/lib/store"
import { BarChart, BookOpen, MessageSquare, Share2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsResponse, QuizValidateResponse, QuizQuestion } from "@/lib/rsvpApi"
import { useBreakpoint } from "@/hooks/use-breakpoint"

interface StatsWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
    data?: {
      sessionId: string
      stats: StatsResponse | {
        wpm: number
        reading_time_seconds: number
        idealTime: number
        score: number
        feedback: string
      }
      score: number
      text: string
      validation: QuizValidateResponse | null
      questions: QuizQuestion[]
    }
  }
}

export default function StatsWindow({ windowData }: StatsWindowProps) {
  const { addWindow } = useWorkspaceStore()
  const { isMobile, isTablet } = useBreakpoint()

  const stats = windowData.data?.stats

  const overall = (stats as StatsResponse)?.overall_stats
  const last = (stats as StatsResponse)?.recent_sessions_stats?.[0]

  // ✅ Sesión individual detectada si tiene "wpm" directamente
  const sessionStats = stats && 'wpm' in stats
    ? {
      wpm: stats.wpm,
      readingTime: stats.reading_time_seconds,
      idealTime: stats.idealTime,
      score: stats.score,
      feedback: stats.feedback,
    }
    : null

  const score = sessionStats?.score ?? windowData.data?.score ?? 0
  const sessionId = windowData.data?.sessionId || ""
  const validation = windowData.data?.validation
  const questions = windowData.data?.questions || []

  const handleOpenAssistant = () => {
    addWindow("assistant", {
      sessionId,
      context: {
        text: windowData.data?.text || "",
        score,
        stats: overall,
      },
    })
  }

  return (
    <WindowFrame
      id={windowData.id}
      title="Estadísticas y Retroalimentación"
      initialWidth={windowData.position.width}
      initialHeight={windowData.position.height}
      initialX={windowData.position.x}
      initialY={windowData.position.y}
    >
      <div className="space-y-6">
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-col' : 'justify-between'}`}>
          <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>Estadísticas y Retroalimentación</h2>
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            className="flex items-center gap-1"
            onClick={handleOpenAssistant}
          >
            <MessageSquare className="h-4 w-4" /> Asistente IA
          </Button>
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats" className={`flex items-center gap-1 ${isMobile ? 'text-sm' : ''}`}>
              <BarChart className="h-4 w-4" /> Estadísticas
            </TabsTrigger>
            <TabsTrigger value="feedback" className={`flex items-center gap-1 ${isMobile ? 'text-sm' : ''}`}>
              <BookOpen className="h-4 w-4" /> Retroalimentación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-medium text-sm">Velocidad de Lectura</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">{overall?.average_wpm ?? sessionStats?.wpm ?? 0} WPM</div>
                  <p className="text-slate-500 mt-1 text-xs">Palabras por minuto</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-medium text-sm">Puntuación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">{score}%</div>
                  <p className="text-slate-500 mt-1 text-xs">Comprensión del texto</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-medium text-sm">Tiempo de Lectura</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">
                    {sessionStats?.readingTime ?? Math.round(overall?.total_reading_time_seconds ?? 0)}s
                  </div>
                  <p className="text-slate-500 mt-1 text-xs">Tiempo total empleado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-medium text-sm">Sesiones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">{overall?.total_sessions_read ?? 1}</div>
                  <p className="text-slate-500 mt-1 text-xs">Sesiones completadas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className={isMobile ? 'text-base' : ''}>Comparativa</CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>Tu rendimiento comparado con el ideal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`flex items-end justify-center gap-8 ${isMobile ? 'h-[150px]' : 'h-[200px]'}`}>
                  <div className="flex flex-col items-center">
                    <div
                      className="bg-slate-200 dark:bg-slate-700 rounded-t-md w-16"
                      style={{
                        height: `${Math.min(
                          isMobile ? 120 : 180,
                          (sessionStats?.readingTime ?? last?.reading_time_seconds ?? 0) * (isMobile ? 2 : 3)
                        )}px`,
                      }}
                    ></div>
                    <span className="mt-2 text-center text-xs">Tu tiempo</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="bg-green-200 dark:bg-green-700 rounded-t-md w-16"
                      style={{
                        height: `${Math.min(
                          isMobile ? 120 : 180,
                          (sessionStats?.idealTime ?? last?.ai_estimated_ideal_reading_time_seconds ?? 0) * (isMobile ? 2 : 3)
                        )}px`,
                      }}
                    ></div>
                    <span className="mt-2 text-center text-xs">Tiempo ideal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className={isMobile ? 'text-base' : ''}>Retroalimentación Personalizada</CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>Análisis de tu desempeño generado por IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`prose dark:prose-invert max-w-none ${isMobile ? 'prose-sm' : ''}`}>
                  <p className={isMobile ? 'text-sm' : ''}>
                    {(stats as StatsResponse)?.personalized_feedback || sessionStats?.feedback || "Sin retroalimentación disponible"}
                  </p>
                </div>

                <div className={`mt-6 flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
                  <Button
                    variant="outline"
                    size={isMobile ? "default" : "sm"}
                    className="flex items-center gap-1"
                  >
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
