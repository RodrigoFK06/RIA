"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, AlertCircle, CheckCircle } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import ThemeToggle from "@/components/theme-toggle"

const formSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
})

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Simulamos el envío de correo de recuperación
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSuccess(true)
      form.reset()
    } catch (err) {
      setError("No se pudo enviar el correo de recuperación. Intenta de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="flex items-center mb-8">
          <BookOpen className="h-8 w-8 mr-2" />
          <h1 className="text-2xl font-bold">RIA - Lector Inteligente</h1>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recuperar contraseña</CardTitle>
            <CardDescription>Ingresa tu correo electrónico para recibir instrucciones</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Hemos enviado un correo con instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="tu@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar instrucciones"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-slate-500">
              <Link href="/auth/login" className="font-medium text-slate-900 hover:underline dark:text-slate-300">
                Volver al inicio de sesión
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </ThemeProvider>
  )
}
