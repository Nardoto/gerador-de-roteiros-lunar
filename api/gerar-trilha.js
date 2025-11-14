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

    const prompt = `Você é especialista em trilha sonora para documentários.

${languagePrompt}

Analise o roteiro abaixo e crie o arquivo de trilha sonora seguindo este formato:

TRILHA SONORA E ORIENTAÇÕES MUSICAIS

INSTRUÇÕES PARA BUSCA DE MÚSICAS
Este documento contém orientações para encontrar músicas em bibliotecas como
- Epidemic Sound
- Artlist
- AudioJungle
- YouTube Audio Library

Para cada seção use as palavras-chave (keywords) fornecidas para buscar.
Priorize músicas que correspondam ao sentimento (mood) descrito.

Para cada seção do roteiro (Hook + Atos e Tópicos + Conclusão) forneça

SEÇÃO (Nome da seção)
Sentimento (Descrever emoção e atmosfera desejada)
Keywords (keyword1) (keyword2) (keyword3) (keyword4)
Mood (3-5 adjetivos em INGLÊS separados por vírgula)
Intensidade (Baixa ou Média ou Alta ou Crescente)
Notas (Observações sobre quando a música deve mudar crescer etc)

DIRETRIZES
- Keywords em INGLÊS e específicas como documentary suspense não só suspense
- Mood com 3-5 adjetivos em INGLÊS
- Alinhar com objetivo de cada seção
- Tensão igual a suspenseful e Revelação igual a crescente
- Use APENAS letras números espaços parênteses e traços
- NÃO use caracteres especiais como asteriscos cerquilha colchetes aspas dois-pontos ponto e vírgula

ROTEIRO
${roteiro}`;

    const response = await anthropic.messages.create({
      model: modeloUsar,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const trilha = response.content[0].text;

    res.status(200).json({
      trilha,
      custoEstimado: '0.039',
      numSecoes: trilha.split('SEÇÃO:').length - 1
    });

  } catch (error) {
    console.error('Erro ao gerar trilha:', error);
    res.status(500).json({ error: error.message });
  }
};
