"use client"

import { useState, useEffect } from "react"

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('lg')
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })

      if (width >= BREAKPOINTS['2xl']) {
        setCurrentBreakpoint('2xl')
      } else if (width >= BREAKPOINTS.xl) {
        setCurrentBreakpoint('xl')
      } else if (width >= BREAKPOINTS.lg) {
        setCurrentBreakpoint('lg')
      } else if (width >= BREAKPOINTS.md) {
        setCurrentBreakpoint('md')
      } else if (width >= BREAKPOINTS.sm) {
        setCurrentBreakpoint('sm')
      } else {
        setCurrentBreakpoint('xs')
      }
    }

    // Set initial values
    updateBreakpoint()

    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  const isAbove = (breakpoint: BreakpointKey) => {
    return windowSize.width >= BREAKPOINTS[breakpoint]
  }

  const isBelow = (breakpoint: BreakpointKey) => {
    return windowSize.width < BREAKPOINTS[breakpoint]
  }

  const isMobile = isBelow('md')
  const isTablet = isAbove('md') && isBelow('lg')
  const isDesktop = isAbove('lg')
  return {
    currentBreakpoint,
    windowSize,
    isAbove,
    isBelow,
    isMobile,
    isTablet,
    isDesktop,
  }
}

export default useBreakpoint
