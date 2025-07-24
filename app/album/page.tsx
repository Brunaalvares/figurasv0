"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { StickerCard } from "@/components/sticker-card"
import { AchievementCard } from "@/components/achievement-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { LogOut, Trophy, Star } from "lucide-react"

interface Sticker {
  id: string
  points: number
  emoji: string
  earnedAt: string
}

interface Achievement {
  id: string
  name: string
  description?: string
  image?: string
  earnedAt: string
  category?: string
}

interface UserData {
  name: string
  email: string
  totalPoints: number
  categoryPoints?: {
    "Vendas": number
    "Recuperação": number
    "Atualização": number
    "Galáxia de reconhecimento": number
    [key: string]: number
  }
}

export default function AlbumPage() {
  const { user, logout } = useAuth()
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const stickerSlots = [
    // 15 slots de 5 pontos
    ...Array(15).fill({ points: 5, emoji: "⭐" }),
    // 15 slots de 10 pontos
    ...Array(15).fill({ points: 10, emoji: "🏆" }),
    // 15 slots de 15 pontos
    ...Array(15).fill({ points: 15, emoji: "🎖️" }),
    // 15 slots de 20 pontos
    ...Array(15).fill({ points: 20, emoji: "💎" }),
    // 15 slots de 25 pontos
    ...Array(15).fill({ points: 25, emoji: "👑" }),
    // 15 slots de 30 pontos
    ...Array(15).fill({ points: 30, emoji: "🔥" }),
  ]

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      // Carregar dados do usuário
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData)
      }

      // Carregar figurinhas
      const stickersQuery = query(collection(db, "stickers"), where("userId", "==", user.uid))
      const stickersSnapshot = await getDocs(stickersQuery)
      const userStickers = stickersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Sticker[]
      setStickers(userStickers)

      // Carregar conquistas
      const achievementsQuery = query(collection(db, "achievements"), where("userId", "==", user.uid))
      const achievementsSnapshot = await getDocs(achievementsQuery)
      const userAchievements = achievementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Achievement[]
      setAchievements(userAchievements)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu álbum...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Avalyst</h1>
                  <p className="text-sm text-gray-600">Meu Álbum</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userData?.name}</p>
                  <p className="text-xs text-gray-600">{userData?.totalPoints || 0} pontos</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Álbum de Figurinhas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Álbum de Figurinhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-15 gap-3">
                    {stickerSlots.map((slot, index) => {
                      // Calcular quantas figurinhas deste valor o usuário já tem
                      const userStickersOfThisValue = stickers.filter((s) => s.points === slot.points)

                      // Determinar qual slot específico este é (0-14 para cada valor)
                      const slotsOfSameValue = stickerSlots.filter((s) => s.points === slot.points)
                      const slotIndexForThisValue =
                        stickerSlots.slice(0, index + 1).filter((s) => s.points === slot.points).length - 1

                      // Verificar se este slot específico deve estar preenchido
                      const earnedSticker = slotIndexForThisValue < userStickersOfThisValue.length

                      return (
                        <StickerCard key={index} points={slot.points} emoji={slot.emoji} earned={!!earnedSticker} />
                      )
                    })}
                  </div>

                  {/* Pontuações por Categoria */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Pontuação por Categoria</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="text-xs font-medium text-green-600">🟢 Vendas</span>
                        <span className="text-sm font-bold text-green-700">
                          {userData?.categoryPoints?.["Vendas"] || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="text-xs font-medium text-orange-600">🟠 Recuperação</span>
                        <span className="text-sm font-bold text-orange-700">
                          {userData?.categoryPoints?.["Recuperação"] || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="text-xs font-medium text-purple-600">🟣 Atualização</span>
                        <span className="text-sm font-bold text-purple-700">
                          {userData?.categoryPoints?.["Atualização"] || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="text-xs font-medium text-yellow-600">🟡 Reconhecimento</span>
                        <span className="text-sm font-bold text-yellow-700">
                          {userData?.categoryPoints?.["Galáxia de reconhecimento"] || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Total de Pontos</p>
                        <p className="text-2xl font-bold text-gray-900">{userData?.totalPoints || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Figurinhas Coletadas</p>
                        <p className="text-2xl font-bold text-gray-900">{stickers.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metas Conquistadas */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-blue-500" />
                    Metas Conquistadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements.length > 0 ? (
                      achievements.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          name={achievement.name}
                          category={achievement.category}
                          description={achievement.description}
                          image={achievement.image}
                          date={new Date(achievement.earnedAt).toLocaleDateString("pt-BR")}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhuma meta conquistada ainda</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Continue trabalhando para desbloquear suas primeiras conquistas!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Minha Posição nos Rankings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Minha Posição nos Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["Vendas", "Recuperação", "Atualização", "Galáxia de reconhecimento"].map((category) => {
                      const points = userData?.categoryPoints?.[category] || 0
                      
                      return (
                        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {category === "Vendas" && "🟢"}
                            {category === "Recuperação" && "🟠"}
                            {category === "Atualização" && "🟣"}
                            {category === "Galáxia de reconhecimento" && "🟡"}
                            <span className="font-medium text-sm">
                              {category === "Galáxia de reconhecimento" ? "Reconhecimento" : category}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{points} pts</p>
                            {points > 0 ? (
                              <p className="text-xs text-green-600">Participando</p>
                            ) : (
                              <p className="text-xs text-gray-400">Sem pontos</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 text-center">
                      💡 <strong>Dica:</strong> Peça ao seu gestor para ver o ranking completo de cada categoria!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
