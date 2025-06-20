"use client"

import { useEffect } from "react"
import { useWorkspaceStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import TopicWindow from "@/components/windows/topic-window"
import ReaderWindow from "@/components/windows/reader-window"
import QuizWindow from "@/components/windows/quiz-window"
import StatsWindow from "@/components/windows/stats-window"
import AssistantWindow from "@/components/windows/assistant-window"
import ParagraphWindow from "@/components/windows/paragraph-window"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WorkspaceProps {
  sidebarOpen: boolean
}

export default function Workspace({ sidebarOpen }: WorkspaceProps) {
  const { windows, activeWindow, activeSession, setActiveWindow, addWindow, loadSession } = useWorkspaceStore()
  const { token } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    if (activeSession) {
      loadSession(activeSession, token)
    }
  }, [activeSession, loadSession, token])

  const handleAddWindow = (type: string) => {
    addWindow(type)
    toast({
      title: "Ventana añadida",
      description: `Se ha añadido una nueva ventana de tipo ${type}`,
    })
  }

  return (
    <div className="relative w-full h-full overflow-hidden p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWindow("topic")}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" /> Tema
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWindow("assistant")}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" /> Asistente
          </Button>
        </div>
      </div>

      <div className="w-full h-full relative">
        {windows.map((window) => {
          switch (window.type) {
            case "topic":
              return <TopicWindow key={window.id} windowData={window} />
            case "reader":
              return <ReaderWindow key={window.id} windowData={window} />
            case "quiz":
              return <QuizWindow key={window.id} windowData={window} />
            case "stats":
              return <StatsWindow key={window.id} windowData={window} />
            case "assistant":
              return <AssistantWindow key={window.id} windowData={window} />
            case "paragraph":
              return <ParagraphWindow key={window.id} windowData={window} />
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}
