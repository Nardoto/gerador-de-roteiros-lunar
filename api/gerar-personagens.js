const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Função auxiliar para calcular max_tokens
function calcMaxTokens(expectedChars) {
  return Math.ceil((expectedChars * 1.5) / 3.5);
}

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
      pt: 'Português (Brasil)',
      en: 'English',
      es: 'Español'
    };
    const languagePrompt = languageInstructions[language || 'pt'];

    // PROMPT OTIMIZADO - Reduzido de ~1000 tokens para ~200 tokens
    const prompt = `Idioma: ${languagePrompt}

Analise o roteiro e liste personagens por ordem de importância.

FORMATO:
1. NOME (sem sufixos)

[Descrição física em INGLÊS: idade, altura, corpo, pele, rosto, olhos, cabelo, barba, roupas, ambiente. Parágrafo contínuo 80-150 palavras para principais, 30-50 para secundários]

REGRAS:
- TOP 3 principais: descrição completa (80-150 palavras)
- Secundários: descrição curta (30-50 palavras)
- Apenas características físicas visíveis
- Estilo live-action documental realista
- Terminar PRINCIPAIS com: live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate, REAL PEOPLE, ultra-detailed, hyper realistic 8k
- Terminar SECUNDÁRIOS com: live-action documentary style, real people, historically accurate
- Manter nomes originais (DAVI não DAVID)
- Sem caracteres especiais

ROTEIRO:
${roteiro}

Inicie com:
CHARACTER DESCRIPTIONS FOR AI IMAGE GENERATION

INSTRUCTIONS
Continuous paragraph format for Midjourney DALL-E Stable Diffusion Runway Kling AI etc.`;

    const response = await anthropic.messages.create({
      model: modeloUsar,
      max_tokens: calcMaxTokens(2000), // ~850 tokens ao invés de 3000
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

    res.status(200).json({
      personagensTexto,
      personagensObj,
      numPersonagens: Object.keys(personagensObj).length,
      custoEstimado: '0.015' // Atualizado para refletir economia de ~70%
    });

  } catch (error) {
    console.error('Erro ao gerar personagens:', error);
    res.status(500).json({ error: error.message });
  }
};
