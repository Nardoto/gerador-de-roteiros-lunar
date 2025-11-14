require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { login, verifyToken, authMiddleware } = require('./auth');

const PORT = process.env.PORT || 3000;

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Criar servidor HTTP simples
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Servir página de login como raiz
  if (req.url === '/' && req.method === 'GET') {
    fs.readFile(path.join(__dirname, 'login.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao carregar página');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Servir login.html
  if (req.url === '/login.html' && req.method === 'GET') {
    fs.readFile(path.join(__dirname, 'login.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao carregar página');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Servir index.html (precisa estar logado)
  if (req.url === '/index.html' && req.method === 'GET') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao carregar página');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Rota de login
  if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);
        const result = login(username, password);

        res.writeHead(result.success ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Erro ao processar requisição' }));
      }
    });
    return;
  }

  // Rota para verificar token
  if (req.url === '/api/verify-token' && req.method === 'GET') {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ valid: false }));
      return;
    }

    const token = authHeader.split(' ')[1];
    const result = verifyToken(token);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // API para gerar roteiro
  if (req.url === '/api/gerar' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const input = JSON.parse(body);

        // Definir instruções de idioma
        const languageInstructions = {
          pt: 'Escreva TODO o conteúdo em PORTUGUÊS (Brasil).',
          en: 'Write ALL content in ENGLISH.',
          es: 'Escribe TODO el contenido en ESPAÑOL.'
        };
        const selectedLanguage = input.language || 'pt';
        const languagePrompt = languageInstructions[selectedLanguage];

        // Headers para Server-Sent Events
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        // Função para enviar eventos SSE
        const sendEvent = (data) => {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Usar SDK do Claude já inicializado no topo do arquivo

        console.log('\n🚀 Iniciando geração...');
        console.log('Título:', input.title);
        console.log('Idioma:', selectedLanguage.toUpperCase());
        console.log('Tópicos:', input.numTopics);
        console.log('Modelo:', input.model || 'claude-sonnet-4-20250514');

        const claudeModel = input.model || 'claude-sonnet-4-20250514';
        const messages = [];

        // STEP 1: Estrutura
        console.log('\n📋 Gerando estrutura...');
        sendEvent({ type: 'step', step: 'estrutura', status: 'started' });

        const estruturaPrompt = `Possuo um canal no YouTube de histórias bíblicas. Se fosse para criar um roteiro sobre "${input.title}" em ${input.numTopics} tópicos como se fosse uma narrativa de livro e em ordem cronológica, sem que informações fiquem repetidas, como você criaria?

Sinopse: ${input.synopsis}
${input.knowledgeBase || ''}

${languagePrompt} Os tópicos não devem conter introdução e nem conclusão, e devem ser bem divididos para que os espectadores não se sintam perdidos no vídeo. Cada tópico deve ter ${input.numSubtopics} subtópicos.

⚠️ IMPORTANTE: Use EXATAMENTE o formato abaixo (com "TÓPICO" em maiúsculas e dois-pontos após o número):

TÓPICO 1: [NOME DO TÓPICO]
1.1 [Nome do subtópico]
1.2 [Nome do subtópico]
...

Numere os subtópicos e NÃO desenvolva os subtópicos, quero apenas seus títulos.

REPITA: Você DEVE gerar EXATAMENTE ${input.numTopics} tópicos usando o formato "TÓPICO 1:", "TÓPICO 2:", etc.`;

        const estruturaMsg = await anthropic.messages.create({
          model: claudeModel,
          max_tokens: 4000,
          messages: [{ role: 'user', content: estruturaPrompt }]
        });

        const estrutura = estruturaMsg.content[0].text;
        messages.push(
          { role: 'user', content: estruturaPrompt },
          { role: 'assistant', content: estrutura }
        );

        console.log('\n✅ Estrutura gerada:');
        console.log(estrutura.substring(0, 300) + '...');

        sendEvent({
          type: 'message',
          role: 'assistant',
          content: estrutura,
          step: 'estrutura',
          prompt: estruturaPrompt,
          charCount: estrutura.length,
          charCountNoSpaces: estrutura.replace(/\s/g, '').length,
          wordCount: estrutura.split(/\s+/).filter(w => w.length > 0).length
        });

        // Extrair tópicos da estrutura
        const topicPattern = /TÓPICO \d+:/gi;
        const marcadores = estrutura.match(topicPattern);
        const parts = estrutura.split(topicPattern);
        parts.shift(); // Remover texto antes do primeiro tópico
        const topicos = parts.filter(t => t.trim().length > 0);

        console.log(`\n🔍 Encontrados ${marcadores ? marcadores.length : 0} marcadores`);
        console.log(`🔍 Extraídos ${topicos.length} tópicos`);

        if (topicos.length < input.numTopics) {
          sendEvent({ type: 'error', error: `Apenas ${topicos.length} tópicos foram gerados. Esperava ${input.numTopics}.` });
          res.end();
          return;
        }

        // STEP 2: Hook
        console.log('\n🎣 Gerando hook...');
        sendEvent({ type: 'step', step: 'hook', status: 'started' });

        const hookPrompt = `Faça uma introdução imersiva e chamativa e curiosa de ${input.hookChars} caracteres que prenda o espectador.

${languagePrompt}

A estrutura do roteiro foi fornecida anteriormente na conversa.`;

        messages.push({ role: 'user', content: hookPrompt });

        const hookMsg = await anthropic.messages.create({
          model: claudeModel,
          max_tokens: 2000,
          messages: messages
        });

        const hook = hookMsg.content[0].text;
        messages.push({ role: 'assistant', content: hook });

        console.log(`✅ Hook gerado (${hook.length} chars)`);

        sendEvent({
          type: 'message',
          role: 'assistant',
          content: hook,
          step: 'hook',
          prompt: hookPrompt,
          charCount: hook.length,
          charCountNoSpaces: hook.replace(/\s/g, '').length,
          wordCount: hook.split(/\s+/).filter(w => w.length > 0).length
        });

        // STEP 3-N: Cada tópico (dividido em subtópicos)
        const topicosGerados = [];

        for (let i = 0; i < input.numTopics; i++) {
          const topicoNum = i + 1;
          const topicoEstrutura = topicos[i];

          console.log(`\n📖 Gerando tópico ${topicoNum}/${input.numTopics}...`);
          console.log(`Estrutura (primeiros 100 chars): ${topicoEstrutura.substring(0, 100)}...`);

          sendEvent({ type: 'step', step: `topico${topicoNum}`, status: 'started' });

          // Extrair subtópicos desta estrutura
          const subtopicoPattern = /\d+\.\d+/g;
          const subtopicosMatch = topicoEstrutura.match(subtopicoPattern);
          const numSubtopicosReais = subtopicosMatch ? subtopicosMatch.length : input.numSubtopics;

          console.log(`🔍 Subtópicos detectados: ${numSubtopicosReais}`);

          // Calcular caracteres por subtópico (SEM margem extra - pedir exatamente o necessário)
          const charsTotal = Math.floor(input.totalChars / input.numTopics);
          const charsPorSubtopico = Math.floor(charsTotal / numSubtopicosReais);

          console.log(`📊 Caracteres por subtópico: ${charsPorSubtopico}`);
          console.log(`📊 Estratégia: Gerar 4 subtópicos por vez para reduzir custo`);

          // Dividir estrutura em subtópicos individuais
          const subtopicoLines = topicoEstrutura.split(/\n/).filter(line => /^\d+\.\d+/.test(line.trim()));

          // Array para armazenar cada subtópico gerado
          const subtopicosGerados = [];

          // NOVA ESTRATÉGIA: Gerar em grupos de 4 subtópicos por vez
          const SUBTOPICOS_POR_GRUPO = 4;
          const numGrupos = Math.ceil(numSubtopicosReais / SUBTOPICOS_POR_GRUPO);

          for (let grupoIdx = 0; grupoIdx < numGrupos; grupoIdx++) {
            const inicioGrupo = grupoIdx * SUBTOPICOS_POR_GRUPO;
            const fimGrupo = Math.min(inicioGrupo + SUBTOPICOS_POR_GRUPO, numSubtopicosReais);
            const numSubsNesteGrupo = fimGrupo - inicioGrupo;

            console.log(`\n  📦 Gerando grupo ${grupoIdx + 1}/${numGrupos} (subtópicos ${inicioGrupo + 1}-${fimGrupo})...`);

            // Coletar os títulos dos subtópicos deste grupo
            const subtopicosTitulos = [];
            for (let j = inicioGrupo; j < fimGrupo; j++) {
              subtopicosTitulos.push(subtopicoLines[j] || `${topicoNum}.${j + 1}`);
            }

            sendEvent({
              type: 'step',
              step: `topico${topicoNum}_grupo${grupoIdx + 1}`,
              status: 'started',
              progress: `Tópico ${topicoNum}/${input.numTopics} - Grupo ${grupoIdx + 1}/${numGrupos} (${numSubsNesteGrupo} subtópicos)`
            });

            // Calcular caracteres para este grupo
            const charsPorGrupo = charsPorSubtopico * numSubsNesteGrupo;

            const grupoPrompt = `Continue a narrativa do Tópico ${topicoNum}, agora desenvolvendo os seguintes ${numSubsNesteGrupo} subtópicos:

${subtopicosTitulos.join('\n')}

🎯 REGRAS OBRIGATÓRIAS:
1. Escreva ${numSubsNesteGrupo} parágrafos distintos, um para cada subtópico acima
2. NÃO escreva os títulos dos subtópicos - escreva APENAS o texto narrativo
3. Separe cada parágrafo com uma linha em branco
4. Continue a narrativa de onde parou (mantenha coesão)
5. Use versículos bíblicos mencionados de forma natural no texto
6. Escreva como narrativa de livro, em terceira pessoa
7. Linguagem simples, fluida e imersiva
8. NÃO repita informações já ditas antes

⚠️ TAMANHO OBRIGATÓRIO:
- Total para os ${numSubsNesteGrupo} subtópicos: EXATAMENTE ${charsPorGrupo} caracteres
- Aproximadamente ${Math.floor(charsPorGrupo / numSubsNesteGrupo)} caracteres por subtópico
- Distribua equilibradamente entre os ${numSubsNesteGrupo} parágrafos

Estrutura completa do tópico para contexto:
${topicoEstrutura}

${languagePrompt} Comece direto com o texto narrativo, SEM títulos.`;

            messages.push({ role: 'user', content: grupoPrompt });

            const grupoMsg = await anthropic.messages.create({
              model: claudeModel,
              max_tokens: 6000, // Reduzido de 16000 para 6000
              messages: messages
            });

            const grupoTexto = grupoMsg.content[0].text;
            messages.push({ role: 'assistant', content: grupoTexto });

            // Dividir o texto gerado em subtópicos (por parágrafos)
            const paragrafos = grupoTexto.split(/\n\n+/).filter(p => p.trim().length > 0);

            console.log(`  ✅ Grupo ${grupoIdx + 1} gerado (${grupoTexto.length} chars, ${paragrafos.length} parágrafos)`);

            // Adicionar cada parágrafo como um subtópico
            for (let k = 0; k < paragrafos.length && k < numSubsNesteGrupo; k++) {
              const subtopicoNum = inicioGrupo + k + 1;
              const paragrafo = paragrafos[k];
              subtopicosGerados.push(paragrafo);

              console.log(`    ✓ Subtópico ${topicoNum}.${subtopicoNum}: ${paragrafo.length} chars`);

              // Enviar cada subtópico individualmente para a UI
              sendEvent({
                type: 'message',
                role: 'assistant',
                content: paragrafo,
                step: `topico${topicoNum}_subtopico${subtopicoNum}`,
                prompt: k === 0 ? grupoPrompt : undefined, // Mostrar prompt só no primeiro
                charCount: paragrafo.length,
                charCountNoSpaces: paragrafo.replace(/\s/g, '').length,
                wordCount: paragrafo.split(/\s+/).filter(w => w.length > 0).length
              });
            }

            // Delay entre grupos
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          // Juntar todos os subtópicos em um único tópico
          // Adicionar título do tópico principal apenas uma vez
          const tituloTopico = topicoEstrutura.split('\n')[0]; // Primeira linha = título
          const topicoCompleto = `**${tituloTopico}**\n\n${subtopicosGerados.join('\n\n')}`;
          topicosGerados.push(topicoCompleto);

          const totalCharsTopico = topicoCompleto.length;
          console.log(`\n✅ Tópico ${topicoNum} completo (${totalCharsTopico} chars de ${charsTotal} esperados - ${Math.round(totalCharsTopico/charsTotal*100)}%)`);

          // Enviar tópico completo como resumo
          sendEvent({
            type: 'topico_complete',
            topicoNum: topicoNum,
            totalChars: totalCharsTopico,
            expectedChars: charsTotal,
            percentComplete: Math.round(totalCharsTopico/charsTotal*100)
          });

          // Delay entre tópicos
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Concluído
        console.log('\n✅ Geração completa!');
        sendEvent({
          type: 'complete',
          files: {
            estrutura,
            hook,
            topicos: topicosGerados
          }
        });

        res.end();

      } catch (error) {
        console.error('❌ Erro:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      }
    });
    return;
  }

  // ============================================
  // ENDPOINT: GERAR TRILHA SONORA
  // ============================================
  if (req.url === '/api/gerar-trilha' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { roteiro, modelo, language } = JSON.parse(body);
        const modeloUsar = modelo || 'claude-sonnet-4-20250514';

        // Definir instruções de idioma
        const languageInstructions = {
          pt: 'Escreva TODO o conteúdo em PORTUGUÊS (Brasil).',
          en: 'Write ALL content in ENGLISH.',
          es: 'Escribe TODO el contenido en ESPAÑOL.'
        };
        const languagePrompt = languageInstructions[language || 'pt'];

        const prompt = `Você é especialista em trilha sonora para documentários.

${languagePrompt}

Analise o roteiro abaixo e crie o arquivo de trilha sonora seguindo este formato:

TRILHA SONORA E ORIENTAÇÕES MUSICAIS

INSTRUÇÕES PARA BUSCA DE MÚSICAS
Este documento contém orientações para encontrar músicas em bibliotecas como
- Epidemic Sound
- Artlist
- AudioJungle
- YouTube Audio Library

Para cada seção use as palavras-chave (keywords) fornecidas para buscar.
Priorize músicas que correspondam ao sentimento (mood) descrito.

Para cada seção do roteiro (Hook + Atos e Tópicos + Conclusão) forneça

SEÇÃO (Nome da seção)
Sentimento (Descrever emoção e atmosfera desejada)
Keywords (keyword1) (keyword2) (keyword3) (keyword4)
Mood (3-5 adjetivos em INGLÊS separados por vírgula)
Intensidade (Baixa ou Média ou Alta ou Crescente)
Notas (Observações sobre quando a música deve mudar crescer etc)

DIRETRIZES
- Keywords em INGLÊS e específicas como documentary suspense não só suspense
- Mood com 3-5 adjetivos em INGLÊS
- Alinhar com objetivo de cada seção
- Tensão igual a suspenseful e Revelação igual a crescente
- Use APENAS letras números espaços parênteses e traços
- NÃO use caracteres especiais como asteriscos cerquilha colchetes aspas dois-pontos ponto e vírgula

ROTEIRO
${roteiro}`;

        const response = await anthropic.messages.create({
          model: modeloUsar,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        });

        const trilha = response.content[0].text;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          trilha,
          custoEstimado: '0.039',
          numSecoes: trilha.split('SEÇÃO:').length - 1
        }));

      } catch (error) {
        console.error('Erro ao gerar trilha:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // ============================================
  // ENDPOINT: GERAR PERSONAGENS
  // ============================================
  if (req.url === '/api/gerar-personagens' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { roteiro, modelo, language } = JSON.parse(body);
        const modeloUsar = modelo || 'claude-sonnet-4-20250514';

        // Definir instruções de idioma
        const languageInstructions = {
          pt: 'Escreva TODO o conteúdo em PORTUGUÊS (Brasil).',
          en: 'Write ALL content in ENGLISH.',
          es: 'Escribe TODO el contenido en ESPAÑOL.'
        };
        const languagePrompt = languageInstructions[language || 'pt'];

        const prompt = `Você é especialista em character design para IA de imagens REALISTAS.

${languagePrompt}

⚠️ ESTILO OBRIGATÓRIO: LIVE-ACTION DOCUMENTARY STYLE
- Pessoas REAIS da vida real (NÃO ilustrações, NÃO desenhos, NÃO estilizado)
- Fotografia documental realista
- Cinematografia de alta fidelidade
- Historicamente preciso com pessoas reais

Analise o roteiro e identifique os personagens por ORDEM DE IMPORTÂNCIA:

**3 PERSONAGENS PRINCIPAIS** (mais recorrentes/importantes da história):
- Descrição COMPLETA: 80-150 palavras
- Detalhamento físico completo
- REALISTA, como pessoa real em documentário

**PERSONAGENS SECUNDÁRIOS** (se houver):
- Descrição SIMPLES: 30-50 palavras
- Apenas características básicas essenciais
- REALISTA, como pessoa real em documentário

FORMATO PRINCIPAL (80-150 palavras)
1. (NOME EM MAIÚSCULAS - SEM SUFIXOS)

(Parágrafo contínuo em INGLÊS descrevendo APENAS características físicas visíveis de uma PESSOA REAL: idade aparente, altura, estrutura corporal, cor da pele, formato do rosto, cor e estilo dos olhos, cabelo cor comprimento e estilo, pelos faciais, roupas e acessórios, postura física, iluminação e ambiente. SEMPRE terminar com: live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate, REAL PEOPLE, ultra-detailed, hyper realistic 8k)

FORMATO SECUNDÁRIO (30-50 palavras)
4. (NOME SECUNDÁRIO)

(Parágrafo curto em INGLÊS com características físicas básicas de uma PESSOA REAL: idade aproximada, aparência geral, roupas principais. SEMPRE terminar com: live-action documentary style, real people, historically accurate)

EXEMPLO PRINCIPAL
1. DAVI

A Middle Eastern man in his early thirties standing five feet eight inches tall with an athletic build developed through years of physical activity olive tanned skin weathered by sun exposure angular face with high cheekbones straight nose full lips dark brown almond-shaped eyes thick dark brown shoulder-length hair with natural waves short trimmed beard covering his jawline wearing simple earth-tone wool tunic in shades of brown with leather belt leather sandals simple bronze arm bracelet holding a wooden shepherd staff positioned in desert landscape with golden hour lighting warm sunlight illuminating his features creating soft shadows live-action documentary style cinematic lighting high fidelity cinematography historically accurate REAL PEOPLE ultra-detailed hyper realistic 8k.

EXEMPLO SECUNDÁRIO
4. JESSÉ

Middle Eastern elderly man in his sixties with gray beard wearing traditional robes weathered face with kind eyes standing in rustic home setting live-action documentary style real people historically accurate.

ROTEIRO
${roteiro}

Comece com cabeçalho:

CHARACTER DESCRIPTIONS FOR AI IMAGE GENERATION

INSTRUCTIONS
These descriptions are written in continuous paragraph format optimized for AI image generation tools like Midjourney DALL-E Stable Diffusion Runway Kling AI etc.

⚠️ CRITICAL RULES:
1. REALISTIC LIVE-ACTION STYLE: Describe REAL PEOPLE only (NO illustrations, NO cartoons, NO stylized art)
2. Use ONLY the MAIN NAME without suffixes (write "DAVI", NOT "DAVI - YOUNG SHEPHERD")
3. Create ONLY ONE description per character (do NOT create multiple versions)
4. ONLY describe VISIBLE PHYSICAL characteristics (NO personality traits, emotions, or interpretations)
5. Identify the TOP 3 MAIN CHARACTERS (most important/recurring) and give them FULL descriptions (80-150 words)
6. For SECONDARY characters: SHORT descriptions (30-50 words) with basic physical traits only
7. Focus on: age, height, body type, skin tone, face shape, eye color and shape, hair color length style, facial hair, clothing, accessories, posture, lighting
8. DO NOT include: personality, emotions, character traits, motivations, feelings, attitudes
9. Use the EXACT character names as they appear in the script (DAVI, JOSÉ, MOISÉS, etc.)
10. DO NOT translate character names to English
11. ALWAYS end descriptions with: "live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate, REAL PEOPLE, ultra-detailed, hyper realistic 8k" (for main characters) or "live-action documentary style, real people, historically accurate" (for secondary characters)

IMPORTANTE - Use APENAS letras números espaços parênteses e traços. NÃO use caracteres especiais como asteriscos cerquilha colchetes aspas dois-pontos ponto e vírgula.`;

        const response = await anthropic.messages.create({
          model: modeloUsar,
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }]
        });

        const personagensTexto = response.content[0].text;

        // Extrair personagens em objeto {nome: descrição}
        const personagensObj = {};
        const matches = personagensTexto.matchAll(/(\d+)\.\s*([A-Z\s]+)\n\n([^\n]+(?:\n(?!\d+\.)[^\n]+)*)/g);

        for (const match of matches) {
          const nome = match[2].trim();
          const descricao = match[3].trim();
          personagensObj[nome] = descricao;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          personagensTexto,
          personagensObj,
          numPersonagens: Object.keys(personagensObj).length,
          custoEstimado: '0.054'
        }));

      } catch (error) {
        console.error('Erro ao gerar personagens:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // ============================================
  // ENDPOINT: GERAR TAKES
  // ============================================
  if (req.url === '/api/gerar-takes' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { blocos, personagens, modelo, offset, language } = JSON.parse(body);
        const modeloUsar = modelo || 'claude-sonnet-4-20250514';
        const offsetNumero = offset || 0;

        // Definir instruções de idioma
        const languageInstructions = {
          pt: 'Escreva TODO o conteúdo em PORTUGUÊS (Brasil).',
          en: 'Write ALL content in ENGLISH.',
          es: 'Escribe TODO el contenido en ESPAÑOL.'
        };
        const languagePrompt = languageInstructions[language || 'pt'];

        // Formatar blocos para o prompt (usando offset para numeração correta)
        const blocosNumerados = blocos.map((bloco, i) => `BLOCO ${offsetNumero + i + 1}:\n${bloco}`).join('\n\n');

        const prompt = `${languagePrompt}

Crie ${blocos.length} takes para IA de vídeo em formato JSON.

FORMATO (80-120 palavras cada):
{
  "take": 1,
  "scene": "[Ação específica], [ambiente histórico], [iluminação], [tipo câmera]. Live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate, real people, ultra-detailed, hyper realistic 8k.",
  "character_anchors": ["Nome1", "Nome2"]
}

REGRAS:
- Scene: ação + ambiente + luz + câmera (80-120 palavras)
- Terminar com: "Live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate, real people, ultra-detailed, hyper realistic 8k."
- character_anchors: APENAS nomes (ou [] se sem personagens)

⚠️ CRITICAL: In "character_anchors", use the EXACT character names as they appear in the BLOCOS below. DO NOT translate names. Character names must match the script exactly.

BLOCOS:
${blocosNumerados}

Retorne APENAS array JSON com ${blocos.length} takes:`;

        // max_tokens otimizado para 40 blocos
        // 40 blocos * ~300 tokens por take = ~12000 tokens necessários
        const response = await anthropic.messages.create({
          model: modeloUsar,
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }]
        });

        let takesJson = response.content[0].text;

        // Extrair JSON do response (caso tenha texto adicional)
        const jsonMatch = takesJson.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          takesJson = jsonMatch[0];
        }

        // Limpar possíveis problemas no JSON de forma mais agressiva
        takesJson = takesJson
          .replace(/,\s*}/g, '}')      // Remove vírgulas antes de }
          .replace(/,\s*\]/g, ']')     // Remove vírgulas antes de ]
          .replace(/}\s*{/g, '},{')    // Adiciona vírgula entre objetos
          .replace(/\n/g, ' ')          // Remove quebras de linha
          .replace(/\r/g, '')           // Remove carriage returns
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
          .replace(/,(\s*[}\]])/g, '$1'); // Remove vírgulas extras antes de } ou ]

        let takes;
        try {
          takes = JSON.parse(takesJson);
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON dos takes:', parseError.message);
          console.error('📍 Posição do erro:', parseError.message.match(/position (\d+)/)?.[1]);
          console.error('🔍 JSON problemático (primeiros 1000 chars):', takesJson.substring(0, 1000));

          // Tentar extrair a parte problemática
          const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
          if (pos > 0) {
            console.error('🎯 Contexto do erro (±50 chars):', takesJson.substring(Math.max(0, pos - 50), pos + 50));
          }

          throw new Error(`JSON inválido retornado pela IA na posição ${pos}. Verifique o log do servidor para detalhes. Tente com menos blocos (reduza de 50 para 30).`);
        }

        // Função para normalizar e encontrar personagem (case-insensitive + traduções)
        function findCharacter(nomeBuscado, personagensObj) {
          // 1. Tentar match exato
          if (personagensObj[nomeBuscado]) {
            return personagensObj[nomeBuscado];
          }

          // 2. Tentar match case-insensitive
          const nomeBuscadoUpper = nomeBuscado.toUpperCase();
          for (const [key, value] of Object.entries(personagensObj)) {
            if (key.toUpperCase() === nomeBuscadoUpper) {
              return value;
            }
          }

          // 3. Mapeamento de traduções comuns (EN -> PT)
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
            'SALOMAO': 'SALOMÃO',
            'SAMUEL': 'SAMUEL',
            'SAUL': 'SAUL',
            'ELIJAH': 'ELIAS',
            'DANIEL': 'DANIEL',
            'JEREMIAH': 'JEREMIAS'
          };

          const nomeTraducao = traducoes[nomeBuscadoUpper];
          if (nomeTraducao && personagensObj[nomeTraducao]) {
            return personagensObj[nomeTraducao];
          }

          // 4. Se não encontrou, retornar null
          return null;
        }

        // Montar arquivo final com substituição de personagens (usando offset para numeração)
        let takesCompleto = '';
        takes.forEach((take, idx) => {
          takesCompleto += `TAKE ${offsetNumero + idx + 1}\n`;
          takesCompleto += `${take.scene}\n`;

          if (take.character_anchors && take.character_anchors.length > 0) {
            takesCompleto += `Character anchor${take.character_anchors.length > 1 ? 's' : ''}:\n`;

            take.character_anchors.forEach(nome => {
              const descricao = findCharacter(nome, personagens) || '[Personagem não encontrado]';
              takesCompleto += `${nome}: ${descricao}\n`;
            });
          }

          takesCompleto += `\n`;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          takesCompleto,
          numTakes: takes.length,
          custoEstimado: '0.025'
        }));

      } catch (error) {
        console.error('Erro ao gerar takes:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📝 Acesse no navegador para testar o gerador\n`);
});
