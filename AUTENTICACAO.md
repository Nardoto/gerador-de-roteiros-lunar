# 🔐 Sistema de Autenticação - Guia Rápido

## ✅ Pronto para Usar!

O sistema de autenticação já está funcionando!

---

## 📝 Como Adicionar Novos Usuários

### Opção 1: Via Linha de Comando (RECOMENDADO)

Abra o terminal na pasta do projeto e rode:

```bash
node add-user.js nomedousuario senha email@exemplo.com
```

**Exemplo:**
```bash
node add-user.js tharcisio minhasenha123 tharcisio@email.com
```

Saída esperada:
```
🔐 Criptografando senha...

✅ Usuário criado com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Username: tharcisio
📧 Email: tharcisio@email.com
🆔 ID: 2
📅 Criado em: 2025-11-13
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Validações Automáticas:
- Username deve ter no mínimo 3 caracteres
- Senha deve ter no mínimo 6 caracteres
- Email deve conter @
- Não pode haver username ou email duplicado

---

## 🔑 Usuário Já Criado

Já existe um usuário de teste:

```
Username: admin
Senha: senha123
Email: admin@email.com
```

---

## 🚀 Como Usar o Sistema

1. **Iniciar o Servidor**
   ```bash
   node server.js
   ```

2. **Acessar no Navegador**
   ```
   http://localhost:3000
   ```
   → Vai abrir automaticamente a página de login

3. **Fazer Login**
   - Digite username e senha
   - Clique em "Entrar"
   - Será redirecionado para o gerador

4. **Fazer Logout**
   - Clique no botão "🚪 Sair" no canto superior direito

---

## 🔒 Como Funciona a Segurança

### 1. Senhas Criptografadas
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "password": "$2b$10$wbNP1Uf7ZhLHEpgYhn/CYu...",  // ← hash bcrypt (impossível descriptografar)
      "email": "admin@email.com"
    }
  ]
}
```

### 2. Token JWT
- Após login bem-sucedido, servidor gera um **token JWT**
- Token é salvo no `localStorage` do navegador
- Token expira em 24 horas
- A cada requisição, browser envia token no header

### 3. Middleware de Proteção
- Todas as rotas de API verificam se token é válido
- Se token inválido/expirado → redireciona para login
- Se sem token → não consegue acessar gerador

---

## 📂 Arquivos Criados

```
local-test/
├── users.json          ← Banco de dados de usuários
├── auth.js             ← Funções de autenticação (login, verificar token)
├── add-user.js         ← Script para adicionar usuários
├── login.html          ← Página de login
├── index.html          ← Gerador (protegido)
└── server.js           ← Servidor com rotas de autenticação
```

---

## 🛠️ Gerenciar Usuários

### Ver todos os usuários
Abra `users.json` para ver a lista:
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "password": "$2b$10$...",
      "email": "admin@email.com",
      "createdAt": "2025-11-13"
    }
  ]
}
```

### Deletar um usuário
Edite `users.json` e remova o objeto do usuário.

### Resetar senha de um usuário
1. Delete o usuário de `users.json`
2. Crie novamente com `node add-user.js`

---

## ⚠️ Importante

- **NÃO compartilhe o arquivo `users.json`** (contém senhas criptografadas)
- **NÃO versione `users.json` no git** (adicione ao `.gitignore`)
- Token expira em 24 horas (usuário precisa fazer login novamente)
- Senhas são criptografadas com bcrypt (salt de 10 rounds)

---

## 🎯 Resumo

**Para adicionar novo usuário:**
```bash
node add-user.js nome senha email
```

**Para acessar o sistema:**
```
http://localhost:3000
→ Login (username + senha)
→ Gerar roteiros normalmente
→ Logout quando terminar
```

**Localização dos arquivos:**
- Usuários: `users.json`
- Autenticação: `auth.js`
- Adicionar user: `add-user.js`

Pronto! Sistema 100% funcional e seguro! 🎉
