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
    const { blocos, personagens, modelo, offset, language } = req.body;
    const modeloUsar = modelo || 'claude-sonnet-4-20250514';
    const offsetNumero = offset || 0;

    const languageInstructions = {
      pt: 'Escreva TODO o conteúdo em PORTUGUÊS (Brasil).',
      en: 'Write ALL content in ENGLISH.',
      es: 'Escribe TODO el contenido en ESPAÑOL.'
    };
    const languagePrompt = languageInstructions[language || 'pt'];

    // Formatar blocos para o prompt (usando offset para numeração correta)
    const blocosNumerados = blocos.map((bloco, i) => `BLOCO ${offsetNumero + i + 1}:\\n${bloco}`).join('\\n\\n');

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

    const response = await anthropic.messages.create({
      model: modeloUsar,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }]
    });

    let takesJson = response.content[0].text;

    // Extrair JSON do response (caso tenha texto adicional)
    const jsonMatch = takesJson.match(/\\[[\\s\\S]*\\]/);
    if (jsonMatch) {
      takesJson = jsonMatch[0];
    }

    // Limpar possíveis problemas no JSON
    takesJson = takesJson
      .replace(/,\\s*}/g, '}')
      .replace(/,\\s*\\]/g, ']')
      .replace(/}\\s*{/g, '},{')
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, '')
      .replace(/[\\u0000-\\u001F\\u007F-\\u009F]/g, '')
      .replace(/,(\\s*[}\\]])/g, '$1');

    let takes;
    try {
      takes = JSON.parse(takesJson);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON dos takes:', parseError.message);
      throw new Error(`JSON inválido retornado pela IA. Tente com menos blocos.`);
    }

    // Função para normalizar e encontrar personagem
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

    // Montar arquivo final
    let takesCompleto = '';
    takes.forEach((take, idx) => {
      takesCompleto += `TAKE ${offsetNumero + idx + 1}\\n`;
      takesCompleto += `${take.scene}\\n`;

      if (take.character_anchors && take.character_anchors.length > 0) {
        takesCompleto += `Character anchor${take.character_anchors.length > 1 ? 's' : ''}:\\n`;

        take.character_anchors.forEach(nome => {
          const descricao = findCharacter(nome, personagens) || '[Personagem não encontrado]';
          takesCompleto += `${nome}: ${descricao}\\n`;
        });
      }

      takesCompleto += `\\n`;
    });

    res.status(200).json({
      takesCompleto,
      numTakes: takes.length,
      custoEstimado: '0.025'
    });

  } catch (error) {
    console.error('Erro ao gerar takes:', error);
    res.status(500).json({ error: error.message });
  }
};
