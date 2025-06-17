"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, token, fetchUser } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"]

    if (token && !isAuthenticated) {
      fetchUser()
    }

    if (!token && !publicRoutes.includes(pathname)) {
      router.push("/auth/login")
    }

    if (isAuthenticated && publicRoutes.includes(pathname)) {
      router.push("/")
    }
  }, [isAuthenticated, pathname, router, token, fetchUser])

  return <>{children}</>
}
