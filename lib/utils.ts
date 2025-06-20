import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convierte una fecha UTC a la hora local de Lima (Perú)
export function formatDateInLima(
  utcDate: string | number | Date,
  withTime = false,
): string {
  const date = new Date(utcDate)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }

  if (withTime) {
    options.hour = "2-digit"
    options.minute = "2-digit"
    options.second = "2-digit"
    options.hour12 = false
  }

  return date.toLocaleString("es-PE", options)
}
