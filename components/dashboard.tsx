"use client"

import { useState } from "react"
import { useWorkspaceStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, BarChart3, History, Sparkles, Clock, TrendingUp, Brain, PlusCircle } from "lucide-react"
import MetricsOverview from "@/components/metrics-overview"
import RecentSessions from "@/components/recent-sessions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DashboardProps {
  setActiveView: (view: "dashboard" | "workspace") => void
}

export default function Dashboard({ setActiveView }: DashboardProps) {
  const [topic, setTopic] = useState("")
  const [customText, setCustomText] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectFolder, setNewProjectFolder] = useState("")
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const { addSession, folders, addProject } = useWorkspaceStore()
  const { user } = useAuthStore()
  const { toast } = useToast()

  const handleCreateSession = async (type: "generate" | "custom") => {
    if (type === "generate" && !topic.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un tema para generar contenido.",
        variant: "destructive",
      })
      return
    }

    if (type === "custom" && !customText.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un texto personalizado.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a new session
      const sessionId = await addSession({
        title: type === "generate" ? topic : "Texto personalizado",
        topic: type === "generate" ? topic : "Personalizado",
        text: type === "custom" ? customText : "",
        folderId: selectedFolder || null,
        type,
      })

      toast({
        title: "Sesión creada",
        description: "La sesión ha sido creada correctamente.",
      })

      // Switch to workspace view
      setActiveView("workspace")
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al crear la sesión. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un nombre para el proyecto.",
        variant: "destructive",
      })
      return
    }

    try {
      addProject(newProjectName, newProjectFolder || folders[0]?.id || "")
      setNewProjectName("")
      setNewProjectFolder("")
      setIsNewProjectDialogOpen(false)
      toast({
        title: "Proyecto creado",
        description: `El proyecto "${newProjectName}" ha sido creado correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al crear el proyecto. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">RIA - Lector Inteligente RSVP</h1>
          <div className="flex items-center gap-2">
            <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" /> Nuevo Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nuevo proyecto</DialogTitle>
                  <DialogDescription>Crea un nuevo proyecto para organizar tus sesiones de lectura.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="projectName" className="text-sm font-medium">
                      Nombre del proyecto
                    </label>
                    <Input
                      id="projectName"
                      placeholder="Ej: Estudio de Historia"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="projectFolder" className="text-sm font-medium">
                      Carpeta
                    </label>
                    <Select value={newProjectFolder} onValueChange={setNewProjectFolder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar carpeta" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateProject}>Crear proyecto</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="new" className="space-y-4">
          <TabsList>
            <TabsTrigger value="new" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> Nueva Sesión
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" /> Métricas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-4 w-4" /> Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Generar Contenido
                  </CardTitle>
                  <CardDescription>Ingresa un tema para generar contenido educativo con IA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="space-y-2">
                    <label htmlFor="folder" className="text-sm font-medium">
                      Carpeta (opcional)
                    </label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar carpeta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleCreateSession("generate")} disabled={!topic.trim()} className="w-full">
                    Generar Contenido
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Texto Personalizado
                  </CardTitle>
                  <CardDescription>Usa tu propio texto para la lectura RSVP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleCreateSession("custom")}
                    disabled={!customText.trim()}
                    className="w-full"
                  >
                    Usar Texto Personalizado
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Velocidad de Lectura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">300-500 WPM</div>
                  <p className="text-xs text-slate-500 mt-1">Mejora tu velocidad con práctica regular</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Progreso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+15% WPM</div>
                  <p className="text-xs text-slate-500 mt-1">Incremento promedio después de 10 sesiones</p>
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
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-slate-500 mt-1">Retención promedio con técnica RSVP</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <MetricsOverview />
          </TabsContent>

          <TabsContent value="history">
            <RecentSessions setActiveView={setActiveView} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
