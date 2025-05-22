"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Rnd } from "react-rnd"
import { useWorkspaceStore } from "@/lib/store"
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
  const [isMaximized, setIsMaximized] = useState(false)
  const [prevDimensions, setPrevDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: initialY,
  })
  const windowRef = useRef<Rnd>(null)

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      removeWindow(id)
    }
  }

  const handleMaximize = () => {
    if (!isMaximized) {
      // Save current dimensions before maximizing
      if (windowRef.current) {
        const { width, height } = windowRef.current.getSelfElement().getBoundingClientRect()
        const { x, y } = windowRef.current.getDraggablePosition()
        setPrevDimensions({ width, height, x, y })
      }
      setIsMaximized(true)
    } else {
      setIsMaximized(false)
    }
  }

  const handleMinimize = () => {
    // Implement minimize functionality if needed
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

  return (
    <Rnd
      ref={windowRef}
      default={{
        x: initialX,
        y: initialY,
        width: initialWidth,
        height: initialHeight,
      }}
      minWidth={minWidth}
      minHeight={minHeight}
      bounds="parent"
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      disableDragging={isMaximized}
      size={isMaximized ? { width: "100%", height: "100%" } : undefined}
      position={isMaximized ? { x: 0, y: 0 } : undefined}
      style={{
        zIndex: activeWindow === id ? 10 : 1,
        transition: "box-shadow 0.2s ease",
      }}
      className={cn(
        "bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-800",
        activeWindow === id && "shadow-xl ring-2 ring-slate-200 dark:ring-slate-700",
        className,
      )}
    >
      <div
        className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 cursor-move"
        onDoubleClick={handleMaximize}
      >
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="flex items-center space-x-1">
          <button onClick={handleMinimize} className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700">
            <Minus className="h-3 w-3" />
          </button>
          <button onClick={handleMaximize} className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700">
            {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
          <button onClick={handleClose} className="p-1 rounded-sm hover:bg-red-100 dark:hover:bg-red-900 text-red-500">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="p-4 h-[calc(100%-40px)] overflow-auto">{children}</div>
    </Rnd>
  )
}
