"use client"

import { useState, useEffect, useMemo } from "react"
import { useWorkspaceStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { useMetricsUpdates } from "@/hooks/use-metrics-updates"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart } from "@/components/charts"
import { BarChart3, LineChartIcon, PieChartIcon, Calendar, TrendingUp, Brain, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function MetricsOverview() {
  const [timeRange, setTimeRange] = useState("30")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { getUserSessions, getSessionStats, refreshStats, userStats, isLoadingStats } = useWorkspaceStore()
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  
  // Use the custom hook to detect metrics updates
  const { lastUpdate, totalSessions, sessionsWithStats, hasData } = useMetricsUpdates()

  // Get filtered sessions for current user
  const userSessions = user?.id ? getUserSessions(user.id) : []
  
  // Calculate average metrics using filtered sessions with memoization for performance
  const stats = useMemo(() => {
    return getSessionStats(Number.parseInt(timeRange), user?.id)
  }, [getSessionStats, timeRange, user?.id, lastUpdate]) // Include lastUpdate as dependency

  // Handle manual refresh of stats from API
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
      console.error('Error refreshing stats:', error)
      
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

  // Enhanced chart data with temporal information
  const enhancedChartData = useMemo(() => {
    const sessions = userSessions
      .filter(session => session.stats)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-20) // Last 20 sessions for better visualization

    // WPM evolution with dates
    const wpmData = sessions.map((session, index) => ({
      name: new Date(session.createdAt).toLocaleDateString(),
      value: session.stats?.wpm || 0,
      sessionId: session.id,
      title: session.title
    }))

    // Comprehension scores with dates  
    const scoreData = sessions.map((session, index) => ({
      name: new Date(session.createdAt).toLocaleDateString(),
      value: session.stats?.score || 0,
      sessionId: session.id,
      title: session.title
    }))

    // Topic distribution with actual counts
    const topicCounts = userSessions.reduce((acc, session) => {
      if (!session.stats) return acc
      const topic = session.topic || "Sin categoría"
      acc[topic] = (acc[topic] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topicData = Object.entries(topicCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 topics

    return { wpmData, scoreData, topicData }
  }, [userSessions, lastUpdate]) // Include lastUpdate as dependency

  // Auto-refresh effect when user sessions change
  useEffect(() => {
    if (userSessions.length > 0) {
      // Optionally trigger a background refresh when new sessions are detected
      // This ensures metrics stay in sync with the latest data
    }
  }, [userSessions.length])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Métricas de Rendimiento</h2>
          <p className="text-sm text-muted-foreground">
            {hasData 
              ? `Basado en ${sessionsWithStats} sesiones completadas de ${totalSessions} totales`
              : `${totalSessions} sesiones creadas - Completa quizzes para ver métricas`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={isRefreshing || isLoadingStats}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo de tiempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Velocidad Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgWpm > 0 ? `${stats.avgWpm} WPM` : 'Sin datos'}
            </div>
            {stats.wpmImprovement !== 0 && (
              <div className={`flex items-center text-xs mt-1 ${
                stats.wpmImprovement > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.wpmImprovement > 0 ? '+' : ''}{stats.wpmImprovement} WPM vs periodo anterior
              </div>
            )}
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
              {stats.avgScore > 0 ? `${stats.avgScore}%` : 'Sin datos'}
            </div>
            {stats.scoreImprovement !== 0 && (
              <div className={`flex items-center text-xs mt-1 ${
                stats.scoreImprovement > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.scoreImprovement > 0 ? '+' : ''}{stats.scoreImprovement}% vs periodo anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sesiones Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              En los últimos {timeRange} días
            </div>
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
              {stats.totalTime > 0 ? `${Math.round(stats.totalTime / 60)} min` : '0 min'}
            </div>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              Tiempo de lectura acumulado
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wpm" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wpm" className="flex items-center gap-1">
            <LineChartIcon className="h-4 w-4" /> Velocidad de Lectura
          </TabsTrigger>
          <TabsTrigger value="comprehension" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> Comprensión
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-1">
            <PieChartIcon className="h-4 w-4" /> Distribución
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wpm">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Velocidad de Lectura</CardTitle>
              <CardDescription>
                WPM (palabras por minuto) a lo largo del tiempo - Últimas {enhancedChartData.wpmData.length} sesiones
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {enhancedChartData.wpmData.length > 0 ? (
                <LineChart data={enhancedChartData.wpmData} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de velocidad de lectura disponibles</p>
                    <p className="text-sm">Completa algunas sesiones de RSVP para ver tus métricas</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehension">
          <Card>
            <CardHeader>
              <CardTitle>Puntuación de Comprensión</CardTitle>
              <CardDescription>
                Rendimiento en cuestionarios por sesión - Últimas {enhancedChartData.scoreData.length} sesiones
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {enhancedChartData.scoreData.length > 0 ? (
                <BarChart data={enhancedChartData.scoreData} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de comprensión disponibles</p>
                    <p className="text-sm">Completa cuestionarios para ver tu progreso de comprensión</p>
                  </div>
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
                Categorías de contenido más estudiadas - Total de {userSessions.filter(s => s.stats).length} sesiones
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {enhancedChartData.topicData.length > 0 ? (
                <PieChart data={enhancedChartData.topicData} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de distribución disponibles</p>
                    <p className="text-sm">Explora diferentes temas para ver la distribución de tu estudio</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
