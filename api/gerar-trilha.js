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

    // PROMPT OTIMIZADO - Reduzido de ~350 tokens para ~120 tokens
    const prompt = `Idioma: ${languagePrompt}

Crie arquivo de trilha sonora para o roteiro abaixo.

FORMATO para cada seção (Hook, Tópicos, Conclusão):

SEÇÃO [nome]
Sentimento [emoção e atmosfera]
Keywords [keyword1] [keyword2] [keyword3] [keyword4]
Mood [3-5 adjetivos em INGLÊS]
Intensidade [Baixa ou Média ou Alta ou Crescente]
Notas [quando mudar/crescer]

REGRAS:
- Keywords em INGLÊS específicas (ex: documentary suspense)
- Mood: 3-5 adjetivos em INGLÊS
- Sem caracteres especiais (asteriscos, aspas, etc)
- Alinhar com objetivo de cada seção

Bibliotecas: Epidemic Sound, Artlist, AudioJungle, YouTube Audio Library

ROTEIRO:
${roteiro}

Inicie com:
TRILHA SONORA E ORIENTAÇÕES MUSICAIS

INSTRUÇÕES PARA BUSCA DE MÚSICAS
Use keywords para buscar. Priorize músicas que correspondam ao mood.`;

    const response = await anthropic.messages.create({
      model: modeloUsar,
      max_tokens: calcMaxTokens(1500), // ~650 tokens ao invés de 2000
      messages: [{ role: 'user', content: prompt }]
    });

    const trilha = response.content[0].text;

    res.status(200).json({
      trilha,
      custoEstimado: '0.012', // Atualizado para economia de ~70%
      numSecoes: trilha.split('SEÇÃO').length - 1
    });

  } catch (error) {
    console.error('Erro ao gerar trilha:', error);
    res.status(500).json({ error: error.message });
  }
};
