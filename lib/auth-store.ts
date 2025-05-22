"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string
  name: string
  email: string
  plan: "free" | "premium" | "pro"
  createdAt: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Auth actions
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: { name: string; email: string }) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

// Mock user data for demo purposes
const mockUsers = [
  {
    id: "user-1",
    name: "Usuario Demo",
    email: "demo@ejemplo.com",
    password: "password123",
    plan: "free",
    createdAt: new Date().toISOString(),
  },
]

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Find user in mock data
          const user = mockUsers.find((u) => u.email === email && u.password === password)

          if (!user) {
            throw new Error("Credenciales incorrectas")
          }

          // Remove password from user object
          const { password: _, ...userWithoutPassword } = user

          set({
            user: userWithoutPassword as User,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          })
          throw error
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Check if user already exists
          const existingUser = mockUsers.find((u) => u.email === email)
          if (existingUser) {
            throw new Error("El correo electrónico ya está en uso")
          }

          // Create new user
          const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            password,
            plan: "free",
            createdAt: new Date().toISOString(),
          }

          // Add to mock users (in a real app, this would be an API call)
          mockUsers.push(newUser)

          // Remove password from user object
          const { password: _, ...userWithoutPassword } = newUser

          set({
            user: userWithoutPassword as User,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        })
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const currentUser = get().user
          if (!currentUser) {
            throw new Error("No hay usuario autenticado")
          }

          // Update user in mock data
          const userIndex = mockUsers.findIndex((u) => u.id === currentUser.id)
          if (userIndex >= 0) {
            mockUsers[userIndex] = {
              ...mockUsers[userIndex],
              name: data.name,
              email: data.email,
            }
          }

          set({
            user: {
              ...currentUser,
              name: data.name,
              email: data.email,
            },
            isLoading: false,
          })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          })
          throw error
        }
      },

      updatePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const currentUser = get().user
          if (!currentUser) {
            throw new Error("No hay usuario autenticado")
          }

          // Find user in mock data
          const userIndex = mockUsers.findIndex((u) => u.id === currentUser.id)
          if (userIndex < 0) {
            throw new Error("Usuario no encontrado")
          }

          // Verify current password
          if (mockUsers[userIndex].password !== currentPassword) {
            throw new Error("La contraseña actual es incorrecta")
          }

          // Update password
          mockUsers[userIndex].password = newPassword

          set({ isLoading: false })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          })
          throw error
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
