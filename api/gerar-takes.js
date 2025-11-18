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
    const { blocos, personagens, modelo, offset, language } = req.body;
    const modeloUsar = modelo || 'claude-sonnet-4-20250514';
    const offsetNumero = offset || 0;

    const languageMap = {
      pt: 'Brazilian Portuguese',
      en: 'English',
      es: 'Spanish'
    };
    const outputLanguage = languageMap[language || 'pt'];

    // Format blocks for prompt (using offset for correct numbering)
    const blocosNumerados = blocos.map((bloco, i) => `BLOCK ${offsetNumero + i + 1}:\n${bloco}`).join('\n\n');

    // ALL PROMPTS IN ENGLISH - With specific historical context
    const prompt = `Analyze the historical period of blocks and create ${blocos.length} takes for video AI in JSON.

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
- Return ONLY JSON array

BLOCKS:
${blocosNumerados}

Return JSON array with ${blocos.length} takes with precise historicity.`;

    const response = await anthropic.messages.create({
      model: modeloUsar,
      max_tokens: calcMaxTokens(blocos.length * 180),
      messages: [{ role: 'user', content: prompt }]
    });

    let takesJson = response.content[0].text;

    // Extract JSON from response (in case there's additional text)
    const jsonMatch = takesJson.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      takesJson = jsonMatch[0];
    }

    // Clean possible JSON problems
    takesJson = takesJson
      .replace(/,\s*}/g, '}')
      .replace(/,\s*\]/g, ']')
      .replace(/}\s*{/g, '},{')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/,(\s*[}\]])/g, '$1');

    let takes;
    try {
      takes = JSON.parse(takesJson);
    } catch (parseError) {
      console.error('❌ Error parsing takes JSON:', parseError.message);
      throw new Error(`Invalid JSON returned by AI. Try with fewer blocks.`);
    }

    // Function to normalize and find character
    function findCharacter(nomeBuscado, personagensObj) {
      if (personagensObj[nomeBuscado]) {
        return personagensObj[nomeBuscado];
      }

      const nomeBuscadoUpper = nomeBuscado.toUpperCase();
      for (const [key, value] of Object.entries(personagensObj)) {
        if (key.toUpperCase() === nomeBuscadoUpper) {
          return value;
        }
      }

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

    // Build final file
    let takesCompleto = '';
    takes.forEach((take, idx) => {
      takesCompleto += `TAKE ${offsetNumero + idx + 1}\n`;
      takesCompleto += `${take.scene}\n`;

      if (take.character_anchors && take.character_anchors.length > 0) {
        takesCompleto += `Character anchor${take.character_anchors.length > 1 ? 's' : ''}:\n`;

        take.character_anchors.forEach(nome => {
          const descricao = findCharacter(nome, personagens) || '[Character not found]';
          takesCompleto += `${nome}: ${descricao}\n`;
        });
      }

      takesCompleto += `\n`;
    });

    res.status(200).json({
      takesCompleto,
      numTakes: takes.length,
      custoEstimado: '0.008'
    });

  } catch (error) {
    console.error('Error generating takes:', error);
    res.status(500).json({ error: error.message });
  }
};
