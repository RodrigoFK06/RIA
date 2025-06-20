"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, token, fetchUser, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"]
    const initializeAuth = async () => {
      // Si tenemos token pero no estamos autenticados, intentar obtener usuario
      if (token && !isAuthenticated && !isLoading) {
        console.log('🔄 Token encontrado, obteniendo información del usuario...')
        try {
          await fetchUser()
        } catch (error) {
          console.error('❌ Error al obtener usuario, token inválido:', error)
          // El token es inválido, el fetchUser ya limpiará el estado
        }
      }
      
      setIsInitialized(true)
    }

    initializeAuth()
  }, [token, isAuthenticated, isLoading, fetchUser])

  // Esperar a que la autenticación se inicialice antes de hacer redirects
  useEffect(() => {
    if (!isInitialized) return

    const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"]

    // Redirect to login if not authenticated and not in public route
    if (!token && !publicRoutes.includes(pathname)) {
      console.log('🔒 No hay token, redirigiendo a login')
      router.push("/auth/login")
      return
    }

    // Redirect to home if authenticated and in public route
    if (isAuthenticated && publicRoutes.includes(pathname)) {
      console.log('✅ Usuario autenticado, redirigiendo a home')
      router.push("/")
      return
    }
  }, [isAuthenticated, pathname, router, token, isInitialized])

  // Mostrar loading mientras se inicializa la autenticación
  if (!isInitialized || (token && !isAuthenticated && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{children}</>
}
