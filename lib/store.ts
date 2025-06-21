"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { rsvpApi } from "@/lib/rsvpApi"
import { formatDateInLima } from "@/lib/utils"

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
  words?: string[]
  folderId: string | null
  type: "generate" | "custom"
  createdAt: string
  userId?: string // Agregar userId para filtrado de seguridad
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
  folderId: string | null  // Allow null
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
  addSession: (sessionData: Omit<Session, "id" | "createdAt" | "stats">, token?: string, userId?: string) => Promise<string>
  updateSession: (id: string, data: Partial<Session>) => void
  updateSessionStats: (id: string, stats: Session['stats']) => void
  deleteSession: (id: string) => void
  deleteSessionById: (id: string, token: string) => Promise<void>
  setActiveSession: (id: string | null) => void
  loadSession: (id: string, token?: string) => Promise<void>

  // Security: Filter sessions by user
  getUserSessions: (userId: string) => Session[]
  clearUserData: () => void

  // Project management
  addProject: (name: string, folderId: string | null) => string
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void

  // Folder management
  addFolder: (name: string) => string
  updateFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void

  // Stats and metrics
  userStats: any | null
  isLoadingStats: boolean
  getSessionStats: (days: number, userId?: string) => {
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
  
  // Load real stats from API
  loadStatsFromAPI: (token: string, userId?: string) => Promise<void>
  
  // Get stats for history/dashboard view
  getStatsHistory: () => any | null
  
  // Refresh stats manually
  refreshStats: (token: string, userId?: string) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindow: null,
      sessions: [], // Iniciar sin datos dummy
      activeSession: null,
      projects: [], // Iniciar sin datos dummy
      activeProject: null,
      folders: [], // Iniciar sin datos dummy
      userStats: null,
      isLoadingStats: false,

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

      addSession: async (sessionData, token, userId) => {
        // If it's a generate type, fetch content from API
        if (sessionData.type === "generate" && token) {
          try {
            console.log('🎯 Creando sesión RSVP para tema:', sessionData.topic)
            // Use the real API to create RSVP session
            const data = await rsvpApi.createRsvp({ topic: sessionData.topic }, token)
            const newSession: Session = {
              id: data.id, // Use real backend ID
              title: sessionData.title || `Sesión sobre ${sessionData.topic}`,
              topic: sessionData.topic,
              text: data.text,
              words: data.words,
              folderId: sessionData.folderId,
              type: "generate",
              createdAt: new Date().toISOString(),
              userId: userId, // Asignar userId para filtrado de seguridad
            }

            set((state) => ({
              sessions: [newSession, ...state.sessions],
              activeSession: data.id,
            }))

            console.log('✅ Sesión RSVP creada exitosamente:', data.id)
            return data.id
          } catch (error: any) {
            console.error("Error creating RSVP session:", error)
            
            // Si es un error de autenticación (401), el token probablemente expiró
            if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
              console.log('🔒 Token expirado detectado en addSession')
              // Lanzar error específico para que el componente lo maneje
              throw new Error('Token expirado. Por favor, inicia sesión nuevamente.')
            }
            
            throw error
          }
        } else if (sessionData.type === "custom") {
          // For custom text, create session without API call
          const id = `custom-${Date.now()}`
          const newSession: Session = {
            id,
            ...sessionData,
            words: sessionData.text.split(/\s+/).filter(word => word.length > 0),
            createdAt: new Date().toISOString(),
            userId: userId, // Asignar userId para filtrado de seguridad
          }

          set((state) => ({
            sessions: [newSession, ...state.sessions],
            activeSession: id,
          }))

          console.log('✅ Sesión personalizada creada:', id)
          return id
        }

        throw new Error("Token required for generate type sessions")
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

      updateSessionStats: (id, stats) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === id) {
              return { ...session, stats }
            }
            return session
          }),
        }))
        
        // Trigger a stats refresh for real-time updates
        console.log(`📊 Estadísticas actualizadas para sesión ${id}:`, stats)
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          activeSession: state.activeSession === id ? null : state.activeSession,
        }))
      },

      deleteSessionById: async (id, token) => {
        try {
          await rsvpApi.deleteRsvp(id, token)
          set((state) => ({
            sessions: state.sessions.filter((session) => session.id !== id),
            activeSession: state.activeSession === id ? null : state.activeSession,
          }))
          console.log('✅ Sesión eliminada del servidor y estado:', id)
        } catch (error) {
          console.error('Error deleting session:', error)
          throw error
        }
      },

      setActiveSession: (id) => {
        set({ activeSession: id })
      },

      loadSession: async (id, token) => {
        let session = get().sessions.find((s) => s.id === id)

        if (token) {
          try {
            const apiSession = await rsvpApi.getRsvp(id, token)
            if (apiSession) {
              const updated: Session = {
                id: apiSession.id,
                title: session?.title || apiSession.topic || `Sesión de lectura (${formatDateInLima(apiSession.created_at || new Date().toISOString())})`,
                topic: apiSession.topic || session?.topic || 'Lectura',
                text: apiSession.text,
                words: apiSession.words,
                folderId: session?.folderId || null,
                type: 'generate',
                createdAt: apiSession.created_at || session?.createdAt || new Date().toISOString(),
                userId: session?.userId,
                stats: {
                  wpm: apiSession.wpm || session?.stats?.wpm || 0,
                  totalTime: (apiSession.reading_time_seconds || 0) * 1000,
                  idealTime: (apiSession.ai_estimated_ideal_reading_time_seconds || 0) * 1000,
                  score: apiSession.quiz_score || session?.stats?.score || 0,
                  feedback: `Dificultad: ${apiSession.ai_text_difficulty || ''}`,
                },
              }

              set((state) => ({
                sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
              }))

              session = updated
            }
          } catch (err) {
            console.error('Error fetching session details:', err)
          }
        }

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

      getSessionStats: (days, userId) => {
        const now = new Date()
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        // CORREGIDO: Usar sesiones filtradas por usuario si se proporciona userId
        let allSessions = get().sessions
        if (userId) {
          allSessions = allSessions.filter(session => session.userId === userId)
        }

        // Filter sessions within the time range
        const filteredSessions = allSessions.filter((session) => {
          const sessionDate = new Date(session.createdAt)
          return sessionDate >= startDate && sessionDate <= now && session.stats
        })

        // Calculate averages
        const totalWpm = filteredSessions.reduce((sum, session) => sum + (session.stats?.wpm || 0), 0)
        const totalScore = filteredSessions.reduce((sum, session) => sum + (session.stats?.score || 0), 0)
        const totalTime = filteredSessions.reduce((sum, session) => sum + (session.stats?.totalTime || 0), 0)

        const avgWpm = filteredSessions.length > 0 ? Math.round(totalWpm / filteredSessions.length) : 0
        const avgScore = filteredSessions.length > 0 ? Math.round(totalScore / filteredSessions.length) : 0

        // Calculate improvement based on actual data
        const sortedSessions = filteredSessions.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        
        const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2))
        const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2))
        
        const firstHalfAvgWpm = firstHalf.length > 0 ? 
          firstHalf.reduce((sum, s) => sum + (s.stats?.wpm || 0), 0) / firstHalf.length : 0
        const secondHalfAvgWpm = secondHalf.length > 0 ? 
          secondHalf.reduce((sum, s) => sum + (s.stats?.wpm || 0), 0) / secondHalf.length : 0
          
        const firstHalfAvgScore = firstHalf.length > 0 ? 
          firstHalf.reduce((sum, s) => sum + (s.stats?.score || 0), 0) / firstHalf.length : 0
        const secondHalfAvgScore = secondHalf.length > 0 ? 
          secondHalf.reduce((sum, s) => sum + (s.stats?.score || 0), 0) / secondHalf.length : 0

        const wpmImprovement = firstHalfAvgWpm > 0 ? Math.round(((secondHalfAvgWpm - firstHalfAvgWpm) / firstHalfAvgWpm) * 100) : 0
        const scoreImprovement = firstHalfAvgScore > 0 ? Math.round(((secondHalfAvgScore - firstHalfAvgScore) / firstHalfAvgScore) * 100) : 0

        // Generate chart data from real sessions with better temporal information
        const sortedSessionsForCharts = filteredSessions
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(-20) // Last 20 sessions for better chart readability

        const wpmData = sortedSessionsForCharts.map((session, index) => ({
          name: formatDateInLima(session.createdAt),
          value: session.stats?.wpm || 0,
          fullDate: session.createdAt,
          sessionId: session.id
        }))

        const scoreData = sortedSessionsForCharts.map((session, index) => ({
          name: formatDateInLima(session.createdAt),
          value: session.stats?.score || 0,
          fullDate: session.createdAt,
          sessionId: session.id
        }))

        // Topic distribution from real data with better sorting
        const topicCounts = filteredSessions.reduce((acc, session) => {
          const topic = session.topic || "Sin categoría"
          acc[topic] = (acc[topic] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const topicData = Object.entries(topicCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value) // Sort by frequency
          .slice(0, 8) // Top 8 topics for better visualization

        return {
          avgWpm,
          avgScore,
          totalSessions: filteredSessions.length,
          totalTime: Math.round(totalTime / 1000), // Convert to seconds
          wpmImprovement,
          scoreImprovement,
          wpmData: wpmData.length > 0 ? wpmData : [],
          scoreData: scoreData.length > 0 ? scoreData : [],
          topicData: topicData.length > 0 ? topicData : [],
        }
      },

      loadStatsFromAPI: async (token: string, userId?: string) => {
        console.log('🔄 Cargando estadísticas desde API para usuario:', userId)
        set({ isLoadingStats: true })
        try {
          const statsData = await rsvpApi.getStats(token)
          set({ userStats: statsData, isLoadingStats: false })

          // If a userId is provided, sync their sessions from the API
          if (userId) {
            if (statsData.recent_sessions_stats) {
              // Map API sessions, preservando datos locales cuando existan
              const apiSessions: Session[] = statsData.recent_sessions_stats.map((apiSession) => {
                const existingSession = get().sessions.find(s => s.id === apiSession.session_id)

                const text = existingSession?.text && existingSession.text.length > (apiSession.text_snippet?.length || 0)
                  ? existingSession.text
                  : (apiSession.text_snippet || "")

                const words = existingSession?.words

                const topic = apiSession.topic || existingSession?.topic || "Lectura general"

                const title =
                  apiSession.topic?.trim()
                    ? apiSession.topic
                    : existingSession?.title || `Sesión de lectura (${formatDateInLima(apiSession.created_at)})`

                return {
                  id: apiSession.session_id,

                  title,

                  topic,
                  text,
                  words,
                  folderId: existingSession?.folderId || null,
                  type: "generate" as const,
                  createdAt: apiSession.created_at,
                  userId: userId,
                  stats: {
                    wpm: apiSession.wpm,
                    totalTime: apiSession.reading_time_seconds * 1000,
                    idealTime: apiSession.ai_estimated_ideal_reading_time_seconds * 1000,
                    score: apiSession.quiz_score,
                    feedback: `Dificultad: ${apiSession.ai_text_difficulty}`,
                  },
                }
              })

              // Get sessions belonging to other users to keep them in the store
              const otherUserSessions = get().sessions.filter(s => s.userId !== userId)

              // The new state is the other users' sessions plus the updated sessions for the current user
              const finalSessions = [...otherUserSessions, ...apiSessions]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              set({ sessions: finalSessions })
              console.log(`✅ Cargadas y sincronizadas ${apiSessions.length} sesiones desde API para usuario ${userId}`)
            } else {
              // If API returns no sessions, clear only the current user's sessions
              const otherUserSessions = get().sessions.filter(s => s.userId !== userId)
              set({ sessions: otherUserSessions })
              console.log(`ℹ️ No hay sesiones en la API para ${userId}, limpiando sus sesiones locales.`)
            }
          }
        } catch (error: any) {
          console.error("Error loading stats from API:", error)
          set({ isLoadingStats: false })
          
          if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            console.log('🔒 Token expirado detectado en loadStatsFromAPI, limpiando estado')
          }
        }
      },

      getStatsHistory: () => {
        const state = get()
        return state.userStats
      },

      refreshStats: async (token: string, userId?: string) => {
        set({ isLoadingStats: true })
        try {
          console.log('🔄 Refrescando estadísticas para usuario:', userId)
          const statsData = await rsvpApi.getStats(token)
          set({ userStats: statsData, isLoadingStats: false })
          
          if (userId) {
            if (statsData.recent_sessions_stats) {
              const sessionsMap = new Map(get().sessions.map(s => [s.id, s]));

              statsData.recent_sessions_stats.forEach(apiSession => {
                const existingSession = sessionsMap.get(apiSession.session_id);

                const text = existingSession?.text && existingSession.text.length > (apiSession.text_snippet?.length || 0)
                  ? existingSession.text
                  : (apiSession.text_snippet || "");

                const words = existingSession?.words;

                const topic = apiSession.topic || existingSession?.topic || "Lectura general";

                const title =
                  apiSession.topic?.trim()
                    ? apiSession.topic
                    : existingSession?.title || `Sesión de lectura (${formatDateInLima(apiSession.created_at)})`;

                const sessionData: Session = {
                  id: apiSession.session_id,

                  title,
                  topic,
                  text,
                  words,
                  folderId: existingSession?.folderId || null,
                  type: "generate" as const,
                  createdAt: apiSession.created_at,
                  userId: userId,
                  stats: {
                    wpm: apiSession.wpm,
                    totalTime: apiSession.reading_time_seconds * 1000,
                    idealTime: apiSession.ai_estimated_ideal_reading_time_seconds * 1000,
                    score: apiSession.quiz_score,
                    feedback: `Dificultad: ${apiSession.ai_text_difficulty}`,
                  },
                };
                sessionsMap.set(apiSession.session_id, sessionData);
              });

              const finalSessions = Array.from(sessionsMap.values())
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              set({ sessions: finalSessions });
              console.log(`✅ Refrescadas y sincronizadas ${statsData.recent_sessions_stats.length} sesiones. Total ahora: ${finalSessions.length}`);
            } else {
              console.log('ℹ️ No hay sesiones en la API durante refresh, no se realizarán cambios en las sesiones.');
            }
          }
        } catch (error: any) {
          console.error("Error refreshing stats:", error)
          set({ isLoadingStats: false })
          
          if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            console.log('🔒 Token expirado detectado en refreshStats, limpiando estado')
          }
        }
      },

      // FUNCIONES DE SEGURIDAD: Filtrado por usuario
      getUserSessions: (userId: string) => {
        return get().sessions.filter(session => session.userId === userId)
      },

      clearUserData: () => {
        console.log('🧹 Limpiando TODOS los datos del workspace')
        set({
          // Limpiar sesiones y contenido relacionado
          sessions: [],
          activeSession: null,
          
          // Limpiar ventanas y estado visual
          windows: [],
          activeWindow: null,
          
          // Limpiar estadísticas y métricas
          userStats: null,
          isLoadingStats: false,
          
          // Limpiar proyectos y estructura organizacional
          projects: [],
          activeProject: null,
          folders: [],
        })
        console.log('✅ Workspace completamente limpio')
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
      return 420  // Reducido de 500
    case "reader":
      return 480  // Reducido de 600
    case "quiz":
      return 520  // Reducido de 650
    case "stats":
      return 550  // Reducido de 700
    case "assistant":
      return 400  // Reducido de 450
    case "paragraph":
      return 550  // Reducido de 700
    default:
      return 420  // Reducido de 500
  }
}

function getDefaultHeight(type: string): number {
  switch (type) {
    case "topic":
      return 350  // Reducido de 400
    case "reader":
      return 400  // Reducido de 450
    case "quiz":
      return 480  // Reducido de 550
    case "stats":
      return 520  // Reducido de 600
    case "assistant":
      return 450  // Reducido de 500
    case "paragraph":
      return 450  // Reducido de 500
    default:
      return 350  // Reducido de 400
  }
}
