"use client"

import { useEffect, useState, useRef } from "react"
import { useWorkspaceStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"

/**
 * Hook para detectar actualizaciones en las métricas de sesiones
 * y forzar re-renderizado del componente cuando cambian las estadísticas
 */
export function useMetricsUpdates() {
  const { getUserSessions } = useWorkspaceStore()
  const { user, isAuthenticated } = useAuthStore()
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const previousSessionsCount = useRef(0)
  const previousStatsCount = useRef(0)

  // Get current user sessions only if authenticated
  const userSessions = isAuthenticated && user?.id ? getUserSessions(user.id) : []
  
  // Count sessions with stats
  const sessionsWithStats = userSessions.filter(session => session.stats)

  useEffect(() => {
    // No hacer nada si no hay usuario autenticado
    if (!isAuthenticated || !user?.id) {
      return
    }

    const currentSessionsCount = userSessions.length
    const currentStatsCount = sessionsWithStats.length
    
    // Check if there are new sessions or new stats
    const hasNewSessions = currentSessionsCount > previousSessionsCount.current
    const hasNewStats = currentStatsCount > previousStatsCount.current

    if (hasNewSessions || hasNewStats) {
      console.log('📊 Métricas actualizadas:', {
        userId: user.id,
        totalSessions: currentSessionsCount,
        sessionsWithStats: currentStatsCount,
        newSessions: hasNewSessions,
        newStats: hasNewStats
      })
      
      setLastUpdate(Date.now())
      previousSessionsCount.current = currentSessionsCount
      previousStatsCount.current = currentStatsCount
    }
  }, [isAuthenticated, user?.id, userSessions.length, sessionsWithStats.length])

  return {
    lastUpdate,
    totalSessions: userSessions.length,
    sessionsWithStats: sessionsWithStats.length,
    hasData: sessionsWithStats.length > 0
  }
}
