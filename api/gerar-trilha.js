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

    // ALL PROMPTS IN ENGLISH - Reduced from ~350 tokens to ~120 tokens
    const prompt = `Create soundtrack file for the script below.

FORMAT for each section (Hook, Topics, Conclusion):

SECTION [name]
Feeling [emotion and atmosphere]
Keywords [keyword1] [keyword2] [keyword3] [keyword4]
Mood [3-5 adjectives in ENGLISH]
Intensity [Low or Medium or High or Growing]
Notes [when to change/grow]

RULES:
- Keywords in ENGLISH specific (ex: documentary suspense)
- Mood: 3-5 adjectives in ENGLISH
- No special characters (asterisks, quotes, etc)
- Align with each section objective

Libraries: Epidemic Sound, Artlist, AudioJungle, YouTube Audio Library

SCRIPT:
${roteiro}

Start with:
SOUNDTRACK AND MUSICAL GUIDANCE

MUSIC SEARCH INSTRUCTIONS
Use keywords to search. Prioritize songs matching the mood.

Output section names in: ${outputLanguage}`;

    const response = await anthropic.messages.create({
      model: modeloUsar,
      max_tokens: calcMaxTokens(1500),
      messages: [{ role: 'user', content: prompt }]
    });

    const trilha = response.content[0].text;

    res.status(200).json({
      trilha,
      custoEstimado: '0.012',
      numSecoes: trilha.split('SECTION').length - 1
    });

  } catch (error) {
    console.error('Error generating soundtrack:', error);
    res.status(500).json({ error: error.message });
  }
};
