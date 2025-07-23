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
import { Users, Plus, Award, Star, LogOut, Target, Trash2 } from "lucide-react"

interface Employee {
  id: string
  name: string
  email: string
  totalPoints: number
  role: string
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
      loadData()
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
              <TabsTrigger value="achievements">Gerenciar Metas</TabsTrigger>
              <TabsTrigger value="employees">Colaboradores</TabsTrigger>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
