"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("HomePage - User:", user?.email, "Role:", userRole, "Loading:", loading)

    if (!loading) {
      if (!user) {
        console.log("No user, redirecting to login")
        router.push("/login")
      } else {
        console.log("User found:", user.email, "Role:", userRole)

        if (userRole === "admin") {
          console.log("Admin user, redirecting to admin panel")
          router.push("/admin")
        } else if (userRole === "employee") {
          console.log("Employee user, redirecting to album")
          router.push("/album")
        } else {
          console.log("Role not determined yet, waiting...")
          // Se o role ainda não foi determinado, aguardar mais um pouco
          setTimeout(() => {
            if (userRole === "admin") {
              router.push("/admin")
            } else {
              router.push("/album")
            }
          }, 2000)
        }
      }
    }
  }, [user, userRole, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
        {user && (
          <div className="mt-2 text-sm text-gray-500">
            <p>Usuário: {user.email}</p>
            <p>Role: {userRole || "Carregando..."}</p>
          </div>
        )}
      </div>
    </div>
  )
}
