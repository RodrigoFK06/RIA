"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWorkspaceStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import ThemeToggle from "@/components/theme-toggle"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Folder,
  FolderOpen,
  BookOpen,
  BarChart3,
  History,
  Activity,
  Settings,
  MessageSquare,
  Clock,
  Calendar,
  User,
  LogOut,
  PlusCircle,
  ChevronDown,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useBreakpoint } from "@/hooks/use-breakpoint"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  setActiveView: (view: "dashboard" | "workspace") => void
  setDashboardTab: (tab: string) => void
}

export default function Sidebar({ open, setOpen, setActiveView, setDashboardTab }: SidebarProps) {
  const {
    projects,
    sessions,
    folders,
    activeProject,
    activeSession,
    setActiveProject,
    setActiveSession,
    addFolder,
    addProject,
    getUserSessions,
  } = useWorkspaceStore()
  const { user, logout } = useAuthStore()
  const { isMobile, isTablet } = useBreakpoint()
  const [searchQuery, setSearchQuery] = useState("")
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})
  const [newFolderName, setNewFolderName] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectFolder, setNewProjectFolder] = useState("")
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // SEGURIDAD: Filtrar sesiones solo del usuario actual
  const userSessions = user?.id ? getUserSessions(user.id) : []

  // Auto-colapsar sidebar en mobile/tablet
  useEffect(() => {
    if (isMobile && open) {
      setOpen(false)
    }
  }, [isMobile, open, setOpen])

  // Initialize open folders state
  useEffect(() => {
    const initialOpenFolders: Record<string, boolean> = {}
    folders.forEach((folder) => {
      initialOpenFolders[folder.id] = false
    })
    setOpenFolders(initialOpenFolders)
  }, [folders])
  // Group sessions by date - SOLO SESIONES DEL USUARIO ACTUAL
  const groupedSessions = userSessions.reduce(
    (groups, session) => {
      const date = new Date(session.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let groupKey = "older"

      if (date.toDateString() === today.toDateString()) {
        groupKey = "today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "yesterday"
      } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        groupKey = "lastWeek"
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }

      groups[groupKey].push(session)
      return groups
    },
    {} as Record<string, typeof sessions>,
  )

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  const handleSessionClick = (sessionId: string) => {
    setActiveSession(sessionId)
    setActiveView("workspace")
  }

  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId)
    setActiveView("workspace")
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const folderId = addFolder(newFolderName.trim())
      setNewFolderName("")
      setIsNewFolderDialogOpen(false)

      // Automatically open the new folder
      setOpenFolders((prev) => ({
        ...prev,
        [folderId]: true,
      }))

      toast({
        title: "Carpeta creada",
        description: `La carpeta "${newFolderName}" ha sido creada correctamente.`,
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

    if (!selectedFolderId) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una carpeta para el proyecto.",
        variant: "destructive",
      })
      return
    }    try {
      const projectId = addProject(newProjectName, selectedFolderId)
      setNewProjectName("")
      setIsNewProjectDialogOpen(false)

      // Make sure the folder is open
      setOpenFolders((prev) => ({
        ...prev,
        [selectedFolderId]: true,
      }))

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

  const handleAddProjectToFolder = (folderId: string) => {
    setSelectedFolderId(folderId)
    setIsNewProjectDialogOpen(true)
  }

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }
  const filteredSessions = searchQuery
    ? userSessions.filter(
        (session) =>
          session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.topic.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : []
  return (
    <div
      className={cn(
        "h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300",
        isMobile ? "w-0 overflow-hidden" : open ? "w-72" : "w-16",
        isMobile && open && "fixed inset-y-0 left-0 z-50 w-72 shadow-lg"
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn(
          "flex items-center border-b border-slate-200 dark:border-slate-800",
          isMobile ? "h-16 px-4 justify-between" : "h-14 px-4 justify-between"
        )}>
          {open ? (
            <div className="flex items-center gap-2">
              <BookOpen className={isMobile ? "h-7 w-7" : "h-6 w-6"} />
              <span className={cn("font-semibold", isMobile ? "text-lg" : "")}>RIA Lector</span>
            </div>
          ) : (
            <BookOpen className="h-6 w-6 mx-auto" />
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpen(!open)} 
            className={cn(!open && "mx-auto", isMobile && "h-10 w-10")}
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {open && (
          <div className={cn("py-2", isMobile ? "px-4" : "px-4")}>
            <div className="relative">
              <Search className={cn("absolute left-2 text-slate-500", isMobile ? "top-3 h-5 w-5" : "top-2.5 h-4 w-4")} />
              <Input
                placeholder="Buscar sesiones..."
                className={cn(isMobile ? "pl-9 h-12 text-base" : "pl-8")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          {open && searchQuery && (
            <div className="px-4 py-2">
              <h3 className="text-sm font-medium mb-2">Resultados de búsqueda</h3>
              {filteredSessions.length > 0 ? (
                <div className="space-y-1">
                  {filteredSessions.map((session) => (
                    <Button
                      key={session.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left text-sm",
                        activeSession === session.id && "bg-slate-100 dark:bg-slate-800",
                      )}
                      onClick={() => handleSessionClick(session.id)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span className="truncate">{session.title}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No se encontraron resultados</p>
              )}
              <Separator className="my-2" />
            </div>
          )}

          {!searchQuery && (
            <>
              <div className={cn("py-2", open ? "px-4" : "px-2")}> 
                <Button
                  variant="outline"
                  className={cn(
                    "gap-2",
                    open ? "w-full justify-start px-4" : "mx-auto h-10 w-10 p-0 justify-center"
                  )}

                  onClick={() => {
                    setDashboardTab("new")
                    setActiveView("dashboard")
                  }}

                >
                  <Plus className="h-4 w-4" />
                  {open && <span>Nueva sesión</span>}
                </Button>
              </div>

              {open && (
                <div className="px-4 pt-4 pb-2">                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Proyectos</h3>
                    <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-5 flex items-center justify-center">
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crear nueva carpeta</DialogTitle>
                          <DialogDescription>Ingresa un nombre para tu nueva carpeta de proyectos.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Input
                            placeholder="Nombre de la carpeta"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateFolder}>Crear carpeta</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-1">
                    {folders.map((folder) => (
                      <div key={folder.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left text-sm pr-2"
                            onClick={() => toggleFolder(folder.id)}
                          >
                            {openFolders[folder.id] ? (
                              <FolderOpen className="mr-2 h-4 w-4" />
                            ) : (
                              <Folder className="mr-2 h-4 w-4" />
                            )}
                            <span className="truncate">{folder.name}</span>
                            <ChevronDown
                              className={cn(
                                "ml-auto h-4 w-4 transition-transform",
                                openFolders[folder.id] && "transform rotate-180",
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => handleAddProjectToFolder(folder.id)}
                          >
                            <PlusCircle className="h-3 w-3" />
                          </Button>
                        </div>

                        {openFolders[folder.id] && (
                          <div className="pl-6 space-y-1">
                            {projects
                              .filter((project) => project.folderId === folder.id)
                              .map((project) => (
                                <Button
                                  key={project.id}
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start text-left text-sm",
                                    activeProject === project.id && "bg-slate-100 dark:bg-slate-800",
                                  )}
                                  onClick={() => handleProjectClick(project.id)}
                                >
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  <span className="truncate">{project.name}</span>
                                </Button>
                              ))}
                            {projects.filter((project) => project.folderId === folder.id).length === 0 && (
                              <p className="text-xs text-slate-500 pl-2 py-1">No hay proyectos en esta carpeta</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear nuevo proyecto</DialogTitle>
                        <DialogDescription>
                          Ingresa un nombre para tu nuevo proyecto en la carpeta seleccionada.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          placeholder="Nombre del proyecto"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateProject}>Crear proyecto</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Separator className="my-2" />
                </div>
              )}

              {!open ? (
                <div className="px-2 space-y-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-full h-10"
                          onClick={() => {
                            setDashboardTab("history")
                            setActiveView("dashboard")
                          }}
                          aria-label="Historial"
                        >
                          <History className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Historial</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-full h-10"
                          onClick={() => {
                            setDashboardTab("metrics")
                            setActiveView("dashboard")
                          }}
                          aria-label="Métricas"
                        >
                          <BarChart3 className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Métricas</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-full h-10"
                          onClick={() => {
                            setDashboardTab("stats")
                            setActiveView("dashboard")
                          }}
                          aria-label="Estadísticas"
                        >
                          <Activity className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Estadísticas</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <>
                  {/* Today's sessions */}
                  {groupedSessions.today && groupedSessions.today.length > 0 && (
                    <div className="px-4 py-2">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Hoy
                      </h3>
                      <div className="space-y-1">
                        {groupedSessions.today.map((session) => (
                          <Button
                            key={session.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left text-sm",
                              activeSession === session.id && "bg-slate-100 dark:bg-slate-800",
                            )}
                            onClick={() => handleSessionClick(session.id)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span className="truncate">{session.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yesterday's sessions */}
                  {groupedSessions.yesterday && groupedSessions.yesterday.length > 0 && (
                    <div className="px-4 py-2">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Ayer
                      </h3>
                      <div className="space-y-1">
                        {groupedSessions.yesterday.map((session) => (
                          <Button
                            key={session.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left text-sm",
                              activeSession === session.id && "bg-slate-100 dark:bg-slate-800",
                            )}
                            onClick={() => handleSessionClick(session.id)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span className="truncate">{session.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last week's sessions */}
                  {groupedSessions.lastWeek && groupedSessions.lastWeek.length > 0 && (
                    <div className="px-4 py-2">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Últimos 7 días
                      </h3>
                      <div className="space-y-1">
                        {groupedSessions.lastWeek.map((session) => (
                          <Button
                            key={session.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left text-sm",
                              activeSession === session.id && "bg-slate-100 dark:bg-slate-800",
                            )}
                            onClick={() => handleSessionClick(session.id)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span className="truncate">{session.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Older sessions */}
                  {groupedSessions.older && groupedSessions.older.length > 0 && (
                    <div className="px-4 py-2">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <History className="mr-2 h-4 w-4" />
                        Anteriores
                      </h3>
                      <div className="space-y-1">
                        {groupedSessions.older.map((session) => (
                          <Button
                            key={session.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left text-sm",
                              activeSession === session.id && "bg-slate-100 dark:bg-slate-800",
                            )}
                            onClick={() => handleSessionClick(session.id)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span className="truncate">{session.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </ScrollArea>        <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {open ? (
              <>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="text-sm min-w-0 flex-1">
                    <p className="font-medium truncate">{user?.full_name || "Usuario"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <ThemeToggle />
                  <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center w-full gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleSettingsClick}
                        aria-label="Perfil"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Perfil</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ThemeToggle />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">Modo oscuro</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Cerrar sesión</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
