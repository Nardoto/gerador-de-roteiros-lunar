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
        password: '$2b$10$6mF5Em8TKqNWnTeF3Na1WuAxOUxeTBCYPPnp8BkHYLdPOMfCje90m',
        email: 'admin@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 2,
        username: 'Diego',
        password: '$2b$10$/ju5eesqCeT2ICYYsRr7pO2rHw9u7bWAaXUKsXKltMg5Lmti6zywq',
        email: 'diego@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 3,
        username: 'Lucas',
        password: '$2b$10$X9d1Lpr56JTLbvi1AYc.q.zC5LLChyqifBlgKt7.3di.ZQDaonCRG',
        email: 'lucas@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 4,
        username: 'Nardoto',
        password: '$2b$10$DD8yWSH23tlT5g8P5UumZeoEW1aitzON0s6IzMk.Royc9FbtsMXg2',
        email: 'nardoto@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 5,
        username: 'Gabriel',
        password: '$2b$10$SQOoENsdNn0m2l4K1/K7DuPABDP1ea3f5Dd/JSNjceyNq1UY2hmf.',
        email: 'gabriel@email.com',
        createdAt: '2025-11-14'
      },
      {
        id: 6,
        username: 'Tayler',
        password: '$2b$10$3WwFUVtk/r1ofnANsXm0hOGfwoC4Uo2VqNcmVDDKK08FY10g3N36S',
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
