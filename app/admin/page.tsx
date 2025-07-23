"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { collection, getDocs, addDoc, doc, updateDoc, increment } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { Users, Plus, Award, Star, LogOut } from "lucide-react"

interface Employee {
  id: string
  name: string
  email: string
  totalPoints: number
  role: string
}

const availableAchievements = [
  // Vendas
  { name: "Construir prédio comercial - Maior faturamento mês", category: "Vendas", image: "🏢" },
  { name: "Construir prédio comercial - 2º maior faturamento mês", category: "Vendas", image: "🏬" },
  { name: "Construir prédio residencial - Maior % metas mês", category: "Vendas", image: "🏠" },
  { name: "Maior ticket médio", category: "Vendas", image: "💰" },
  { name: "Captar terreno - Crescer % em contratos", category: "Vendas", image: "🏞️" },
  { name: "Ações de relacionamento", category: "Vendas", image: "🤝" },
  { name: "Ações de marketing", category: "Vendas", image: "📈" },
  { name: "Maior faturamento no trimestre", category: "Vendas", image: "📊" },
  { name: "Maior percentual de metas no trimestre", category: "Vendas", image: "🎯" },
  { name: "Reativar e converter", category: "Vendas", image: "🔄" },

  // Recuperação
  { name: "Mestre de Negociação", category: "Recuperação", image: "🎯" },
  { name: "Efetividade das ligações", category: "Recuperação", image: "📞" },
  { name: "Estrelas da Vez", category: "Recuperação", image: "⭐" },
  { name: "Resgate Histórico", category: "Recuperação", image: "📜" },
  { name: "Maior número de horas em ligação", category: "Recuperação", image: "⏰" },
  { name: "Maior porcentagem de atingimento de metas", category: "Recuperação", image: "🎪" },
  { name: "Trabalho em equipe", category: "Recuperação", image: "👥" },

  // Atualização
  { name: "Corrida ao ouro", category: "Atualização", image: "🥇" },
  { name: "Top Performance Diária", category: "Atualização", image: "🚀" },
  { name: "Resgate histórico", category: "Atualização", image: "🏛️" },
  { name: "Mês extraordinário", category: "Atualização", image: "🌟" },

  // Gálaxia de reconhecimento
  { name: "Brilho no Atendimento", category: "Galáxia de reconhecimento", image: "✨" },
  { name: "Estrela do Conhecimento", category: "Galáxia de reconhecimento", image: "📚" },
  { name: "Cometa de Ouro", category: "Galáxia de reconhecimento", image: "☄️" },
  { name: "Supernova da Inovação", category: "Galáxia de reconhecimento", image: "💡" },
  { name: "Satélite de conexão", category: "Galáxia de reconhecimento", image: "🛰️" },
  { name: "Figurinha DunkLee", category: "Galáxia de reconhecimento", image: "🏆" },
]

const pointValues = [5, 10, 15, 20, 25, 30]

export default function AdminPage() {
  const { logout } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para modais
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [stickerPoints, setStickerPoints] = useState("")
  const [achievementDescription, setAchievementDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedAchievement, setSelectedAchievement] = useState("")

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const employeesList = usersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role === "employee") as Employee[]

      setEmployees(employeesList)
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async () => {
    if (!newEmployeeName || !newEmployeeEmail) return

    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newEmployeeEmail, "senha123")

      // Adicionar dados do usuário no Firestore
      await addDoc(collection(db, "users"), {
        name: newEmployeeName,
        email: newEmployeeEmail,
        role: "employee",
        totalPoints: 0,
        createdAt: new Date().toISOString(),
      })

      setNewEmployeeName("")
      setNewEmployeeEmail("")
      loadEmployees()
      alert("Colaborador adicionado com sucesso!")
    } catch (error) {
      console.error("Erro ao adicionar colaborador:", error)
      alert("Erro ao adicionar colaborador")
    }
  }

  const handleAddSticker = async () => {
    if (!selectedEmployee || !stickerPoints) return

    try {
      const points = Number.parseInt(stickerPoints)
      const stickerEmojis: Record<number, string> = {
        5: "⭐",
        10: "🏆",
        15: "🎖️",
        20: "💎",
        25: "👑",
        30: "🔥",
      }

      // Adicionar figurinha
      await addDoc(collection(db, "stickers"), {
        userId: selectedEmployee,
        points: points,
        emoji: stickerEmojis[points],
        earnedAt: new Date().toISOString(),
      })

      // Atualizar pontos totais do usuário
      await updateDoc(doc(db, "users", selectedEmployee), {
        totalPoints: increment(points),
      })

      setSelectedEmployee("")
      setStickerPoints("")
      loadEmployees()
      alert("Figurinha adicionada com sucesso!")
    } catch (error) {
      console.error("Erro ao adicionar figurinha:", error)
      alert("Erro ao adicionar figurinha")
    }
  }

  const handleAddAchievement = async () => {
    if (!selectedEmployee || !selectedAchievement) return

    try {
      const achievement = JSON.parse(selectedAchievement)

      await addDoc(collection(db, "achievements"), {
        userId: selectedEmployee,
        name: achievement.name,
        category: achievement.category,
        description: achievementDescription,
        image: achievement.image,
        earnedAt: new Date().toISOString(),
      })

      setSelectedEmployee("")
      setSelectedCategory("")
      setSelectedAchievement("")
      setAchievementDescription("")
      alert("Meta adicionada com sucesso!")
    } catch (error) {
      console.error("Erro ao adicionar meta:", error)
      alert("Erro ao adicionar meta")
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
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
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
                  <p className="text-sm text-gray-600">Painel Administrativo</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Ações Rápidas */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Adicionar Colaborador */}
            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <Plus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">Novo Colaborador</h3>
                      <p className="text-sm text-gray-600">Cadastrar novo usuário</p>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome completo"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newEmployeeEmail}
                    onChange={(e) => setNewEmployeeEmail(e.target.value)}
                  />
                  <p className="text-sm text-gray-600">Senha padrão: senha123</p>
                  <Button onClick={handleAddEmployee} className="w-full">
                    Adicionar Colaborador
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Adicionar Figurinha */}
            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">Dar Figurinha</h3>
                      <p className="text-sm text-gray-600">Atribuir pontos</p>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Figurinha</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={stickerPoints} onValueChange={setStickerPoints}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pontuação da figurinha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">⭐ 5 pontos</SelectItem>
                      <SelectItem value="10">🏆 10 pontos</SelectItem>
                      <SelectItem value="15">🎖️ 15 pontos</SelectItem>
                      <SelectItem value="20">💎 20 pontos</SelectItem>
                      <SelectItem value="25">👑 25 pontos</SelectItem>
                      <SelectItem value="30">🔥 30 pontos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddSticker} className="w-full">
                    Adicionar Figurinha
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Adicionar Meta */}
            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">Nova Meta</h3>
                      <p className="text-sm text-gray-600">Registrar conquista</p>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Meta Conquistada</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value)
                      setSelectedAchievement("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vendas">📈 Vendas</SelectItem>
                      <SelectItem value="Recuperação">🔄 Recuperação</SelectItem>
                      <SelectItem value="Atualização">🚀 Atualização</SelectItem>
                      <SelectItem value="Galáxia de reconhecimento">🌟 Galáxia de reconhecimento</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedCategory && (
                    <Select value={selectedAchievement} onValueChange={setSelectedAchievement}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar meta" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAchievements
                          .filter((achievement) => achievement.category === selectedCategory)
                          .map((achievement, index) => (
                            <SelectItem key={index} value={JSON.stringify(achievement)}>
                              {achievement.image} {achievement.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Textarea
                    placeholder="Descrição adicional (opcional)"
                    value={achievementDescription}
                    onChange={(e) => setAchievementDescription(e.target.value)}
                  />
                  <Button onClick={handleAddAchievement} className="w-full">
                    Registrar Meta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Colaboradores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Colaboradores ({employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Nome</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-center py-3 px-4">Pontos Totais</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{employee.name}</td>
                        <td className="py-3 px-4 text-gray-600">{employee.email}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {employee.totalPoints} pts
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
