"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

export interface UseIdleTimerOptions {
  timeout: number // timeout in milliseconds
  onIdle?: () => void
  events?: string[]
  immediateEvents?: string[]
  element?: Document | Element
}

export function useIdleTimer({
  timeout = 30 * 60 * 1000, // 30 minutes default
  onIdle,
  events = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ],
  immediateEvents = [],
  element = typeof document !== 'undefined' ? document : undefined,
}: UseIdleTimerOptions) {
  const { logout, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const timeoutId = useRef<NodeJS.Timeout | null>(null)
  const eventsBound = useRef(false)

  const handleIdle = useCallback(() => {
    if (isAuthenticated) {
      logout()
      router.push('/auth/login')
      if (onIdle) {
        onIdle()
      }
    }
  }, [logout, router, isAuthenticated, onIdle])

  const startTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current)
    }
    timeoutId.current = setTimeout(handleIdle, timeout)
  }, [handleIdle, timeout])

  const resetTimer = useCallback(() => {
    if (isAuthenticated) {
      startTimer()
    }
  }, [startTimer, isAuthenticated])

  const handleEvent = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (!element || !isAuthenticated) return

    if (!eventsBound.current) {
      events.forEach((event) => {
        element.addEventListener(event, handleEvent, true)
      })

      immediateEvents.forEach((event) => {
        element.addEventListener(event, handleEvent, true)
      })

      eventsBound.current = true
    }

    startTimer()

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      if (eventsBound.current) {
        events.forEach((event) => {
          element.removeEventListener(event, handleEvent, true)
        })

        immediateEvents.forEach((event) => {
          element.removeEventListener(event, handleEvent, true)
        })
        eventsBound.current = false
      }
    }
  }, [element, events, immediateEvents, handleEvent, startTimer, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated && timeoutId.current) {
      clearTimeout(timeoutId.current)
    }
  }, [isAuthenticated])

  return {
    reset: resetTimer,
    pause: () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
    },
    resume: startTimer,
  }
}
