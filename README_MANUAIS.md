# 📚 COMO USAR OS MANUAIS NO CURSOR

Este repositório contém 2 manuais completos para geração automática de roteiros bíblicos usando o Cursor AI.

---

## 📁 ARQUIVOS DISPONÍVEIS

### 1. [MANUAL_CRIATIVO.md](MANUAL_CRIATIVO.md)
**O QUE É**: Diretrizes completas de escrita, formato e estilo para cada tipo de documento.

**QUANDO USAR**: Sempre que precisar entender:
- Como cada documento deve ser escrito
- Regras de escrita bíblica
- Formato e estrutura de cada arquivo
- Diretrizes narrativas

**TAMANHO**: ~450 linhas de instruções criativas

---

### 2. [MANUAL_PROCEDURAL.md](MANUAL_PROCEDURAL.md)
**O QUE É**: Passo a passo técnico completo que o Cursor deve seguir.

**QUANDO USAR**: Para implementar a geração automática:
- Ordem correta de geração dos documentos
- Prompts exatos para Claude API
- Configurações de cada chamada
- Processamento e validação de resultados
- Tratamento de erros

**TAMANHO**: ~800 linhas de instruções técnicas

---

## 🚀 COMO USAR NO CURSOR

### Opção 1: Fornecer Ambos os Manuais
```
@MANUAL_CRIATIVO.md @MANUAL_PROCEDURAL.md

Gere um roteiro completo sobre "A História de Davi" seguindo EXATAMENTE
os manuais fornecidos. Use os seguintes parâmetros:

- Título: A História de Davi
- Sinopse: A trajetória de Davi desde pastor até rei de Israel
- Tópicos: 3
- Subtópicos por tópico: 8
- Total de caracteres: 9000
- Caracteres do hook: 800
- Idioma: pt
```

### Opção 2: Usar em Etapas
**Primeiro**: Ler o manual criativo
```
@MANUAL_CRIATIVO.md

Leia e confirme que entendeu as diretrizes de escrita bíblica.
```

**Depois**: Executar com o manual procedural
```
@MANUAL_PROCEDURAL.md

Agora gere o roteiro seguindo o fluxo completo de 9 etapas.
Use os parâmetros: [...]
```

### Opção 3: Documentos Individuais
Se quiser gerar apenas um tipo de documento:

```
@MANUAL_CRIATIVO.md

Gere APENAS o documento de PERSONAGENS para o seguinte roteiro:
[colar roteiro aqui]

Siga EXATAMENTE a seção "👥 DOCUMENTO 6: PERSONAGENS" do manual.
```

---

## 📋 PARÂMETROS DE ENTRADA

Sempre forneça estes parâmetros ao Cursor:

```javascript
{
  // OBRIGATÓRIOS
  title: "Título do vídeo",
  synopsis: "Sinopse breve do tema",
  numTopics: 3,              // Número de tópicos
  numSubtopics: 8,           // Subtópicos por tópico
  totalChars: 9000,          // Total de caracteres do roteiro
  hookChars: 800,            // Caracteres da introdução
  language: "pt",            // pt, en ou es

  // OPCIONAIS
  knowledgeBase: "Contexto adicional",  // Se tiver
  model: "claude-sonnet-4-20250514",    // Modelo Claude
  tipoConteudo: "historias"             // historias, curiosidades, estudos, personagens
}
```

---

## 🎯 DOCUMENTOS GERADOS

Seguindo os manuais, o Cursor gerará 10 arquivos:

1. **00_estrutura.txt** - Esqueleto (tópicos e subtópicos)
2. **01_hook.txt** - Introdução imersiva
3. **02_topico1.txt** - Primeiro tópico desenvolvido
4. **03_topico2.txt** - Segundo tópico desenvolvido
5. **04_topico3.txt** - Terceiro tópico desenvolvido
6. **05_conclusao.txt** - CTA final
7. **06_blocos.txt** - Roteiro dividido em blocos
8. **07_trilha_sonora.txt** - Orientações musicais
9. **08_personagens.txt** - Descrições físicas para IA
10. **09_roteiro.srt** - Legendas com timecode
11. **10_takes.txt** - Prompts de imagem por bloco

**BÔNUS**: `roteiro_completo.txt` - Hook + Tópicos + Conclusão juntos

---

## ⚡ DICAS IMPORTANTES

### 1. Leia o Manual Criativo Primeiro
O Cursor precisa entender as **DIRETRIZES DE ESCRITA BÍBLICA** antes de gerar.

### 2. Siga a Ordem do Manual Procedural
A ordem de geração é CRÍTICA. Não pule etapas:
```
Estrutura → Hook → Tópicos → Conclusão → Blocos → Trilha → Personagens → SRT → Takes
```

### 3. Tópicos Devem Ser Gerados Sequencialmente
⚠️ **NUNCA em paralelo!** Cada tópico precisa do contexto dos anteriores para evitar repetição.

### 4. Validação de Caracteres
Aceite variação de ±3% nos caracteres. Exemplo:
- Pediu 3000 caracteres
- Aceitável: 2910 a 3090 caracteres

### 5. Formato Limpo
TODOS os documentos devem ser:
- ❌ Sem emojis
- ❌ Sem markdown (**, ##)
- ❌ Sem caracteres especiais
- ✅ Texto puro para narração

---

## 🔧 CONFIGURAÇÃO DA API

Você precisará de:

### API Key da Anthropic
```bash
export ANTHROPIC_API_KEY="sua-chave-aqui"
```

### Instalar SDK (se necessário)
```bash
npm install @anthropic-ai/sdk
```

### Modelos Disponíveis
- `claude-sonnet-4-20250514` ⭐ Recomendado (custo-benefício)
- `claude-opus-4-20250514` (máxima qualidade, caro)
- `claude-haiku-4-20250514` (rápido, econômico)

---

## 💰 CUSTO ESTIMADO

Por roteiro completo:
- **Custo**: ~$0.10-$0.15
- **Tempo**: ~90-120 segundos
- **Blocos**: ~150 blocos (para 9000 caracteres)

---

## 📊 EXEMPLO DE USO COMPLETO

```
@MANUAL_CRIATIVO.md @MANUAL_PROCEDURAL.md

Gere um roteiro bíblico completo seguindo EXATAMENTE ambos os manuais.

PARÂMETROS:
- Título: O Êxodo de Israel
- Sinopse: A libertação do povo de Israel da escravidão no Egito sob a liderança de Moisés
- Tópicos: 3
- Subtópicos: 8
- Total de caracteres: 9000
- Hook: 800 caracteres
- Idioma: pt
- Modelo: claude-sonnet-4-20250514

INSTRUÇÕES:
1. Leia ambos os manuais completamente
2. Siga o fluxo das 9 etapas do Manual Procedural
3. Aplique TODAS as diretrizes de escrita do Manual Criativo
4. Salve cada documento gerado em arquivo separado
5. Valide cada etapa antes de continuar
6. Mostre progresso após cada documento gerado

CRÍTICO:
- Fidelidade bíblica ABSOLUTA (não invente nada)
- Texto LIMPO sem markdown/emojis
- Linguagem SIMPLES para crianças entenderem
- Gere tópicos SEQUENCIALMENTE (um por vez)
- Valide caracteres (97%-103% do esperado)

Comece!
```

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### "O Cursor não está seguindo as diretrizes"
→ Seja mais explícito: `Siga EXATAMENTE a seção X do MANUAL_CRIATIVO.md`

### "Tópicos ficaram muito curtos/longos"
→ Verifique se está usando a fórmula: `totalChars / numTopics`

### "JSON inválido nos takes"
→ O Manual Procedural tem tratamento de erro. Implemente a limpeza de JSON.

### "Personagens não encontrados nos takes"
→ Use a função `findCharacter()` do manual com sistema de traduções.

### "Geração muito lenta"
→ Use `claude-haiku-4-20250514` para testes (mais rápido e barato).

---

## 📝 NOTAS FINAIS

### Esses manuais foram extraídos de:
- Sistema em produção v4.8.1
- 100% testado e funcional
- Usado para geração de roteiros bíblicos para YouTube

### Idiomas suportados:
- ✅ Português Brasileiro (pt)
- ✅ English (en)
- ✅ Español (es)

### Personalizável:
Você pode adaptar os prompts no Manual Procedural para:
- Outros tipos de conteúdo (não apenas bíblico)
- Diferentes estruturas narrativas
- Tamanhos variados de roteiro

---

## 🎓 APRENDIZADO GRADUAL

Se você é novo nisso, comece assim:

**Nível 1**: Gere apenas estrutura + hook
**Nível 2**: Adicione geração de 1 tópico
**Nível 3**: Gere todos os 3 tópicos
**Nível 4**: Adicione conclusão e blocos
**Nível 5**: Adicione trilha e personagens
**Nível 6**: Complete com SRT e takes

---

## 💡 DICA PRO

Crie um arquivo `.cursorrules` no seu workspace com:

```
# Geração de Roteiros Bíblicos

Sempre que gerar roteiros:
1. Consulte @MANUAL_CRIATIVO.md para diretrizes
2. Siga @MANUAL_PROCEDURAL.md para ordem de execução
3. Valide formato: sem emojis, sem markdown
4. Valide caracteres: 97%-103% do esperado
5. Fidelidade bíblica absoluta
```

---

**Boa geração de roteiros! 🎬📖**

---

Criado em: 2025-11-19
Versão dos Manuais: 4.8.1
Repositório: gerador-de-roteiros-lunar
