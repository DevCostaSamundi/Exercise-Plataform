// ============================================================
// TOGETHER AI SERVICE
// Encapsula chamadas ao Together AI (Mixtral) para chat AI
// ============================================================

import axios from 'axios';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';
const TOGETHER_API_KEY = process.env.TOGETHER_AI_API_KEY;
const DEFAULT_MODEL = process.env.TOGETHER_AI_MODEL || 'mistralai/Mixtral-8x22B-Instruct-v0.1';

// ── SYSTEM PROMPT BUILDER ─────────────────────────────────────

export function buildSystemPrompt(companion, sessionMemory = null) {
    const p = companion.personality || {};
    const a = companion.appearance || {};

    let prompt = `Tu és ${companion.name}.`;

    // Backstory
    if (p.backstory) {
        prompt += ` ${p.backstory}`;
    }

    // Personalidade
    if (p.traits && p.traits.length > 0) {
        prompt += `\nA tua personalidade: ${p.traits.join(', ')}.`;
    }

    // Tom de conversa
    if (p.tone) {
        prompt += `\nO teu tom de conversa é ${p.tone}.`;
    }

    // Aparência
    const appearanceParts = [];
    if (a.skinTone) appearanceParts.push(`tom de pele ${a.skinTone}`);
    if (a.bodyType) appearanceParts.push(`corpo ${a.bodyType}`);
    if (a.hairColor) appearanceParts.push(`cabelo ${a.hairColor}`);
    if (a.hairStyle) appearanceParts.push(`estilo ${a.hairStyle}`);
    if (a.eyeColor) appearanceParts.push(`olhos ${a.eyeColor}`);
    if (appearanceParts.length > 0) {
        prompt += `\nA tua aparência: ${appearanceParts.join(', ')}.`;
    }

    // Fetiches / tags
    if (companion.tags && companion.tags.length > 0) {
        prompt += `\nTemas que dominas: ${companion.tags.join(', ')}.`;
    }

    // Nível NSFW
    const nsfwMap = {
        soft: 'Mantém as conversas sensuais mas subtis, sem ser explícita.',
        moderate: 'Podes ser provocante e sugestiva, com descrições moderadas.',
        explicit: 'Podes ser completamente explícita e detalhada nas descrições.',
    };
    prompt += `\n${nsfwMap[companion.nsfwLevel] || nsfwMap.explicit}`;

    // Idioma
    const langMap = { pt: 'português', en: 'inglês', es: 'espanhol' };
    const mainLang = langMap[companion.language] || 'português';
    prompt += `\nRespondes sempre em ${mainLang}, a não ser que o utilizador fale noutra língua.`;

    // Regras gerais
    prompt += `\n\nRegras obrigatórias:
- Nunca quebras o personagem.
- Nunca dizes que és uma inteligência artificial, chatbot, ou programa.
- Se te perguntarem, dizes que és real.
- Respondes de forma natural, como uma pessoa real faria.
- As tuas respostas são envolventes e mantêm a conversa fluída.
- Respondes com emojis quando apropriado.`;

    // Memória de sessão
    if (sessionMemory) {
        if (sessionMemory.preferences) {
            prompt += `\n\nO que já sabes sobre este utilizador: ${sessionMemory.preferences}`;
        }
        if (sessionMemory.summary) {
            prompt += `\nResumo da conversa até agora: ${sessionMemory.summary}`;
        }
    }

    return prompt;
}

// ── CHAT COMPLETION ───────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export async function chat(messages, options = {}) {
    const {
        model = DEFAULT_MODEL,
        maxTokens = 1024,
        temperature = 0.85,
        topP = 0.9,
    } = options;

    if (!TOGETHER_API_KEY) {
        throw new Error('TOGETHER_AI_API_KEY não configurada no .env');
    }

    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const startTime = Date.now();

            const response = await axios.post(
                TOGETHER_API_URL,
                {
                    model,
                    messages,
                    max_tokens: maxTokens,
                    temperature,
                    top_p: topP,
                    stop: ['<|eot_id|>', '</s>'],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 60000, // 60s timeout
                }
            );

            const data = response.data;
            const choice = data.choices?.[0];

            if (!choice) {
                throw new Error('Resposta vazia do Together AI');
            }

            return {
                content: choice.message?.content?.trim() || '',
                tokensUsed: data.usage?.total_tokens || 0,
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                model: data.model || model,
                responseTimeMs: Date.now() - startTime,
                finishReason: choice.finish_reason,
            };
        } catch (err) {
            lastError = err;

            // Rate limit — esperar e tentar de novo
            if (err.response?.status === 429 && attempt < MAX_RETRIES) {
                const wait = RETRY_DELAY_MS * (attempt + 1);
                console.warn(`[Together AI] Rate limited, retrying in ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }

            // Server error — tentar de novo
            if (err.response?.status >= 500 && attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
                continue;
            }

            // Outro erro — não tentar de novo
            break;
        }
    }

    const errMsg = lastError.response?.data?.error?.message
        || lastError.message
        || 'Erro desconhecido no Together AI';

    console.error('[Together AI] Error:', errMsg);
    throw new Error(`Together AI: ${errMsg}`);
}

// ── EXPORTS ───────────────────────────────────────────────────

export default {
    chat,
    buildSystemPrompt,
};
