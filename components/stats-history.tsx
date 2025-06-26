"use client"

import { useState, useEffect } from "react"
import { useWorkspaceStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, LineChart, PieChart } from "@/components/charts"
import { 
  BarChart3, 
  LineChartIcon, 
  PieChartIcon, 
  Calendar, 
  TrendingUp, 
  Brain, 
  Clock,
  RefreshCw,
  Download,
  Share2,
  Activity,
  ChevronUp,
  ChevronDown,
  Circle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDateInLima } from "@/lib/utils"

export default function StatsHistory() {
  const [timeRange, setTimeRange] = useState("30")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { 
    sessions, 
    getSessionStats, 
    userStats, 
    isLoadingStats, 
    refreshStats, 
    getStatsHistory,
    getUserSessions
  } = useWorkspaceStore()
  const { token, user } = useAuthStore()
  const { toast } = useToast()
  // SEGURIDAD: Solo sesiones del usuario actual
  const userSessions = user?.id ? getUserSessions(user.id) : []
  // Estadísticas calculadas CON DATOS REALES DEL USUARIO
  const stats = getSessionStats(Number.parseInt(timeRange), user?.id)
  const apiStats = getStatsHistory()

  const overall = apiStats?.overall_stats

  const wpmEvolution = apiStats?.recent_sessions_stats
    ? apiStats.recent_sessions_stats
        .slice(0, 10)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(s => ({ name: formatDateInLima(s.created_at), value: s.wpm }))
    : []

  const scoreEvolution = apiStats?.recent_sessions_stats
    ? apiStats.recent_sessions_stats
        .slice(0, 10)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(s => ({ name: formatDateInLima(s.created_at), value: s.quiz_score }))
    : []
  const handleRefreshStats = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "No hay sesión autenticada",
        variant: "destructive",
      })
      return
    }
    
    setIsRefreshing(true)
    try {
      await refreshStats(token, user?.id)
      toast({
        title: "Estadísticas actualizadas",
        description: "Los datos han sido sincronizados con el servidor",
      })
    } catch (error: any) {
      console.error('Error refreshing stats in stats-history:', error)
      
      // Manejar específicamente errores de token expirado
      if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized') || error?.message?.includes('Token expirado')) {
        toast({
          title: "Sesión expirada",
          description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudieron actualizar las estadísticas",
          variant: "destructive",
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportStats = () => {
    const exportData = {
      userStats: apiStats,
      localStats: stats,
      sessions: userSessions.slice(0, 50), // Últimas 50 sesiones DEL USUARIO
      exportedAt: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `ria-stats-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Estadísticas exportadas",
      description: "El archivo ha sido descargado correctamente",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Historial de Estadísticas</h2>
          <p className="text-muted-foreground">
            Análisis detallado de tu progreso y rendimiento
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="90">3 meses</SelectItem>
              <SelectItem value="365">1 año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={isRefreshing || isLoadingStats}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportStats}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumen de estadísticas del servidor */}
      {apiStats?.overall_stats && (
        <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estadísticas del Servidor
            </CardTitle>
            <CardDescription>
              Datos sincronizados desde tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {apiStats.overall_stats.total_sessions_read}
                </div>
                <div className="text-sm text-muted-foreground">Sesiones Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {apiStats.overall_stats.average_wpm} WPM
                </div>
                <div className="text-sm text-muted-foreground">Velocidad Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(apiStats.overall_stats.average_quiz_score)}%
                </div>
                <div className="text-sm text-muted-foreground">Comprensión Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(apiStats.overall_stats.total_reading_time_seconds / 60)}m
                </div>
                <div className="text-sm text-muted-foreground">Tiempo Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {overall ? `${overall.delta_wpm_vs_previous >= 0 ? '+' : ''}${Math.round(overall.delta_wpm_vs_previous)}%` : <Skeleton className="h-6 w-12 mx-auto" />}
            </div>
            <div className="text-sm text-muted-foreground">Cambio WPM</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {overall ? `${overall.delta_comprehension_vs_previous >= 0 ? '+' : ''}${Math.round(overall.delta_comprehension_vs_previous)}%` : <Skeleton className="h-6 w-12 mx-auto" />}
            </div>
            <div className="text-sm text-muted-foreground">Cambio Comprensión</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              {overall ? (
                <>
                  {overall.wpm_trend === 'up' && <ChevronUp className="h-4 w-4 text-green-600" />}
                  {overall.wpm_trend === 'down' && <ChevronDown className="h-4 w-4 text-red-600" />}
                  {overall.wpm_trend === 'stable' && <Circle className="h-3 w-3 text-muted-foreground" />}
                  <span className="capitalize">{overall.wpm_trend}</span>
                </>
              ) : (
                <Skeleton className="h-6 w-16 mx-auto" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">Tendencia WPM</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              {overall ? (
                <>
                  {overall.comprehension_trend === 'up' && <ChevronUp className="h-4 w-4 text-green-600" />}
                  {overall.comprehension_trend === 'down' && <ChevronDown className="h-4 w-4 text-red-600" />}
                  {overall.comprehension_trend === 'stable' && <Circle className="h-3 w-3 text-muted-foreground" />}
                  <span className="capitalize">{overall.comprehension_trend}</span>
                </>
              ) : (
                <Skeleton className="h-6 w-16 mx-auto" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">Tendencia Comp.</div>
          </div>
          </div>
        </>
      )}

      {/* Estadísticas locales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Velocidad ({timeRange} días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overall ? (
                `${overall.average_wpm} WPM`
              ) : (
                <Skeleton className="h-6 w-16 mx-auto" />
              )}
            </div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {overall ? (
                `${overall.delta_wpm_vs_previous >= 0 ? '+' : ''}${Math.round(overall.delta_wpm_vs_previous)}% vs anterior`
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Comprensión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overall ? (
                `${Math.round(overall.average_quiz_score)}%`
              ) : (
                <Skeleton className="h-6 w-12 mx-auto" />
              )}
            </div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {overall ? (
                `${overall.delta_comprehension_vs_previous >= 0 ? '+' : ''}${Math.round(overall.delta_comprehension_vs_previous)}% vs anterior`
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overall ? (
                overall.total_sessions_read
              ) : (
                <Skeleton className="h-6 w-10 mx-auto" />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">En {timeRange} días</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overall ? (
                `${Math.round(overall.total_reading_time_seconds / 60)} min`
              ) : (
                <Skeleton className="h-6 w-12 mx-auto" />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Tiempo acumulado</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="wpm" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wpm" className="flex items-center gap-1">
            <LineChartIcon className="h-4 w-4" /> 
            <span className="hidden sm:inline">Velocidad</span>
          </TabsTrigger>
          <TabsTrigger value="comprehension" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> 
            <span className="hidden sm:inline">Comprensión</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-1">
            <PieChartIcon className="h-4 w-4" /> 
            <span className="hidden sm:inline">Distribución</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wpm">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Velocidad de Lectura</CardTitle>
              <CardDescription>
                Progreso en palabras por minuto durante los últimos {timeRange} días
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              {wpmEvolution.length > 0 ? (
                <LineChart data={wpmEvolution} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay datos suficientes para mostrar el gráfico
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehension">
          <Card>
            <CardHeader>
              <CardTitle>Comprensión por Sesión</CardTitle>
              <CardDescription>
                Puntuación de comprensión en las sesiones recientes
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              {scoreEvolution.length > 0 ? (
                <BarChart data={scoreEvolution} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay datos suficientes para mostrar el gráfico
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Temas</CardTitle>
              <CardDescription>
                Categorías de contenido más trabajadas
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              {stats.topicData.length > 0 ? (
                <PieChart data={stats.topicData} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay datos suficientes para mostrar el gráfico
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sesiones recientes desde el servidor */}
      {apiStats?.recent_sessions_stats && apiStats.recent_sessions_stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sesiones Recientes del Servidor</CardTitle>
            <CardDescription>
              Últimas sesiones sincronizadas con tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apiStats.recent_sessions_stats.slice(0, 5).map((session: any, index: number) => (
                <div key={session.session_id} className="p-3 border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Sesión #{index + 1}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateInLima(session.created_at, true)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {session.text_snippet}
                  </p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Badge variant="secondary">{session.wpm} WPM</Badge>
                    <Badge variant={session.quiz_score >= 70 ? 'default' : 'destructive'}>
                      {session.quiz_score}%
                    </Badge>
                    <Badge variant="outline">{session.ai_text_difficulty}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
