"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Rnd } from "react-rnd"
import { useWorkspaceStore } from "@/lib/store"
import { useBreakpoint } from "@/hooks/use-breakpoint"
import { X, Minus, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WindowFrameProps {
  id: string
  title: string
  children: React.ReactNode
  initialWidth?: number
  initialHeight?: number
  initialX?: number
  initialY?: number
  minWidth?: number
  minHeight?: number
  className?: string
  onClose?: () => void
}

export default function WindowFrame({
  id,
  title,
  children,
  initialWidth = 500,
  initialHeight = 400,
  initialX = 50,
  initialY = 50,
  minWidth = 300,
  minHeight = 200,
  className,
  onClose,
}: WindowFrameProps) {
  const { activeWindow, setActiveWindow, updateWindowPosition, removeWindow } = useWorkspaceStore()
  const { isMobile, isTablet, windowSize } = useBreakpoint()
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false)
  const [prevDimensions, setPrevDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: initialY,
  })
  const windowRef = useRef<Rnd>(null)

  // Auto-maximize en mobile
  useEffect(() => {
    if (isMobile && !isMobileFullscreen) {
      setIsMobileFullscreen(true)
      setIsMaximized(true)
    } else if (!isMobile && isMobileFullscreen) {
      setIsMobileFullscreen(false)
      setIsMaximized(false)
    }
  }, [isMobile, isMobileFullscreen])

  // Ajustar dimensiones responsivas
  const getResponsiveDimensions = () => {
    if (isMobile) {
      return {
        width: windowSize.width,
        height: windowSize.height,
        x: 0,
        y: 0,
      }
    }
    
    if (isTablet) {
      const adjustedWidth = Math.min(initialWidth, windowSize.width * 0.9)
      const adjustedHeight = Math.min(initialHeight, windowSize.height * 0.9)
      return {
        width: adjustedWidth,
        height: adjustedHeight,
        x: Math.max(0, (windowSize.width - adjustedWidth) / 2),
        y: Math.max(0, (windowSize.height - adjustedHeight) / 2),
      }
    }

    return {
      width: initialWidth,
      height: initialHeight,
      x: initialX,
      y: initialY,
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      removeWindow(id)
    }
  }

  const handleMaximize = () => {
    // En mobile siempre está maximizado
    if (isMobile) return

    if (!isMaximized) {
      // Save current dimensions before maximizing
      if (windowRef.current) {
        const element = windowRef.current.getSelfElement()
        if (element) {
          const { width, height } = element.getBoundingClientRect()
          const { x, y } = windowRef.current.getDraggablePosition()
          setPrevDimensions({ width, height, x, y })
        }
      }
      setIsMaximized(true)
    } else {
      setIsMaximized(false)
    }
  }

  const handleMinimize = () => {
    // En mobile no se puede minimizar
    if (isMobile) return
    console.log("Minimize window", id)
  }

  const handleDragStop = (_e: any, d: { x: number; y: number }) => {
    updateWindowPosition(id, d.x, d.y)
  }

  const handleResizeStop = (_e: any, _direction: any, ref: any, _delta: any, position: { x: number; y: number }) => {
    updateWindowPosition(
      id,
      position.x,
      position.y,
      Number.parseInt(ref.style.width),
      Number.parseInt(ref.style.height),
    )
  }

  useEffect(() => {
    const handleClick = () => {
      setActiveWindow(id)
    }

    const element = windowRef.current?.getSelfElement()
    if (element) {
      element.addEventListener("mousedown", handleClick)
      return () => {
        element.removeEventListener("mousedown", handleClick)
      }
    }
  }, [id, setActiveWindow])

  const responsiveDimensions = getResponsiveDimensions()

  return (
    <Rnd
      ref={windowRef}
      default={responsiveDimensions}
      minWidth={isMobile ? windowSize.width : minWidth}
      minHeight={isMobile ? windowSize.height : minHeight}
      bounds="parent"
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      disableDragging={isMaximized || isMobile}
      enableResizing={!isMobile}
      size={isMaximized || isMobile ? 
        { width: "100%", height: "100%" } : 
        undefined
      }
      position={isMaximized || isMobile ? 
        { x: 0, y: 0 } : 
        undefined
      }
      style={{
        zIndex: activeWindow === id ? 10 : 1,
        transition: "box-shadow 0.2s ease",
      }}
      className={cn(
        "bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800",
        isMobile ? "rounded-none" : "rounded-lg shadow-lg",
        activeWindow === id && !isMobile && "shadow-xl ring-2 ring-slate-200 dark:ring-slate-700",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between bg-slate-100 dark:bg-slate-800",
          isMobile ? "p-3 cursor-default" : "p-2 cursor-move"
        )}
        onDoubleClick={!isMobile ? handleMaximize : undefined}
      >
        <div className={cn(
          "font-medium truncate",
          isMobile ? "text-base" : "text-sm"
        )}>
          {title}
        </div>
        <div className="flex items-center space-x-1">
          {!isMobile && (
            <button 
              onClick={handleMinimize} 
              className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Minus className="h-3 w-3" />
            </button>
          )}
          {!isMobile && (
            <button 
              onClick={handleMaximize} 
              className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
          )}
          <button 
            onClick={handleClose} 
            className={cn(
              "rounded-sm hover:bg-red-100 dark:hover:bg-red-900 text-red-500",
              isMobile ? "p-2" : "p-1"
            )}
          >
            <X className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
          </button>
        </div>
      </div>
      <div className={cn(
        "overflow-auto",
        isMobile ? "p-4 h-[calc(100vh-60px)]" : "p-4 h-[calc(100%-40px)]"
      )}>
        {children}
      </div>
    </Rnd>
  )
}
