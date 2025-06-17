"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  registerUser,
  loginUser,
  fetchCurrentUser,
  RegisterRequest,
} from "@/lib/rsvpApi"

import type { User } from "@/lib/rsvpApi"

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  register: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      register: async (name, email, password) => {
        const data: RegisterRequest = {
          full_name: name,
          email,
          password,
        }
        const user = await registerUser(data)
        set({ user, isAuthenticated: true })
      },

      login: async (email, password) => {
        const { access_token } = await loginUser({ username: email, password })
        set({ token: access_token, isAuthenticated: true })
        const user = await fetchCurrentUser(access_token)
        set({ user })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },

      fetchUser: async () => {
        const token = get().token
        if (!token) return
        const user = await fetchCurrentUser(token)
        set({ user, isAuthenticated: true })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

