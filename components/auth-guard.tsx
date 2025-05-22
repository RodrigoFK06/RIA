"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"]

    // If not authenticated and not on a public route, redirect to login
    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push("/auth/login")
    }

    // If authenticated and on an auth route, redirect to home
    if (isAuthenticated && publicRoutes.includes(pathname)) {
      router.push("/")
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}
