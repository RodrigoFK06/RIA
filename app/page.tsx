"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import Workspace from "@/components/workspace"
import { useWorkspaceStore } from "@/lib/store"
import { Toaster } from "@/components/toaster"

export default function Home() {
  const [activeView, setActiveView] = useState<"dashboard" | "workspace">("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { activeProject } = useWorkspaceStore()

  return (
    <main className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} setActiveView={setActiveView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === "dashboard" ? (
          <Dashboard setActiveView={setActiveView} />
        ) : (
          <Workspace sidebarOpen={sidebarOpen} />
        )}
      </div>

      <Toaster />
    </main>
  )
}
