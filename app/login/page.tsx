"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCreatingUsers, setIsCreatingUsers] = useState(false)

  const { login, createTestUser } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("Logging in with:", email)
      await login(email, password)
      console.log("Login successful, waiting for role determination...")

      // Aguardar um pouco para o role ser determinado
      setTimeout(() => {
        console.log("Redirecting to home page")
        router.push("/")
      }, 1500)
    } catch (error: any) {
      console.error("Login failed:", error)
      setError("Email ou senha incorretos. " + (error.message || ""))
    } finally {
      setLoading(false)
    }
  }

  // Função para criar todos os usuários de teste
  const createAllTestUsers = async () => {
    setIsCreatingUsers(true)
    setError("")

    try {
      const testUsers = [
        { email: "admin@avalyst.com", password: "admin123", role: "admin" as const, name: "Administrador" },
        { email: "marketing2@avalyst.com.br", password: "admin123", role: "admin" as const, name: "Marketing Admin" },
        { email: "user@avalyst.com", password: "user123", role: "employee" as const, name: "João Silva" },
      ]

      for (const user of testUsers) {
        try {
          await createTestUser(user.email, user.password, user.role, user.name)
          console.log(`Created user: ${user.email}`)
        } catch (error: any) {
          if (error.code !== "auth/email-already-in-use") {
            console.error(`Error creating ${user.email}:`, error)
          }
        }
      }

      alert("Usuários de teste criados com sucesso! Agora você pode fazer login.")
    } catch (error: any) {
      console.error("Error creating test users:", error)
      setError("Erro ao criar usuários de teste: " + error.message)
    } finally {
      setIsCreatingUsers(false)
    }
  }

  // Função para login rápido de teste
  const quickLogin = async (testEmail: string, testPassword: string) => {
    setEmail(testEmail)
    setPassword(testPassword)
    setLoading(true)
    setError("")

    try {
      await login(testEmail, testPassword)
      console.log("Quick login successful, waiting for role determination...")

      // Aguardar um pouco para o role ser determinado
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error: any) {
      setError("Erro no login: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Avalyst</CardTitle>
          <CardDescription>Sistema de Figurinhas Gamificado</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Configuração de Teste:</p>

            <Button
              variant="outline"
              size="sm"
              className="w-full mb-3 bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              onClick={createAllTestUsers}
              disabled={isCreatingUsers}
            >
              {isCreatingUsers ? "Criando usuários..." : "🔧 Criar Usuários de Teste"}
            </Button>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => quickLogin("admin@avalyst.com", "admin123")}
                disabled={loading}
              >
                🔑 Admin Principal
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => quickLogin("marketing2@avalyst.com.br", "admin123")}
                disabled={loading}
              >
                🔑 Admin Marketing
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => quickLogin("user@avalyst.com", "user123")}
                disabled={loading}
              >
                👤 Colaborador
              </Button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              <p>
                <strong>Primeiro uso:</strong> Clique em "Criar Usuários de Teste" antes de fazer login
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
