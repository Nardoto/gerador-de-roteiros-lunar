const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Chave secreta para assinar tokens JWT (usar variável de ambiente em produção)
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-mude-isso-' + Math.random().toString(36);

// Carregar usuários de variável de ambiente ou usar usuários padrão
function loadUsers() {
  // Tentar carregar de variável de ambiente primeiro
  if (process.env.USERS_JSON) {
    try {
      return JSON.parse(process.env.USERS_JSON);
    } catch (error) {
      console.error('Erro ao parsear USERS_JSON:', error);
    }
  }

  // Usuários padrão (quando USERS_JSON não está configurado)
  return {
    users: [
      {
        id: 1,
        username: 'admin',
        password: '$2b$10$3wvl9y5dnNrf9WImRotbUOfraNpCaQzVbS5Gy2WJZ6xevtmgQ6Uku',
        email: 'admin@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 2,
        username: 'Diego',
        password: '$2b$10$QDQfmORKU/OSesmcVaZxZuf5z81wMf1CZpspspDjAzkZYksPjXPqi',
        email: 'diego@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 3,
        username: 'Lucas',
        password: '$2b$10$3FuZytkiTFDhI2jEZdnEOeSINosCrZn2Kc1qO1ZmzLnvSSCY9tM1y',
        email: 'lucas@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 4,
        username: 'Nardoto',
        password: '$2b$10$a/TYsnavAz6aqVbT06Qw1.T0U8bB.Ps1MrSi3xqE0X2oKw4dyskUK',
        email: 'nardoto@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 5,
        username: 'Gabriel',
        password: '$2b$10$w.u2VQKlkpi2v4NCNdgXnO7Qh3gCvoi9aNKaC.1mQsJP7CvfEZzoi',
        email: 'gabriel@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 6,
        username: 'Tayler',
        password: '$2b$10$hipxJCdkdctwaYXTvh6Aju1eh8zodxsj03i.3iQt5rPTbjQ2V7rZS',
        email: 'tayler@email.com',
        createdAt: '2025-11-14'
      }
    ]
  };
}

// Fazer login
function login(username, password) {
  const usersData = loadUsers();

  // Buscar usuário
  const user = usersData.users.find(u =>
    u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    return { success: false, message: 'Usuário não encontrado' };
  }

  // Verificar senha
  const passwordMatch = bcrypt.compareSync(password, user.password);

  if (!passwordMatch) {
    return { success: false, message: 'Senha incorreta' };
  }

  // Gerar token JWT (expira em 24 horas)
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  };
}

// Verificar token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Middleware para proteger rotas
function authMiddleware(req, res, next) {
  // Pegar token do header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Token não fornecido' }));
    return;
  }

  // Formato: "Bearer TOKEN"
  const token = authHeader.split(' ')[1];

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Token inválido' }));
    return;
  }

  // Verificar token
  const result = verifyToken(token);

  if (!result.valid) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Token expirado ou inválido' }));
    return;
  }

  // Adicionar usuário na requisição
  req.user = result.user;
  next();
}

module.exports = {
  login,
  verifyToken,
  authMiddleware
};
