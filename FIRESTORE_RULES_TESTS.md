# 🧪 Testes das Regras de Segurança do Firestore

## 🎯 Como Testar no Firebase Console

### 1. Acesse o Rules Playground
1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `sistema-figuras`
3. Firestore Database → Rules → **Rules Playground**

### 2. Configure os Testes

## ✅ **TESTES QUE DEVEM PASSAR (Allow)**

### Teste 1: Admin Principal - Acesso Total
```javascript
// Configuração do Teste
Authentication: {
  "uid": "admin_uid_123",
  "email": "marketing2@avalyst.com.br",
  "email_verified": true
}

// Teste 1a: Ler qualquer usuário
Path: /databases/sistema-figuras/documents/users/any_user_id
Method: get
Expected: ✅ Allow

// Teste 1b: Criar usuário
Path: /databases/sistema-figuras/documents/users/new_user_id
Method: create
Data: {
  "name": "Novo Usuário",
  "email": "novo@exemplo.com",
  "role": "employee",
  "totalPoints": 0
}
Expected: ✅ Allow

// Teste 1c: Criar figurinha para qualquer usuário
Path: /databases/sistema-figuras/documents/stickers/new_sticker_id
Method: create
Data: {
  "userId": "any_user_id",
  "points": 10,
  "emoji": "⭐",
  "earnedAt": "2024-01-01T00:00:00Z"
}
Expected: ✅ Allow
```

### Teste 2: Usuário Normal - Próprios Dados
```javascript
// Configuração do Teste
Authentication: {
  "uid": "user_123",
  "email": "user@avalyst.com",
  "email_verified": true
}

// Teste 2a: Ler próprio documento de usuário
Path: /databases/sistema-figuras/documents/users/user_123
Method: get
Expected: ✅ Allow

// Teste 2b: Ler próprias figurinhas
Path: /databases/sistema-figuras/documents/stickers/sticker_id
Method: get
Existing Data: {
  "userId": "user_123",
  "points": 5,
  "emoji": "⭐"
}
Expected: ✅ Allow

// Teste 2c: Ler metas customizadas
Path: /databases/sistema-figuras/documents/customAchievements/achievement_id
Method: get
Expected: ✅ Allow
```

### Teste 3: Admin com Role no Banco
```javascript
// Configuração do Teste
Authentication: {
  "uid": "admin_role_456",
  "email": "admin@avalyst.com",
  "email_verified": true
}

// Dados existentes necessários
Existing Document: /databases/sistema-figuras/documents/users/admin_role_456
Data: {
  "name": "Admin Local",
  "email": "admin@avalyst.com",
  "role": "admin",
  "totalPoints": 0
}

// Teste 3a: Criar figurinha
Path: /databases/sistema-figuras/documents/stickers/new_sticker
Method: create
Data: {
  "userId": "user_123",
  "points": 15,
  "emoji": "🏆"
}
Expected: ✅ Allow

// Teste 3b: Gerenciar metas customizadas
Path: /databases/sistema-figuras/documents/customAchievements/new_achievement
Method: create
Data: {
  "name": "Meta Especial",
  "category": "Vendas",
  "description": "Atingir meta de vendas"
}
Expected: ✅ Allow
```

## ❌ **TESTES QUE DEVEM FALHAR (Deny)**

### Teste 4: Usuário Tentando Acessar Dados de Outro
```javascript
// Configuração do Teste
Authentication: {
  "uid": "user_123",
  "email": "user@avalyst.com",
  "email_verified": true
}

// Teste 4a: Tentar ler dados de outro usuário
Path: /databases/sistema-figuras/documents/users/other_user_456
Method: get
Expected: ❌ Deny

// Teste 4b: Tentar ler figurinhas de outro usuário
Path: /databases/sistema-figuras/documents/stickers/sticker_id
Method: get
Existing Data: {
  "userId": "other_user_456",
  "points": 10
}
Expected: ❌ Deny
```

### Teste 5: Usuário Tentando Criar Figurinhas
```javascript
// Configuração do Teste
Authentication: {
  "uid": "user_123",
  "email": "user@avalyst.com",
  "email_verified": true
}

// Teste 5a: Tentar criar figurinha
Path: /databases/sistema-figuras/documents/stickers/new_sticker
Method: create
Data: {
  "userId": "user_123",
  "points": 20,
  "emoji": "💎"
}
Expected: ❌ Deny

// Teste 5b: Tentar criar conquista
Path: /databases/sistema-figuras/documents/achievements/new_achievement
Method: create
Data: {
  "userId": "user_123",
  "name": "Conquista Falsa"
}
Expected: ❌ Deny
```

### Teste 6: Usuário Tentando Alterar Role
```javascript
// Configuração do Teste
Authentication: {
  "uid": "user_123",
  "email": "user@avalyst.com",
  "email_verified": true
}

// Dados existentes
Existing Document: /databases/sistema-figuras/documents/users/user_123
Data: {
  "name": "Usuário Normal",
  "email": "user@avalyst.com",
  "role": "employee",
  "totalPoints": 50
}

// Teste 6a: Tentar alterar role para admin
Path: /databases/sistema-figuras/documents/users/user_123
Method: update
Data: {
  "name": "Usuário Normal",
  "email": "user@avalyst.com",
  "role": "admin",  // ← Tentativa de escalação de privilégios
  "totalPoints": 50
}
Expected: ❌ Deny

// Teste 6b: Tentar alterar email
Path: /databases/sistema-figuras/documents/users/user_123
Method: update  
Data: {
  "name": "Usuário Normal",
  "email": "novo_email@exemplo.com",  // ← Tentativa de alterar email
  "role": "employee",
  "totalPoints": 50
}
Expected: ❌ Deny
```

### Teste 7: Acesso Sem Autenticação
```javascript
// Configuração do Teste
Authentication: null  // Sem autenticação

// Teste 7a: Tentar ler qualquer documento
Path: /databases/sistema-figuras/documents/users/any_user
Method: get
Expected: ❌ Deny

// Teste 7b: Tentar criar documento
Path: /databases/sistema-figuras/documents/users/new_user
Method: create
Data: { "name": "Teste" }
Expected: ❌ Deny
```

## 🚀 **Script de Teste Automatizado**

Você pode usar este script para testar programaticamente:

```javascript
// test-firestore-rules.js
const { readFileSync } = require('fs');
const { loadFirestoreRules, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'sistema-figuras',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('Admin pode ler todos os usuários', async () => {
    const admin = testEnv.authenticatedContext('admin_uid', {
      email: 'marketing2@avalyst.com.br'
    });
    
    await assertSucceeds(
      admin.firestore().doc('users/any_user').get()
    );
  });

  test('Usuário só pode ler próprios dados', async () => {
    const user = testEnv.authenticatedContext('user_123', {
      email: 'user@avalyst.com'
    });
    
    // Deve conseguir ler próprios dados
    await assertSucceeds(
      user.firestore().doc('users/user_123').get()
    );
    
    // Não deve conseguir ler dados de outros
    await assertFails(
      user.firestore().doc('users/other_user').get()
    );
  });
});
```

## 📊 **Monitoramento das Regras**

### 1. Logs de Segurança
No Firebase Console, vá para:
**Firestore → Usage → Security Rules**

### 2. Métricas Importantes
- **Requests Denied**: Tentativas de acesso negadas
- **Rules Evaluations**: Número de avaliações de regras
- **Error Rate**: Taxa de erro nas regras

### 3. Alertas Recomendados
Configure alertas para:
- Alto número de requests negados
- Tentativas de escalação de privilégios
- Acesso a dados sensíveis

---

**🔒 Essas regras garantem que apenas o admin marketing2@avalyst.com.br tenha acesso total, enquanto usuários só veem seus próprios dados!**