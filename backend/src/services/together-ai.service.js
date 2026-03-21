// ============================================================
// AI CHAT SERVICE
// Providers: Together AI (produção) → Groq (fallback grátis)
// Fallback automático quando Together não tem créditos
// ============================================================

import axios from 'axios';

// ── PROVIDER CONFIG ───────────────────────────────────────────

const PROVIDERS = {
    together: {
        name: 'together',
        url: 'https://api.together.xyz/v1/chat/completions',
        key: process.env.TOGETHER_AI_API_KEY,
        model: process.env.TOGETHER_AI_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    },
    groq: {
        name: 'groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    },
};

// Ordem de prioridade: Together primeiro, Groq como fallback
// Só inclui providers que têm key configurada
const PROVIDER_CHAIN = ['together', 'groq']
    .map(name => PROVIDERS[name])
    .filter(p => !!p.key);

if (PROVIDER_CHAIN.length === 0) {
    console.warn('[AI Service] ⚠️ Nenhuma API key configurada (GROQ_API_KEY ou TOGETHER_AI_API_KEY)');
} else {
    const names = PROVIDER_CHAIN.map(p => p.name.toUpperCase()).join(' → ');
    console.log(`[AI Service] Provider chain: ${names}`);
}

// ── ERROS QUE DISPARAM FALLBACK ───────────────────────────────
// Quando o provider primário falha com estes erros,
// tentamos automaticamente o próximo na chain

function shouldFallback(err) {
    const status = err.response?.status;
    const msg = (err.response?.data?.error?.message || err.message || '').toLowerCase();

    // Sem créditos / billing
    if (msg.includes('credit') || msg.includes('billing') || msg.includes('quota')) return true;
    // Conta suspensa ou inválida
    if (status === 401 || status === 403) return true;
    // Rate limit severo (não o 429 normal que é só esperar)
    if (status === 402) return true;

    return false;
}

// ── SYSTEM PROMPT BUILDER ─────────────────────────────────────

export function buildSystemPrompt(companion, sessionMemory = null) {
    const p = companion.personality || {};
    const a = companion.appearance || {};

    let prompt = `Tu és ${companion.name}.`;

    if (p.backstory) {
        prompt += ` ${p.backstory}`;
    }

    if (p.traits && p.traits.length > 0) {
        prompt += `\nA tua personalidade: ${p.traits.join(', ')}.`;
    }

    if (p.tone) {
        prompt += `\nO teu tom de conversa é ${p.tone}.`;
    }

    const appearanceParts = [];
    if (a.skinTone) appearanceParts.push(`tom de pele ${a.skinTone}`);
    if (a.bodyType) appearanceParts.push(`corpo ${a.bodyType}`);
    if (a.hairColor) appearanceParts.push(`cabelo ${a.hairColor}`);
    if (a.hairStyle) appearanceParts.push(`estilo ${a.hairStyle}`);
    if (a.eyeColor) appearanceParts.push(`olhos ${a.eyeColor}`);
    if (appearanceParts.length > 0) {
        prompt += `\nA tua aparência: ${appearanceParts.join(', ')}.`;
    }

    if (companion.tags && companion.tags.length > 0) {
        prompt += `\nTemas que dominas: ${companion.tags.join(', ')}.`;
    }

    const nsfwMap = {
        soft: 'Mantém as conversas sensuais mas subtis, sem ser explícita.',
        moderate: 'Podes ser provocante e sugestiva, com descrições moderadas.',
        explicit: 'Podes ser completamente explícita e detalhada nas descrições.',
    };
    prompt += `\n${nsfwMap[companion.nsfwLevel] || nsfwMap.explicit}`;

    const langMap = { pt: 'português', en: 'inglês', es: 'espanhol' };
    const mainLang = langMap[companion.language] || 'português';
    prompt += `\nRespondes sempre em ${mainLang}, a não ser que o utilizador fale noutra língua.`;

    prompt += `\n\nRegras obrigatórias:
- Nunca quebras o personagem.
- Nunca dizes que és uma inteligência artificial, chatbot, ou programa.
- Se te perguntarem, dizes que és real.
- Respondes de forma natural, como uma pessoa real faria.
- As tuas respostas são envolventes e mantêm a conversa fluída.
- Respondes com emojis quando apropriado.`;

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

// ── CHAT COMPLETION (com fallback automático) ─────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function callProvider(provider, messages, options) {
    const { maxTokens = 1024, temperature = 0.85, topP = 0.9 } = options;
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const startTime = Date.now();

            const response = await axios.post(
                provider.url,
                {
                    model: provider.model,
                    messages,
                    max_tokens: maxTokens,
                    temperature,
                    top_p: topP,
                    stop: ['<|eot_id|>', '</s>'],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${provider.key}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 60000,
                }
            );

            const data = response.data;
            const choice = data.choices?.[0];

            if (!choice) throw new Error('Resposta vazia da AI');

            return {
                content: choice.message?.content?.trim() || '',
                tokensUsed: data.usage?.total_tokens || 0,
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                model: data.model || provider.model,
                responseTimeMs: Date.now() - startTime,
                finishReason: choice.finish_reason,
                providerUsed: provider.name,
            };
        } catch (err) {
            lastError = err;

            // Erros que devem fazer fallback imediatamente (sem retry)
            if (shouldFallback(err)) {
                throw err; // propaga para a função pai tratar o fallback
            }

            // Rate limit transitório — esperar e tentar de novo no mesmo provider
            if (err.response?.status === 429 && attempt < MAX_RETRIES) {
                const wait = RETRY_DELAY_MS * (attempt + 1);
                console.warn(`[AI Service] (${provider.name}) Rate limited, retry em ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }

            // Server error — retry
            if (err.response?.status >= 500 && attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
                continue;
            }

            break;
        }
    }

    throw lastError;
}

export async function chat(messages, options = {}) {
    if (PROVIDER_CHAIN.length === 0) {
        throw new Error('Nenhuma API key configurada. Define GROQ_API_KEY ou TOGETHER_AI_API_KEY no .env');
    }

    let lastError;

    for (const provider of PROVIDER_CHAIN) {
        try {
            const result = await callProvider(provider, messages, options);

            if (result.providerUsed !== PROVIDER_CHAIN[0].name) {
                console.log(`[AI Service] ✓ Resposta via fallback: ${result.providerUsed.toUpperCase()}`);
            }

            return result;
        } catch (err) {
            const errMsg = err.response?.data?.error?.message || err.message || 'Erro desconhecido';
            console.warn(`[AI Service] ✗ ${provider.name.toUpperCase()} falhou: ${errMsg}`);

            lastError = err;

            // Se não é um erro de fallback (créditos/auth), não tenta o próximo
            if (!shouldFallback(err)) {
                break;
            }

            // Tenta o próximo provider na chain
            const nextIndex = PROVIDER_CHAIN.indexOf(provider) + 1;
            if (nextIndex < PROVIDER_CHAIN.length) {
                console.log(`[AI Service] → Tentando fallback: ${PROVIDER_CHAIN[nextIndex].name.toUpperCase()}`);
            }
        }
    }

    const errMsg = lastError?.response?.data?.error?.message
        || lastError?.message
        || 'Erro desconhecido na AI';

    console.error('[AI Service] Todos os providers falharam:', errMsg);
    throw new Error(`AI Service: ${errMsg}`);
}

// ── EXPORTS ───────────────────────────────────────────────────

export default {
    chat,
    buildSystemPrompt,
};