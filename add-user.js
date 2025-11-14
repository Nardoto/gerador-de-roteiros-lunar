const fs = require('fs');
const bcrypt = require('bcrypt');

// Validar argumentos
if (process.argv.length < 5) {
  console.log('\n❌ Uso incorreto!');
  console.log('\n📝 Como usar:');
  console.log('   node add-user.js <username> <senha> <email>\n');
  console.log('📌 Exemplo:');
  console.log('   node add-user.js tharcisio minhasenha123 tharcisio@email.com\n');
  process.exit(1);
}

const username = process.argv[2];
const password = process.argv[3];
const email = process.argv[4];

// Validações básicas
if (username.length < 3) {
  console.log('❌ Username deve ter pelo menos 3 caracteres');
  process.exit(1);
}

if (password.length < 6) {
  console.log('❌ Senha deve ter pelo menos 6 caracteres');
  process.exit(1);
}

if (!email.includes('@')) {
  console.log('❌ Email inválido');
  process.exit(1);
}

// Ler users.json
let usersData;
try {
  const fileContent = fs.readFileSync('users.json', 'utf8');
  usersData = JSON.parse(fileContent);
} catch (error) {
  console.log('⚠️ Arquivo users.json não encontrado, criando novo...');
  usersData = { users: [] };
}

// Verificar se usuário já existe
const userExists = usersData.users.find(u =>
  u.username.toLowerCase() === username.toLowerCase() ||
  u.email.toLowerCase() === email.toLowerCase()
);

if (userExists) {
  console.log('❌ Usuário ou email já existe!');
  process.exit(1);
}

// Gerar hash da senha (bcrypt)
console.log('🔐 Criptografando senha...');
const passwordHash = bcrypt.hashSync(password, 10);

// Criar novo usuário
const newUser = {
  id: usersData.users.length + 1,
  username: username,
  password: passwordHash,
  email: email,
  createdAt: new Date().toISOString().split('T')[0]
};

// Adicionar ao array
usersData.users.push(newUser);

// Salvar no arquivo
fs.writeFileSync('users.json', JSON.stringify(usersData, null, 2), 'utf8');

console.log('\n✅ Usuário criado com sucesso!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`👤 Username: ${username}`);
console.log(`📧 Email: ${email}`);
console.log(`🆔 ID: ${newUser.id}`);
console.log(`📅 Criado em: ${newUser.createdAt}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
