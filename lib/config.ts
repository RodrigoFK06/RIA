// Environment configuration
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
}

// Feature flags
export const FEATURES = {
  // Enable development tools
  enableDevTools: ENV.isDevelopment,
}
