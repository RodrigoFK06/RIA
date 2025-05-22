"use client"

import type React from "react"

import { useState } from "react"
import { useWorkspaceStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, BarChart3, Search, Filter, Trash2 } from "lucide-react"

interface RecentSessionsProps {
  setActiveView: (view: "dashboard" | "workspace") => void
}

export default function RecentSessions({ setActiveView }: RecentSessionsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [filterFolder, setFilterFolder] = useState("")
  const { sessions, folders, setActiveSession, deleteSession } = useWorkspaceStore()

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter((session) => {
      const matchesSearch = searchQuery
        ? session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.topic.toLowerCase().includes(searchQuery.toLowerCase())
        : true

      const matchesFolder = filterFolder ? session.folderId === filterFolder : true

      return matchesSearch && matchesFolder
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === "wpm") {
        return (b.stats?.wpm || 0) - (a.stats?.wpm || 0)
      } else if (sortBy === "score") {
        return (b.stats?.score || 0) - (a.stats?.score || 0)
      }
      return 0
    })

  const handleSessionClick = (sessionId: string) => {
    setActiveSession(sessionId)
    setActiveView("workspace")
  }

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    deleteSession(sessionId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar sesiones..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterFolder} onValueChange={setFilterFolder}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por carpeta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las carpetas</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Fecha (más reciente)</SelectItem>
              <SelectItem value="wpm">Velocidad (WPM)</SelectItem>
              <SelectItem value="score">Puntuación</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSessionClick(session.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-500 hover:text-red-500"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {formatDistanceToNow(new Date(session.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-4 text-sm">
                  {session.stats?.wpm && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-slate-500" />
                      <span>{session.stats.wpm} WPM</span>
                    </div>
                  )}

                  {session.stats?.score && (
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1 text-slate-500" />
                      <span>{session.stats.score}%</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-sm text-slate-500 line-clamp-2">
                  {session.text ? session.text.substring(0, 100) + "..." : "Sin contenido"}
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-slate-500">Tema: {session.topic}</div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-slate-500">
            No se encontraron sesiones que coincidan con los criterios de búsqueda.
          </div>
        )}
      </div>
    </div>
  )
}
