const bcrypt = require('bcrypt');

// ==================================================
// EDITE AQUI: Defina as senhas para cada usuário
// ==================================================
const novosUsuarios = [
  { username: 'Diego', senha: 'diego123', email: 'diego@email.com' },
  { username: 'Lucas', senha: 'lucas123', email: 'lucas@email.com' },
  { username: 'Nardoto', senha: 'nardoto123', email: 'nardoto@email.com' }
];

console.log('\n🔐 Gerando hashes de senha...\n');

// Gerar JSON completo com admin + novos usuários
const users = {
  users: [
    // Admin padrão (você)
    {
      id: 1,
      username: 'admin',
      password: '$2b$10$wbNP1Uf7ZhLHEpgYhn/CYu5YXv8jw.4RqH8r0gE7KqPvLc7h1ZXUC',
      email: 'admin@email.com',
      createdAt: '2025-11-13'
    },
    // Novos usuários
    ...novosUsuarios.map((u, i) => ({
      id: i + 2,
      username: u.username,
      password: bcrypt.hashSync(u.senha, 10),
      email: u.email,
      createdAt: new Date().toISOString().split('T')[0]
    }))
  ]
};

// Mostrar resumo
console.log('✅ Usuários criados:\n');
console.log('┌─────────────────────────────────────────┐');
console.log('│ ID │ Username  │ Senha        │');
console.log('├─────────────────────────────────────────┤');
console.log('│ 1  │ admin     │ senha123     │ (você)');
novosUsuarios.forEach((u, i) => {
  const username = u.username.padEnd(9);
  const senha = u.senha.padEnd(12);
  console.log(`│ ${i + 2}  │ ${username} │ ${senha} │`);
});
console.log('└─────────────────────────────────────────┘');

console.log('\n📋 COPIE O JSON ABAIXO (CTRL+C):\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(JSON.stringify(users));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n\n📌 PRÓXIMOS PASSOS:\n');
console.log('1. Copie o JSON acima (a linha inteira)');
console.log('2. Vá em: https://vercel.com/nardotos-projects/gerador-de-roteiros-lunar/settings/environment-variables');
console.log('3. Clique em "Add More"');
console.log('4. Key: USERS_JSON');
console.log('5. Value: [COLE O JSON AQUI]');
console.log('6. Clique em "Save"');
console.log('7. Aguarde 1-2 minutos (redeploy automático)');
console.log('8. Pronto! Envie o link e as senhas para seus amigos:\n');
console.log('   🔗 Link: https://gerador-de-roteiros-lunar.vercel.app\n');
novosUsuarios.forEach(u => {
  console.log(`   👤 ${u.username}: ${u.senha}`);
});
console.log('\n');
