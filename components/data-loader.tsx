"use client"

import { useEffect, useRef } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useWorkspaceStore } from "@/lib/store"

export default function DataLoader() {
  const { token, isAuthenticated, user, isLoading } = useAuthStore()
  const { loadStatsFromAPI, clearUserData } = useWorkspaceStore()
  const previousUserId = useRef<string | null>(null)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    // No hacer nada si estamos en proceso de carga o no hay autenticación completa
    if (isLoading || !isAuthenticated || !token || !user?.id) {
      return
    }

    // Detectar cambio de usuario y limpiar datos del usuario anterior
    if (user.id && previousUserId.current && previousUserId.current !== user.id) {
      console.log('🔄 Usuario cambió de', previousUserId.current, 'a', user.id, '- limpiando datos del usuario anterior')
      clearUserData()
    }
    
    // Actualizar referencia del usuario actual
    previousUserId.current = user.id
    
    // Evitar cargas duplicadas
    if (isLoadingRef.current) {
      console.log('⏳ Ya hay una carga en progreso, saltando...')
      return
    }
    
    // Load real data when user is fully authenticated
    console.log('📊 Cargando datos para usuario autenticado:', user.id)
    isLoadingRef.current = true
    
    loadStatsFromAPI(token, user.id)
      .then(() => {
        console.log('✅ Datos cargados exitosamente para usuario:', user.id)
      })
      .catch((error) => {
        console.error('❌ Error cargando datos para usuario:', user.id, error)
      })
      .finally(() => {
        isLoadingRef.current = false
      })
  }, [isAuthenticated, token, user?.id, isLoading, loadStatsFromAPI, clearUserData])

  return null // This component doesn't render anything
}
