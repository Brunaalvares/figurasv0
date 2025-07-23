-- Este é um script de exemplo para estruturar os dados no Firestore
-- Execute estes comandos no console do Firebase ou através de um script de inicialização

-- Coleção: users
-- Documento de exemplo para admin
{
  "name": "Administrador",
  "email": "admin@avalyst.com",
  "role": "admin",
  "totalPoints": 0,
  "createdAt": "2024-01-15T10:00:00.000Z"
}

-- Documento de exemplo para admin marketing
{
  "name": "Marketing Admin",
  "email": "marketing2@avalyst.com.br",
  "role": "admin",
  "totalPoints": 0,
  "createdAt": "2024-01-15T10:00:00.000Z"
}

-- Documento de exemplo para colaborador
{
  "name": "João Silva",
  "email": "user@avalyst.com", 
  "role": "employee",
  "totalPoints": 45,
  "createdAt": "2024-01-15T10:00:00.000Z"
}

-- Coleção: stickers
-- Documento de exemplo
{
  "userId": "user_id_here",
  "points": 10,
  "emoji": "🏆",
  "earnedAt": "2024-01-20T14:30:00.000Z"
}

-- Coleção: achievements  
-- Documento de exemplo
{
  "userId": "user_id_here",
  "name": "Primeira Venda do Mês",
  "description": "Conquistou a primeira venda de janeiro",
  "image": "🎯",
  "earnedAt": "2024-01-20T14:30:00.000Z"
}
