"use client"

import { useState, useRef, useEffect } from "react"
import WindowFrame from "@/components/window-frame"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2 } from "lucide-react"
import { rsvpApi } from "@/lib/rsvpApi"
import { useAuthStore } from "@/lib/auth-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface AssistantWindowProps {
  windowData: {
    id: string
    type: string
    position: { x: number; y: number; width: number; height: number }
    data?: {
      sessionId: string
      context?: {
        text: string
        score: number
        stats: any
      }
    }
  }
}

export default function AssistantWindow({ windowData }: AssistantWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { token } = useAuthStore()

  const sessionId = windowData.data?.sessionId || ""
  const context = windowData.data?.context

  useEffect(() => {
    if (context) {
      // Add initial system message if context is provided
      setMessages([
        {
          role: "assistant",
          content:
            "Hola, soy tu asistente de lectura. Puedo ayudarte a entender mejor el texto que has leído, resolver dudas o darte consejos para mejorar tu velocidad de lectura y comprensión. ¿En qué puedo ayudarte?",
          timestamp: Date.now(),
        },
      ])
    } else {
      // Default welcome message
      setMessages([
        {
          role: "assistant",
          content: "Hola, soy tu asistente de lectura. ¿En qué puedo ayudarte hoy?",
          timestamp: Date.now(),
        },
      ])
    }
  }, [context])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      if (!token) throw new Error("No autenticado")
      const response = await rsvpApi.assistant({ query: input, rsvp_session_id: sessionId }, token)
      const messageText = response.response

      const assistantMessage: Message = {
        role: "assistant",
        content: messageText,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo obtener la respuesta del asistente. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <WindowFrame
      id={windowData.id}
      title="Asistente IA"
      initialWidth={windowData.position.width}
      initialHeight={windowData.position.height}
      initialX={windowData.position.x}
      initialY={windowData.position.y}
    >
      <div className="container-responsive flex flex-col h-full">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex-shrink-0 ${message.role === "user" ? "ml-2" : "mr-2"}`}>
                    <Avatar>
                      <AvatarFallback>{message.role === "user" ? "U" : "IA"}</AvatarFallback>
                      {message.role === "assistant" && <AvatarImage src="/placeholder.svg?height=40&width=40" />}
                    </Avatar>
                  </div>
                  <div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-slate-900 text-white dark:bg-slate-700"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div
                      className={`text-xs text-slate-500 mt-1 ${message.role === "user" ? "text-right" : "text-left"}`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="mt-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="resize-none min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="h-10 px-4">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Presiona Enter para enviar, Shift+Enter para nueva línea</p>
        </div>
      </div>
    </WindowFrame>
  )
}
