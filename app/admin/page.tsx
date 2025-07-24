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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, getDocs, addDoc, doc, updateDoc, increment, deleteDoc, setDoc, getDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { Users, Plus, Award, Star, LogOut, Target, Trash2, Edit, Trophy, Crown, Medal } from "lucide-react"

interface Employee {
  id: string
  name: string
  email: string
  totalPoints: number
  role: string
  categoryPoints?: {
    "Vendas": number
    "Recuperação": number
    "Atualização": number
    "Galáxia de reconhecimento": number
    [key: string]: number // Para categorias customizadas
  }
}

interface CustomAchievement {
  id: string
  name: string
  category: string
  image: string
  description?: string
  createdAt: string
}

const defaultAchievements = [
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

  // Galáxia de reconhecimento
  { name: "Brilho no Atendimento", category: "Galáxia de reconhecimento", image: "✨" },
  { name: "Estrela do Conhecimento", category: "Galáxia de reconhecimento", image: "📚" },
  { name: "Cometa de Ouro", category: "Galáxia de reconhecimento", image: "☄️" },
  { name: "Supernova da Inovação", category: "Galáxia de reconhecimento", image: "💡" },
  { name: "Satélite de conexão", category: "Galáxia de reconhecimento", image: "🛰️" },
  { name: "Figurinha DunkLee", category: "Galáxia de reconhecimento", image: "🏆" },
]

const pointValues = [5, 10, 15, 20, 25, 30]

// Categorias padrão do sistema
const defaultCategories = ["Vendas", "Recuperação", "Atualização", "Galáxia de reconhecimento"]

// Função para inicializar pontuações por categoria
const initializeCategoryPoints = () => {
  const points: { [key: string]: number } = {}
  defaultCategories.forEach(category => {
    points[category] = 0
  })
  return points
}

export default function AdminPage() {
  const { logout } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customAchievements, setCustomAchievements] = useState<CustomAchievement[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para modais
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [stickerPoints, setStickerPoints] = useState("")
  const [achievementDescription, setAchievementDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedAchievement, setSelectedAchievement] = useState("")

  // Estados para edição de colaborador
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editEmployeeName, setEditEmployeeName] = useState("")
  const [editEmployeeEmail, setEditEmployeeEmail] = useState("")
  const [editEmployeePoints, setEditEmployeePoints] = useState("")
  const [editCategoryPoints, setEditCategoryPoints] = useState<{[key: string]: string}>({})
  const [showCategoryPoints, setShowCategoryPoints] = useState(false)
  
  // Estados para rankings
  const [selectedRankingCategory, setSelectedRankingCategory] = useState("Vendas")

  // Função para obter ranking de uma categoria
  const getCategoryRanking = (category: string) => {
    return employees
      .filter(emp => emp.categoryPoints && emp.categoryPoints[category] > 0)
      .sort((a, b) => (b.categoryPoints?.[category] || 0) - (a.categoryPoints?.[category] || 0))
      .map((emp, index) => ({
        ...emp,
        position: index + 1,
        categoryPoints: emp.categoryPoints?.[category] || 0
      }))
  }

  // Estados para criar nova meta
  const [newAchievementName, setNewAchievementName] = useState("")
  const [newAchievementCategory, setNewAchievementCategory] = useState("")
  const [newAchievementImage, setNewAchievementImage] = useState("")
  const [newAchievementDescription, setNewAchievementDescription] = useState("")

  const categories = ["Vendas", "Recuperação", "Atualização", "Galáxia de reconhecimento"]
  const emojiOptions = [
    "🏢",
    "🏬",
    "🏠",
    "💰",
    "🏞️",
    "🤝",
    "📈",
    "📊",
    "🎯",
    "🔄",
    "📞",
    "⭐",
    "📜",
    "⏰",
    "🎪",
    "👥",
    "🥇",
    "🚀",
    "🏛️",
    "🌟",
    "✨",
    "📚",
    "☄️",
    "💡",
    "🛰️",
    "🏆",
    "🎖️",
    "💎",
    "👑",
    "🔥",
    "🎨",
    "🎭",
    "🎪",
    "🎨",
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar colaboradores
      const usersSnapshot = await getDocs(collection(db, "users"))
      const employeesList = usersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Employee))
        .filter((user) => user.role === "employee")
      setEmployees(employeesList)

      // Carregar metas customizadas
      const achievementsSnapshot = await getDocs(collection(db, "customAchievements"))
      const customAchievementsList = achievementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CustomAchievement[]
      setCustomAchievements(customAchievementsList)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async () => {
    // Validação
    if (!newEmployeeName?.trim() || !newEmployeeEmail?.trim()) {
      alert("Por favor, preencha todos os campos.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmployeeEmail.trim())) {
      alert("Email inválido.")
      return
    }

    setLoading(true)

    try {
      const name = newEmployeeName.trim()
      const email = newEmployeeEmail.trim()
      
      console.log("🚀 Criando colaborador:", { name, email })
      
      // Criar instância separada do Firebase Auth para não deslogar o admin
      const secondaryApp = initializeApp({
        apiKey: "AIzaSyD995cU7-SuyTbAME9W8SMrloSvhWRLTbo",
        authDomain: "sistema-figuras.firebaseapp.com",
        projectId: "sistema-figuras",
        storageBucket: "sistema-figuras.firebasestorage.app",
        messagingSenderId: "110106643382",
        appId: "1:110106643382:web:23de36713a98f4a49a4f17",
      }, "secondary")
      
      const secondaryAuth = getAuth(secondaryApp)
      
      // Criar usuário na instância secundária (não afeta a sessão do admin)
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, "senha123")
      const uid = userCredential.user.uid
      
      console.log("✅ Usuário criado:", uid)
      
      // Deslogar da instância secundária para limpar
      await signOut(secondaryAuth)
      
      // Dados para salvar
              const userData = {
          name,
          email,
          role: "employee",
          totalPoints: 0,
          categoryPoints: initializeCategoryPoints(),
          createdAt: new Date().toISOString(),
        }

             // Salvar no Firestore (OBRIGATÓRIO para controle de pontos)
       await setDoc(doc(db, "users", uid), userData)
       console.log("✅ Salvo no Firestore")

       // Verificar se foi salvo corretamente
       const checkDoc = await getDoc(doc(db, "users", uid))
       if (!checkDoc.exists()) {
         throw new Error("Falha ao salvar no Firestore - colaborador não pode receber pontos")
       }

       // Recarregar dados do servidor para garantir sincronização
       await loadData()
       
       // Limpar campos
       setNewEmployeeName("")
       setNewEmployeeEmail("")
       
       console.log("✅ Colaborador adicionado e sincronizado")
       alert(`✅ Colaborador "${name}" criado com sucesso!\nEmail: ${email}\nSenha: senha123\n\nO colaborador já pode receber figurinhas e pontos!`)
      
    } catch (error: any) {
      console.error("❌ Erro:", error)
      
      let msg = "Erro desconhecido"
      let instructions = ""
      
      if (error.code === "auth/email-already-in-use") {
        msg = "Email já está em uso"
        instructions = "Use um email diferente."
      } else if (error.code === "auth/invalid-email") {
        msg = "Email inválido"
        instructions = "Verifique o formato do email."
      } else if (error.code === "auth/weak-password") {
        msg = "Senha muito fraca"
        instructions = "A senha padrão 'senha123' deveria funcionar."
      } else if (error.code === "permission-denied") {
        msg = "Erro de permissão no Firestore"
        instructions = "SOLUÇÃO:\n1. Execute: npm run firestore:rules\n2. Copie o conteúdo do arquivo firestore.rules\n3. Cole no Firebase Console → Firestore → Rules → Publish"
      } else if (error.message?.includes("Falha ao salvar no Firestore")) {
        msg = "Colaborador não foi salvo no banco de dados"
        instructions = "Verifique se as regras do Firestore estão configuradas corretamente."
      } else {
        msg = error.message || "Erro ao criar colaborador"
      }
      
      const fullMessage = instructions 
        ? `❌ Erro: ${msg}\n\n${instructions}`
        : `❌ Erro: ${msg}`
      
      alert(fullMessage)
    } finally {
      setLoading(false)
    }
  }

  const openEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setEditEmployeeName(employee.name)
    setEditEmployeeEmail(employee.email)
    setEditEmployeePoints(employee.totalPoints.toString())
    
    // Carregar pontuações por categoria
    const categoryPointsStr: {[key: string]: string} = {}
    if (employee.categoryPoints) {
      Object.keys(employee.categoryPoints).forEach(category => {
        categoryPointsStr[category] = employee.categoryPoints![category].toString()
      })
    } else {
      // Se não existir, inicializar com zeros
      defaultCategories.forEach(category => {
        categoryPointsStr[category] = "0"
      })
    }
    setEditCategoryPoints(categoryPointsStr)
    setShowCategoryPoints(false)
  }

  const closeEditEmployee = () => {
    setEditingEmployee(null)
    setEditEmployeeName("")
    setEditEmployeeEmail("")
    setEditEmployeePoints("")
    setEditCategoryPoints({})
    setShowCategoryPoints(false)
  }

  const handleEditEmployee = async () => {
    if (!editingEmployee || !editEmployeeName.trim() || !editEmployeeEmail.trim()) {
      alert("Por favor, preencha todos os campos.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editEmployeeEmail.trim())) {
      alert("Email inválido.")
      return
    }

    const newPoints = parseInt(editEmployeePoints) || 0
    if (newPoints < 0) {
      alert("Pontos não podem ser negativos.")
      return
    }

    setLoading(true)

    try {
      console.log("🔄 Editando colaborador:", editingEmployee.id)
      
      // Converter pontuações por categoria de string para number
      const categoryPointsNum: {[key: string]: number} = {}
      let calculatedTotal = 0
      
      Object.keys(editCategoryPoints).forEach(category => {
        const points = parseInt(editCategoryPoints[category]) || 0
        categoryPointsNum[category] = points
        calculatedTotal += points
      })
      
      // Se o usuário editou o total manualmente, usar esse valor
      // Senão, usar a soma das categorias
      const finalTotalPoints = showCategoryPoints ? calculatedTotal : newPoints
      
      // Atualizar dados no Firestore
      await updateDoc(doc(db, "users", editingEmployee.id), {
        name: editEmployeeName.trim(),
        email: editEmployeeEmail.trim(),
        totalPoints: finalTotalPoints,
        categoryPoints: categoryPointsNum,
      })

      console.log("✅ Colaborador atualizado no Firestore")

      // Recarregar dados
      await loadData()
      
      closeEditEmployee()
      
      alert(`✅ Colaborador "${editEmployeeName.trim()}" atualizado com sucesso!`)
      
    } catch (error: any) {
      console.error("❌ Erro ao editar colaborador:", error)
      
      let msg = "Erro desconhecido"
      if (error.code === "permission-denied") {
        msg = "Erro de permissão no Firestore"
      } else {
        msg = error.message || "Erro ao editar colaborador"
      }
      
      alert(`❌ Erro: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSticker = async () => {
    if (!selectedEmployee || !stickerPoints || !selectedCategory) {
      alert("Por favor, selecione o colaborador, categoria e pontuação.")
      return
    }

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

      // Adicionar figurinha com categoria
      await addDoc(collection(db, "stickers"), {
        userId: selectedEmployee,
        points: points,
        emoji: stickerEmojis[points],
        category: selectedCategory,
        earnedAt: new Date().toISOString(),
      })

      // Atualizar pontos totais e pontos da categoria específica
      const categoryField = `categoryPoints.${selectedCategory}`
      await updateDoc(doc(db, "users", selectedEmployee), {
        totalPoints: increment(points),
        [categoryField]: increment(points),
      })

      setSelectedEmployee("")
      setStickerPoints("")
      setSelectedCategory("")
      loadData()
      alert(`Figurinha de ${selectedCategory} adicionada com sucesso! (+${points} pontos)`)
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

  const handleCreateCustomAchievement = async () => {
    if (!newAchievementName || !newAchievementCategory || !newAchievementImage) return

    try {
      await addDoc(collection(db, "customAchievements"), {
        name: newAchievementName,
        category: newAchievementCategory,
        image: newAchievementImage,
        description: newAchievementDescription,
        createdAt: new Date().toISOString(),
      })

      setNewAchievementName("")
      setNewAchievementCategory("")
      setNewAchievementImage("")
      setNewAchievementDescription("")
      loadData()
      alert("Nova meta criada com sucesso!")
    } catch (error) {
      console.error("Erro ao criar meta:", error)
      alert("Erro ao criar meta")
    }
  }

  const handleDeleteCustomAchievement = async (achievementId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return

    try {
      await deleteDoc(doc(db, "customAchievements", achievementId))
      loadData()
      alert("Meta excluída com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir meta:", error)
      alert("Erro ao excluir meta")
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const allAchievements = [...defaultAchievements, ...customAchievements]

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
          <Tabs defaultValue="actions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
              <TabsTrigger value="achievements">Gerenciar Metas</TabsTrigger>
              <TabsTrigger value="employees">Colaboradores</TabsTrigger>
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
            </TabsList>

            {/* Ações Rápidas */}
            <TabsContent value="actions">
              <div className="grid md:grid-cols-3 gap-6">
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
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedCategory && (
                        <Select value={selectedAchievement} onValueChange={setSelectedAchievement}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar meta" />
                          </SelectTrigger>
                          <SelectContent>
                            {allAchievements
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
            </TabsContent>

            {/* Gerenciar Metas */}
            <TabsContent value="achievements">
              <div className="space-y-6">
                {/* Criar Nova Meta */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Criar Nova Meta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Nome da meta"
                        value={newAchievementName}
                        onChange={(e) => setNewAchievementName(e.target.value)}
                      />
                      <Select value={newAchievementCategory} onValueChange={setNewAchievementCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={newAchievementImage} onValueChange={setNewAchievementImage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Emoji/Ícone" />
                        </SelectTrigger>
                        <SelectContent>
                          {emojiOptions.map((emoji) => (
                            <SelectItem key={emoji} value={emoji}>
                              {emoji} {emoji}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="md:col-span-2">
                        <Textarea
                          placeholder="Descrição da meta (opcional)"
                          value={newAchievementDescription}
                          onChange={(e) => setNewAchievementDescription(e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button onClick={handleCreateCustomAchievement} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Meta
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Metas Customizadas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Metas Customizadas ({customAchievements.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customAchievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{achievement.image}</span>
                            <div>
                              <h4 className="font-medium">{achievement.name}</h4>
                              <p className="text-sm text-gray-600">{achievement.category}</p>
                              {achievement.description && (
                                <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCustomAchievement(achievement.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {customAchievements.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Nenhuma meta customizada criada ainda</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Lista de Colaboradores */}
            <TabsContent value="employees">
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
                          <th className="text-center py-3 px-4">Total</th>
                          <th className="text-center py-3 px-4">Vendas</th>
                          <th className="text-center py-3 px-4">Recuperação</th>
                          <th className="text-center py-3 px-4">Atualização</th>
                          <th className="text-center py-3 px-4">Reconhecimento</th>
                          <th className="text-center py-3 px-4">Status</th>
                          <th className="text-center py-3 px-4">Ações</th>
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
                              <span className="text-xs font-medium text-green-600">
                                {employee.categoryPoints?.["Vendas"] || 0}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-medium text-orange-600">
                                {employee.categoryPoints?.["Recuperação"] || 0}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-medium text-purple-600">
                                {employee.categoryPoints?.["Atualização"] || 0}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-medium text-yellow-600">
                                {employee.categoryPoints?.["Galáxia de reconhecimento"] || 0}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ativo
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditEmployee(employee)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rankings por Categoria */}
            <TabsContent value="rankings">
              <div className="space-y-6">
                {/* Seletor de Categoria */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Rankings por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {defaultCategories.map((category) => (
                        <Button
                          key={category}
                          variant={selectedRankingCategory === category ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedRankingCategory(category)}
                          className="flex items-center gap-2"
                        >
                          {category === "Vendas" && "🟢"}
                          {category === "Recuperação" && "🟠"}
                          {category === "Atualização" && "🟣"}
                          {category === "Galáxia de reconhecimento" && "🟡"}
                          {category === "Galáxia de reconhecimento" ? "Reconhecimento" : category}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Ranking da Categoria Selecionada */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Ranking - {selectedRankingCategory === "Galáxia de reconhecimento" ? "Reconhecimento" : selectedRankingCategory}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getCategoryRanking(selectedRankingCategory).length > 0 ? (
                        getCategoryRanking(selectedRankingCategory).map((employee, index) => (
                          <div
                            key={employee.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              index === 0 ? 'bg-yellow-50 border-yellow-200' :
                              index === 1 ? 'bg-gray-50 border-gray-200' :
                              index === 2 ? 'bg-orange-50 border-orange-200' :
                              'bg-white border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm">
                                {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                                {index === 1 && <Medal className="w-5 h-5 text-gray-500" />}
                                {index === 2 && <Medal className="w-5 h-5 text-orange-500" />}
                                {index > 2 && <span className="text-gray-600">{employee.position}º</span>}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{employee.name}</p>
                                <p className="text-sm text-gray-600">{employee.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {employee.categoryPoints} pts
                              </p>
                              <p className="text-xs text-gray-500">
                                {selectedRankingCategory === "Vendas" && "🟢 Vendas"}
                                {selectedRankingCategory === "Recuperação" && "🟠 Recuperação"}
                                {selectedRankingCategory === "Atualização" && "🟣 Atualização"}
                                {selectedRankingCategory === "Galáxia de reconhecimento" && "🟡 Reconhecimento"}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">
                            Nenhum colaborador possui pontos em {selectedRankingCategory === "Galáxia de reconhecimento" ? "Reconhecimento" : selectedRankingCategory} ainda
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Adicione figurinhas desta categoria para ver o ranking
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo Geral */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-blue-500" />
                      Resumo Geral por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {defaultCategories.map((category) => {
                        const ranking = getCategoryRanking(category)
                        const totalPoints = ranking.reduce((sum, emp) => sum + emp.categoryPoints, 0)
                        const participantes = ranking.length
                        
                        return (
                          <div key={category} className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              {category === "Vendas" && "🟢"}
                              {category === "Recuperação" && "🟠"}
                              {category === "Atualização" && "🟣"}
                              {category === "Galáxia de reconhecimento" && "🟡"}
                              <span className="font-medium text-sm">
                                {category === "Galáxia de reconhecimento" ? "Reconhecimento" : category}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                              <p className="text-xs text-gray-600">pontos totais</p>
                              <p className="text-xs text-gray-500">{participantes} participantes</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal de Edição de Colaborador */}
        {editingEmployee && (
          <Dialog open={!!editingEmployee} onOpenChange={closeEditEmployee}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Colaborador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <Input
                    placeholder="Nome completo"
                    value={editEmployeeName}
                    onChange={(e) => setEditEmployeeName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={editEmployeeEmail}
                    onChange={(e) => setEditEmployeeEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pontuação
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCategoryPoints(!showCategoryPoints)}
                      disabled={loading}
                    >
                      {showCategoryPoints ? "Edição Simples" : "Editar por Categoria"}
                    </Button>
                  </div>
                  
                  {!showCategoryPoints ? (
                    <div>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={editEmployeePoints}
                        onChange={(e) => setEditEmployeePoints(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Ajuste a pontuação total do colaborador
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">
                        Edite as pontuações por categoria (o total será calculado automaticamente)
                      </p>
                      
                      {defaultCategories.map((category) => (
                        <div key={category}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {category === "Galáxia de reconhecimento" ? "Reconhecimento" : category}
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={editCategoryPoints[category] || "0"}
                            onChange={(e) => setEditCategoryPoints(prev => ({
                              ...prev,
                              [category]: e.target.value
                            }))}
                            disabled={loading}
                            className="text-sm"
                          />
                        </div>
                      ))}
                      
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-gray-700">
                          Total Calculado: {Object.values(editCategoryPoints).reduce((sum, val) => sum + (parseInt(val) || 0), 0)} pontos
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleEditEmployee} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={closeEditEmployee}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  )
}
