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
  const [dashboardTab, setDashboardTab] = useState("new")
  const { activeProject } = useWorkspaceStore()

  return (
    <main
      className="grid min-h-svh overflow-y-auto bg-slate-50 dark:bg-slate-950 lg:grid-cols-[16rem_1fr]"
    >
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        setActiveView={setActiveView}
        setDashboardTab={setDashboardTab}
      />

      <div className="flex flex-col min-h-0 overflow-hidden">
        {activeView === "dashboard" ? (
          <Dashboard
            setActiveView={setActiveView}
            activeTab={dashboardTab}
            setActiveTab={setDashboardTab}
          />
        ) : (
          <Workspace sidebarOpen={sidebarOpen} />
        )}
      </div>

      <Toaster />
    </main>
  )
}
