const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

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

    const languageMap = {
      pt: 'Brazilian Portuguese',
      en: 'English',
      es: 'Spanish'
    };
    const outputLanguage = languageMap[language || 'pt'];

    // ALL PROMPTS IN ENGLISH - Reduced from ~1000 tokens to ~200 tokens
    const prompt = `Analyze the script and list characters by order of importance.

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
${roteiro}

Start with:
CHARACTER DESCRIPTIONS FOR AI IMAGE GENERATION

INSTRUCTIONS
Continuous paragraph format for Midjourney DALL-E Stable Diffusion Runway Kling AI etc.

Output names/titles in: ${outputLanguage}`;

    const response = await anthropic.messages.create({
      model: modeloUsar,
      max_tokens: calcMaxTokens(2000),
      messages: [{ role: 'user', content: prompt }]
    });

    const personagensTexto = response.content[0].text;

    // Extract characters as object {name: description}
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
      custoEstimado: '0.015'
    });

  } catch (error) {
    console.error('Error generating characters:', error);
    res.status(500).json({ error: error.message });
  }
};
