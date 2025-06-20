"use client"

import { rsvpApi } from "@/lib/rsvpApi"

// API functions that use real API endpoints only

export async function generateRSVPContent(topic: string, token: string) {
  return await rsvpApi.createRsvp({ topic }, token)
}

export async function getQuizQuestions(sessionId: string, token: string) {
  return await rsvpApi.createQuiz({ rsvp_session_id: sessionId }, token)
}

export async function getStats(sessionId: string, token: string) {
  return await rsvpApi.getStats(token)
}

export async function getAssistantResponse(message: string, sessionId: string, token: string, context?: any) {
  return await rsvpApi.assistant({ query: message, rsvp_session_id: sessionId }, token)
}
