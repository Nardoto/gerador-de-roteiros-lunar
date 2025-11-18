# 🎬 Gerador de Roteiros Lunar

Sistema profissional de geração de roteiros bíblicos com IA (Claude), autenticação de usuários e interface minimalista.

## 🌐 Acesso

**Produção:** https://gerador-de-roteiros-lunar.vercel.app

## 📁 Estrutura do Projeto

```
gerador-de-roteiros-lunar/
├── api/                    # APIs serverless (Vercel Functions)
│   ├── gerar.js           # API principal de geração de roteiros
│   └── login.js           # API de autenticação
├── public/                # Arquivos públicos servidos
│   ├── index.html         # Interface principal
│   └── login.html         # Página de login
├── scripts/               # Scripts utilitários
│   ├── add-user.js        # Adicionar novo usuário
│   ├── criar-usuarios.js  # Criar múltiplos usuários
│   ├── mudar-senha.js     # Alterar senha de usuário
│   └── gerar-hashes-corretos.js
├── docs/                  # Documentação
│   ├── AUTENTICACAO.md    # Guia de autenticação
│   ├── DEPLOY.md          # Guia de deploy
│   └── DEPLOY-VERCEL.md   # Deploy específico Vercel
├── auth.js                # Módulo de autenticação JWT
├── users.json             # Banco de usuários (não commitar)
├── users.json.example     # Exemplo de estrutura
├── package.json           # Dependências do projeto
└── vercel.json            # Configuração do Vercel
```

## 🚀 Instalação Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

Edite `.env` e adicione:
```
ANTHROPIC_API_KEY=sua-chave-aqui
JWT_SECRET=seu-secret-jwt-aqui
```

### 3. Criar usuário inicial
```bash
node scripts/add-user.js
```

### 4. Iniciar servidor local
```bash
npm start
```

### 5. Acessar
```
http://localhost:3000
```

## ✨ Funcionalidades

### 🎨 Interface
- ✅ Design minimalista com paleta Claude
- ✅ Largura total otimizada (sem espaços desperdiçados)
- ✅ Seleção de tipo de conteúdo (Histórias, Curiosidades, Estudos, Personagens)
- ✅ Multi-idioma (Português, Inglês, Espanhol)
- ✅ Modo Avançado para editar prompts
- ✅ Contador de duração de blocos em tempo real

### 🔐 Autenticação
- ✅ Sistema de login com JWT
- ✅ Hash de senhas com bcrypt
- ✅ Proteção de rotas
- ✅ Exibição do nome do usuário

### 🤖 Geração de Roteiros
- ✅ 4 tipos de conteúdo bíblico
- ✅ Geração em múltiplos idiomas
- ✅ Customização de prompts (Modo Avançado)
- ✅ Modo Automático (gera tudo de uma vez)
- ✅ Download individual ou completo
- ✅ Importação de blocos (uso avançado)

### 📊 Configurações Padrão
- **Idioma**: Inglês
- **Tópicos**: 3
- **Subtópicos**: 8
- **Caracteres Hook**: 1000
- **Caracteres Totais**: 20000 (roteiro falado)
- **Caracteres por Bloco**: 490 (~41s a 12 c/s)

## 🔧 Scripts Úteis

### Gerenciar Usuários
```bash
# Adicionar usuário
node scripts/add-user.js

# Criar múltiplos usuários
node scripts/criar-usuarios.js

# Mudar senha
node scripts/mudar-senha.js
```

### Deploy
```bash
# Deploy para produção
vercel --prod

# Deploy de preview
vercel
```

## 📚 Documentação

- [Autenticação](docs/AUTENTICACAO.md) - Como funciona o sistema de login
- [Deploy](docs/DEPLOY.md) - Guia geral de deploy
- [Deploy Vercel](docs/DEPLOY-VERCEL.md) - Deploy específico para Vercel

## 🎯 Tipos de Conteúdo

1. **📖 Histórias Bíblicas** - Narrativa cronológica imersiva
2. **💡 Curiosidades Bíblicas** - Fatos interessantes e surpreendentes
3. **📚 Estudos Bíblicos** - Análise teológica profunda
4. **👤 Perfis de Personagens** - Biografia e caráter de personagens

## 🌍 Idiomas Suportados

- 🇧🇷 Português (Brasil)
- 🇺🇸 English (Inglês)
- 🇪🇸 Español (Espanhol)

## 📦 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js (Serverless Functions)
- **IA**: Anthropic Claude API
- **Autenticação**: JWT + bcrypt
- **Deploy**: Vercel
- **Banco de Dados**: JSON (users.json)

## 🔒 Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ Variáveis de ambiente protegidas
- ✅ CORS configurado
- ✅ `.env` e `users.json` no `.gitignore`

## 🚨 Importante

**NUNCA commitar:**
- `.env` (chaves de API)
- `users.json` (dados de usuários)
- `node_modules/` (dependências)

Esses arquivos estão no `.gitignore` para sua segurança!

---

Desenvolvido com ❤️ por Nardoto
