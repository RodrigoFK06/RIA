const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body && !(options.headers && (options.headers as Record<string, string>)["Content-Type"])) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data.detail || data.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  return res.json();
}

// Auth
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export async function registerUser(data: RegisterRequest): Promise<User> {
  return apiFetch<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchCurrentUser(token: string): Promise<User> {
  return apiFetch<User>("/auth/me", {}, token);
}

// RSVP Sessions
export interface RsvpRequest {
  topic: string;
}

export interface RsvpSession {
  id: string;
  text: string;
  words: string[];
  [key: string]: any;
}

export async function createRsvpSession(data: RsvpRequest, token: string): Promise<RsvpSession> {
  return apiFetch<RsvpSession>("/api/rsvp", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function getRsvpSession(id: string, token: string): Promise<RsvpSession> {
  return apiFetch<RsvpSession>(`/api/rsvp/${id}`, {}, token);
}

// Quiz
export interface QuizRequest {
  rsvp_session_id: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface QuizResponse {
  rsvp_session_id: string;
  questions: QuizQuestion[];
}

export async function createQuiz(data: QuizRequest, token: string): Promise<QuizResponse> {
  return apiFetch<QuizResponse>("/api/quiz", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export interface QuizValidateRequest {
  rsvp_session_id: string;
  answers: { question_id: string; user_answer: string }[];
}

export interface QuizValidateResult {
  question_id: string;
  is_correct: boolean;
  feedback: string;
  correct_answer: string;
}

export interface QuizValidateResponse {
  rsvp_session_id: string;
  overall_score: number;
  results: QuizValidateResult[];
}

export async function validateQuiz(data: QuizValidateRequest, token: string): Promise<QuizValidateResponse> {
  return apiFetch<QuizValidateResponse>("/api/quiz/validate", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

// Stats
export interface StatsResponse {
  user_id: string;
  overall_stats: {
    total_sessions_read: number;
    total_reading_time_seconds: number;
    total_words_read: number;
    average_wpm: number;
    total_quizzes_taken: number;
    average_quiz_score: number;
  };
  recent_sessions_stats: {
    session_id: string;
    text_snippet: string;
    word_count: number;
    reading_time_seconds: number;
    wpm: number;
    quiz_taken: boolean;
    quiz_score: number;
    ai_text_difficulty: string;
    ai_estimated_ideal_reading_time_seconds: number;
    created_at: string;
  }[];
  personalized_feedback: string | null;
}

export async function fetchStats(token: string): Promise<StatsResponse> {
  return apiFetch<StatsResponse>("/api/stats", {}, token);
}

// Assistant
export interface AssistantRequest {
  query: string;
  rsvp_session_id: string;
}

export interface AssistantResponse {
  response: string;
}

export async function assistantQuery(data: AssistantRequest, token: string): Promise<AssistantResponse> {
  return apiFetch<AssistantResponse>("/api/assistant", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

