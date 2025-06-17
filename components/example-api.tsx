"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { createRsvpSession } from "@/lib/rsvpApi"

export default function ExampleApi() {
  const { login, token } = useAuthStore()

  useEffect(() => {
    const run = async () => {
      try {
        await login("demo@example.com", "password123")
        if (!token) return
        const session = await createRsvpSession({ topic: "tecnologia" }, token)
        console.log(session)
      } catch (err) {
        console.error(err)
      }
    }
    run()
  }, [login, token])

  return <div>Example API Usage</div>
}
