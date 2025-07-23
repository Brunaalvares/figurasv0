// Script para criar usuários de teste no Firebase
// Execute este script no console do navegador na página de login

async function createTestUsersInFirestore() {
  // Importar Firebase (assumindo que já está carregado na página)
  const { createUserWithEmailAndPassword } = await import("firebase/auth")
  const { doc, setDoc } = await import("firebase/firestore")
  const { auth, db } = window // Declare auth and db variables

  const testUsers = [
    {
      email: "admin@avalyst.com",
      password: "admin123",
      role: "admin",
      name: "Administrador",
    },
    {
      email: "marketing2@avalyst.com.br",
      password: "admin123",
      role: "admin",
      name: "Marketing Admin",
    },
    {
      email: "user@avalyst.com",
      password: "user123",
      role: "employee",
      name: "João Silva",
    },
  ]

  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email}`)

      // Criar no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password)

      // Criar documento no Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: user.name,
        email: user.email,
        role: user.role,
        totalPoints: 0,
        createdAt: new Date().toISOString(),
      })

      console.log(`✅ User created: ${user.email} (${user.role})`)
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log(`⚠️ User already exists: ${user.email}`)
      } else {
        console.error(`❌ Error creating ${user.email}:`, error)
      }
    }
  }

  console.log("🎉 Test users creation process completed!")
}

// Executar a função
createTestUsersInFirestore()
