"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { rsvpApi, type StatsResponse } from "@/lib/rsvpApi"
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
  userId?: string
  created_at_local?: string
  deleted?: boolean // ✅ Agregado
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
        if (!token) throw new Error("Token requerido para crear sesión")

        try {
          console.log('🎯 Creando sesión RSVP para tema:', sessionData.topic)

          // Llama a la API SIEMPRE (ahora también para texto personalizado con "__raw__:")
          const data = await rsvpApi.createRsvp({ topic: sessionData.topic }, token)

          const newSession: Session = {
            id: data.id,  // ✅ ID real del backend
            title: sessionData.title || `Sesión sobre ${sessionData.topic}`,
            topic: sessionData.topic,
            text: data.text,
            words: data.words,
            folderId: sessionData.folderId,
            type: sessionData.type,  // puede ser "generate" o "custom"
            createdAt: new Date().toISOString(),
            userId,
          }

          set((state) => ({
            sessions: [newSession, ...state.sessions],
            activeSession: data.id,
          }))

          console.log('✅ Sesión creada exitosamente:', data.id)
          return data.id
        } catch (error: any) {
          console.error("Error creating RSVP session:", error)
          if (error?.status === 401 || error?.message?.includes('401')) {
            throw new Error('Token expirado. Por favor, inicia sesión nuevamente.')
          }
          throw error
        }
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

      getSessionStats: (days: number, userId?: string) => {
        const userStats = get().userStats

        // 🚀 NUEVA LÓGICA: Usar datos del backend directamente cuando estén disponibles
        if (userStats?.overall_stats && userId) {
          const backendStats = userStats.overall_stats

          // Construir gráficos desde recent_sessions_stats del backend
          const recentSessions = userStats.recent_sessions_stats || []

          // Definir tipo para las sesiones del backend
          type BackendSession = StatsResponse['recent_sessions_stats'][0]

          // Filtrar por rango de días si es necesario
          const now = new Date()
          const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

          const filteredBackendSessions = recentSessions.filter((session: BackendSession) => {
            const sessionDate = new Date(session.created_at_local || session.created_at)
            return sessionDate >= startDate && sessionDate <= now
          })

          // Construir datos de gráficos directamente desde el backend
          const sortedSessions = filteredBackendSessions
            .sort((a: BackendSession, b: BackendSession) => new Date(a.created_at_local || a.created_at).getTime() -
              new Date(b.created_at_local || b.created_at).getTime())
            .slice(-20) // Últimas 20 sesiones para mejor visualización

          const wpmData = sortedSessions.map((session: BackendSession) => ({
            name: formatDateInLima(session.created_at_local || session.created_at),
            value: session.wpm,
            fullDate: session.created_at,
            sessionId: session.session_id,
          }))

          const scoreData = sortedSessions
            .filter((session: BackendSession) => session.quiz_taken)
            .map((session: BackendSession) => ({
              name: formatDateInLima(session.created_at_local || session.created_at),
              value: session.quiz_score,
              fullDate: session.created_at,
              sessionId: session.session_id,
            }))

          // Distribución de temas desde backend
          const topicCounts = filteredBackendSessions.reduce((acc: Record<string, number>, session: BackendSession) => {
            const topic = session.topic || "Sin categoría"
            acc[topic] = (acc[topic] || 0) + 1
            return acc
          }, {})

          const topicData = Object.entries(topicCounts)
            .map(([name, value]) => ({ name, value: value as number }))
            .sort((a, b) => (b.value as number) - (a.value as number))
            .slice(0, 8)

          // ✅ DEVOLVER DATOS DEL BACKEND CON MÍNIMO PROCESAMIENTO
          return {
            // Usar directamente los valores calculados por el backend
            avgWpm: Math.round(backendStats.average_wpm),
            avgScore: Math.round(backendStats.average_quiz_score),
            totalSessions: filteredBackendSessions.length,
            totalTime: Math.round(backendStats.total_reading_time_seconds),

            // Usar las tendencias calculadas por el backend
            wpmImprovement: Math.round(backendStats.delta_wpm_vs_previous),
            scoreImprovement: Math.round(backendStats.delta_comprehension_vs_previous),

            // Gráficos construidos desde datos reales del backend
            wpmData,
            scoreData,
            topicData,
          }
        }

        // 📊 FALLBACK: Cálculo local para compatibilidad (cuando no hay datos del backend)
        console.log('⚠️ Usando cálculo local - datos del backend no disponibles')
        const now = new Date()
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        const allSessions: Session[] = userId
          ? get().sessions.filter((s) => s.userId === userId)
          : get().sessions

        const filteredSessions: Session[] = allSessions.filter((session) => {
          const sessionDate = new Date(session.created_at_local ?? session.createdAt)
          return sessionDate >= startDate && sessionDate <= now && !!session.stats
        })

        if (filteredSessions.length === 0) {
          return {
            avgWpm: 0,
            avgScore: 0,
            totalSessions: 0,
            totalTime: 0,
            wpmImprovement: 0,
            scoreImprovement: 0,
            wpmData: [],
            scoreData: [],
            topicData: [],
          }
        }

        const totalWpm = filteredSessions.reduce((sum, s) => sum + (s.stats?.wpm || 0), 0)
        const avgWpm = Math.round(totalWpm / filteredSessions.length)

        const quizSessions = filteredSessions.filter((s) => typeof s.stats?.score === "number")
        const totalScore = quizSessions.reduce((sum, s) => sum + (s.stats?.score || 0), 0)
        const avgScore = quizSessions.length > 0 ? Math.round(totalScore / quizSessions.length) : 0

        const totalTime = filteredSessions.reduce((sum, s) => sum + (s.stats?.totalTime || 0), 0)

        const sortedSessions = [...filteredSessions].sort(
          (a, b) =>
            new Date(a.created_at_local ?? a.createdAt).getTime() -
            new Date(b.created_at_local ?? b.createdAt).getTime()
        )

        const half = Math.floor(sortedSessions.length / 2)
        const firstHalf = sortedSessions.slice(0, half)
        const secondHalf = sortedSessions.slice(half)

        const calcAvg = (arr: Session[], key: "wpm" | "score") =>
          arr.length > 0
            ? arr.reduce((sum, s) => sum + (s.stats?.[key] || 0), 0) / arr.length
            : 0

        const firstHalfWpm = calcAvg(firstHalf, "wpm")
        const secondHalfWpm = calcAvg(secondHalf, "wpm")
        const wpmImprovement = firstHalfWpm > 0
          ? Math.round(((secondHalfWpm - firstHalfWpm) / firstHalfWpm) * 100)
          : 0

        const firstHalfScore = calcAvg(firstHalf, "score")
        const secondHalfScore = calcAvg(secondHalf, "score")
        const scoreImprovement = firstHalfScore > 0
          ? Math.round(((secondHalfScore - firstHalfScore) / firstHalfScore) * 100)
          : 0

        const sortedForCharts = sortedSessions.slice(-20)

        const format = (session: Session, key: "wpm" | "score") => ({
          name: formatDateInLima(session.created_at_local ?? session.createdAt),
          value: session.stats?.[key] || 0,
          fullDate: session.createdAt,
          sessionId: session.id,
        })

        const wpmData = sortedForCharts.map((s) => format(s, "wpm"))
        const scoreData = sortedForCharts.map((s) => format(s, "score"))

        const topicCounts = filteredSessions.reduce((acc: Record<string, number>, s: Session) => {
          const topic = s.topic || "Sin categoría"
          acc[topic] = (acc[topic] || 0) + 1
          return acc
        }, {})

        const topicData = Object.entries(topicCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)

        return {
          avgWpm,
          avgScore,
          totalSessions: filteredSessions.length,
          totalTime: Math.round(totalTime / 1000),
          wpmImprovement,
          scoreImprovement,
          wpmData,
          scoreData,
          topicData,
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
                  created_at_local: apiSession.created_at_local, // ✅ Agregar campo del backend
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
                  created_at_local: apiSession.created_at_local, // ✅ Agregar campo del backend
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
