const Anthropic = require('@anthropic-ai/sdk');

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Função auxiliar para calcular max_tokens dinamicamente
function calcMaxTokens(expectedChars) {
  // 1 token ≈ 3.5 caracteres (média para português/inglês)
  // +50% de margem de segurança
  return Math.ceil((expectedChars * 1.5) / 3.5);
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const input = req.body;

    // Language mapping for output
    const languageMap = {
      pt: 'Brazilian Portuguese',
      en: 'English',
      es: 'Spanish'
    };
    const selectedLanguage = input.language || 'pt';
    const outputLanguage = languageMap[selectedLanguage];

    // Headers para Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Função para enviar eventos SSE com suporte a chunking para mensagens grandes
    const sendEvent = (data) => {
      try {
        const jsonStr = JSON.stringify(data);

        // Se a mensagem é muito grande (>5000 chars), dividir em chunks
        // Reduzido de 7000 para 5000 para ter margem de segurança com metadados JSON
        if (data.type === 'message' && data.content && data.content.length > 5000) {
          const content = data.content;
          const chunkSize = 5000;
          const chunks = [];

          for (let i = 0; i < content.length; i += chunkSize) {
            chunks.push(content.slice(i, i + chunkSize));
          }

          // Enviar cada chunk como uma mensagem separada
          chunks.forEach((chunk, index) => {
            const chunkData = {
              ...data,
              content: chunk,
              isChunk: true,
              chunkIndex: index,
              totalChunks: chunks.length,
              isLastChunk: index === chunks.length - 1
            };
            res.write(`data: ${JSON.stringify(chunkData)}\\n\\n`);
          });
        } else {
          // Mensagem normal, enviar diretamente
          res.write(`data: ${jsonStr}\\n\\n`);
        }

        // Flush para garantir envio imediato
        if (res.flush) res.flush();
      } catch (error) {
        console.error('❌ Error sending event:', error);
      }
    };

    console.log('\\n🚀 Starting OPTIMIZED generation (Option B - Minimal Context)...');
    console.log('Title:', input.title);
    console.log('Language:', selectedLanguage.toUpperCase());
    console.log('Topics:', input.numTopics);
    console.log('Model:', input.model || 'claude-sonnet-4-20250514');

    const claudeModel = input.model || 'claude-sonnet-4-20250514';

    // Content type configurations
    const tipoConteudo = input.tipoConteudo || 'historias';
    const tiposConfig = {
      historias: {
        estilo: 'immersive chronological narrative, third person, literary style'
      },
      curiosidades: {
        estilo: 'surprising and revealing facts, engaging tone'
      },
      estudos: {
        estilo: 'deep theological analysis with historical context'
      },
      personagens: {
        estilo: 'detailed biographical profile, character exploration'
      }
    };

    const config = tiposConfig[tipoConteudo] || tiposConfig.historias;
    console.log('Content Type:', tipoConteudo);

    // Check for custom prompts (Advanced Mode)
    const customPrompts = input.customPrompts || {};
    const usandoCustom = Object.keys(customPrompts).length > 0;
    if (usandoCustom) {
      console.log('🔧 ADVANCED MODE: Using custom prompts');
    }

    // ============================================================
    // STEP 1: Structure
    // ============================================================
    console.log('\\n📋 Generating structure...');
    sendEvent({ type: 'step', step: 'estrutura', status: 'started' });

    // Topic format by language
    const formatoTopico = {
      pt: 'TÓPICO',
      en: 'TOPIC',
      es: 'TÓPICO'
    };
    const palavraTopico = formatoTopico[selectedLanguage];

    // IMPROVED PROMPT - Clear narrative guidelines
    let estruturaPrompt = customPrompts.estrutura || `Create ${input.numTopics} topics about "${input.title}" for a YouTube biblical history channel.

Synopsis: ${input.synopsis}
${input.knowledgeBase ? `\nContext: ${input.knowledgeBase}` : ''}

NARRATIVE GUIDELINES:
- Structure as a book narrative in chronological order
- No information should be repeated across topics
- Topics must NOT contain introduction or conclusion (only development)
- Each topic should be well-divided so viewers don't feel lost
- Distribute content equally across all topics

MANDATORY FORMAT (FOLLOW EXACTLY):
${palavraTopico} 1: [title]
1.1 [subtopic]
1.2 [subtopic]
...1.${input.numSubtopics}

${palavraTopico} 2: [title]
2.1-2.${input.numSubtopics} [subtopics]

FORMAT RULES:
- Use EXACTLY "${palavraTopico} X:" (number + colon, no extra characters)
- NO markdown (**, ##, bullets)
- NO special formatting
- Plain text only

Output language: ${outputLanguage}
CRITICAL: ${input.numTopics} topics, ${input.numSubtopics} subtopics each. ONLY titles (do not develop content yet).`;

    // Replace variables in custom prompt
    if (customPrompts.estrutura) {
      estruturaPrompt = estruturaPrompt
        .replace(/\{titulo\}/g, input.title)
        .replace(/\{sinopse\}/g, input.synopsis)
        .replace(/\{knowledgeBase\}/g, input.knowledgeBase || '')
        .replace(/\{numTopics\}/g, input.numTopics)
        .replace(/\{numSubtopics\}/g, input.numSubtopics)
        .replace(/\{languagePrompt\}/g, outputLanguage);
    }

    const estruturaMsg = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: calcMaxTokens(2000), // Increased for 3 topics with 8 subtopics each
      messages: [{ role: 'user', content: estruturaPrompt }]
    });

    const estrutura = estruturaMsg.content[0].text;

    console.log('✅ Structure generated:', estrutura.length, 'chars');
    console.log(estrutura.substring(0, 200) + '...');

    sendEvent({
      type: 'message',
      role: 'assistant',
      content: estrutura,
      step: 'estrutura',
      prompt: estruturaPrompt,
      charCount: estrutura.length,
      charCountNoSpaces: estrutura.replace(/\\s/g, '').length,
      wordCount: estrutura.split(/\\s+/).filter(w => w.length > 0).length
    });

    // Extract topics from structure (multilingual, flexible for markdown)
    const topicPattern = /(?:\*\*)?(?:#{1,3}\s*)?(?:TÓPICO|TOPIC)\s*\d+\s*[:.\-]?(?:\*\*)?/gi;
    const marcadores = estrutura.match(topicPattern);
    const parts = estrutura.split(topicPattern);

    // Remove text before first topic and filter empty
    parts.shift();
    const topicos = parts.filter(t => t.trim().length > 0);

    console.log(`🔍 Found ${marcadores ? marcadores.length : 0} markers`);
    console.log(`🔍 Extracted ${topicos.length} topics`);

    if (topicos.length < input.numTopics) {
      sendEvent({ type: 'error', error: `Only ${topicos.length} topics generated. Expected ${input.numTopics}.` });
      res.end();
      return;
    }

    // ============================================================
    // STEP 2: Hook
    // ============================================================
    console.log('\\n🎣 Generating hook...');
    sendEvent({ type: 'step', step: 'hook', status: 'started' });

    // OPTIMIZED PROMPT (ALL IN ENGLISH)
    let hookPrompt = customPrompts.hook || `Title: "${input.title}"
Topics: ${topicos.map((t, i) => `${i + 1}. ${t.split('\n')[0]}`).join('; ')}

Create immersive introduction of EXACTLY ${input.hookChars} characters.
CRITICAL: NO emojis, NO special characters, NO markdown formatting (**, ##, bullets).
Plain narrative text only for AI voice narration.
Output language: ${outputLanguage}`;

    if (customPrompts.hook) {
      hookPrompt = hookPrompt
        .replace(/\{hookChars\}/g, input.hookChars)
        .replace(/\{languagePrompt\}/g, outputLanguage);
    }

    const hookMsg = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: calcMaxTokens(input.hookChars),
      messages: [{ role: 'user', content: hookPrompt }]
    });

    const hook = hookMsg.content[0].text;

    console.log(`✅ Hook generated: ${hook.length}/${input.hookChars} chars (${Math.round(hook.length/input.hookChars*100)}%)`);

    sendEvent({
      type: 'message',
      role: 'assistant',
      content: hook,
      step: 'hook',
      prompt: hookPrompt,
      charCount: hook.length,
      charCountNoSpaces: hook.replace(/\\s/g, '').length,
      wordCount: hook.split(/\\s+/).filter(w => w.length > 0).length
    });

    // ============================================================
    // STEP 3-N: Each COMPLETE topic (no groups!)
    // ============================================================
    const topicosGerados = [];
    const resumosTopicos = [];

    for (let i = 0; i < input.numTopics; i++) {
      const topicoNum = i + 1;
      const topicoEstrutura = topicos[i];

      console.log(`\\n📖 Generating COMPLETE TOPIC ${topicoNum}/${input.numTopics}...`);

      sendEvent({ type: 'step', step: `topico${topicoNum}`, status: 'started' });

      const charsTotal = Math.floor(input.totalChars / input.numTopics);

      console.log(`📊 Target characters: ${charsTotal}`);

      // ULTRA OPTIMIZED PROMPT (ALL IN ENGLISH)
      let topicoPrompt;

      if (customPrompts.topico) {
        topicoPrompt = customPrompts.topico
          .replace(/\{topicoNum\}/g, topicoNum)
          .replace(/\{numTopicos\}/g, input.numTopics)
          .replace(/\{topicoEstrutura\}/g, topicoEstrutura)
          .replace(/\{charsTotal\}/g, charsTotal)
          .replace(/\{languagePrompt\}/g, outputLanguage);
      } else {
        const contextoAnterior = resumosTopicos.length > 0
          ? `\nAlready covered: ${resumosTopicos.join('; ')}`
          : '';

        topicoPrompt = `You are an experienced biblical writer creating Topic ${topicoNum} of ${input.numTopics}.

TOPIC TO DEVELOP:
${topicoEstrutura}

${contextoAnterior}

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
Write EXACTLY ${charsTotal} characters (range: ${Math.floor(charsTotal * 0.97)}-${Math.ceil(charsTotal * 1.03)})

Output language: ${outputLanguage}

START WRITING (${charsTotal} chars):`;
      }

      const topicoMsg = await anthropic.messages.create({
        model: claudeModel,
        max_tokens: calcMaxTokens(charsTotal),
        messages: [{ role: 'user', content: topicoPrompt }]
      });

      const topicoTexto = topicoMsg.content[0].text;

      // Push only the pure topic text (no title or structure)
      topicosGerados.push(topicoTexto);

      // Extract title for summary context
      const tituloTopico = topicoEstrutura.split('\n')[0];
      const resumo = `Topic ${topicoNum}: ${tituloTopico.substring(0, 50)} (${topicoTexto.length} chars)`;
      resumosTopicos.push(resumo);

      const accuracy = Math.round(topicoTexto.length / charsTotal * 100);
      const diff = topicoTexto.length - charsTotal;
      console.log(`✅ Topic ${topicoNum}: ${topicoTexto.length}/${charsTotal} chars (${accuracy}%, ${diff > 0 ? '+' : ''}${diff})`);

      // Log para debug de tamanho
      console.log(`📏 Topic ${topicoNum} content length: ${topicoTexto.length} chars`);
      if (topicoTexto.length > 5000) {
        console.log(`📦 Topic ${topicoNum} will be chunked (${topicoTexto.length} > 5000)`);
      }

      sendEvent({
        type: 'message',
        role: 'assistant',
        content: topicoTexto,
        step: `topico${topicoNum}`,
        prompt: topicoPrompt,
        charCount: topicoTexto.length,
        charCountNoSpaces: topicoTexto.replace(/\s/g, '').length,
        wordCount: topicoTexto.split(/\s+/).filter(w => w.length > 0).length
      });

      sendEvent({
        type: 'topico_complete',
        topicoNum: topicoNum,
        totalChars: topicoTexto.length,
        expectedChars: charsTotal,
        percentComplete: accuracy
      });
    }

    // ============================================================
    // FINAL STEP: Conclusion with CTA
    // ============================================================
    console.log('\\n🎬 Generating conclusion/CTA...');
    sendEvent({ type: 'step', step: 'conclusao', status: 'started' });

    // OPTIMIZED PROMPT (ALL IN ENGLISH)
    let conclusaoPrompt = customPrompts.conclusao || `Title: "${input.title}"

Create narrated conclusion (max 400 characters) for voice-over:
- Invite to subscribe and activate notifications
- Ask viewers to share and comment their location
- Warm, conversational tone
- CRITICAL: NO emojis, NO special characters, NO markdown (**, ##, bullets)
- Plain narrative text only for AI voice narration
- Natural spoken language only

Output language: ${outputLanguage}`;

    if (customPrompts.conclusao) {
      conclusaoPrompt = conclusaoPrompt.replace(/\{languagePrompt\}/g, outputLanguage);
    }

    const conclusaoMsg = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: calcMaxTokens(400),
      messages: [{ role: 'user', content: conclusaoPrompt }]
    });

    const conclusao = conclusaoMsg.content[0].text;

    console.log(`✅ Conclusion generated: ${conclusao.length} chars`);

    sendEvent({
      type: 'message',
      role: 'assistant',
      content: conclusao,
      step: 'conclusao',
      prompt: conclusaoPrompt,
      charCount: conclusao.length,
      charCountNoSpaces: conclusao.replace(/\\s/g, '').length,
      wordCount: conclusao.split(/\\s+/).filter(w => w.length > 0).length
    });

    // ============================================================
    // Complete
    // ============================================================
    console.log('\\n✅ Generation complete! (OPTIMIZED - 60-70% fewer tokens)');

    // Calcular tamanho total dos arquivos gerados
    const totalSize = estrutura.length + hook.length +
                     topicosGerados.reduce((acc, t) => acc + t.length, 0) +
                     conclusao.length;

    console.log(`📊 Total content size: ${totalSize} chars`);

    // Enviar evento de conclusão LEVE (sem conteúdo completo)
    // O frontend já tem todo o conteúdo dos eventos individuais
    console.log('📤 Enviando evento COMPLETE (lightweight)...');
    sendEvent({
      type: 'complete',
      status: 'success',
      summary: {
        estruturaLength: estrutura.length,
        hookLength: hook.length,
        topicosCount: topicosGerados.length,
        topicosLengths: topicosGerados.map(t => t.length),
        conclusaoLength: conclusao.length,
        totalSize: totalSize
      },
      message: 'Roteiro gerado com sucesso!'
    });
    console.log('✅ Evento COMPLETE enviado (lightweight)!');

    // Flush explícito (forçar envio dos dados do buffer)
    if (res.flush) res.flush();

    // Aguardar um pouco antes de encerrar a conexão para garantir que o evento foi enviado
    setTimeout(() => {
      console.log('🔒 Encerrando conexão SSE');
      res.end();
    }, 1000); // Aumentado para 1 segundo para garantir envio

  } catch (error) {
    console.error('❌ Error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\\n\\n`);
    res.end();
  }
};
