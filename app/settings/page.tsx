"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, Lock, Bell, Globe, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { IDLE_TIMEOUTS, updateIdleTimeout } from "@/components/idle-manager"

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
})

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "La contraseña actual es requerida" }),
    newPassword: z.string().min(6, { message: "La nueva contraseña debe tener al menos 6 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [idleTimeout, setIdleTimeout] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('idle_timeout')
      return saved ? parseInt(saved) : IDLE_TIMEOUTS.MEDIUM
    }
    return IDLE_TIMEOUTS.MEDIUM
  })
  const router = useRouter()
  const { user, updateProfile, updatePassword, isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, router])

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.full_name || "",
      email: user?.email || "",
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsLoading(true)
    try {
      await updateProfile(values)
      toast({
        title: "Perfil actualizado",
        description: "Tu información de perfil ha sido actualizada correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil. Intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsLoading(true)
    try {
      await updatePassword(values.currentPassword, values.newPassword)
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
      })
      passwordForm.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar tu contraseña. Verifica que la contraseña actual sea correcta.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleIdleTimeoutChange = (value: string) => {
    const timeout = parseInt(value)
    setIdleTimeout(timeout)
    updateIdleTimeout(timeout)
    toast({
      title: "Configuración actualizada",
      description: `Tiempo de inactividad configurado a ${timeout / (60 * 1000)} minutos`,
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Configuración de cuenta</h1>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-1">
            <User className="h-4 w-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-1">
            <Lock className="h-4 w-4" /> Contraseña
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="h-4 w-4" /> Notificaciones
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1">
            <Globe className="h-4 w-4" /> Preferencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Información de perfil</CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
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
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña actual</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar nueva contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Actualizando..." : "Actualizar contraseña"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de notificaciones</CardTitle>
              <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Correo electrónico</h3>
                  <p className="text-sm text-slate-500">Recibir notificaciones por correo electrónico</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Recordatorios de práctica</h3>
                  <p className="text-sm text-slate-500">Recibir recordatorios para practicar lectura</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Actualizaciones de la plataforma</h3>
                  <p className="text-sm text-slate-500">Recibir notificaciones sobre nuevas funciones</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Consejos de mejora</h3>
                  <p className="text-sm text-slate-500">Recibir consejos personalizados para mejorar</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button className="mt-4">Guardar preferencias</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de lectura</CardTitle>
              <CardDescription>Personaliza tu experiencia de lectura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="defaultWpm" className="text-sm font-medium">
                    Velocidad de lectura predeterminada (WPM)
                  </label>
                  <Select defaultValue="300">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar velocidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="200">200 WPM (Lento)</SelectItem>
                      <SelectItem value="300">300 WPM (Normal)</SelectItem>
                      <SelectItem value="400">400 WPM (Rápido)</SelectItem>
                      <SelectItem value="500">500 WPM (Muy rápido)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">
                    Idioma preferido
                  </label>
                  <Select defaultValue="es">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>              </div>

              <Separator />

              <div className="space-y-2">
                <label htmlFor="idleTimeout" className="text-sm font-medium">
                  Tiempo de inactividad antes de cerrar sesión
                </label>
                <Select 
                  value={idleTimeout.toString()} 
                  onValueChange={handleIdleTimeoutChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tiempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={IDLE_TIMEOUTS.SHORT.toString()}>15 minutos</SelectItem>
                    <SelectItem value={IDLE_TIMEOUTS.MEDIUM.toString()}>30 minutos</SelectItem>
                    <SelectItem value={IDLE_TIMEOUTS.LONG.toString()}>60 minutos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tu sesión se cerrará automáticamente después de este tiempo de inactividad por seguridad
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Opciones de visualización</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Mostrar contador de palabras</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Mostrar barra de progreso</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Resaltar palabra actual</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button className="mt-4">Guardar preferencias</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
