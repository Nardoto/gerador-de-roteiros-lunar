const bcrypt = require('bcrypt');
const fs = require('fs');

// ==================================================
// EDITE AQUI: Defina qual usuário e nova senha
// ==================================================
const USUARIO_PARA_MUDAR = 'Lucas'; // Nome do usuário
const NOVA_SENHA = 'novaSenha456';   // Nova senha

console.log('\n🔐 Mudando Senha de Usuário\n');
console.log(`Usuário: ${USUARIO_PARA_MUDAR}`);
console.log(`Nova senha: ${NOVA_SENHA}`);
console.log('\nGerando hash...\n');

// Gerar hash da nova senha
const novoHash = bcrypt.hashSync(NOVA_SENHA, 10);

console.log('✅ Hash gerado!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(novoHash);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Carregar users.json atual (se existir)
let users = { users: [] };
try {
  const data = fs.readFileSync('users.json', 'utf8');
  users = JSON.parse(data);
} catch (error) {
  console.log('\n⚠️  users.json não encontrado localmente');
}

// Atualizar senha do usuário
const userIndex = users.users.findIndex(u => u.username === USUARIO_PARA_MUDAR);
if (userIndex !== -1) {
  users.users[userIndex].password = novoHash;

  // Salvar users.json atualizado
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

  console.log(`\n✅ Senha de "${USUARIO_PARA_MUDAR}" atualizada em users.json (local)\n`);
} else {
  console.log(`\n⚠️  Usuário "${USUARIO_PARA_MUDAR}" não encontrado em users.json local\n`);
}

console.log('\n📋 PARA ATUALIZAR NO VERCEL (ONLINE):\n');
console.log('1. Vá em: https://vercel.com/nardotos-projects/gerador-de-roteiros-lunar/settings/environment-variables');
console.log('2. Edite a variável USERS_JSON');
console.log('3. Encontre o objeto do usuário e substitua o campo "password" pelo hash acima');
console.log('4. Salve');
console.log('5. Aguarde 1-2 minutos (redeploy automático)');
console.log('\nOu execute o script atualizar-users-json-vercel.js (mais fácil)\n');
