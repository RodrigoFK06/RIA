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

  // placeholders to keep compatibility
  updateProfile?: (data: { name: string; email: string }) => Promise<void>
  updatePassword?: (current: string, newPassword: string) => Promise<void>
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
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data: LoginRequest = { username: email, password }
          const res = await rsvpApi.login(data)
          set({ token: res.access_token, isAuthenticated: true })
          await get().fetchUser()
        } catch (err: any) {
          set({ error: err.message || "Error", isAuthenticated: false, token: null })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      fetchUser: async () => {
        const token = get().token
        if (!token) return
        try {
          const user = await rsvpApi.me(token)
          set({ user, isAuthenticated: true })
        } catch (err) {
          set({ token: null, user: null, isAuthenticated: false })
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateProfile: async () => {},
      updatePassword: async () => {},
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

