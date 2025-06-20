"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { rsvpApi, RegisterRequest, LoginRequest, User } from "@/lib/rsvpApi"

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  register: (fullName: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  // Profile and password update functions
  updateProfile: (data: { name: string; email: string }) => Promise<void>
  updatePassword: (current: string, newPassword: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      register: async (fullName, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data: RegisterRequest = { full_name: fullName, email, password }
          await rsvpApi.register(data)
          await get().login(email, password)
        } catch (err: any) {
          set({ error: err.message || "Error" })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data: LoginRequest = { username: email, password }
          const res = await rsvpApi.login(data)
          
          // CRÍTICO: Limpiar TODOS los datos del workspace antes de establecer nueva sesión
          if (typeof window !== 'undefined') {
            // Limpiar completamente el localStorage del workspace
            localStorage.removeItem('rsvp_workspace_v1')
            console.log('🧹 Workspace limpiado completamente para nueva sesión')
          }
          
          set({ token: res.access_token, isAuthenticated: true })
          await get().fetchUser()
        } catch (err: any) {
          set({ error: err.message || "Error", isAuthenticated: false, token: null })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },      fetchUser: async () => {
        const token = get().token
        if (!token) {
          console.log('🔒 No hay token, limpiando estado de autenticación')
          set({ user: null, isAuthenticated: false })
          return
        }
        
        try {
          console.log('👤 Obteniendo información del usuario...')
          const user = await rsvpApi.me(token)
          set({ user, isAuthenticated: true, error: null })
          console.log('✅ Usuario obtenido exitosamente:', user.email)
        } catch (err: any) {
          console.error('❌ Error obteniendo usuario, token probablemente expirado:', err)
          // Token inválido o expirado, limpiar todo el estado
          set({ token: null, user: null, isAuthenticated: false, error: 'Sesión expirada' })
          
          // Limpiar también el workspace storage por seguridad
          if (typeof window !== 'undefined') {
            localStorage.removeItem('rsvp_workspace_v1')
            console.log('🧹 Workspace limpiado por token expirado')
          }
        }
      },logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        // Limpiar datos del workspace al hacer logout por seguridad
        if (typeof window !== 'undefined') {
          const workspaceStorage = localStorage.getItem('rsvp_workspace_v1')
          if (workspaceStorage) {
            try {
              const parsed = JSON.parse(workspaceStorage)
              // Limpiar solo las sesiones y datos sensibles, mantener configuraciones
              parsed.state.sessions = []
              parsed.state.activeSession = null
              parsed.state.windows = []
              parsed.state.activeWindow = null
              parsed.state.userStats = null
              localStorage.setItem('rsvp_workspace_v1', JSON.stringify(parsed))
            } catch (error) {
              console.error('Error clearing workspace data:', error)
            }
          }
        }
      },updateProfile: async (data: { name: string; email: string }) => {
        const token = get().token
        if (!token) throw new Error("No token available")
        
        set({ isLoading: true, error: null })
        try {
          const updatedUser = await rsvpApi.updateProfile(
            { full_name: data.name, email: data.email }, 
            token
          )
          set({ user: updatedUser })
        } catch (err: any) {
          set({ error: err.message || "Error updating profile" })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      updatePassword: async (currentPassword: string, newPassword: string) => {
        const token = get().token
        if (!token) throw new Error("No token available")
        
        set({ isLoading: true, error: null })
        try {
          await rsvpApi.updatePassword(
            { current_password: currentPassword, new_password: newPassword }, 
            token
          )
        } catch (err: any) {
          set({ error: err.message || "Error updating password" })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

