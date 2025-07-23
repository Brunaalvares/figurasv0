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

interface UserData {
  name: string
  email: string
  role: "admin" | "employee"
  totalPoints: number
  createdAt: string
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<"admin" | "employee" | null>(null)
  const [loading, setLoading] = useState(true)

  const validateUserData = (data: any): UserData | null => {
    if (!data || typeof data !== 'object') return null
    if (!data.email || !data.role || !['admin', 'employee'].includes(data.role)) return null
    return {
      name: data.name || 'Usuário',
      email: data.email,
      role: data.role,
      totalPoints: data.totalPoints || 0,
      createdAt: data.createdAt || new Date().toISOString()
    }
  }

  // Função para garantir que o admin principal sempre tenha role correto
  const ensureAdminRole = async (user: User): Promise<"admin" | "employee"> => {
    // Se for o admin principal, sempre retornar admin e corrigir no banco se necessário
    if (user.email === "marketing2@avalyst.com.br") {
      console.log("🔧 Admin principal detectado, garantindo role admin")
      
      const adminData: UserData = {
        name: "Marketing Admin",
        email: "marketing2@avalyst.com.br",
        role: "admin",
        totalPoints: 0,
        createdAt: new Date().toISOString(),
      }
      
      try {
        // Forçar criação/atualização do documento com role admin
        await setDoc(doc(db, "users", user.uid), adminData, { merge: true })
        console.log("✅ Admin role garantido no banco de dados")
        return "admin"
      } catch (error) {
        console.error("❌ Erro ao garantir admin role:", error)
        return "admin" // Mesmo com erro, retornar admin para o email principal
      }
    }
    
    // Para outros usuários, seguir lógica normal
    return await getNormalUserRole(user)
  }

  const getNormalUserRole = async (user: User): Promise<"admin" | "employee"> => {
    try {
      // Busca otimizada: primeiro por UID (mais eficiente)
      const userDocById = await getDoc(doc(db, "users", user.uid))

      if (userDocById.exists()) {
        const userData = validateUserData(userDocById.data())
        if (userData) {
          console.log("User data found by UID:", userData)
          return userData.role
        } else {
          console.error("Invalid user data structure:", userDocById.data())
          return "employee" // Fallback seguro
        }
      } else {
        // Fallback: buscar por email apenas se não existir por UID
        console.log("User not found by UID, searching by email:", user.email)
        const usersQuery = query(collection(db, "users"), where("email", "==", user.email))
        const usersSnapshot = await getDocs(usersQuery)

        if (!usersSnapshot.empty) {
          const userData = validateUserData(usersSnapshot.docs[0].data())
          if (userData) {
            console.log("User data found by email:", userData)
            
            // Migrar documento para usar UID como chave
            await setDoc(doc(db, "users", user.uid), userData)
            console.log("User document migrated to UID-based key")
            return userData.role
          } else {
            console.error("Invalid user data structure:", usersSnapshot.docs[0].data())
            return "employee"
          }
        } else {
          console.log("User not found in database, creating default employee record")
          const defaultUserData: UserData = {
            name: user.displayName || user.email?.split("@")[0] || "Usuário",
            email: user.email!,
            role: "employee",
            totalPoints: 0,
            createdAt: new Date().toISOString(),
          }
          
          await setDoc(doc(db, "users", user.uid), defaultUserData)
          return "employee"
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error)
      return "employee" // Default role on error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email)
      setUser(user)

      if (user) {
        try {
          const role = await ensureAdminRole(user)
          setUserRole(role)
          console.log(`✅ Role determinado: ${role} para ${user.email}`)
        } catch (error) {
          console.error("Error determining user role:", error)
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
      console.log("User created in Auth:", userCredential.user.uid)

      // Criar documento no Firestore com o UID como ID do documento
      const userData: UserData = {
        name: name,
        email: email,
        role: role,
        totalPoints: 0,
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, "users", userCredential.user.uid), userData)

      console.log("Test user created successfully:", email, "with role:", role)
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("Login successful for:", userCredential.user.email)

      // Aguardar um pouco para garantir que o estado seja atualizado
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error: any) {
      console.error("Login error:", error)

      // Tratar códigos de erro atualizados do Firebase Auth v9+
      if (error.code === "auth/invalid-credential" || error.code === "auth/invalid-login-credentials") {
        console.log("Invalid credentials, checking if it's a test account...")

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
    try {
      await signOut(auth)
      setUser(null)
      setUserRole(null)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout, createTestUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
