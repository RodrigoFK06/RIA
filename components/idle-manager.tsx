"use client"

import { useEffect, useState } from 'react'
import { useIdleTimer } from '@/hooks/use-idle-timer'
import { useAuthStore } from '@/lib/auth-store'
import { useToast } from '@/hooks/use-toast'

// Configuración de timeouts (en minutos)
export const IDLE_TIMEOUTS = {
  SHORT: 15 * 60 * 1000,  // 15 minutos
  MEDIUM: 30 * 60 * 1000, // 30 minutos
  LONG: 60 * 60 * 1000,   // 60 minutos
} as const

export default function IdleManager() {
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [warningShown, setWarningShown] = useState(false)

  // Obtener configuración del localStorage o usar valor por defecto
  const getIdleTimeout = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('idle_timeout')
      return saved ? parseInt(saved) : IDLE_TIMEOUTS.MEDIUM
    }
    return IDLE_TIMEOUTS.MEDIUM
  }

  const [idleTimeout, setIdleTimeout] = useState(getIdleTimeout())

  const showWarning = () => {
    if (!warningShown) {
      setWarningShown(true)
      toast({
        title: "Sesión por expirar",
        description: "Tu sesión expirará en 2 minutos por inactividad.",
        variant: "destructive",
        duration: 10000,
      })
    }
  }

  const onIdle = () => {
    toast({
      title: "Sesión expirada",
      description: "Has sido desconectado por inactividad.",
      variant: "destructive",
      duration: 5000,
    })
  }

  // Hook para manejar inactividad
  const { reset } = useIdleTimer({
    timeout: idleTimeout,
    onIdle,
  })

  // Hook para mostrar advertencia 2 minutos antes del logout
  useIdleTimer({
    timeout: Math.max(idleTimeout - 2 * 60 * 1000, idleTimeout * 0.8), // 2 min antes o 80% del tiempo
    onIdle: showWarning,
  })

  // Resetear warning cuando hay actividad
  useEffect(() => {
    const resetWarning = () => setWarningShown(false)
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, resetWarning)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetWarning)
      })
    }
  }, [])

  // Actualizar timeout cuando cambie en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setIdleTimeout(getIdleTimeout())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Solo renderizar si el usuario está autenticado
  if (!isAuthenticated) {
    return null
  }

  return null // Este componente no renderiza nada visible
}

// Función helper para actualizar el timeout de inactividad
export const updateIdleTimeout = (timeout: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('idle_timeout', timeout.toString())
    window.dispatchEvent(new Event('storage'))
  }
}
