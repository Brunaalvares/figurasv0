#!/usr/bin/env node

/**
 * Script para deploy das regras do Firestore
 * 
 * Este script facilita o processo de aplicação das regras de segurança
 * no Firebase Console programaticamente.
 */

const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateRulesFile() {
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  
  if (!fs.existsSync(rulesPath)) {
    log('❌ Arquivo firestore.rules não encontrado!', 'red');
    log('💡 Certifique-se de que o arquivo existe na raiz do projeto', 'yellow');
    return false;
  }
  
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  
  // Validações básicas
  if (!rulesContent.includes('rules_version')) {
    log('❌ Arquivo de regras inválido: missing rules_version', 'red');
    return false;
  }
  
  if (!rulesContent.includes('marketing2@avalyst.com.br')) {
    log('❌ Admin principal não encontrado nas regras!', 'red');
    return false;
  }
  
  if (!rulesContent.includes('service cloud.firestore')) {
    log('❌ Arquivo de regras inválido: missing service declaration', 'red');
    return false;
  }
  
  log('✅ Arquivo de regras validado com sucesso!', 'green');
  return true;
}

function showRulesSummary() {
  log('\n📋 RESUMO DAS REGRAS DE SEGURANÇA', 'cyan');
  log('================================', 'cyan');
  
  log('\n👑 Admin Principal (marketing2@avalyst.com.br):', 'magenta');
  log('   ✅ Acesso total a todas as coleções', 'green');
  log('   ✅ Pode gerenciar usuários, figurinhas e conquistas', 'green');
  
  log('\n🛡️ Admins com Role no Banco:', 'blue');
  log('   ✅ Podem criar figurinhas e conquistas', 'green');
  log('   ✅ Podem gerenciar metas customizadas', 'green');
  log('   ❌ Não podem gerenciar outros usuários', 'red');
  
  log('\n👤 Usuários Normais (Employees):', 'blue');
  log('   ✅ Podem ler apenas seus próprios dados', 'green');
  log('   ✅ Podem visualizar metas customizadas', 'green');
  log('   ❌ Não podem criar figurinhas ou conquistas', 'red');
  
  log('\n🗂️ Coleções Protegidas:', 'yellow');
  log('   📁 users - Dados dos usuários', 'bright');
  log('   🎴 stickers - Figurinhas dos usuários', 'bright');
  log('   🏆 achievements - Conquistas dos usuários', 'bright');
  log('   🎯 customAchievements - Metas customizadas', 'bright');
}

function showDeployInstructions() {
  log('\n🚀 COMO APLICAR AS REGRAS', 'cyan');
  log('========================', 'cyan');
  
  log('\n📝 Método 1 - Firebase Console (Recomendado):', 'yellow');
  log('   1. Acesse: https://console.firebase.google.com/', 'bright');
  log('   2. Selecione o projeto: sistema-figuras', 'bright');
  log('   3. Vá para: Firestore Database > Rules', 'bright');
  log('   4. Copie o conteúdo de firestore.rules', 'bright');
  log('   5. Cole no editor e clique em "Publish"', 'bright');
  
  log('\n💻 Método 2 - Firebase CLI:', 'yellow');
  log('   1. npm install -g firebase-tools', 'bright');
  log('   2. firebase login', 'bright');
  log('   3. firebase init firestore (se necessário)', 'bright');
  log('   4. firebase deploy --only firestore:rules', 'bright');
  
  log('\n🧪 Método 3 - Testar Localmente:', 'yellow');
  log('   1. firebase firestore:rules:test --project=sistema-figuras', 'bright');
}

function showTestCases() {
  log('\n🧪 CASOS DE TESTE SUGERIDOS', 'cyan');
  log('============================', 'cyan');
  
  log('\n✅ Teste 1 - Admin acessando todos os dados:', 'green');
  log('   Auth: marketing2@avalyst.com.br', 'bright');
  log('   Path: /users/any_user_id', 'bright');
  log('   Operation: read', 'bright');
  log('   Esperado: Allow', 'green');
  
  log('\n✅ Teste 2 - Usuário acessando próprios dados:', 'green');
  log('   Auth: user@avalyst.com', 'bright');
  log('   Path: /users/{user_uid}', 'bright');
  log('   Operation: read', 'bright');
  log('   Esperado: Allow', 'green');
  
  log('\n❌ Teste 3 - Usuário tentando acessar dados de outro:', 'red');
  log('   Auth: user@avalyst.com', 'bright');
  log('   Path: /users/other_user_uid', 'bright');
  log('   Operation: read', 'bright');
  log('   Esperado: Deny', 'red');
  
  log('\n❌ Teste 4 - Usuário tentando criar figurinha:', 'red');
  log('   Auth: user@avalyst.com', 'bright');
  log('   Path: /stickers/new_sticker', 'bright');
  log('   Operation: create', 'bright');
  log('   Esperado: Deny', 'red');
}

function main() {
  log('🔒 FIRESTORE SECURITY RULES DEPLOYMENT', 'cyan');
  log('======================================', 'cyan');
  
  // Validar arquivo de regras
  if (!validateRulesFile()) {
    process.exit(1);
  }
  
  // Mostrar resumo
  showRulesSummary();
  
  // Mostrar instruções de deploy
  showDeployInstructions();
  
  // Mostrar casos de teste
  showTestCases();
  
  log('\n⚡ PRÓXIMOS PASSOS:', 'cyan');
  log('==================', 'cyan');
  log('1. Copie o conteúdo de firestore.rules', 'bright');
  log('2. Acesse o Firebase Console', 'bright');
  log('3. Aplique as regras na aba Rules', 'bright');
  log('4. Teste no Rules Playground', 'bright');
  log('5. Monitore os logs de segurança', 'bright');
  
  log('\n🎉 Regras prontas para deploy!', 'green');
}

// Executar script
if (require.main === module) {
  main();
}

module.exports = {
  validateRulesFile,
  showRulesSummary,
  showDeployInstructions,
  showTestCases
};