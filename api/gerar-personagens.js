const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

module.exports = async (req, res) => {
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
    const { roteiro, modelo, language } = req.body;
    const modeloUsar = modelo || 'claude-sonnet-4-20250514';

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
    const matches = personagensTexto.matchAll(/(\\d+)\\.\\s*([A-Z\\s]+)\\n\\n([^\\n]+(?:\\n(?!\\d+\\.)[^\\n]+)*)/g);

    for (const match of matches) {
      const nome = match[2].trim();
      const descricao = match[3].trim();
      personagensObj[nome] = descricao;
    }

    res.status(200).json({
      personagensTexto,
      personagensObj,
      numPersonagens: Object.keys(personagensObj).length,
      custoEstimado: '0.054'
    });

  } catch (error) {
    console.error('Erro ao gerar personagens:', error);
    res.status(500).json({ error: error.message });
  }
};
