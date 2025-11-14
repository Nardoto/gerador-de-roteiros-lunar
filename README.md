# 🎬 Gerador de Roteiros - Teste Local

App simples para testar o gerador de roteiros localmente, sem precisar fazer deploy no Git toda hora.

## 🚀 Como Usar

### 1. Instalar dependências:
```bash
cd "C:\Users\tharc\Videos\GERADOR PROFISSIONAL DE ROTEIROS\local-test"
npm install
```

### 2. Iniciar servidor:
```bash
npm start
```

### 3. Abrir no navegador:
```
http://localhost:3000
```

## 📝 Funcionalidades

- **API do Claude hardcoded**: não precisa configurar nada
- **Interface minimalista**: só os campos essenciais
- **Conversa visível**: acompanhe cada step da IA
- **Downloads**: baixe cada arquivo gerado
- **Sem banco de dados**: tudo em memória
- **Sem autenticação**: foco em testar a geração

## ⚙️ Configurações Padrão

- **Tópicos**: 3
- **Subtópicos**: 8
- **Caracteres Hook**: 1000
- **Caracteres Totais**: 20000

Você pode mudar esses valores na interface!

## 🔧 O que ele faz

1. Gera a estrutura com os tópicos
2. Gera o hook/introdução
3. Gera cada tópico individualmente
4. Mostra todo o progresso em tempo real
5. Permite baixar cada arquivo

## 💡 Vantagens

- ✅ Testa localmente sem subir no Git
- ✅ Vê logs detalhados no terminal
- ✅ Modifica e testa rapidamente
- ✅ Debug fácil

## 📊 Logs

O terminal mostra logs detalhados:
- Estrutura gerada
- Marcadores encontrados
- Tópicos extraídos
- Progresso de cada step

Quando funcionar 100%, aí sim colocamos no site de produção!
