# 🚀 Deploy no Vercel - Gerador de Roteiros

## Por que Vercel?

- Você JÁ usa Vercel para roteiros.nardoto.com.br
- GRATUITO (plano hobby)
- Deploy automático a cada git push
- SEMPRE online (não dorme como Render free)
- Domínio .nardoto.com.br (profissional)
- Serverless Functions (escala automaticamente)

---

## 📋 O que foi Adaptado

Seu código foi convertido de servidor Node.js tradicional para Serverless Functions do Vercel:

### Estrutura Antiga (local):
```
gerador-de-roteiros-lunar/
├── server.js          ← Servidor HTTP tradicional
├── index.html         ← Frontend
├── login.html
├── auth.js            ← Autenticação
└── users.json         ← Banco de dados
```

### Estrutura Nova (Vercel):
```
gerador-de-roteiros-lunar/
├── api/               ← Serverless Functions
│   ├── login.js
│   ├── verify-token.js
│   ├── gerar.js
│   ├── gerar-trilha.js
│   ├── gerar-personagens.js
│   ├── gerar-takes.js
│   └── auth.js        ← Módulo auxiliar
├── public/            ← Arquivos estáticos
│   ├── index.html
│   └── login.html
└── vercel.json        ← Configuração
```

---

## 🎯 Passo a Passo para Deploy

### PASSO 1: Verificar Repositório no GitHub

Seu código já está em: https://github.com/Nardoto/gerador-de-roteiros-lunar

### PASSO 2: Acessar Vercel

1. Vá em: https://vercel.com
2. Faça login com sua conta do GitHub (a mesma que usa para roteiros.nardoto.com.br)
3. Você verá seus projetos existentes

### PASSO 3: Importar Novo Projeto

1. Clique em **"Add New..." → "Project"**
2. Na lista de repositórios, encontre **"gerador-de-roteiros-lunar"**
3. Clique em **"Import"**

### PASSO 4: Configurar Projeto

**Framework Preset:**
```
Other
```
(Vercel detecta automaticamente as serverless functions)

**Root Directory:**
```
./
```
(deixe em branco ou use ./

)

**Build Command:**
```
# Deixe em branco (não precisa)
```

**Output Directory:**
```
public
```

**Install Command:**
```
npm install
```

### PASSO 5: Configurar Variáveis de Ambiente

⚠️ **MUITO IMPORTANTE!**

Antes de fazer deploy, configure as variáveis de ambiente:

1. Ainda na página de configuração, role até **"Environment Variables"**
2. Adicione as seguintes variáveis:

**Variable 1:**
```
Name: ANTHROPIC_API_KEY
Value: [SUA API KEY DA ANTHROPIC]
```

**Variable 2:**
```
Name: JWT_SECRET
Value: [QUALQUER STRING ALEATÓRIA SEGURA]
```
Exemplo: `minha-chave-jwt-super-secreta-12345-mudar-em-producao`

**Variable 3 (OPCIONAL - Para adicionar mais usuários):**
```
Name: USERS_JSON
Value: {"users":[{"id":1,"username":"admin","password":"$2b$10$wbNP1Uf7ZhLHEpgYhn/CYu5YXv8jw.4RqH8r0gE7KqPvLc7h1ZXUC","email":"admin@email.com"}]}
```

### PASSO 6: Deploy!

1. Clique em **"Deploy"**
2. Aguarde 1-2 minutos enquanto Vercel:
   - Instala dependências (npm install)
   - Prepara serverless functions
   - Deploy em produção
3. Quando aparecer "🎉 Congratulations", está pronto!

---

## 🌐 Acessar o Gerador

Após o deploy, você terá uma URL assim:

```
https://gerador-de-roteiros-lunar.vercel.app
```

### Configurar Domínio Personalizado (nardoto.com.br)

1. No painel do Vercel, vá em **Settings → Domains**
2. Clique em **"Add"**
3. Digite: `gerador.nardoto.com.br` (ou o subdomínio que quiser)
4. Siga as instruções para configurar DNS

Resultado final:
```
https://gerador.nardoto.com.br
```

---

## 🔑 Login no Sistema

### Usuário Padrão

```
Username: admin
Senha: senha123
Email: admin@email.com
```

### Como Adicionar Mais Usuários

#### Opção 1: Via Variável de Ambiente (RECOMENDADO)

1. No painel Vercel, vá em **Settings → Environment Variables**
2. Edite ou adicione `USERS_JSON`
3. Use este formato:

```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "password": "$2b$10$wbNP1Uf7ZhLHEpgYhn/CYu5YXv8jw.4RqH8r0gE7KqPvLc7h1ZXUC",
      "email": "admin@email.com"
    },
    {
      "id": 2,
      "username": "joao",
      "password": "[HASH BCRYPT AQUI]",
      "email": "joao@email.com"
    }
  ]
}
```

**Como gerar hash de senha:**

Execute localmente:
```javascript
const bcrypt = require('bcrypt');
console.log(bcrypt.hashSync('suasenha', 10));
```

4. Salve e faça redeploy (Vercel faz automaticamente)

#### Opção 2: Migrar para Vercel KV (Futuro)

Se precisar de muitos usuários ou permitir cadastro, migre para [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (banco chave-valor grátis).

---

## 🔄 Atualizar o Código

Quando você fizer mudanças:

1. **Localmente:**
```bash
git add .
git commit -m "Descrição da mudança"
git push
```

2. **Vercel:**
   - Detecta push automaticamente
   - Faz build e deploy em 1-2 minutos
   - Sem precisar fazer nada manualmente!

3. **Acompanhar:**
   - Vá em https://vercel.com/dashboard
   - Veja logs do deploy em tempo real

---

## 📊 Monitorar Funcionamento

### Ver Logs

1. Painel Vercel → Seu projeto
2. Aba **"Logs"**
3. Filtre por:
   - Runtime Logs (erros de execução)
   - Build Logs (erros de deploy)

### Ver Uso/Estatísticas

1. Aba **"Analytics"**
   - Requisições por segundo
   - Latência
   - Erros

---

## ⚠️ Limitações do Plano FREE

- ✅ 100GB bandwidth/mês
- ✅ 100GB-hours serverless execution
- ✅ SEMPRE online (não dorme)
- ✅ Deploy ilimitado
- ⚠️ Timeout de 10 segundos por função (pode aumentar no plano pago)
  - Geração de roteiros longos pode dar timeout
  - Solução: Gerar em tópicos menores ou upgrade plano Pro ($20/mês)

---

## 🐛 Problemas Comuns

### "Application Error" ao acessar

**Causa:** Faltou configurar variável ANTHROPIC_API_KEY

**Solução:**
1. Vercel → Settings → Environment Variables
2. Adicione ANTHROPIC_API_KEY
3. Aguarde redeploy automático

### "Login failed"

**Causa:** Usuário/senha incorretos ou USERS_JSON mal formatado

**Solução:**
1. Tente: `admin` / `senha123`
2. Verifique USERS_JSON no painel Vercel
3. Veja logs de erro

### "Function timeout"

**Causa:** Geração muito longa (>10s no plano free)

**Solução:**
1. Reduza número de tópicos/caracteres
2. OU upgrade para Pro ($20/mês, timeout de 60s)

### Deploy falhou

**Causas comuns:**
- Erro de sintaxe no código
- Dependência faltando em package.json
- Variável de ambiente faltando

**Solução:**
1. Veja Build Logs no Vercel
2. Corrija erro localmente
3. Git push novamente

---

## ✅ Checklist Final

Antes de compartilhar com seus amigos:

- [ ] Deploy concluído com sucesso
- [ ] URL acessível (abre página de login)
- [ ] Variável ANTHROPIC_API_KEY configurada
- [ ] Consegue fazer login com admin/senha123
- [ ] Consegue gerar um roteiro de teste
- [ ] (Opcional) Domínio personalizado configurado
- [ ] (Opcional) Criou usuários para amigos

---

## 🔐 Segurança

✅ **O que está seguro:**
- API key da Anthropic (variável de ambiente)
- Senhas criptografadas com bcrypt
- JWT para autenticação
- HTTPS automático
- Código versionado no GitHub (sem segredos)

⚠️ **Avisos:**
- Não compartilhe sua API key da Anthropic
- Não versione users.json com senhas no Git (já está no .gitignore)
- Troque JWT_SECRET em produção
- Monitore uso da API (custos)

---

## 📚 Recursos

- Documentação Vercel: https://vercel.com/docs
- Serverless Functions: https://vercel.com/docs/functions/serverless-functions
- Variáveis de Ambiente: https://vercel.com/docs/projects/environment-variables
- Domínios Personalizados: https://vercel.com/docs/projects/domains

---

## 🎉 Pronto!

Seu gerador de roteiros está:
- ✅ Online 24/7
- ✅ Acessível de qualquer lugar
- ✅ Com domínio profissional
- ✅ Deploy automático
- ✅ Escalável e seguro

**Compartilhe a URL com seus amigos e bom trabalho!**

```
https://gerador.nardoto.com.br
ou
https://gerador-de-roteiros-lunar.vercel.app
```

Login padrão: `admin` / `senha123`
