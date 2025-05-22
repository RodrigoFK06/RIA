"use client"

import { useState } from "react"
import { useWorkspaceStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart } from "@/components/charts"
import { BarChart3, LineChartIcon, PieChartIcon, Calendar, TrendingUp, Brain, Clock } from "lucide-react"

export default function MetricsOverview() {
  const [timeRange, setTimeRange] = useState("30")
  const { sessions, getSessionStats } = useWorkspaceStore()

  // Calculate average metrics
  const stats = getSessionStats(Number.parseInt(timeRange))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Métricas de Rendimiento</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Velocidad Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgWpm} WPM</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />+{stats.wpmImprovement}% vs periodo anterior
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
            <div className="text-2xl font-bold">{stats.avgScore}%</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />+{stats.scoreImprovement}% vs periodo anterior
            </div>
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
            <div className="flex items-center text-xs text-slate-500 mt-1">En los últimos {timeRange} días</div>
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
            <div className="text-2xl font-bold">{Math.round(stats.totalTime / 60)} min</div>
            <div className="flex items-center text-xs text-slate-500 mt-1">Tiempo de lectura acumulado</div>
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
              <CardDescription>WPM (palabras por minuto) a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <LineChart data={stats.wpmData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehension">
          <Card>
            <CardHeader>
              <CardTitle>Comprensión por Sesión</CardTitle>
              <CardDescription>Puntuación de comprensión en las últimas sesiones</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BarChart data={stats.scoreData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Temas</CardTitle>
              <CardDescription>Categorías de contenido más leídas</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <PieChart data={stats.topicData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
