# 🔒 Regras de Segurança do Firestore

## 📋 Resumo das Permissões

### 👑 Admin Principal (marketing2@avalyst.com.br)
- ✅ **Acesso TOTAL**: Pode ler e escrever em todas as coleções
- ✅ **Gerenciar usuários**: Criar, atualizar, deletar usuários
- ✅ **Gerenciar figurinhas**: Adicionar figurinhas para qualquer usuário
- ✅ **Gerenciar conquistas**: Criar conquistas para qualquer usuário
- ✅ **Gerenciar metas**: Criar, editar, deletar metas customizadas

### 🛡️ Admins com Role no Banco
- ✅ **Criar figurinhas**: Para qualquer usuário
- ✅ **Criar conquistas**: Para qualquer usuário
- ✅ **Gerenciar metas**: Criar, editar, deletar metas customizadas
- ❌ **Limitação**: Não podem gerenciar outros usuários diretamente

### 👤 Usuários Normais (Employees)
- ✅ **Ler próprios dados**: Apenas seus documentos pessoais
- ✅ **Ler metas**: Visualizar metas customizadas criadas pelos admins
- ✅ **Atualizar perfil**: Campos não-críticos do próprio perfil
- ❌ **Não podem**: Criar figurinhas, conquistas ou alterar role

## 🗂️ Estrutura das Coleções

### 📁 Collection: `users`
```javascript
{
  id: "user_uid",
  name: "Nome do Usuário",
  email: "email@example.com",
  role: "admin" | "employee",
  totalPoints: 0,
  createdAt: "2024-01-01T00:00:00Z"
}
```

**Permissões:**
- Admin principal: `read, write` (todos os documentos)
- Usuários: `read` (apenas próprio documento)
- Usuários: `update` (campos não-críticos apenas)

### 🎴 Collection: `stickers`
```javascript
{
  id: "sticker_id",
  userId: "user_uid",
  points: 5,
  emoji: "⭐",
  earnedAt: "2024-01-01T00:00:00Z"
}
```

**Permissões:**
- Admin principal: `read, write` (todas as figurinhas)
- Admins com role: `create` (adicionar figurinhas)
- Usuários: `read` (apenas próprias figurinhas)

### 🏆 Collection: `achievements`
```javascript
{
  id: "achievement_id",
  userId: "user_uid",
  name: "Nome da Conquista",
  description: "Descrição",
  earnedAt: "2024-01-01T00:00:00Z"
}
```

**Permissões:**
- Admin principal: `read, write` (todas as conquistas)
- Admins com role: `create` (adicionar conquistas)
- Usuários: `read` (apenas próprias conquistas)

### 🎯 Collection: `customAchievements`
```javascript
{
  id: "custom_achievement_id",
  name: "Meta Customizada",
  category: "Categoria",
  image: "URL da imagem",
  description: "Descrição da meta"
}
```

**Permissões:**
- Admin principal: `read, write` (todas as metas)
- Admins com role: `read, write` (todas as metas)
- Usuários: `read` (visualizar metas disponíveis)

## 🚀 Como Implementar as Regras

### 1. Acesso ao Firebase Console
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `sistema-figuras`
3. Vá para **Firestore Database**
4. Clique na aba **Rules**

### 2. Aplicar as Regras
1. Copie o conteúdo do arquivo `firestore.rules`
2. Cole no editor de regras do Firebase Console
3. Clique em **Publish** para aplicar

### 3. Testar as Regras
Use o **Rules Playground** no Firebase Console para testar:

```javascript
// Teste 1: Admin principal acessando todos os usuários
// Auth: marketing2@avalyst.com.br
// Path: /users/any_user_id
// Operation: read
// Resultado esperado: ✅ Allow

// Teste 2: Usuário normal acessando próprios dados
// Auth: user@avalyst.com
// Path: /users/user_uid
// Operation: read
// Resultado esperado: ✅ Allow

// Teste 3: Usuário tentando acessar dados de outro
// Auth: user@avalyst.com
// Path: /users/other_user_uid
// Operation: read
// Resultado esperado: ❌ Deny
```

## ⚠️ Considerações de Segurança

### 🔐 Pontos Fortes
- **Isolamento de dados**: Usuários só veem seus próprios dados
- **Admin privilegiado**: marketing2@avalyst.com.br tem controle total
- **Validação de propriedade**: Verificação de UID para ownership
- **Campos protegidos**: Role e email não podem ser alterados por usuários

### 🚨 Pontos de Atenção
- **Email hardcoded**: Se precisar trocar o admin, deve alterar as regras
- **Dependência de auth**: Todas as regras dependem de autenticação
- **Cache de regras**: Mudanças podem levar alguns minutos para propagar

## 🔧 Comandos Úteis

### Testar Regras Localmente (Firebase CLI)
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Testar regras
firebase firestore:rules:test --project=sistema-figuras
```

### Deploy das Regras via CLI
```bash
# Inicializar projeto (se necessário)
firebase init firestore

# Deploy das regras
firebase deploy --only firestore:rules
```

## 📞 Suporte

Se precisar alterar as permissões ou adicionar novos admins:

1. **Adicionar novo admin por email**: Modifique a função `isAdmin()` nas regras
2. **Adicionar nova coleção**: Crie regras específicas seguindo o padrão
3. **Modificar permissões**: Teste sempre no Rules Playground antes de aplicar

---

**⚡ As regras estão prontas para uso e seguem as melhores práticas de segurança do Firebase!**