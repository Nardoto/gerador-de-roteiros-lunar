# MANUAL PROCEDURAL - GERAÇÃO AUTOMÁTICA DE ROTEIROS BÍBLICOS

Este documento contém o PASSO A PASSO TÉCNICO completo que o Cursor deve seguir para gerar todos os documentos do roteiro.

---

## 📁 ARQUIVOS NECESSÁRIOS

Antes de começar, você deve ter acesso a:
- `MANUAL_CRIATIVO.md` - Diretrizes de escrita e formato (leia primeiro!)
- API Key da Anthropic (Claude)

---

## 🎯 ENTRADA DO USUÁRIO

O usuário fornecerá os seguintes parâmetros:

### Parâmetros Obrigatórios
```javascript
{
  title: "Título do vídeo",
  synopsis: "Sinopse do tema a ser abordado",
  numTopics: 3,              // Número de tópicos (geralmente 3)
  numSubtopics: 8,           // Subtópicos por tópico (geralmente 8)
  totalChars: 9000,          // Total de caracteres do roteiro
  hookChars: 800,            // Caracteres do hook/introdução
  language: "pt"             // pt, en ou es
}
```

### Parâmetros Opcionais
```javascript
{
  knowledgeBase: "Contexto adicional se fornecido",
  model: "claude-sonnet-4-20250514",  // Modelo Claude a usar
  tipoConteudo: "historias"  // historias, curiosidades, estudos, personagens
}
```

---

## 📋 FLUXO COMPLETO DE GERAÇÃO

### VISÃO GERAL
```
1. ESTRUTURA       → Esqueleto (tópicos/subtópicos)
   ↓
2. HOOK            → Introdução (usa estrutura)
   ↓
3. TÓPICOS         → Corpo principal (um por vez, usa contexto anteriores)
   ↓
4. CONCLUSÃO       → CTA final
   ↓
5. BLOCOS          → Divide roteiro completo
   ↓
6. TRILHA          → Orientações musicais (usa roteiro completo)
   ↓
7. PERSONAGENS     → Lista personagens (usa roteiro completo)
   ↓
8. SRT             → Legendas com timecode (usa blocos)
   ↓
9. TAKES           → Prompts de imagem (usa blocos + personagens)
```

---

## ETAPA 1: GERAR ESTRUTURA

### Objetivo
Criar o esqueleto do roteiro com tópicos e subtópicos.

### Pré-requisitos
- Título
- Sinopse
- Número de tópicos
- Número de subtópicos
- Idioma

### Prompt Template
```
Create {numTopics} topics about "{title}" for a YouTube biblical history channel.

Synopsis: {synopsis}
{knowledgeBase ? `\nContext: ${knowledgeBase}` : ''}

NARRATIVE GUIDELINES:
- Structure as a book narrative in chronological order
- No information should be repeated across topics
- Topics must NOT contain introduction or conclusion (only development)
- Each topic should be well-divided so viewers don't feel lost
- Distribute content equally across all topics

MANDATORY FORMAT (FOLLOW EXACTLY):
TÓPICO 1: [title]
1.1 [subtopic]
1.2 [subtopic]
...1.{numSubtopics}

TÓPICO 2: [title]
2.1-2.{numSubtopics} [subtopics]

FORMAT RULES:
- Use EXACTLY "TÓPICO X:" (number + colon, no extra characters)
- NO markdown (**, ##, bullets)
- NO special formatting
- Plain text only

Output language: {outputLanguage}
CRITICAL: {numTopics} topics, {numSubtopics} subtopics each. ONLY titles (do not develop content yet).
```

### Configuração Claude
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: calcMaxTokens(2000),  // (2000 * 1.5) / 3.5 ≈ 857 tokens
  messages: [{ role: 'user', content: prompt }]
}
```

### Pós-processamento
Extrair tópicos da estrutura gerada:

```javascript
// Pattern multilíngue flexível para markdown
const topicPattern = /(?:\*\*)?(?:#{1,3}\s*)?(?:TÓPICO|TOPIC)\s*\d+\s*[:.\-]?(?:\*\*)?/gi;
const marcadores = estrutura.match(topicPattern);
const parts = estrutura.split(topicPattern);

// Remover texto antes do primeiro tópico
parts.shift();
const topicos = parts.filter(t => t.trim().length > 0);

// Validar
if (topicos.length < numTopics) {
  throw new Error(`Only ${topicos.length} topics generated. Expected ${numTopics}.`);
}
```

### Saída
- **Arquivo**: `estrutura.txt`
- **Variável**: `estrutura` (texto completo)
- **Variável**: `topicos` (array de tópicos extraídos)

---

## ETAPA 2: GERAR HOOK

### Objetivo
Criar introdução imersiva.

### Pré-requisitos
- Título
- Tópicos extraídos (apenas títulos)
- Caracteres do hook
- Idioma

### Prompt Template
```
Title: "{title}"
Topics: {topicos.map((t, i) => `${i + 1}. ${t.split('\n')[0]}`).join('; ')}

Create immersive introduction of EXACTLY {hookChars} characters.
CRITICAL: NO emojis, NO special characters, NO markdown formatting (**, ##, bullets).
Plain narrative text only for AI voice narration.
Output language: {outputLanguage}
```

### Configuração Claude
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: calcMaxTokens(hookChars),
  messages: [{ role: 'user', content: prompt }]
}
```

### Validação
```javascript
const accuracy = Math.round(hook.length / hookChars * 100);
console.log(`Hook: ${hook.length}/${hookChars} chars (${accuracy}%)`);

// Aceitar se estiver entre 97%-103%
if (hook.length < hookChars * 0.97 || hook.length > hookChars * 1.03) {
  console.warn(`⚠️ Hook fora da faixa ideal`);
}
```

### Saída
- **Arquivo**: `hook.txt`
- **Variável**: `hook`

---

## ETAPA 3: GERAR TÓPICOS

### Objetivo
Desenvolver cada tópico completamente, um por vez.

### Pré-requisitos
- Estrutura de cada tópico (da Etapa 1)
- Caracteres por tópico: `Math.floor(totalChars / numTopics)`
- Resumo de tópicos anteriores (para evitar repetição)
- Idioma

### IMPORTANTE: GERAR UM POR VEZ
⚠️ Gere os tópicos **SEQUENCIALMENTE**, não em paralelo. Cada tópico precisa do contexto dos anteriores.

### Loop de Geração
```javascript
const topicosGerados = [];
const resumosTopicos = [];

for (let i = 0; i < numTopics; i++) {
  const topicoNum = i + 1;
  const topicoEstrutura = topicos[i];
  const charsTotal = Math.floor(totalChars / numTopics);

  // Criar contexto dos tópicos anteriores
  const contextoAnterior = resumosTopicos.length > 0
    ? `\nAlready covered: ${resumosTopicos.join('; ')}`
    : '';

  // Gerar tópico
  const topicoTexto = await gerarTopico(topicoNum, topicoEstrutura, charsTotal, contextoAnterior);

  // Adicionar título ao tópico
  const tituloTopico = topicoEstrutura.split('\n')[0];
  const topicoCompleto = `${tituloTopico}\n\n${topicoTexto}`;
  topicosGerados.push(topicoCompleto);

  // Salvar resumo para próximos tópicos
  const resumo = `Topic ${topicoNum}: ${tituloTopico.substring(0, 50)} (${topicoTexto.length} chars)`;
  resumosTopicos.push(resumo);
}
```

### Prompt Template (para cada tópico)
```
You are an experienced biblical writer creating Topic {topicoNum} of {numTopics}.

TOPIC TO DEVELOP:
{topicoEstrutura}

{contextoAnterior}

WRITING GUIDELINES:
1. BIBLICAL ACCURACY: Stay faithful to the biblical text. Do NOT add information the Bible doesn't mention.
2. NARRATIVE STYLE: Third-person book narrative, chronological order. Cover ALL subtopics above completely.
3. SIMPLICITY: Write so even a child can understand. Use simple, direct language. No difficult words or unnecessary complexity.
4. BIBLE VERSES: Always mention chapter/verse naturally BEFORE quoting. Example: "As recorded in John 3:16, Jesus said..." No abrupt breaks.
5. FLOW: Transition smoothly between subtopics WITHOUT subtopic titles. Keep text fluid and engaging, never tiring.
6. CONVERSATIONAL: Write as if talking directly to ONE person. Be dynamic and create connection with the viewer.
7. NO REPETITION: Do NOT repeat information, verses, or events from previous topics. Each topic is unique.
8. BOUNDARIES: Only cover what THIS topic requests. Don't go beyond—it interferes with next topics' narrative.
9. ENDING: End directly without conclusions or reflections. Just stop when the topic is complete.
10. FORMAT: NO emojis, NO special characters, NO markdown (**, ##, bullets). Plain narrative text only for AI voice narration.

CHARACTER REQUIREMENT:
Write EXACTLY {charsTotal} characters (range: {Math.floor(charsTotal * 0.97)}-{Math.ceil(charsTotal * 1.03)})

Output language: {outputLanguage}

START WRITING ({charsTotal} chars):
```

### Configuração Claude (para cada tópico)
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: calcMaxTokens(charsTotal),
  messages: [{ role: 'user', content: prompt }]
}
```

### Validação (para cada tópico)
```javascript
const accuracy = Math.round(topicoTexto.length / charsTotal * 100);
const diff = topicoTexto.length - charsTotal;
console.log(`Topic ${topicoNum}: ${topicoTexto.length}/${charsTotal} chars (${accuracy}%, ${diff > 0 ? '+' : ''}${diff})`);
```

### Saída
- **Arquivos**: `topico1.txt`, `topico2.txt`, `topico3.txt`...
- **Variável**: `topicosGerados` (array com todos os tópicos completos)

---

## ETAPA 4: GERAR CONCLUSÃO

### Objetivo
Criar CTA (Call to Action) final.

### Pré-requisitos
- Título
- Idioma

### Prompt Template
```
Title: "{title}"

Create narrated conclusion (max 400 characters) for voice-over:
- Invite to subscribe and activate notifications
- Ask viewers to share and comment their location
- Warm, conversational tone
- CRITICAL: NO emojis, NO special characters, NO markdown (**, ##, bullets)
- Plain narrative text only for AI voice narration
- Natural spoken language only

Output language: {outputLanguage}
```

### Configuração Claude
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: calcMaxTokens(400),
  messages: [{ role: 'user', content: prompt }]
}
```

### Saída
- **Arquivo**: `conclusao.txt`
- **Variável**: `conclusao`

---

## 🎉 PONTO DE CHECKPOINT: ROTEIRO COMPLETO

Neste ponto você tem o **ROTEIRO COMPLETO**:
- Estrutura
- Hook
- Tópicos (todos)
- Conclusão

Construa o roteiro final:
```javascript
const roteiroCompleto = [hook, ...topicosGerados, conclusao].join('\n\n');
```

**SALVE ESTE CHECKPOINT!** O roteiro está pronto. Os próximos passos geram documentos auxiliares.

---

## ETAPA 5: DIVIDIR EM BLOCOS

### Objetivo
Dividir o roteiro completo (Hook + Tópicos, sem conclusão) em blocos de tamanho uniforme.

### Pré-requisitos
- Hook
- Tópicos gerados
- Algoritmo de divisão em blocos

### Processo

#### 5.1 Juntar Hook + Tópicos
```javascript
const roteiro = [hook, ...topicosGerados].join('\n\n');
```

⚠️ **NÃO incluir conclusão** - ela é separada do roteiro narrado.

#### 5.2 Dividir em Blocos
Use um algoritmo que:
- Respeite frases completas (não corte no meio)
- Crie blocos de tamanho uniforme
- Mantenha ordem cronológica

```javascript
// Exemplo simplificado (você pode implementar lógica mais sofisticada)
function dividirEmBlocos(texto, tamanhoBlocoIdeal = 500) {
  const frases = texto.match(/[^.!?]+[.!?]+/g) || [];
  const blocos = [];
  let blocoAtual = '';

  for (const frase of frases) {
    if (blocoAtual.length + frase.length > tamanhoBlocoIdeal && blocoAtual.length > 0) {
      blocos.push(blocoAtual.trim());
      blocoAtual = frase;
    } else {
      blocoAtual += frase;
    }
  }

  if (blocoAtual.trim()) {
    blocos.push(blocoAtual.trim());
  }

  return blocos;
}

const currentBlocks = dividirEmBlocos(roteiro);
```

### Saída
- **Arquivo**: `blocos.txt` (formato: "BLOCO 1\n[texto]\n\nBLOCO 2\n[texto]...")
- **Variável**: `currentBlocks` (array de blocos)

---

## ETAPA 6: GERAR TRILHA SONORA

### Objetivo
Criar orientações musicais para cada seção do roteiro.

### Pré-requisitos
- Roteiro completo (Hook + Tópicos + Conclusão)
- Idioma

### Prompt Template
```
Create soundtrack file for the script below.

FORMAT for each section (Hook, Topics, Conclusion):

SECTION [name]
Feeling [emotion and atmosphere]
Keywords [keyword1] [keyword2] [keyword3] [keyword4]
Mood [3-5 adjectives in ENGLISH]
Intensity [Low or Medium or High or Growing]
Notes [when to change/grow]

RULES:
- Keywords in ENGLISH specific (ex: documentary suspense)
- Mood: 3-5 adjectives in ENGLISH
- No special characters (asterisks, quotes, etc)
- Align with each section objective

Libraries: Epidemic Sound, Artlist, AudioJungle, YouTube Audio Library

SCRIPT:
{roteiroCompleto}

Start with:
SOUNDTRACK AND MUSICAL GUIDANCE

MUSIC SEARCH INSTRUCTIONS
Use keywords to search. Prioritize songs matching the mood.

Output section names in: {outputLanguage}
```

### Configuração Claude
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: calcMaxTokens(1500),
  messages: [{ role: 'user', content: prompt }]
}
```

### Saída
- **Arquivo**: `trilha_sonora.txt`
- **Variável**: `trilha`

---

## ETAPA 7: GERAR PERSONAGENS

### Objetivo
Listar e descrever fisicamente todos os personagens do roteiro.

### Pré-requisitos
- Roteiro completo
- Idioma

### Prompt Template
```
Analyze the script and list characters by order of importance.

FORMAT:
1. NAME (no suffixes)

[Physical description in ENGLISH: age, height, body, skin, face, eyes, hair, beard, clothes, environment. Continuous paragraph 80-150 words for main, 30-50 for secondary]

RULES:
- TOP 3 main: complete description (80-150 words)
- Secondary: short description (30-50 words)
- ONLY visible physical characteristics
- Live-action documentary realistic style
- End MAIN with: live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate, REAL PEOPLE, ultra-detailed, hyper realistic 8k
- End SECONDARY with: live-action documentary style, real people, historically accurate
- Keep original names (DAVI not DAVID)
- No special characters

SCRIPT:
{roteiroCompleto}

Start with:
CHARACTER DESCRIPTIONS FOR AI IMAGE GENERATION

INSTRUCTIONS
Continuous paragraph format for Midjourney DALL-E Stable Diffusion Runway Kling AI etc.

Output names/titles in: {outputLanguage}
```

### Configuração Claude
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: calcMaxTokens(2000),
  messages: [{ role: 'user', content: prompt }]
}
```

### Pós-processamento
Extrair personagens como objeto:

```javascript
const personagensObj = {};
const matches = personagensTexto.matchAll(/(\d+)\.\s*([A-Z\s]+)\n\n([^\n]+(?:\n(?!\d+\.)[^\n]+)*)/g);

for (const match of matches) {
  const nome = match[2].trim();
  const descricao = match[3].trim();
  personagensObj[nome] = descricao;
}
```

### Saída
- **Arquivo**: `personagens.txt`
- **Variável**: `personagensTexto` (texto completo)
- **Variável**: `personagensObj` (objeto {nome: descrição})

---

## ETAPA 8: GERAR SRT (LEGENDAS)

### Objetivo
Criar arquivo de legendas com timecode sincronizado.

### Pré-requisitos
- Blocos divididos (da Etapa 5)
- Taxa de leitura: 12 caracteres/segundo (padrão)
- Pausa entre blocos: 0.9 segundos

### Processo

```javascript
const readingRate = 12;  // caracteres por segundo
const pauseTime = 0.9;   // pausa entre blocos

let srtContent = '';
let currentTime = 0;

currentBlocks.forEach((block, index) => {
  const text = block.trim();
  if (!text) return;

  // Calcular duração
  const duration = text.length / readingRate;
  const startTime = currentTime;
  const endTime = currentTime + duration;

  // Formatar timestamps
  const startTimestamp = formatSrtTimestamp(startTime);
  const endTimestamp = formatSrtTimestamp(endTime);

  // Adicionar ao SRT
  srtContent += `${index + 1}\n`;
  srtContent += `${startTimestamp} --> ${endTimestamp}\n`;
  srtContent += `${text}\n\n`;

  // Avançar tempo
  currentTime = endTime + pauseTime;
});
```

### Função de Formatação de Timestamp
```javascript
function formatSrtTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}
```

### Saída
- **Arquivo**: `roteiro.srt`
- **Variável**: `srtContent`

---

## ETAPA 9: GERAR TAKES (PROMPTS DE IMAGEM)

### Objetivo
Criar prompts de imagem AI para cada bloco do roteiro.

### Pré-requisitos
- Blocos divididos
- Personagens (objeto)
- Idioma

### IMPORTANTE: DIVISÃO EM GRUPOS
Takes são gerados em **grupos de 10 blocos** para confiabilidade.

### Loop de Geração
```javascript
const BLOCOS_POR_GRUPO = 10;
const allTakes = [];

for (let i = 0; i < currentBlocks.length; i += BLOCOS_POR_GRUPO) {
  const grupoAtual = currentBlocks.slice(i, i + BLOCOS_POR_GRUPO);
  const offsetGrupo = i;  // Para numeração correta

  // Formatar blocos numerados
  const blocosNumerados = grupoAtual.map((bloco, idx) =>
    `BLOCK ${offsetGrupo + idx + 1}:\n${bloco}`
  ).join('\n\n');

  // Gerar takes para este grupo
  const takesGrupo = await gerarTakesGrupo(blocosNumerados, grupoAtual.length, offsetGrupo);

  allTakes.push(...takesGrupo);
}
```

### Prompt Template (para cada grupo)
```
Analyze the historical period of blocks and create {grupoAtual.length} takes for video AI in JSON.

FORMAT (80-120 words each):
{
  "take": 1,
  "scene": "[Action + environment + lighting + camera + period clothing + typical architecture]. Live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate for [specific historical period ex: ancient Egypt 1400 BC], real people, ultra-detailed, hyper realistic 8k.",
  "character_anchors": ["Name1", "Name2"]
}

EXAMPLE:
{
  "take": 1,
  "scene": "Moses wearing simple linen robes typical of Hebrew slaves raises wooden staff toward churning waters of Red Sea, Egyptian chariots pursuing in background, desert landscape with palm trees, mud brick structures visible, golden hour lighting. Live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate for ancient Egypt 1400 BC, real people, ultra-detailed, hyper realistic 8k.",
  "character_anchors": ["Moses"]
}

CRITICAL RULES:
- Identify historical era of blocks (ex: Exodus = Egypt 1400 BC, Jesus = Judea 1st century)
- Scene: 80-120 words including specific historical period
- Describe period clothing, architecture and environment of correct era
- End with "historically accurate for [specific period]"
- character_anchors: EXACT names or []
- Return ONLY JSON array, no extra text

BLOCKS:
{blocosNumerados}

Return JSON array with {grupoAtual.length} takes with precise historicity.
```

### Configuração Claude (para cada grupo)
```javascript
const maxTokensNeeded = grupoAtual.length * 250;  // 250 tokens por take

{
  model: "claude-sonnet-4-20250514",
  max_tokens: maxTokensNeeded,
  messages: [{ role: 'user', content: prompt }]
}
```

### Pós-processamento JSON
```javascript
let takesJson = response.content[0].text.trim();

// Extrair JSON (caso haja texto extra)
const jsonMatch = takesJson.match(/\[[\s\S]*\]/);
if (jsonMatch) {
  takesJson = jsonMatch[0];
}

// Parsear
let takesGrupo;
try {
  takesGrupo = JSON.parse(takesJson);
} catch (parseError) {
  // Limpeza se primeiro parse falhar
  const cleanedJson = takesJson
    .replace(/,\s*}/g, '}')
    .replace(/,\s*\]/g, ']')
    .replace(/}\s*{/g, '},{');

  takesGrupo = JSON.parse(cleanedJson);
}
```

### Construir Arquivo Final de Takes
```javascript
let takesCompleto = '';

allTakes.forEach((take, idx) => {
  takesCompleto += `TAKE ${idx + 1}\n`;
  takesCompleto += `${take.scene}\n`;

  if (take.character_anchors && take.character_anchors.length > 0) {
    takesCompleto += `Character anchor${take.character_anchors.length > 1 ? 's' : ''}:\n`;

    take.character_anchors.forEach(nome => {
      const descricao = findCharacter(nome, personagensObj) || '[Character not found]';
      takesCompleto += `${nome}: ${descricao}\n`;
    });
  }

  takesCompleto += `\n`;
});
```

### Função de Busca de Personagem
```javascript
function findCharacter(nomeBuscado, personagensObj) {
  // Busca exata
  if (personagensObj[nomeBuscado]) {
    return personagensObj[nomeBuscado];
  }

  // Busca case-insensitive
  const nomeBuscadoUpper = nomeBuscado.toUpperCase();
  for (const [key, value] of Object.entries(personagensObj)) {
    if (key.toUpperCase() === nomeBuscadoUpper) {
      return value;
    }
  }

  // Traduções comuns
  const traducoes = {
    'DAVID': 'DAVI',
    'MOSES': 'MOISÉS',
    'MOISES': 'MOISÉS',
    'JOSEPH': 'JOSÉ',
    'JOSE': 'JOSÉ',
    'JOSHUA': 'JOSUÉ',
    'JOSUE': 'JOSUÉ',
    'JOHN': 'JOÃO',
    'JOAO': 'JOÃO',
    'PAUL': 'PAULO',
    'PETER': 'PEDRO',
    'ABRAHAM': 'ABRAÃO',
    'ABRAAO': 'ABRAÃO',
    'ISAAC': 'ISAQUE',
    'JACOB': 'JACÓ',
    'JACO': 'JACÓ',
    'SOLOMON': 'SALOMÃO',
    'SALOMAO': 'SALOMÃO'
  };

  const nomeTraducao = traducoes[nomeBuscadoUpper];
  if (nomeTraducao && personagensObj[nomeTraducao]) {
    return personagensObj[nomeTraducao];
  }

  return null;
}
```

### Saída
- **Arquivo**: `takes.txt`
- **Variável**: `takesCompleto`

---

## ✅ VALIDAÇÃO E CONTROLE DE QUALIDADE

### Após Cada Etapa
1. **Validar tamanho**: Caracteres gerados vs esperados
2. **Log de progresso**: Informar usuário do andamento
3. **Verificar formato**: Sem markdown, emojis ou caracteres especiais
4. **Salvar arquivo**: Criar .txt para cada documento

### Métricas de Sucesso

#### Estrutura
- Número correto de tópicos extraídos
- Cada tópico com número correto de subtópicos

#### Hook
- 97%-103% dos caracteres solicitados
- Formato limpo (sem markdown)

#### Tópicos
- Cada tópico: 97%-103% dos caracteres esperados
- Sem repetição de conteúdo entre tópicos
- Formato limpo

#### Conclusão
- Máximo 400 caracteres
- CTA claro

#### Blocos
- Frases completas (não cortadas)
- Tamanho uniforme

#### Trilha
- Seções correspondentes ao roteiro (Hook + Tópicos + Conclusão)
- Keywords em inglês

#### Personagens
- TOP 3 principais: 80-150 palavras
- Secundários: 30-50 palavras
- Descrições em inglês

#### SRT
- Timestamps formatados corretamente
- Número de entradas = número de blocos

#### Takes
- Número de takes = número de blocos
- JSON válido
- Histórias com período histórico específico

---

## 📊 ESTIMATIVA DE TEMPO E CUSTO

### Tempo de Geração (aproximado)
1. Estrutura: ~5s
2. Hook: ~3s
3. Tópicos: ~10s cada (30s total para 3 tópicos)
4. Conclusão: ~3s
5. Blocos: ~1s (processamento local)
6. Trilha: ~10s
7. Personagens: ~15s
8. SRT: ~1s (processamento local)
9. Takes: ~20s por grupo de 10 blocos

**Total estimado**: ~90-120 segundos para roteiro completo com ~150 blocos

### Custo de API (aproximado)
- Estrutura: $0.005
- Hook: $0.003
- Tópicos: $0.015 cada ($0.045 total)
- Conclusão: $0.002
- Trilha: $0.012
- Personagens: $0.015
- Takes: $0.008 por grupo de 10 blocos

**Total estimado**: ~$0.10-$0.15 por roteiro completo

---

## 🚨 TRATAMENTO DE ERROS

### Erros Comuns e Soluções

#### 1. Número incorreto de tópicos extraídos
```javascript
if (topicos.length < numTopics) {
  throw new Error(`Only ${topicos.length} topics generated. Expected ${numTopics}.`);
}
```
**Solução**: Regenerar estrutura com prompt mais explícito.

#### 2. Tópico muito curto/longo
```javascript
if (topicoTexto.length < charsTotal * 0.97) {
  console.warn(`⚠️ Topic ${topicoNum} too short: ${topicoTexto.length}/${charsTotal}`);
  // Considere regenerar
}
```
**Solução**: Ajustar prompt ou aceitar variação de ±3%.

#### 3. JSON inválido nos takes
```javascript
try {
  takesGrupo = JSON.parse(takesJson);
} catch (error) {
  // Aplicar limpeza e tentar novamente
  // Se falhar, logar erro e pular grupo
}
```
**Solução**: Implementar limpeza de JSON e retry.

#### 4. Personagem não encontrado nos takes
```javascript
const descricao = findCharacter(nome, personagensObj) || '[Character not found]';
```
**Solução**: Sistema de traduções e fallback para evitar quebra.

#### 5. Timeout de API
```javascript
try {
  const response = await anthropic.messages.create({...}, {
    timeout: 120000  // 2 minutos
  });
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    // Retry com backoff exponencial
  }
}
```

---

## 📝 ORGANIZAÇÃO DE ARQUIVOS DE SAÍDA

### Estrutura Recomendada
```
output/
├── roteiro_completo.txt          (Hook + Tópicos + Conclusão)
├── 00_estrutura.txt
├── 01_hook.txt
├── 02_topico1.txt
├── 03_topico2.txt
├── 04_topico3.txt
├── 05_conclusao.txt
├── 06_blocos.txt
├── 07_trilha_sonora.txt
├── 08_personagens.txt
├── 09_roteiro.srt
└── 10_takes.txt
```

### Nome de Arquivo Sugerido
Use o título do vídeo como base:
```javascript
function getTituloArquivo(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
    .replace(/[^a-z0-9]+/g, '-')      // Substitui não-alfanuméricos por hífen
    .replace(/^-+|-+$/g, '');          // Remove hífens do início/fim
}

// Exemplo: "A História de Davi" → "a-historia-de-davi"
```

---

## 🔄 MODO STREAMING (OPCIONAL)

Se você quiser mostrar progresso em tempo real ao usuário:

### Server-Sent Events (SSE)
```javascript
// Enviar eventos de progresso
function sendEvent(type, data) {
  console.log(`[${type}]`, data);
  // Se em ambiente web: res.write(`data: ${JSON.stringify({type, ...data})}\n\n`);
}

// Eventos disponíveis:
sendEvent('step', { step: 'estrutura', status: 'started' });
sendEvent('message', { step: 'hook', content: hook });
sendEvent('topico_complete', { topicoNum: 1, totalChars: 3000, expectedChars: 3000 });
sendEvent('complete', { files: {...} });
```

---

## 🎯 CHECKLIST FINAL

Antes de finalizar, verificar:

- [ ] Todos os 9 documentos foram gerados
- [ ] Nenhum documento contém markdown (**, ##)
- [ ] Nenhum documento contém emojis
- [ ] Hook está dentro da faixa de caracteres (97%-103%)
- [ ] Cada tópico está dentro da faixa de caracteres (97%-103%)
- [ ] Número de blocos > 0
- [ ] SRT tem número de entradas = número de blocos
- [ ] Takes tem número de takes = número de blocos
- [ ] Todos os character_anchors foram encontrados ou marcados como not found
- [ ] Arquivos salvos com nomes corretos
- [ ] Logs de progresso foram exibidos ao usuário

---

## 🚀 EXEMPLO DE SCRIPT COMPLETO

```javascript
async function gerarRoteiroCompleto(input) {
  console.log('🚀 Iniciando geração de roteiro...');

  // ETAPA 1: Estrutura
  console.log('\n📋 [1/9] Gerando estrutura...');
  const estrutura = await gerarEstrutura(input);
  const topicos = extrairTopicos(estrutura);
  salvarArquivo('00_estrutura.txt', estrutura);

  // ETAPA 2: Hook
  console.log('\n🎣 [2/9] Gerando hook...');
  const hook = await gerarHook(input.title, topicos, input.hookChars, input.language);
  salvarArquivo('01_hook.txt', hook);

  // ETAPA 3: Tópicos
  console.log('\n📖 [3/9] Gerando tópicos...');
  const topicosGerados = [];
  const charsTotal = Math.floor(input.totalChars / input.numTopics);

  for (let i = 0; i < input.numTopics; i++) {
    const topicoTexto = await gerarTopico(i + 1, topicos[i], charsTotal, topicosGerados);
    topicosGerados.push(topicoTexto);
    salvarArquivo(`0${i + 2}_topico${i + 1}.txt`, topicoTexto);
  }

  // ETAPA 4: Conclusão
  console.log('\n🎬 [4/9] Gerando conclusão...');
  const conclusao = await gerarConclusao(input.title, input.language);
  salvarArquivo('05_conclusao.txt', conclusao);

  // ETAPA 5: Blocos
  console.log('\n📐 [5/9] Dividindo em blocos...');
  const roteiro = [hook, ...topicosGerados].join('\n\n');
  const blocos = dividirEmBlocos(roteiro);
  const blocosTexto = blocos.map((b, i) => `BLOCO ${i + 1}\n${b}`).join('\n\n');
  salvarArquivo('06_blocos.txt', blocosTexto);

  // ETAPA 6: Trilha
  console.log('\n🎵 [6/9] Gerando trilha sonora...');
  const roteiroCompleto = [hook, ...topicosGerados, conclusao].join('\n\n');
  const trilha = await gerarTrilha(roteiroCompleto, input.language);
  salvarArquivo('07_trilha_sonora.txt', trilha);

  // ETAPA 7: Personagens
  console.log('\n👥 [7/9] Gerando personagens...');
  const { personagensTexto, personagensObj } = await gerarPersonagens(roteiroCompleto, input.language);
  salvarArquivo('08_personagens.txt', personagensTexto);

  // ETAPA 8: SRT
  console.log('\n📄 [8/9] Gerando SRT...');
  const srtContent = gerarSRT(blocos);
  salvarArquivo('09_roteiro.srt', srtContent);

  // ETAPA 9: Takes
  console.log('\n🎬 [9/9] Gerando takes...');
  const takes = await gerarTakes(blocos, personagensObj, input.language);
  salvarArquivo('10_takes.txt', takes);

  console.log('\n✅ Geração completa! Todos os documentos foram criados.');

  return {
    estrutura,
    hook,
    topicos: topicosGerados,
    conclusao,
    blocos,
    trilha,
    personagens: personagensTexto,
    srt: srtContent,
    takes
  };
}
```

---

## 📚 RECURSOS ADICIONAIS

### Leitura Obrigatória
- `MANUAL_CRIATIVO.md` - Diretrizes detalhadas de escrita

### Modelos Claude Disponíveis
- `claude-sonnet-4-20250514` (recomendado, custo-benefício)
- `claude-opus-4-20250514` (máxima qualidade, mais caro)
- `claude-haiku-4-20250514` (rápido e barato, qualidade inferior)

### Idiomas Suportados
- `pt` - Português Brasileiro
- `en` - English
- `es` - Español

---

**FIM DO MANUAL PROCEDURAL**

Última atualização: 2025-11-19
Versão: 4.8.1
