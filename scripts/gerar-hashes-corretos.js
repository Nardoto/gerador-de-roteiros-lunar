const bcrypt = require('bcrypt');
const fs = require('fs');

console.log('\n=== GERANDO HASHES CORRETOS ===\n');

const usuarios = [
  { id: 1, username: 'admin', senha: 'admin@321', email: 'admin@email.com' },
  { id: 2, username: 'Diego', senha: 'diego@321', email: 'diego@email.com' },
  { id: 3, username: 'Lucas', senha: 'lucas@321', email: 'lucas@email.com' },
  { id: 4, username: 'Nardoto', senha: 'nardoto@321', email: 'nardoto@email.com' },
  { id: 5, username: 'Gabriel', senha: 'gabriel@321', email: 'gabriel@email.com' },
  { id: 6, username: 'Tayler', senha: 'tayler@321', email: 'tayler@email.com' }
];

// Gerar hashes síncronos
const users = usuarios.map(u => {
  const hash = bcrypt.hashSync(u.senha, 10);
  console.log(`${u.username} → Senha: ${u.senha}`);
  console.log(`  Hash: ${hash}`);
  console.log(`  Teste: ${bcrypt.compareSync(u.senha, hash) ? '✅ OK' : '❌ ERRO'}\n`);

  return {
    id: u.id,
    username: u.username,
    password: hash,
    email: u.email,
    createdAt: new Date().toISOString().split('T')[0]
  };
});

const usersData = { users };

// Salvar em users.json
fs.writeFileSync('users.json', JSON.stringify(usersData, null, 2));

console.log('\n✅ Arquivo users.json atualizado!\n');
