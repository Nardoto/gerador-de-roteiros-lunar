# 🚀 Como Colocar o Gerador de Roteiros no Ar (ONLINE)

## Visão Geral
Este guia mostra como colocar seu gerador de roteiros ONLINE usando **Render.com** (GRATUITO) para que seus amigos possam acessar de qualquer lugar.

---

## 📋 Requisitos

1. ✅ Conta no GitHub (você já tem)
2. ✅ Código no GitHub (já está em https://github.com/Nardoto/gerador-de-roteiros-lunar)
3. ⚠️ Conta no Render.com (vamos criar agora)

---

## 🎯 Passo a Passo COMPLETO

### PASSO 1: Criar Conta no Render.com

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Escolha **"Sign up with GitHub"**
4. Autorize o Render a acessar seu GitHub
5. ✅ Pronto! Conta criada

---

### PASSO 2: Criar Novo Web Service

1. No painel do Render, clique em **"New +"** (canto superior direito)
2. Escolha **"Web Service"**
3. Clique em **"Connect a repository"**
4. Encontre **"gerador-de-roteiros-lunar"** na lista
5. Clique em **"Connect"**

---

### PASSO 3: Configurar o Serviço

Preencha os campos assim:

**Name:**
```
gerador-roteiros-lunar
```
(ou qualquer nome que você quiser - será parte da URL)

**Region:**
```
Frankfurt (Europe West)
```
(escolha o mais próximo do Brasil se tiver outra opção)

**Branch:**
```
main
```

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Instance Type:**
```
Free
```
(deixe marcado FREE - é grátis para sempre!)

---

### PASSO 4: Adicionar Variável de Ambiente (API KEY)

⚠️ **MUITO IMPORTANTE!** Sem isso não vai funcionar.

1. Role a página até encontrar **"Environment Variables"**
2. Clique em **"Add Environment Variable"**
3. Preencha:

**Key:**
```
ANTHROPIC_API_KEY
```

**Value:**
```
[COLE AQUI SUA API KEY DA ANTHROPIC]
```
(você tem a API key guardada - é aquela que começa com sk-ant-...)

---

### PASSO 5: Deploy!

1. Clique no botão **"Create Web Service"** no final da página
2. Aguarde 2-5 minutos enquanto o Render:
   - Baixa o código do GitHub
   - Instala as dependências (npm install)
   - Inicia o servidor (npm start)
3. Você verá logs aparecendo na tela
4. Quando aparecer **"Your service is live"**, está PRONTO!

---

## 🌐 Acessar o Gerador Online

Após o deploy, você terá uma URL assim:

```
https://gerador-roteiros-lunar.onrender.com
```

**Copie essa URL e compartilhe com seus amigos!**

Eles poderão:
1. Acessar a URL
2. Fazer login (com usuário que você criar)
3. Usar o gerador de roteiros
4. Tudo funcionando 100% online!

---

## 👥 Criar Usuários para Seus Amigos

Existem 2 formas:

### Opção 1: Pelo Terminal do Render (MAIS FÁCIL)

1. No painel do Render, vá em **"Shell"** (menu lateral)
2. Digite:
```bash
node add-user.js nomedoamigo senha123 email@amigo.com
```
3. Pronto! Usuário criado

### Opção 2: Editar users.json

1. No painel do Render, vá em **"Shell"**
2. Crie um usuário usando o comando acima
3. O arquivo users.json será criado automaticamente

---

## 📊 Monitorar o Gerador

### Ver Logs em Tempo Real

1. No painel do Render
2. Clique na aba **"Logs"**
3. Veja tudo que está acontecendo (logins, gerações, erros)

### Verificar se Está Online

1. Vá em **"Events"**
2. Verá: "Deploy live" = Está funcionando
3. Se der erro, os logs mostram o problema

---

## 🔄 Atualizar o Código

Quando você fizer mudanças no código:

1. Faça commit no GitHub:
```bash
git add .
git commit -m "Atualização"
git push
```

2. O Render detecta automaticamente
3. Faz deploy automático em 2-3 minutos
4. Sem precisar fazer nada manualmente!

---

## ⚠️ Limitações do Plano FREE

- ✅ 750 horas grátis por mês (suficiente para uso normal)
- ⚠️ Servidor "dorme" após 15 minutos sem uso
- ⚠️ Quando alguém acessar após dormir, demora 30-60 segundos para "acordar"
- ✅ Depois de acordar, funciona normalmente

**Solução:** Se quiser que fique sempre acordado, upgrade para plano pago ($7/mês)

---

## 🐛 Problemas Comuns

### "Application failed to respond"
- **Causa:** Faltou adicionar ANTHROPIC_API_KEY
- **Solução:** Vá em Environment > Add Variable

### "Build failed"
- **Causa:** Erro no código ou dependências
- **Solução:** Veja os logs e corrija o erro

### "Service offline"
- **Causa:** Servidor dormindo (plano free)
- **Solução:** Aguarde 30-60s ao acessar

---

## 📞 Suporte

Se tiver dúvidas:
- Documentação Render: https://render.com/docs
- Verificar logs no painel do Render
- Verificar se ANTHROPIC_API_KEY está configurada

---

## ✅ Checklist Final

Antes de compartilhar com seus amigos, verifique:

- [ ] URL está acessível (abre a página de login)
- [ ] Consegue fazer login com usuário de teste
- [ ] Consegue gerar um roteiro
- [ ] Criou usuários para seus amigos
- [ ] Testou logout e login novamente

**Está tudo funcionando? Compartilhe a URL e aproveite!** 🎉

---

## 🔐 Segurança

- ✅ API key segura (variável de ambiente)
- ✅ Senhas criptografadas (bcrypt)
- ✅ Autenticação JWT
- ✅ Código versionado no GitHub (sem senhas)

Seu gerador está seguro e pronto para produção!
