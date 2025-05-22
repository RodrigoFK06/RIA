"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { generateRSVPContent } from "@/lib/api"

interface Window {
  id: string
  type: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  data?: any
}

interface Session {
  id: string
  title: string
  topic: string
  text: string
  folderId: string | null
  type: "generate" | "custom"
  createdAt: string
  stats?: {
    wpm: number
    totalTime: number
    idealTime: number
    score: number
    feedback: string
  }
}

interface Project {
  id: string
  name: string
  folderId: string
  createdAt: string
}

interface Folder {
  id: string
  name: string
  createdAt: string
}

interface WorkspaceState {
  windows: Window[]
  activeWindow: string | null
  sessions: Session[]
  activeSession: string | null
  projects: Project[]
  activeProject: string | null
  folders: Folder[]

  // Window management
  addWindow: (type: string, data?: any) => string
  removeWindow: (id: string) => void
  updateWindowPosition: (id: string, x: number, y: number, width?: number, height?: number) => void
  updateWindowData: (id: string, data: any) => void
  setActiveWindow: (id: string) => void

  // Session management
  addSession: (sessionData: Omit<Session, "id" | "createdAt" | "stats">) => Promise<string>
  updateSession: (id: string, data: Partial<Session>) => void
  deleteSession: (id: string) => void
  setActiveSession: (id: string | null) => void
  loadSession: (id: string) => void

  // Project management
  addProject: (name: string, folderId: string) => string
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void

  // Folder management
  addFolder: (name: string) => string
  updateFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void

  // Stats and metrics
  getSessionStats: (days: number) => {
    avgWpm: number
    avgScore: number
    totalSessions: number
    totalTime: number
    wpmImprovement: number
    scoreImprovement: number
    wpmData: { name: string; value: number }[]
    scoreData: { name: string; value: number }[]
    topicData: { name: string; value: number }[]
  }
}

// Helper function to generate mock data for charts
const generateMockChartData = (count: number, min: number, max: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Sesión ${i + 1}`,
    value: Math.floor(Math.random() * (max - min + 1)) + min,
  }))
}

// Helper function to generate mock topic distribution data
const generateMockTopicData = () => {
  const topics = ["Historia", "Ciencia", "Tecnología", "Literatura", "Arte"]
  return topics.map((topic) => ({
    name: topic,
    value: Math.floor(Math.random() * 30) + 10,
  }))
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindow: null,
      sessions: [
        {
          id: "session-1",
          title: "Introducción a la Energía Solar",
          topic: "Energía Solar",
          text: "La energía solar es una fuente de energía renovable que se obtiene del sol...",
          folderId: "folder-1",
          type: "generate",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          stats: {
            wpm: 320,
            totalTime: 45000,
            idealTime: 30000,
            score: 85,
            feedback: "Buen rendimiento en la lectura de este tema técnico.",
          },
        },
        {
          id: "session-2",
          title: "Historia de Roma",
          topic: "Historia",
          text: "La historia de Roma comienza con la fundación de la ciudad...",
          folderId: "folder-1",
          type: "generate",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          stats: {
            wpm: 290,
            totalTime: 60000,
            idealTime: 45000,
            score: 78,
            feedback: "Buena comprensión de los eventos históricos.",
          },
        },
        {
          id: "session-3",
          title: "Inteligencia Artificial",
          topic: "Tecnología",
          text: "La inteligencia artificial es la simulación de procesos de inteligencia humana...",
          folderId: "folder-2",
          type: "generate",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          stats: {
            wpm: 350,
            totalTime: 40000,
            idealTime: 35000,
            score: 92,
            feedback: "Excelente comprensión de conceptos técnicos complejos.",
          },
        },
        {
          id: "session-4",
          title: "Literatura Contemporánea",
          topic: "Literatura",
          text: "La literatura contemporánea abarca obras escritas después de la Segunda Guerra Mundial...",
          folderId: "folder-2",
          type: "generate",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          stats: {
            wpm: 310,
            totalTime: 50000,
            idealTime: 40000,
            score: 88,
            feedback: "Buena comprensión de los movimientos literarios.",
          },
        },
        {
          id: "session-5",
          title: "Cambio Climático",
          topic: "Ciencia",
          text: "El cambio climático se refiere a cambios a largo plazo en las temperaturas y los patrones climáticos...",
          folderId: null,
          type: "generate",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
          stats: {
            wpm: 300,
            totalTime: 55000,
            idealTime: 45000,
            score: 82,
            feedback: "Buena comprensión de los conceptos científicos.",
          },
        },
      ],
      activeSession: null,
      projects: [
        {
          id: "project-1",
          name: "Ciencias Naturales",
          folderId: "folder-1",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        },
        {
          id: "project-2",
          name: "Historia Universal",
          folderId: "folder-1",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        },
        {
          id: "project-3",
          name: "Tecnología e Innovación",
          folderId: "folder-2",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        },
      ],
      activeProject: null,
      folders: [
        {
          id: "folder-1",
          name: "Educación",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        },
        {
          id: "folder-2",
          name: "Trabajo",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
        },
      ],

      addWindow: (type, data) => {
        const id = `${type}-${Date.now()}`
        const newWindow: Window = {
          id,
          type,
          position: {
            x: 50 + get().windows.length * 30,
            y: 50 + get().windows.length * 30,
            width: getDefaultWidth(type),
            height: getDefaultHeight(type),
          },
          data,
        }

        set((state) => ({
          windows: [...state.windows, newWindow],
          activeWindow: id,
        }))

        return id
      },

      removeWindow: (id) => {
        set((state) => ({
          windows: state.windows.filter((window) => window.id !== id),
          activeWindow: state.activeWindow === id ? null : state.activeWindow,
        }))
      },

      updateWindowPosition: (id, x, y, width, height) => {
        set((state) => ({
          windows: state.windows.map((window) => {
            if (window.id === id) {
              return {
                ...window,
                position: {
                  x,
                  y,
                  width: width || window.position.width,
                  height: height || window.position.height,
                },
              }
            }
            return window
          }),
        }))
      },

      updateWindowData: (id, data) => {
        set((state) => ({
          windows: state.windows.map((window) => {
            if (window.id === id) {
              return {
                ...window,
                data: {
                  ...window.data,
                  ...data,
                },
              }
            }
            return window
          }),
        }))
      },

      setActiveWindow: (id) => {
        set({ activeWindow: id })
      },

      addSession: async (sessionData) => {
        const id = `session-${Date.now()}`
        const newSession: Session = {
          id,
          ...sessionData,
          createdAt: new Date().toISOString(),
        }

        // If it's a generate type, fetch content from API
        if (sessionData.type === "generate") {
          try {
            const data = await generateRSVPContent(sessionData.topic)
            newSession.text = data.text
          } catch (error) {
            console.error("Error generating content:", error)
          }
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSession: id,
        }))

        return id
      },

      updateSession: (id, data) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === id) {
              return { ...session, ...data }
            }
            return session
          }),
        }))
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          activeSession: state.activeSession === id ? null : state.activeSession,
        }))
      },

      setActiveSession: (id) => {
        set({ activeSession: id })
      },

      loadSession: (id) => {
        const session = get().sessions.find((s) => s.id === id)
        if (!session) return

        // Clear existing windows
        set({ windows: [] })

        // Add reader window with session content
        const words = session.text.split(/\s+/).filter((word) => word.length > 0)
        get().addWindow("reader", {
          sessionId: session.id,
          text: session.text,
          words: words,
          currentWordIndex: 0,
          isPlaying: false,
        })

        // If session has stats, add stats window
        if (session.stats) {
          get().addWindow("stats", {
            sessionId: session.id,
            stats: session.stats,
            score: session.stats.score,
            text: session.text,
          })
        }
      },

      addProject: (name, folderId) => {
        const id = `project-${Date.now()}`
        const newProject: Project = {
          id,
          name,
          folderId,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          projects: [...state.projects, newProject],
          activeProject: id,
        }))

        return id
      },

      updateProject: (id, data) => {
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id === id) {
              return { ...project, ...data }
            }
            return project
          }),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          activeProject: state.activeProject === id ? null : state.activeProject,
        }))
      },

      setActiveProject: (id) => {
        set({ activeProject: id })
      },

      addFolder: (name) => {
        const id = `folder-${Date.now()}`
        const newFolder: Folder = {
          id,
          name,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          folders: [...state.folders, newFolder],
        }))

        return id
      },

      updateFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map((folder) => {
            if (folder.id === id) {
              return { ...folder, name }
            }
            return folder
          }),
        }))
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          // Also update projects that were in this folder
          projects: state.projects.map((project) => {
            if (project.folderId === id) {
              return { ...project, folderId: null }
            }
            return project
          }),
          // Also update sessions that were in this folder
          sessions: state.sessions.map((session) => {
            if (session.folderId === id) {
              return { ...session, folderId: null }
            }
            return session
          }),
        }))
      },

      getSessionStats: (days) => {
        const now = new Date()
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        // Filter sessions within the time range
        const filteredSessions = get().sessions.filter((session) => {
          const sessionDate = new Date(session.createdAt)
          return sessionDate >= startDate && sessionDate <= now && session.stats
        })

        // Calculate averages
        const totalWpm = filteredSessions.reduce((sum, session) => sum + (session.stats?.wpm || 0), 0)
        const totalScore = filteredSessions.reduce((sum, session) => sum + (session.stats?.score || 0), 0)
        const totalTime = filteredSessions.reduce((sum, session) => sum + (session.stats?.totalTime || 0), 0)

        const avgWpm = filteredSessions.length > 0 ? Math.round(totalWpm / filteredSessions.length) : 0
        const avgScore = filteredSessions.length > 0 ? Math.round(totalScore / filteredSessions.length) : 0

        // Generate mock improvement data
        const wpmImprovement = Math.floor(Math.random() * 15) + 5
        const scoreImprovement = Math.floor(Math.random() * 10) + 2

        // Generate chart data
        const wpmData = generateMockChartData(10, 200, 400)
        const scoreData = generateMockChartData(10, 60, 100)
        const topicData = generateMockTopicData()

        return {
          avgWpm,
          avgScore,
          totalSessions: filteredSessions.length,
          totalTime: Math.round(totalTime / 1000), // Convert to seconds
          wpmImprovement,
          scoreImprovement,
          wpmData,
          scoreData,
          topicData,
        }
      },
    }),
    {
      name: "rsvp_workspace_v1",
    },
  ),
)

function getDefaultWidth(type: string): number {
  switch (type) {
    case "topic":
      return 500
    case "reader":
      return 600
    case "quiz":
      return 650
    case "stats":
      return 700
    case "assistant":
      return 450
    case "paragraph":
      return 700
    default:
      return 500
  }
}

function getDefaultHeight(type: string): number {
  switch (type) {
    case "topic":
      return 400
    case "reader":
      return 450
    case "quiz":
      return 550
    case "stats":
      return 600
    case "assistant":
      return 500
    case "paragraph":
      return 500
    default:
      return 400
  }
}
