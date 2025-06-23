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
import { BookOpen, BarChart3, History, Sparkles, Clock, TrendingUp, Brain, PlusCircle, Activity } from "lucide-react"
import MetricsOverview from "@/components/metrics-overview"
import RecentSessions from "@/components/recent-sessions"
import StatsHistory from "@/components/stats-history"
import { useBreakpoint } from "@/hooks/use-breakpoint"
import { cn } from "@/lib/utils"
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
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Dashboard({ setActiveView, activeTab, setActiveTab }: DashboardProps) {
  const [topic, setTopic] = useState("")
  const [customText, setCustomText] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectFolder, setNewProjectFolder] = useState("")
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const { addSession, folders, addProject } = useWorkspaceStore()
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const { isMobile, isTablet } = useBreakpoint()

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
      // Create a new session - PASAR userId PARA FILTRADO DE SEGURIDAD
      const sessionId = await addSession({
        title: type === "generate" ? topic : "Texto personalizado",
        topic: type === "generate" ? topic : "Personalizado",
        text: type === "custom" ? customText : "",
        folderId: selectedFolder || null,
        type,
      }, token || undefined, user?.id)

      toast({
        title: "Sesión creada",
        description: "La sesión ha sido creada correctamente.",
      })

      // Switch to workspace view
      setActiveView("workspace")
    } catch (error: any) {
      console.error('Error creating session:', error)
      
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
          description: "Hubo un error al crear la sesión. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
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
      addProject(newProjectName, newProjectFolder || folders[0]?.id || null)
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
    <div className={cn("flex-1 overflow-auto", isMobile ? "p-4" : "p-6")}>
      <div className={cn("mx-auto space-y-6", isMobile ? "max-w-full" : "max-w-6xl")}>
        <div className={cn("flex items-center", isMobile ? "flex-col space-y-4" : "justify-between")}>
          <h1 className={cn("font-bold", isMobile ? "text-xl text-center" : "text-2xl")}>RIA - Lector Inteligente RSVP</h1>
          <div className="flex items-center gap-2">
            <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn("flex items-center gap-1", isMobile && "w-full")}
                  size={isMobile ? "default" : "default"}
                >
                  <PlusCircle className="h-4 w-4" /> {isMobile ? "Proyecto" : "Nuevo Proyecto"}
                </Button>
              </DialogTrigger>
              <DialogContent className={isMobile ? "w-[95vw] max-w-md" : ""}>
                <DialogHeader>
                  <DialogTitle className={isMobile ? "text-lg" : ""}>Crear nuevo proyecto</DialogTitle>
                  <DialogDescription className={isMobile ? "text-sm" : ""}>Crea un nuevo proyecto para organizar tus sesiones de lectura.</DialogDescription>
                </DialogHeader>
                <div className={cn("space-y-4", isMobile ? "py-3" : "py-4")}>
                  <div className="space-y-2">
                    <label htmlFor="projectName" className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                      Nombre del proyecto
                    </label>
                    <Input
                      id="projectName"
                      placeholder="Ej: Estudio de Historia"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className={isMobile ? "text-base" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="projectFolder" className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                      Carpeta
                    </label>
                    <Select value={newProjectFolder} onValueChange={setNewProjectFolder}>
                      <SelectTrigger className={isMobile ? "text-base" : ""}>
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
                <DialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNewProjectDialogOpen(false)}
                    className={isMobile ? "w-full" : ""}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    className={isMobile ? "w-full" : ""}
                  >
                    Crear proyecto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={cn("grid w-full", isMobile ? "grid-cols-2" : "grid-cols-4")}>
            <TabsTrigger value="new" className={cn("flex items-center gap-1", isMobile && "text-sm px-2")}>
              <Sparkles className="h-4 w-4" /> {isMobile ? "Nueva" : "Nueva Sesión"}
            </TabsTrigger>
            <TabsTrigger value="metrics" className={cn("flex items-center gap-1", isMobile && "text-sm px-2")}>
              <BarChart3 className="h-4 w-4" /> Métricas
            </TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger value="history" className="flex items-center gap-1">
                  <History className="h-4 w-4" /> Historial
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" /> Estadísticas
                </TabsTrigger>
              </>
            )}
            {isMobile && (
              <TabsTrigger value="stats" className="flex items-center gap-1 text-sm px-2">
                <Activity className="h-4 w-4" /> Estadísticas
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
              <Card>
                <CardHeader>
                  <CardTitle className={cn("flex items-center gap-2", isMobile && "text-lg")}>
                    <BookOpen className="h-5 w-5" />
                    Generar Contenido
                  </CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>Ingresa un tema para generar contenido educativo con IA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="topic" className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                      Tema
                    </label>
                    <Input
                      id="topic"
                      placeholder={isMobile ? "Ej: Energía solar..." : "Ej: Energía solar, Historia de Roma, Inteligencia Artificial..."}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className={isMobile ? "text-base" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="folder" className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                      Carpeta (opcional)
                    </label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger className={isMobile ? "text-base" : ""}>
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
                  <Button 
                    onClick={() => handleCreateSession("generate")} 
                    disabled={!topic.trim()} 
                    className="w-full"
                    size={isMobile ? "default" : "default"}
                  >
                    {isMobile ? "Generar" : "Generar Contenido"}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={cn("flex items-center gap-2", isMobile && "text-lg")}>
                    <BookOpen className="h-5 w-5" />
                    Texto Personalizado
                  </CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>Usa tu propio texto para la lectura RSVP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="customText" className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
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

          <TabsContent value="stats">
            <StatsHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
