#!/usr/bin/env node

/**
 * Script para debugar o usuário admin marketing2@avalyst.com.br
 * Verifica se existe no banco e qual é o role atual
 */

console.log('🔍 DEBUGGING ADMIN USER');
console.log('======================');

console.log('\n📝 Instruções para debug manual:');
console.log('1. Acesse Firebase Console: https://console.firebase.google.com/');
console.log('2. Selecione projeto: sistema-figuras');
console.log('3. Vá para Firestore Database');
console.log('4. Procure na coleção "users" por:');
console.log('   - Email: marketing2@avalyst.com.br');
console.log('   - Verifique se o campo "role" está como "admin"');

console.log('\n🔧 Possíveis problemas e soluções:');

console.log('\n❌ Problema 1: Usuário não existe no Firestore');
console.log('   Solução: Criar usuário manualmente ou usar botão "Criar Usuários de Teste"');

console.log('\n❌ Problema 2: Usuário existe mas role é "employee"');
console.log('   Solução: Editar documento no Firestore e alterar role para "admin"');

console.log('\n❌ Problema 3: Usuário existe em Authentication mas não no Firestore');
console.log('   Solução: Deletar da Authentication e recriar com botão de teste');

console.log('\n✅ Estrutura correta do documento:');
console.log('   {');
console.log('     "name": "Marketing Admin",');
console.log('     "email": "marketing2@avalyst.com.br",');
console.log('     "role": "admin",  ← DEVE SER "admin"');
console.log('     "totalPoints": 0,');
console.log('     "createdAt": "2024-01-01T00:00:00Z"');
console.log('   }');

console.log('\n🚀 Teste rápido:');
console.log('1. Acesse: http://localhost:3000/login');
console.log('2. Clique em "🔧 Criar Usuários de Teste"');
console.log('3. Aguarde confirmação');
console.log('4. Clique em "🔑 Admin Marketing"');
console.log('5. Deve redirecionar para /admin');

console.log('\n📊 Logs para verificar:');
console.log('- Abra DevTools (F12)');
console.log('- Vá para Console');
console.log('- Procure por mensagens como:');
console.log('  • "User data found by UID: {role: admin}"');
console.log('  • "Admin user, redirecting to admin panel"');

console.log('\n⚠️  Se ainda não funcionar:');
console.log('1. Limpe localStorage: localStorage.clear()');
console.log('2. Limpe cookies do site');
console.log('3. Recarregue a página');
console.log('4. Tente login novamente');

console.log('\n🎯 Debug completo realizado!');