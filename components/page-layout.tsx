import type React from "react"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function PageLayout({ sidebar, children, className }: PageLayoutProps) {
  return (
    <div className={cn("container flex flex-col lg:flex-row gap-6", className)}>
      <aside className="w-full lg:w-64">{sidebar}</aside>
      <section className="flex-1">{children}</section>
    </div>
  )
}
