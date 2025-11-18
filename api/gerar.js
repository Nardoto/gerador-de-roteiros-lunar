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

    // Definir instruções de idioma (simplificado)
    const languageInstructions = {
      pt: 'Português (Brasil)',
      en: 'English',
      es: 'Español'
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
      res.write(`data: ${JSON.stringify(data)}\\n\\n`);
    };

    console.log('\\n🚀 Iniciando geração OTIMIZADA (Opção B - Contexto Mínimo)...');
    console.log('Título:', input.title);
    console.log('Idioma:', selectedLanguage.toUpperCase());
    console.log('Tópicos:', input.numTopics);
    console.log('Modelo:', input.model || 'claude-sonnet-4-20250514');

    const claudeModel = input.model || 'claude-sonnet-4-20250514';

    // Definir tipo de conteúdo e suas características
    const tipoConteudo = input.tipoConteudo || 'historias';
    const tiposConfig = {
      historias: {
        estilo: 'narrativa cronológica imersiva, terceira pessoa, estilo literário'
      },
      curiosidades: {
        estilo: 'fatos surpreendentes e reveladores, tom envolvente'
      },
      estudos: {
        estilo: 'análise teológica profunda com contexto histórico'
      },
      personagens: {
        estilo: 'perfil biográfico detalhado, exploração de caráter'
      }
    };

    const config = tiposConfig[tipoConteudo] || tiposConfig.historias;
    console.log('Tipo de Conteúdo:', tipoConteudo);

    // Verificar se há prompts customizados (Modo Avançado)
    const customPrompts = input.customPrompts || {};
    const usandoCustom = Object.keys(customPrompts).length > 0;
    if (usandoCustom) {
      console.log('🔧 MODO AVANÇADO: Usando prompts customizados');
    }

    // ============================================================
    // STEP 1: Estrutura
    // ============================================================
    console.log('\\n📋 Gerando estrutura...');
    sendEvent({ type: 'step', step: 'estrutura', status: 'started' });

    // Definir formato de tópico por idioma
    const formatoTopico = {
      pt: 'TÓPICO',
      en: 'TOPIC',
      es: 'TÓPICO'
    };
    const palavraTopico = formatoTopico[selectedLanguage];

    // PROMPT OTIMIZADO - Reduzido de ~300 tokens para ~80 tokens
    let estruturaPrompt = customPrompts.estrutura || `Crie ${input.numTopics} tópicos sobre "${input.title}".

Sinopse: ${input.synopsis}
${input.knowledgeBase ? `\\nContexto: ${input.knowledgeBase}` : ''}

Formato OBRIGATÓRIO:
${palavraTopico} 1: [título]
1.1 [subtópico]
1.2 [subtópico]
...1.${input.numSubtopics}

${palavraTopico} 2: [título]
2.1-2.${input.numSubtopics} [subtópicos]

Idioma: ${languagePrompt}
IMPORTANTE: ${input.numTopics} tópicos, ${input.numSubtopics} subtópicos cada. APENAS títulos (não desenvolva).`;

    // Substituir variáveis no prompt customizado
    if (customPrompts.estrutura) {
      estruturaPrompt = estruturaPrompt
        .replace(/\{titulo\}/g, input.title)
        .replace(/\{sinopse\}/g, input.synopsis)
        .replace(/\{knowledgeBase\}/g, input.knowledgeBase || '')
        .replace(/\{numTopics\}/g, input.numTopics)
        .replace(/\{numSubtopics\}/g, input.numSubtopics)
        .replace(/\{languagePrompt\}/g, languagePrompt);
    }

    const estruturaMsg = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: calcMaxTokens(800), // ~350 tokens ao invés de 4000
      messages: [{ role: 'user', content: estruturaPrompt }]
    });

    const estrutura = estruturaMsg.content[0].text;

    console.log('✅ Estrutura gerada:', estrutura.length, 'chars');
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

    // Extrair tópicos da estrutura (multilíngue)
    const topicPattern = /(TÓPICO|TOPIC) \\d+:/gi;
    const marcadores = estrutura.match(topicPattern);
    const parts = estrutura.split(topicPattern);

    // Remover texto antes do primeiro tópico
    const topicos = [];
    for (let i = 1; i < parts.length; i += 2) {
      if (parts[i + 1]) {
        topicos.push(parts[i + 1].trim());
      }
    }

    // Fallback se não encontrar
    if (topicos.length === 0) {
      parts.shift();
      topicos.push(...parts.filter(t => t.trim().length > 0));
    }

    console.log(`🔍 Encontrados ${marcadores ? marcadores.length : 0} marcadores`);
    console.log(`🔍 Extraídos ${topicos.length} tópicos`);

    if (topicos.length < input.numTopics) {
      sendEvent({ type: 'error', error: `Apenas ${topicos.length} tópicos gerados. Esperava ${input.numTopics}.` });
      res.end();
      return;
    }

    // ============================================================
    // STEP 2: Hook
    // ============================================================
    console.log('\\n🎣 Gerando hook...');
    sendEvent({ type: 'step', step: 'hook', status: 'started' });

    // PROMPT OTIMIZADO - Reduzido de ~150 tokens para ~40 tokens
    // CONTEXTO MÍNIMO: Apenas título + estrutura resumida (não histórico completo)
    let hookPrompt = customPrompts.hook || `Título: "${input.title}"
Tópicos: ${topicos.map((t, i) => `${i + 1}. ${t.split('\\n')[0]}`).join('; ')}

Crie introdução imersiva de EXATAMENTE ${input.hookChars} caracteres.
Idioma: ${languagePrompt}`;

    if (customPrompts.hook) {
      hookPrompt = hookPrompt
        .replace(/\{hookChars\}/g, input.hookChars)
        .replace(/\{languagePrompt\}/g, languagePrompt);
    }

    const hookMsg = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: calcMaxTokens(input.hookChars),
      messages: [{ role: 'user', content: hookPrompt }] // ← SEM HISTÓRICO!
    });

    const hook = hookMsg.content[0].text;

    console.log(`✅ Hook gerado: ${hook.length}/${input.hookChars} chars (${Math.round(hook.length/input.hookChars*100)}%)`);

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
    // STEP 3-N: Cada tópico COMPLETO (sem grupos!)
    // ============================================================
    const topicosGerados = [];
    const resumosTopicos = []; // Para contexto mínimo entre tópicos

    for (let i = 0; i < input.numTopics; i++) {
      const topicoNum = i + 1;
      const topicoEstrutura = topicos[i];

      console.log(`\\n📖 Gerando TÓPICO COMPLETO ${topicoNum}/${input.numTopics}...`);

      sendEvent({ type: 'step', step: `topico${topicoNum}`, status: 'started' });

      // Calcular caracteres para este tópico
      const charsTotal = Math.floor(input.totalChars / input.numTopics);

      console.log(`📊 Caracteres alvo: ${charsTotal}`);

      // PROMPT ULTRA OTIMIZADO - Reduzido de ~400 tokens para ~120 tokens
      // CONTEXTO MÍNIMO: Apenas estrutura do tópico + resumo dos anteriores
      let topicoPrompt;

      if (customPrompts.topico) {
        // Modo avançado - usar prompt customizado
        topicoPrompt = customPrompts.topico
          .replace(/\{topicoNum\}/g, topicoNum)
          .replace(/\{numTopicos\}/g, input.numTopics)
          .replace(/\{topicoEstrutura\}/g, topicoEstrutura)
          .replace(/\{charsTotal\}/g, charsTotal)
          .replace(/\{languagePrompt\}/g, languagePrompt);
      } else {
        // Prompt padrão otimizado
        const contextoAnterior = resumosTopicos.length > 0
          ? `\\nJá abordado: ${resumosTopicos.join('; ')}`
          : '';

        topicoPrompt = `Desenvolva este tópico:

${topicoEstrutura}

${contextoAnterior}

⚠️ OBRIGATÓRIO:
- EXATAMENTE ${charsTotal} caracteres (margem ±3%)
- Estilo: ${config.estilo}
- Idioma: ${languagePrompt}
- Fluido, sem títulos de subtópicos
- Versículos integrados naturalmente
- SEM repetir informações anteriores

CRÍTICO: Conte os caracteres! Alvo = ${charsTotal} chars.`;
      }

      const topicoMsg = await anthropic.messages.create({
        model: claudeModel,
        max_tokens: calcMaxTokens(charsTotal),
        messages: [{ role: 'user', content: topicoPrompt }] // ← SEM HISTÓRICO!
      });

      const topicoTexto = topicoMsg.content[0].text;

      // Adicionar título ao tópico
      const tituloTopico = topicoEstrutura.split('\\n')[0];
      const topicoCompleto = `**${tituloTopico}**\\n\\n${topicoTexto}`;
      topicosGerados.push(topicoCompleto);

      // Guardar resumo para contexto dos próximos tópicos
      const resumo = `Tópico ${topicoNum}: ${tituloTopico.substring(0, 50)} (${topicoTexto.length} chars)`;
      resumosTopicos.push(resumo);

      const accuracy = Math.round(topicoTexto.length / charsTotal * 100);
      const diff = topicoTexto.length - charsTotal;
      console.log(`✅ Tópico ${topicoNum}: ${topicoTexto.length}/${charsTotal} chars (${accuracy}%, ${diff > 0 ? '+' : ''}${diff})`);

      // Enviar tópico completo
      sendEvent({
        type: 'message',
        role: 'assistant',
        content: topicoCompleto,
        step: `topico${topicoNum}`,
        prompt: topicoPrompt,
        charCount: topicoCompleto.length,
        charCountNoSpaces: topicoCompleto.replace(/\\s/g, '').length,
        wordCount: topicoCompleto.split(/\\s+/).filter(w => w.length > 0).length
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
    // STEP FINAL: Conclusão com CTA
    // ============================================================
    console.log('\\n🎬 Gerando conclusão/CTA...');
    sendEvent({ type: 'step', step: 'conclusao', status: 'started' });

    // PROMPT OTIMIZADO - Reduzido de ~200 tokens para ~60 tokens
    let conclusaoPrompt = customPrompts.conclusao || `Título: "${input.title}"

Crie conclusão (máximo 400 caracteres):
- Inscrever no canal
- Compartilhar vídeo
- Comentar de onde assiste
- Tom amigável

Idioma: ${languagePrompt}`;

    if (customPrompts.conclusao) {
      conclusaoPrompt = conclusaoPrompt.replace(/\{languagePrompt\}/g, languagePrompt);
    }

    const conclusaoMsg = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: calcMaxTokens(400),
      messages: [{ role: 'user', content: conclusaoPrompt }] // ← SEM HISTÓRICO!
    });

    const conclusao = conclusaoMsg.content[0].text;

    console.log(`✅ Conclusão gerada: ${conclusao.length} chars`);

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
    // Concluído
    // ============================================================
    console.log('\\n✅ Geração completa! (OTIMIZADO - 60-70% menos tokens)');
    sendEvent({
      type: 'complete',
      files: {
        estrutura,
        hook,
        topicos: topicosGerados,
        conclusao
      }
    });

    res.end();

  } catch (error) {
    console.error('❌ Erro:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\\n\\n`);
    res.end();
  }
};
