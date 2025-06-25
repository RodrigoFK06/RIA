"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import Workspace from "@/components/workspace"
import PageLayout from "@/components/page-layout"
import { useWorkspaceStore } from "@/lib/store"
import { Toaster } from "@/components/toaster"

export default function Home() {
  const [activeView, setActiveView] = useState<"dashboard" | "workspace">("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashboardTab, setDashboardTab] = useState("new")
  const { activeProject } = useWorkspaceStore()

  return (
    <main className="min-h-svh overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <PageLayout
        sidebar={
          <Sidebar
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            setActiveView={setActiveView}
            setDashboardTab={setDashboardTab}
          />
        }
      >
        {activeView === "dashboard" ? (
          <Dashboard
            setActiveView={setActiveView}
            activeTab={dashboardTab}
            setActiveTab={setDashboardTab}
          />
        ) : (
          <Workspace sidebarOpen={sidebarOpen} />
        )}
      </PageLayout>

      <Toaster />
    </main>
  )
}
