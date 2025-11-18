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
    const { blocos, personagens, modelo, offset, language } = req.body;
    const modeloUsar = modelo || 'claude-sonnet-4-20250514';
    const offsetNumero = offset || 0;

    const languageInstructions = {
      pt: 'Português (Brasil)',
      en: 'English',
      es: 'Español'
    };
    const languagePrompt = languageInstructions[language || 'pt'];

    // Formatar blocos para o prompt (usando offset para numeração correta)
    const blocosNumerados = blocos.map((bloco, i) => `BLOCO ${offsetNumero + i + 1}:\n${bloco}`).join('\n\n');

    // PROMPT OTIMIZADO - Com contexto histórico específico
    const prompt = `Idioma: ${languagePrompt}

Analise o período histórico dos blocos e crie ${blocos.length} takes para IA de vídeo em JSON.

FORMATO (80-120 palavras cada):
{
  "take": 1,
  "scene": "[Ação + ambiente + luz + câmera + vestuário de época + arquitetura típica do período]. Live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate for [período histórico específico ex: ancient Egypt 1400 BC], real people, ultra-detailed, hyper realistic 8k.",
  "character_anchors": ["Nome1", "Nome2"]
}

EXEMPLO:
{
  "take": 1,
  "scene": "Moses wearing simple linen robes typical of Hebrew slaves raises wooden staff toward churning waters of Red Sea, Egyptian chariots pursuing in background, desert landscape with palm trees, mud brick structures visible, golden hour lighting. Live-action documentary style, cinematic lighting, high fidelity cinematography, historically accurate for ancient Egypt 1400 BC, real people, ultra-detailed, hyper realistic 8k.",
  "character_anchors": ["Moses"]
}

REGRAS CRÍTICAS:
- Identificar época histórica dos blocos (ex: Êxodo = Egito 1400 AC, Jesus = Judeia século I)
- Scene: 80-120 palavras incluindo período histórico específico
- Descrever vestuário, arquitetura e ambiente da época correta
- Terminar com "historically accurate for [período específico]"
- character_anchors: nomes EXATOS ou []
- Retornar APENAS array JSON

BLOCOS:
${blocosNumerados}

Retorne array JSON com ${blocos.length} takes com historicidade precisa.`;

    const response = await anthropic.messages.create({
      model: modeloUsar,
      max_tokens: calcMaxTokens(blocos.length * 180), // Dinâmico baseado em número de blocos
      messages: [{ role: 'user', content: prompt }]
    });

    let takesJson = response.content[0].text;

    // Extrair JSON do response (caso tenha texto adicional)
    const jsonMatch = takesJson.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      takesJson = jsonMatch[0];
    }

    // Limpar possíveis problemas no JSON
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

    res.status(200).json({
      takesCompleto,
      numTakes: takes.length,
      custoEstimado: '0.008' // Atualizado para economia de ~70%
    });

  } catch (error) {
    console.error('Erro ao gerar takes:', error);
    res.status(500).json({ error: error.message });
  }
};
