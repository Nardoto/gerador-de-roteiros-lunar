const bcrypt = require('bcrypt');
const fs = require('fs');

// ==================================================
// EDITE AQUI: Atualize senhas ou adicione usuários
// ==================================================
const USUARIOS = [
  { id: 1, username: 'admin', senha: 'admin@321', email: 'admin@email.com' },
  { id: 2, username: 'Diego', senha: 'diego@321', email: 'diego@email.com' },
  { id: 3, username: 'Lucas', senha: 'lucas@321', email: 'lucas@email.com' },
  { id: 4, username: 'Nardoto', senha: 'nardoto@321', email: 'nardoto@email.com' },
  { id: 5, username: 'Gabriel', senha: 'gabriel@321', email: 'gabriel@email.com' },
  { id: 6, username: 'Tayler', senha: 'tayler@321', email: 'tayler@email.com' }
];

console.log('\n🔐 Gerando JSON Atualizado para Vercel\n');

// Gerar users com hashes
const users = {
  users: USUARIOS.map(u => ({
    id: u.id,
    username: u.username,
    password: bcrypt.hashSync(u.senha, 10),
    email: u.email,
    createdAt: new Date().toISOString().split('T')[0]
  }))
};

// Salvar localmente
fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

console.log('✅ Usuários atualizados:\n');
console.log('┌─────────────────────────────────────────┐');
console.log('│ ID │ Username  │ Senha        │');
console.log('├─────────────────────────────────────────┤');
USUARIOS.forEach(u => {
  const username = u.username.padEnd(9);
  const senha = u.senha.padEnd(12);
  console.log(`│ ${u.id}  │ ${username} │ ${senha} │`);
});
console.log('└─────────────────────────────────────────┘');

console.log('\n📋 COPIE O JSON ABAIXO (CTRL+C):\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(JSON.stringify(users));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n\n📌 PARA ATUALIZAR NO VERCEL:\n');
console.log('1. Copie o JSON acima (a linha inteira)');
console.log('2. Vá em: https://vercel.com/nardotos-projects/gerador-de-roteiros-lunar/settings/environment-variables');
console.log('3. Edite a variável "USERS_JSON"');
console.log('4. Cole o JSON copiado');
console.log('5. Clique em "Save"');
console.log('6. Aguarde 1-2 minutos (redeploy automático)');
console.log('7. Pronto! Senhas atualizadas!\n');
