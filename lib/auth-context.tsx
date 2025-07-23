"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

interface AuthContextType {
  user: User | null
  userRole: "admin" | "employee" | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  createTestUser: (email: string, password: string, role: "admin" | "employee", name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<"admin" | "employee" | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email)
      setUser(user)

      if (user) {
        try {
          // Primeiro, tentar buscar por UID
          const userDocById = await getDoc(doc(db, "users", user.uid))

          if (userDocById.exists()) {
            const userData = userDocById.data()
            console.log("User data found by UID:", userData)
            setUserRole(userData.role)
          } else {
            // Se não encontrar por UID, buscar por email
            console.log("User not found by UID, searching by email:", user.email)
            const usersQuery = query(collection(db, "users"), where("email", "==", user.email))
            const usersSnapshot = await getDocs(usersQuery)

            if (!usersSnapshot.empty) {
              const userData = usersSnapshot.docs[0].data()
              console.log("User data found by email:", userData)
              setUserRole(userData.role)
            } else {
              console.log("User not found in database, creating default employee record")
              // Criar registro padrão para o usuário
              await setDoc(doc(db, "users", user.uid), {
                name: user.displayName || user.email?.split("@")[0] || "Usuário",
                email: user.email,
                role: "employee",
                totalPoints: 0,
                createdAt: new Date().toISOString(),
              })
              setUserRole("employee")
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
          setUserRole("employee") // Default role on error
        }
      } else {
        setUserRole(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const createTestUser = async (email: string, password: string, role: "admin" | "employee", name: string) => {
    try {
      console.log("Creating test user:", email, role)

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Criar documento no Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name,
        email: email,
        role: role,
        totalPoints: 0,
        createdAt: new Date().toISOString(),
      })

      console.log("Test user created successfully:", email)
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        console.log("User already exists:", email)
        // Usuário já existe, apenas fazer login
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        console.error("Error creating test user:", error)
        throw error
      }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error("Login error:", error)

      // Se o usuário não existe, tentar criar usuários de teste
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
        console.log("User not found, checking if it's a test account...")

        // Definir usuários de teste
        const testUsers = {
          "admin@avalyst.com": { role: "admin" as const, name: "Administrador" },
          "marketing2@avalyst.com.br": { role: "admin" as const, name: "Marketing Admin" },
          "user@avalyst.com": { role: "employee" as const, name: "João Silva" },
        }

        if (email in testUsers) {
          console.log("Creating test user:", email)
          const userData = testUsers[email as keyof typeof testUsers]
          await createTestUser(email, password, userData.role, userData.name)
          return // Login será feito automaticamente após criar o usuário
        }
      }

      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout, createTestUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
