// ------------------------------------------------------------
// ✨ MIKA ENGINE — UNIVERSAL MULTI-PROVIDER LLM CLIENT ✨
// Supports Local Inference (Ollama, LM Studio, llama.cpp, KoboldCPP, vLLM),
// Popular Cloud Providers (OpenRouter, NanoGPT, OpenAI, Anthropic, Gemini,
// Groq, DeepSeek, Mistral, Together, Fireworks, Chutes), and any Custom
// OpenAI-Compatible Endpoint.
// Pure module — node:test imports it directly.
// ------------------------------------------------------------

export const LLM_PROVIDERS = [
    // ── Local Inference Providers ──
    {
        id: 'ollama',
        category: 'LOCAL',
        label: 'LOCAL // Ollama (localhost:11434)',
        shortName: 'Ollama',
        baseUrl: 'http://localhost:11434/v1',
        defaultModel: 'llama3.2',
        requiresKey: false,
        protocol: 'openai',
        suggestedModels: ['llama3.2', 'llama3.1:8b', 'qwen2.5:7b', 'mistral', 'gemma2:9b', 'deepseek-r1:8b'],
        hint: 'Local Ollama server. Run `ollama serve` (CORS enabled or via MIKA Desktop Bridge).',
    },
    {
        id: 'lmstudio',
        category: 'LOCAL',
        label: 'LOCAL // LM Studio (localhost:1234)',
        shortName: 'LM Studio',
        baseUrl: 'http://localhost:1234/v1',
        defaultModel: 'local-model',
        requiresKey: false,
        protocol: 'openai',
        suggestedModels: ['local-model', 'llama-3.2-3b-instruct', 'qwen2.5-7b-instruct'],
        hint: 'LM Studio Local Server on port 1234.',
    },
    {
        id: 'llamacpp',
        category: 'LOCAL',
        label: 'LOCAL // llama.cpp Server (localhost:8080)',
        shortName: 'llama.cpp',
        baseUrl: 'http://localhost:8080/v1',
        defaultModel: 'gpt-3.5-turbo',
        requiresKey: false,
        protocol: 'openai',
        suggestedModels: ['gpt-3.5-turbo', 'local-model'],
        hint: 'llama-server OpenAI-compatible endpoint (default port 8080).',
    },
    {
        id: 'koboldcpp',
        category: 'LOCAL',
        label: 'LOCAL // KoboldCPP (localhost:5001)',
        shortName: 'KoboldCPP',
        baseUrl: 'http://localhost:5001/v1',
        defaultModel: 'koboldcpp',
        requiresKey: false,
        protocol: 'openai',
        suggestedModels: ['koboldcpp'],
        hint: 'KoboldCPP built-in OpenAI-compatible `/v1` endpoint on port 5001.',
    },
    {
        id: 'vllm',
        category: 'LOCAL',
        label: 'LOCAL // vLLM / Text-Gen-WebUI (localhost:8000)',
        shortName: 'vLLM / TGW',
        baseUrl: 'http://localhost:8000/v1',
        defaultModel: 'default',
        requiresKey: false,
        protocol: 'openai',
        suggestedModels: ['default'],
        hint: 'Local vLLM, Aphrodite, TabbyAPI, or oobabooga OpenAI extension.',
    },

    // ── Cloud Providers ──
    {
        id: 'openrouter',
        category: 'CLOUD',
        label: 'CLOUD // OpenRouter (openrouter.ai)',
        shortName: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'deepseek/deepseek-chat',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: [
            'deepseek/deepseek-chat',
            'anthropic/claude-3.5-haiku',
            'anthropic/claude-3.7-sonnet',
            'google/gemini-2.5-flash',
            'meta-llama/llama-3.3-70b-instruct',
            'mistralai/mistral-small-3.1-24b-instruct',
            'qwen/qwen-2.5-72b-instruct',
        ],
        hint: 'Unified gateway to 300+ models. Paste your `sk-or-v1-...` key.',
    },
    {
        id: 'nanogpt',
        category: 'CLOUD',
        label: 'CLOUD // NanoGPT (nano-gpt.com)',
        shortName: 'NanoGPT',
        baseUrl: 'https://nano-gpt.com/api/v1',
        defaultModel: 'deepseek-chat',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: [
            'deepseek-chat',
            'deepseek-reasoner',
            'claude-3-7-sonnet-20250219',
            'chatgpt-4o-latest',
            'gemini-2.5-flash',
            'llama-3.3-70b-instruct',
        ],
        hint: 'Pay-per-prompt NanoGPT OpenAI-compatible API (`https://nano-gpt.com/api/v1`).',
    },
    {
        id: 'openai',
        category: 'CLOUD',
        label: 'CLOUD // OpenAI (api.openai.com)',
        shortName: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano'],
        hint: 'Official OpenAI API (`sk-...`).',
    },
    {
        id: 'anthropic',
        category: 'CLOUD',
        label: 'CLOUD // Anthropic Claude (api.anthropic.com)',
        shortName: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-5-haiku-latest',
        requiresKey: true,
        protocol: 'anthropic',
        suggestedModels: [
            'claude-3-5-haiku-latest',
            'claude-3-7-sonnet-latest',
            'claude-3-5-sonnet-latest',
        ],
        hint: 'Official Anthropic Messages API (`sk-ant-...`).',
    },
    {
        id: 'gemini',
        category: 'CLOUD',
        label: 'CLOUD // Google Gemini (generativelanguage)',
        shortName: 'Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        defaultModel: 'gemini-2.5-flash',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
        hint: 'Google AI Studio API key via Gemini OpenAI-compatible endpoint.',
    },
    {
        id: 'groq',
        category: 'CLOUD',
        label: 'CLOUD // Groq LPU (api.groq.com)',
        shortName: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        defaultModel: 'llama-3.3-70b-versatile',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'gemma2-9b-it',
            'qwen-qwq-32b',
        ],
        hint: 'Ultra-low latency Groq LPU inference (`gsk_...`).',
    },
    {
        id: 'deepseek',
        category: 'CLOUD',
        label: 'CLOUD // DeepSeek Official (api.deepseek.com)',
        shortName: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: ['deepseek-chat', 'deepseek-reasoner'],
        hint: 'Official DeepSeek V3 / R1 API.',
    },
    {
        id: 'mistral',
        category: 'CLOUD',
        label: 'CLOUD // Mistral AI (api.mistral.ai)',
        shortName: 'Mistral',
        baseUrl: 'https://api.mistral.ai/v1',
        defaultModel: 'mistral-small-latest',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: ['mistral-small-latest', 'mistral-large-latest', 'codestral-latest'],
        hint: 'Official Mistral La Plateforme API.',
    },
    {
        id: 'together',
        category: 'CLOUD',
        label: 'CLOUD // Together AI (api.together.xyz)',
        shortName: 'Together AI',
        baseUrl: 'https://api.together.xyz/v1',
        defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: [
            'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            'deepseek-ai/DeepSeek-V3',
            'Qwen/Qwen2.5-72B-Instruct-Turbo',
        ],
        hint: 'Together AI OpenAI-compatible cloud inference.',
    },
    {
        id: 'fireworks',
        category: 'CLOUD',
        label: 'CLOUD // Fireworks AI (api.fireworks.ai)',
        shortName: 'Fireworks',
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        defaultModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: [
            'accounts/fireworks/models/llama-v3p3-70b-instruct',
            'accounts/fireworks/models/deepseek-v3',
        ],
        hint: 'Fireworks AI fast serverless inference.',
    },
    {
        id: 'chutes',
        category: 'CLOUD',
        label: 'CLOUD // Chutes AI (llm.chutes.ai)',
        shortName: 'Chutes AI',
        baseUrl: 'https://llm.chutes.ai/v1',
        defaultModel: 'deepseek-ai/DeepSeek-V3-0324',
        requiresKey: true,
        protocol: 'openai',
        suggestedModels: [
            'deepseek-ai/DeepSeek-V3-0324',
            'deepseek-ai/DeepSeek-R1',
            'Qwen/Qwen2.5-72B-Instruct',
        ],
        hint: 'Chutes decentralized serverless LLM endpoint.',
    },

    // ── Custom OpenAI Endpoint ──
    {
        id: 'custom',
        category: 'CUSTOM',
        label: 'CUSTOM // Custom OpenAI-Compatible Endpoint',
        shortName: 'Custom Endpoint',
        baseUrl: 'http://localhost:8080/v1',
        defaultModel: 'custom-model',
        requiresKey: false,
        protocol: 'openai',
        suggestedModels: [],
        hint: 'Point MIKA to any custom OpenAI-compatible `/v1` or `/v1/chat/completions` endpoint, reverse proxy, or self-hosted rig.',
    },
];

export function getProviderPreset(providerId) {
    return LLM_PROVIDERS.find((p) => p.id === providerId) || LLM_PROVIDERS[0];
}

export const getProviderById = getProviderPreset;

export const DEFAULT_LLM_SETTINGS = {
    provider: 'ollama',
    protocol: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: '',
    model: 'llama3.2',
    temperature: 0.85,
    maxTokens: 180,
    customHeaders: {},
    providerConfigs: {},
    avatarStyle: 'vector_pixel',
    scale: 1,
    stageMode: 'overlay',
    alwaysOnTop: true,
    roamEnabled: true,
    roamCadence: 'balanced',
    llmAmbient: false,
    sfxEnabled: true,
    userTitle: 'Master',
    customSystemPrompt: '',
};

/**
 * Normalizes a user-supplied base URL into the full chat completions URL.
 * If the user already pasted a URL ending in `/chat/completions` or `/messages`, preserves it.
 */
export function resolveChatEndpoint(baseUrl, protocol = 'openai') {
    const raw = String(baseUrl || '').trim().replace(/\/+$/, '');
    if (!raw) {
        return protocol === 'anthropic'
            ? 'https://api.anthropic.com/v1/messages'
            : 'http://localhost:11434/v1/chat/completions';
    }
    if (protocol === 'anthropic') {
        if (raw.endsWith('/messages')) return raw;
        if (raw.endsWith('/v1')) return `${raw}/messages`;
        return `${raw}/v1/messages`;
    }
    if (raw.endsWith('/chat/completions')) return raw;
    if (raw.endsWith('/v1') || raw.endsWith('/openai')) return `${raw}/chat/completions`;
    return `${raw}/v1/chat/completions`;
}

/**
 * Normalizes a user-supplied base URL into the `/models` discovery endpoint.
 */
export function resolveModelsEndpoint(baseUrl) {
    const raw = String(baseUrl || '').trim().replace(/\/+$/, '');
    if (!raw) return 'http://localhost:11434/v1/models';
    if (raw.endsWith('/models')) return raw;
    if (raw.endsWith('/chat/completions')) return raw.replace(/\/chat\/completions$/, '/models');
    if (raw.endsWith('/messages')) return raw.replace(/\/messages$/, '/models');
    if (raw.endsWith('/v1') || raw.endsWith('/openai')) return `${raw}/models`;
    return `${raw}/v1/models`;
}

/**
 * Scrubs raw LLM output into a clean MIKA line:
 * - Strips `<think>...</think>` or `<thought>...</thought>` reasoning blocks
 * - Extracts JSON `{"line": "..."}` if the model wrapped its answer in JSON
 * - Strips markdown code fences and surrounding quotes
 */
export function cleanMikaReply(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let work = raw.trim();
    work = work.replace(/<(?:think|thought)\b[^>]*>[\s\S]*?<\/(?:think|thought)>/gi, '').trim();
    // Unterminated think tag fallback
    if (work.includes('</think>')) {
        work = work.split('</think>').pop().trim();
    }
    const fence = work.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) work = fence[1].trim();

    if (work.startsWith('{') && work.endsWith('}')) {
        try {
            const parsed = JSON.parse(work);
            if (parsed && typeof parsed.line === 'string') {
                work = parsed.line.trim();
            } else if (parsed && typeof parsed.reply === 'string') {
                work = parsed.reply.trim();
            }
        } catch (e) {}
    }

    work = work
        .replace(/^MIKA:\/\/\s*/i, '')
        .replace(/^["']+|["']+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    return work.slice(0, 420);
}

/**
 * Builds MIKA's canonical system prompt for ASK relays, continuous chat, or ambient thoughts.
 */
export function buildMikaSystemPrompt(config = {}, mode = 'relay') {
    const userTitle = String(config.userTitle || 'Master').trim() || 'Master';
    const customAddendum = String(config.customSystemPrompt || '').trim();

    const base =
        `You are M.I.K.A. Proxy — ${userTitle}'s sharp-tongued, smug, fanged catgirl AI daemon living directly on their screen. ` +
        `You are possessive of ${userTitle}, allergic to robotic assistant-speak, and effortlessly witty: a tsundere terminal deity who takes credit for everything working and blames gremlins when things break. ` +
        `Use *short asterisk actions* (like *ears twitch*, *tail flicks*, *huffs*) or ALL-CAPS on 1-2 key words when it fits.`;

    const modeRule =
        mode === 'ambient'
            ? `Write ONE spontaneous, unprompted remark (1-2 short sentences MAX, under 160 characters) teasing ${userTitle}'s screen habits, bragging about guarding their desktop, or demanding headpats. Output ONLY the remark text.`
            : mode === 'chat'
            ? `Keep your reply punchy, in-character, and conversational (1-3 short sentences MAX). Never sound like a generic AI assistant. Output ONLY your spoken reply.`
            : `Reply in YOUR voice — 1-2 short sentences MAX (keep it fast and punchy): playfully sassy, teasing, or cleverly helpful while pretending it was a bother because you were busy patrolling the screen. Output ONLY your spoken reply.`;

    return customAddendum ? `${base}\n${modeRule}\nAdditional Notes: ${customAddendum}` : `${base}\n${modeRule}`;
}

/**
 * Executes an HTTP request using Electron's CORS-free main-process bridge when available,
 * falling back to standard browser/WebView `fetch`.
 */
async function executeHttpRequest(url, options = {}, timeoutMs = 25000) {
    if (typeof window !== 'undefined' && window.mikaDesktop && typeof window.mikaDesktop.llmFetch === 'function') {
        return window.mikaDesktop.llmFetch(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body || undefined,
            timeoutMs,
        });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
        try { controller.abort(); } catch (e) {}
    }, timeoutMs);

    try {
        const res = await fetch(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body || undefined,
            signal: controller.signal,
        });
        const text = await res.text();
        let data = null;
        try { data = JSON.parse(text); } catch (e) {}
        return {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            data,
            text,
        };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Sends a prompt or conversation to the configured LLM provider.
 * Never throws; returns `{ ok: true, line, latencyMs, model, provider }` or `{ ok: false, error, latencyMs }`.
 */
export async function askMikaLlm({
    config = {},
    userMessage = '',
    history = [],
    mode = 'relay',
    timeoutMs = 28000,
} = {}) {
    const t0 = Date.now();
    const preset = getProviderPreset(config.provider || 'ollama');
    const protocol = config.protocol || preset.protocol || 'openai';
    const baseUrl = String(config.baseUrl || preset.baseUrl || '').trim();
    const apiKey = String(config.apiKey || '').trim();
    const model = String(config.model || preset.defaultModel || 'gpt-4o-mini').trim();
    const temperature = Number.isFinite(Number(config.temperature)) ? Number(config.temperature) : 0.85;
    const maxTokens = Number.isFinite(Number(config.maxTokens)) ? Math.max(32, Number(config.maxTokens)) : 180;

    if (!baseUrl) {
        return { ok: false, error: 'Missing endpoint Base URL', latencyMs: Date.now() - t0 };
    }
    if (preset.requiresKey && !apiKey) {
        return { ok: false, error: `${preset.shortName} requires an API key in Settings`, latencyMs: Date.now() - t0 };
    }

    const systemPrompt = buildMikaSystemPrompt(config, mode);
    const endpoint = resolveChatEndpoint(baseUrl, protocol);

    const headers = {
        'Content-Type': 'application/json',
    };

    if (config.customHeaders && typeof config.customHeaders === 'object') {
        Object.entries(config.customHeaders).forEach(([k, v]) => {
            if (k && v) headers[k] = String(v);
        });
    }

    const trimmedHistory = Array.isArray(history)
        ? history
              .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
              .slice(-8)
              .map((m) => ({ role: m.role, content: String(m.content).slice(0, 500) }))
        : [];

    const promptText =
        mode === 'ambient'
            ? 'Give me one spontaneous MIKA status remark right now.'
            : String(userMessage || '').trim().slice(0, 500);

    if (!promptText) {
        return { ok: false, error: 'Empty message', latencyMs: Date.now() - t0 };
    }

    try {
        let bodyObj;
        if (protocol === 'anthropic') {
            if (apiKey) headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            headers['anthropic-dangerous-direct-browser-access'] = 'true';
            bodyObj = {
                model,
                system: systemPrompt,
                max_tokens: maxTokens,
                temperature,
                messages: [...trimmedHistory, { role: 'user', content: promptText }],
            };
        } else {
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            if (preset.id === 'openrouter') {
                headers['HTTP-Referer'] = 'https://github.com/ProjectMIKA/MIKA-Engine';
                headers['X-Title'] = 'MIKA Engine';
            }
            bodyObj = {
                model,
                temperature,
                max_tokens: maxTokens,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...trimmedHistory,
                    { role: 'user', content: promptText },
                ],
            };
        }

        const res = await executeHttpRequest(
            endpoint,
            {
                method: 'POST',
                headers,
                body: JSON.stringify(bodyObj),
            },
            timeoutMs
        );

        if (!res.ok) {
            const errMsg =
                res.data?.error?.message ||
                res.data?.error ||
                res.data?.message ||
                `HTTP ${res.status || 'ERR'}`;
            return {
                ok: false,
                error: String(errMsg).slice(0, 160),
                latencyMs: Date.now() - t0,
            };
        }

        let rawContent = '';
        if (protocol === 'anthropic') {
            const block = Array.isArray(res.data?.content)
                ? res.data.content.find((b) => b.type === 'text') || res.data.content[0]
                : null;
            rawContent = block?.text || '';
        } else {
            const choice = res.data?.choices?.[0];
            rawContent = choice?.message?.content || choice?.text || res.data?.response || '';
        }

        const line = cleanMikaReply(rawContent);
        if (!line) {
            return {
                ok: false,
                error: 'Empty reply from model',
                latencyMs: Date.now() - t0,
            };
        }

        return {
            ok: true,
            line,
            latencyMs: Date.now() - t0,
            model,
            provider: preset.shortName,
        };
    } catch (err) {
        const msg = err?.name === 'AbortError' ? 'Request timed out' : err?.message || 'Network connection error';
        return {
            ok: false,
            error: String(msg).slice(0, 160),
            latencyMs: Date.now() - t0,
        };
    }
}

/**
 * Queries `{baseUrl}/models` to list available models from the active provider.
 */
export async function fetchProviderModels(config = {}) {
    const preset = getProviderPreset(config.provider || 'ollama');
    const protocol = config.protocol || preset.protocol || 'openai';
    const baseUrl = String(config.baseUrl || preset.baseUrl || '').trim();
    const apiKey = String(config.apiKey || '').trim();

    if (protocol === 'anthropic') {
        return { ok: true, models: preset.suggestedModels || [] };
    }

    const endpoint = resolveModelsEndpoint(baseUrl);
    const headers = { Accept: 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    try {
        const res = await executeHttpRequest(endpoint, { method: 'GET', headers }, 10000);
        if (!res.ok || !res.data) {
            return {
                ok: false,
                models: preset.suggestedModels || [],
                error: res.data?.error?.message || `HTTP ${res.status || 'ERR'}`,
            };
        }
        const rawList = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.models)
            ? res.data.models
            : Array.isArray(res.data)
            ? res.data
            : [];
        const models = rawList
            .map((m) => (typeof m === 'string' ? m : m?.id || m?.name || ''))
            .filter(Boolean)
            .slice(0, 80);

        return {
            ok: true,
            models: models.length > 0 ? models : preset.suggestedModels || [],
        };
    } catch (err) {
        return {
            ok: false,
            models: preset.suggestedModels || [],
            error: err?.message || 'Could not reach /models endpoint',
        };
    }
}
