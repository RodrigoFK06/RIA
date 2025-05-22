"use client"

// Mock API functions for development
// In production, these would make actual API calls to the FastAPI backend

export async function generateRSVPContent(topic: string) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock response
  const text = generateMockText(topic)
  const words = text.split(/\s+/).filter((word) => word.length > 0)

  return {
    id: `session-${Date.now()}`,
    text,
    words,
  }
}

export async function getQuizQuestions(sessionId: string) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock response
  return [
    {
      type: "multiple_choice",
      question: "¿Cuál es el propósito principal de la técnica RSVP?",
      options: [
        "Mejorar la memoria a largo plazo",
        "Aumentar la velocidad de lectura",
        "Reducir la fatiga visual",
        "Mejorar la pronunciación",
      ],
      answer: "Aumentar la velocidad de lectura",
    },
    {
      type: "multiple_choice",
      question: "¿Qué significa RSVP en el contexto de lectura?",
      options: [
        "Rapid Serial Visual Presentation",
        "Reading System for Visual Processing",
        "Responsive Speed Viewing Protocol",
        "Rapid Semantic Visual Processing",
      ],
      answer: "Rapid Serial Visual Presentation",
    },
    {
      type: "open",
      question: "Explica cómo la técnica RSVP puede mejorar la comprensión lectora.",
      answer:
        "La técnica RSVP mejora la comprensión lectora al eliminar los movimientos sacádicos de los ojos y la regresión, permitiendo que el cerebro se concentre en procesar cada palabra individualmente. Esto reduce la carga cognitiva asociada con el seguimiento visual y permite una mayor atención al contenido semántico del texto.",
    },
  ]
}

export async function getStats(sessionId: string) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Mock response
  return {
    wpm: Math.floor(Math.random() * 300) + 200, // Random WPM between 200-500
    totalTime: (Math.floor(Math.random() * 60) + 30) * 1000, // Random time in ms (30-90 seconds)
    idealTime: (Math.floor(Math.random() * 30) + 20) * 1000, // Random ideal time in ms (20-50 seconds)
    score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
    feedback:
      "Tu velocidad de lectura es buena, pero aún hay margen de mejora. Has demostrado una comprensión sólida del texto, aunque algunas preguntas específicas fueron desafiantes. Recomendamos practicar con textos más complejos y aumentar gradualmente la velocidad de lectura. Intenta también hacer resúmenes mentales mientras lees para mejorar la retención de información clave.",
  }
}

export async function getAssistantResponse(message: string, sessionId: string, context?: any) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1200))

  // Mock responses based on keywords in the message
  if (message.toLowerCase().includes("velocidad") || message.toLowerCase().includes("wpm")) {
    return "Para mejorar tu velocidad de lectura, te recomiendo practicar regularmente con la técnica RSVP. Comienza con velocidades moderadas (200-300 WPM) y ve aumentando gradualmente. También es útil reducir la subvocalización (leer en voz alta mentalmente) y ampliar tu vocabulario para reconocer palabras más rápidamente. ¿Te gustaría algunos ejercicios específicos para practicar?"
  }

  if (message.toLowerCase().includes("comprensión") || message.toLowerCase().includes("entender")) {
    return "Para mejorar la comprensión durante la lectura RSVP, es importante hacer pausas estratégicas después de secciones importantes. También puedes intentar hacer preguntas previas sobre el texto para enfocar tu atención en información relevante. Otra técnica efectiva es visualizar los conceptos mientras lees, creando imágenes mentales que ayuden a la retención. ¿Has probado alguna de estas técnicas?"
  }

  if (message.toLowerCase().includes("técnica") || message.toLowerCase().includes("rsvp")) {
    return "La técnica RSVP (Rapid Serial Visual Presentation) consiste en mostrar palabras una a una en un punto fijo, eliminando los movimientos oculares durante la lectura. Esto puede aumentar significativamente la velocidad de lectura al reducir el tiempo perdido en movimientos sacádicos y regresiones. La técnica fue desarrollada en los años 70 y ha ganado popularidad con la tecnología digital. ¿Hay algún aspecto específico de RSVP sobre el que quieras saber más?"
  }

  // Default response
  return "Gracias por tu mensaje. Como asistente de lectura, puedo ayudarte con técnicas de RSVP, estrategias para mejorar la velocidad y comprensión, o resolver dudas sobre el texto que has leído. ¿Podrías ser más específico sobre qué tipo de ayuda necesitas?"
}

// Helper function to generate mock text based on topic
function generateMockText(topic: string): string {
  const topics: Record<string, string> = {
    default: `La técnica RSVP (Rapid Serial Visual Presentation) es un método de lectura que muestra palabras individuales secuencialmente en un punto fijo. Esta técnica elimina los movimientos sacádicos de los ojos, permitiendo que el lector se concentre únicamente en procesar la información presentada. Al reducir el tiempo dedicado a mover los ojos a través del texto, RSVP puede aumentar significativamente la velocidad de lectura mientras mantiene o incluso mejora la comprensión.

La investigación ha demostrado que muchas personas pueden leer a velocidades de 400-700 palabras por minuto utilizando RSVP, en comparación con las 200-300 palabras por minuto de la lectura tradicional. Esta técnica es especialmente útil en dispositivos con pantallas pequeñas o para personas con ciertas discapacidades visuales.

El sistema RIA - Lector Inteligente RSVP combina esta técnica con procesamiento semántico mediante inteligencia artificial para optimizar aún más la experiencia de lectura y evaluación de comprensión.`,
  }

  // Return text based on topic or default if not found
  return topics[topic.toLowerCase()] || topics.default
}
