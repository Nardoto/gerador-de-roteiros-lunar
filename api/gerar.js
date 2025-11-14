const Anthropic = require('@anthropic-ai/sdk');

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

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
      res.write(`data: ${JSON.stringify(data)}\\n\\n`);
    };

    console.log('\\n🚀 Iniciando geração...');
    console.log('Título:', input.title);
    console.log('Idioma:', selectedLanguage.toUpperCase());
    console.log('Tópicos:', input.numTopics);
    console.log('Modelo:', input.model || 'claude-sonnet-4-20250514');

    const claudeModel = input.model || 'claude-sonnet-4-20250514';
    const messages = [];

    // STEP 1: Estrutura
    console.log('\\n📋 Gerando estrutura...');
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

    console.log('\\n✅ Estrutura gerada:');
    console.log(estrutura.substring(0, 300) + '...');

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

    // Extrair tópicos da estrutura
    const topicPattern = /TÓPICO \\d+:/gi;
    const marcadores = estrutura.match(topicPattern);
    const parts = estrutura.split(topicPattern);
    parts.shift(); // Remover texto antes do primeiro tópico
    const topicos = parts.filter(t => t.trim().length > 0);

    console.log(`\\n🔍 Encontrados ${marcadores ? marcadores.length : 0} marcadores`);
    console.log(`🔍 Extraídos ${topicos.length} tópicos`);

    if (topicos.length < input.numTopics) {
      sendEvent({ type: 'error', error: `Apenas ${topicos.length} tópicos foram gerados. Esperava ${input.numTopics}.` });
      res.end();
      return;
    }

    // STEP 2: Hook
    console.log('\\n🎣 Gerando hook...');
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
      charCountNoSpaces: hook.replace(/\\s/g, '').length,
      wordCount: hook.split(/\\s+/).filter(w => w.length > 0).length
    });

    // STEP 3-N: Cada tópico (dividido em subtópicos)
    const topicosGerados = [];

    for (let i = 0; i < input.numTopics; i++) {
      const topicoNum = i + 1;
      const topicoEstrutura = topicos[i];

      console.log(`\\n📖 Gerando tópico ${topicoNum}/${input.numTopics}...`);
      console.log(`Estrutura (primeiros 100 chars): ${topicoEstrutura.substring(0, 100)}...`);

      sendEvent({ type: 'step', step: `topico${topicoNum}`, status: 'started' });

      // Extrair subtópicos desta estrutura
      const subtopicoPattern = /\\d+\\.\\d+/g;
      const subtopicosMatch = topicoEstrutura.match(subtopicoPattern);
      const numSubtopicosReais = subtopicosMatch ? subtopicosMatch.length : input.numSubtopics;

      console.log(`🔍 Subtópicos detectados: ${numSubtopicosReais}`);

      // Calcular caracteres por subtópico
      const charsTotal = Math.floor(input.totalChars / input.numTopics);
      const charsPorSubtopico = Math.floor(charsTotal / numSubtopicosReais);

      console.log(`📊 Caracteres por subtópico: ${charsPorSubtopico}`);
      console.log(`📊 Estratégia: Gerar 4 subtópicos por vez para reduzir custo`);

      // Dividir estrutura em subtópicos individuais
      const subtopicoLines = topicoEstrutura.split(/\\n/).filter(line => /^\\d+\\.\\d+/.test(line.trim()));

      // Array para armazenar cada subtópico gerado
      const subtopicosGerados = [];

      // Gerar em grupos de 4 subtópicos por vez
      const SUBTOPICOS_POR_GRUPO = 4;
      const numGrupos = Math.ceil(numSubtopicosReais / SUBTOPICOS_POR_GRUPO);

      for (let grupoIdx = 0; grupoIdx < numGrupos; grupoIdx++) {
        const inicioGrupo = grupoIdx * SUBTOPICOS_POR_GRUPO;
        const fimGrupo = Math.min(inicioGrupo + SUBTOPICOS_POR_GRUPO, numSubtopicosReais);
        const numSubsNesteGrupo = fimGrupo - inicioGrupo;

        console.log(`\\n  📦 Gerando grupo ${grupoIdx + 1}/${numGrupos} (subtópicos ${inicioGrupo + 1}-${fimGrupo})...`);

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

${subtopicosTitulos.join('\\n')}

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
          max_tokens: 6000,
          messages: messages
        });

        const grupoTexto = grupoMsg.content[0].text;
        messages.push({ role: 'assistant', content: grupoTexto });

        // Dividir o texto gerado em subtópicos (por parágrafos)
        const paragrafos = grupoTexto.split(/\\n\\n+/).filter(p => p.trim().length > 0);

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
            prompt: k === 0 ? grupoPrompt : undefined,
            charCount: paragrafo.length,
            charCountNoSpaces: paragrafo.replace(/\\s/g, '').length,
            wordCount: paragrafo.split(/\\s+/).filter(w => w.length > 0).length
          });
        }

        // Delay entre grupos
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Juntar todos os subtópicos em um único tópico
      const tituloTopico = topicoEstrutura.split('\\n')[0];
      const topicoCompleto = `**${tituloTopico}**\\n\\n${subtopicosGerados.join('\\n\\n')}`;
      topicosGerados.push(topicoCompleto);

      const totalCharsTopico = topicoCompleto.length;
      console.log(`\\n✅ Tópico ${topicoNum} completo (${totalCharsTopico} chars de ${charsTotal} esperados - ${Math.round(totalCharsTopico/charsTotal*100)}%)`);

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
    console.log('\\n✅ Geração completa!');
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
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\\n\\n`);
    res.end();
  }
};
