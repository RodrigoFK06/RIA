export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface RegisterResponse {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface User extends RegisterResponse {}

export interface RsvpRequest {
  topic: string
}

export interface RsvpSession {
  id: string
  text: string
  words: string[]
  reading_time_seconds?: number
  wpm?: number
  quiz_score?: number
  ai_estimated_ideal_reading_time_seconds?: number
  ai_text_difficulty?: string
  topic?: string
  created_at?: string
  // additional fields may exist
  [key: string]: any
}

export interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation: string
}

export interface QuizResponse {
  rsvp_session_id: string
  questions: QuizQuestion[]
}

export interface QuizValidateRequest {
  rsvp_session_id: string
  answers: {
    question_id: string
    user_answer: string
  }[]
  reading_time_seconds?: number
}

export interface QuizValidateResponse {
  rsvp_session_id: string
  overall_score: number
  reading_time_seconds?: number
  wpm?: number
  ai_estimated_ideal_reading_time_seconds?: number
  results: {
    question_id: string
    is_correct: boolean
    feedback: string
    correct_answer: string
  }[]
}

export interface StatsResponse {
  user_id: string
  overall_stats: {
    total_sessions_read: number
    total_reading_time_seconds: number
    total_words_read: number
    average_wpm: number
    total_quizzes_taken: number
    average_quiz_score: number
    delta_wpm_vs_previous: number
    delta_comprehension_vs_previous: number
    delta_reading_time_vs_previous: number
    reading_progress_percent: number
    wpm_trend: "up" | "down" | "stable"
    comprehension_trend: "up" | "down" | "stable"
  }
  recent_sessions_stats: {
    session_id: string
    text_snippet: string
    word_count: number
    reading_time_seconds: number
    wpm: number
    quiz_taken: boolean
    quiz_score: number
    ai_text_difficulty: string
    ai_estimated_ideal_reading_time_seconds: number
    created_at: string
    created_at_local: string
    topic?: string // Topic real de la sesión (opcional por compatibilidad)
  }[]
  personalized_feedback: string | null
}

export interface AssistantRequest {
  query: string
  rsvp_session_id: string
}

export interface AssistantResponse {
  response: string
}

export interface UpdateProfileRequest {
  full_name: string
  email: string
}

export interface UpdatePasswordRequest {
  current_password: string
  new_password: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: any } = {},
  token?: string,
): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  const requestOptions: RequestInit = {
    ...options,
    headers,
  }
  
  if (options.body && typeof options.body !== 'string') {
    requestOptions.body = JSON.stringify(options.body)
  } else if (options.body) {
    requestOptions.body = options.body
  }
  
  const res = await fetch(`${API_URL}${endpoint}`, requestOptions)
  if (!res.ok) {
    let detail: string | undefined
    try {
      const data = await res.json()
      detail = data.detail || JSON.stringify(data)
    } catch {
      detail = res.statusText
    }
    
    // Crear un error más descriptivo que incluya el código de estado
    const error = new Error(detail) as any
    error.status = res.status
    error.statusText = res.statusText
    
    console.error(`❌ API Error [${res.status}]:`, {
      endpoint,
      status: res.status,
      statusText: res.statusText,
      detail
    })
    
    throw error
  }
  return res.json()
}

export const rsvpApi = {
  register: (data: RegisterRequest) =>
    request<RegisterResponse>('/auth/register', { method: 'POST', body: data }),
  login: (data: LoginRequest) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: data }),
  me: (token: string) => request<User>('/auth/me', { method: 'GET' }, token),
  updateProfile: (data: UpdateProfileRequest, token: string) =>
    request<User>('/auth/profile', { method: 'PUT', body: data }, token),
  updatePassword: (data: UpdatePasswordRequest, token: string) =>
    request<{ message: string }>('/auth/password', { method: 'PUT', body: data }, token),
  createRsvp: (data: RsvpRequest, token: string) =>
    request<RsvpSession>('/api/rsvp', { method: 'POST', body: data }, token),
  getRsvp: (id: string, token: string) =>
    request<RsvpSession>(`/api/rsvp/${id}`, { method: 'GET' }, token),
  createQuiz: (data: { rsvp_session_id: string }, token: string) =>
    request<QuizResponse>('/api/quiz', { method: 'POST', body: data }, token),
  validateQuiz: (data: QuizValidateRequest, token: string) =>
    request<QuizValidateResponse>(
      '/api/quiz/validate',
      { method: 'POST', body: data },
      token,
    ),
  getStats: (token: string) =>
    request<StatsResponse>('/api/stats', { method: 'GET' }, token),
  assistant: (data: AssistantRequest, token: string) =>
    request<AssistantResponse>('/api/assistant', { method: 'POST', body: data }, token),
  deleteRsvp: (id: string, token: string) =>
    request<{ message: string }>(`/api/rsvp/${id}`, { method: 'DELETE' }, token),
}

