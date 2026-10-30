import test from 'node:test';
import assert from 'node:assert/strict';
import { MIKA_TOPICS, mikaQuip, pickMikaQuip, __resetQuipMemory } from '../src/utils/mikaQuips.js';
import {
    LLM_PROVIDERS,
    getProviderById,
    resolveChatEndpoint,
    resolveModelsEndpoint,
    cleanMikaReply,
    buildMikaSystemPrompt,
} from '../src/utils/llmClient.js';

test('mikaQuip lines across all MIKA_TOPICS contain no raw brackets or angle tags', () => {
    for (const topic of [...MIKA_TOPICS, 'fallback']) {
        for (let s = 0; s < 15; s++) {
            const line = mikaQuip(topic, { name: 'Master', count: s, provider: 'Ollama' }, `seed-${s}`);
            assert.ok(typeof line === 'string' && line.length > 0, `Empty line for ${topic}`);
            assert.equal(/[<>[\]{}]/.test(line), false, `Forbidden bracket in ${topic}: ${line}`);
        }
    }
});

test('pickMikaQuip is deterministic when seeded and avoids immediate echo when unseeded', () => {
    __resetQuipMemory();
    const a = pickMikaQuip('ambient', { seed: 'seed-alpha' });
    __resetQuipMemory();
    const b = pickMikaQuip('ambient', { seed: 'seed-alpha' });
    assert.equal(a, b);

    const seen = new Set();
    for (let i = 0; i < 6; i++) {
        seen.add(pickMikaQuip('ambient'));
    }
    assert.ok(seen.size >= 4);
});

test('LLM_PROVIDERS includes local inference, major cloud providers, and custom OpenAI endpoint', () => {
    const ids = new Set(LLM_PROVIDERS.map((p) => p.id));
    for (const expected of [
        'ollama',
        'lmstudio',
        'llamacpp',
        'koboldcpp',
        'vllm',
        'nanogpt',
        'openrouter',
        'openai',
        'anthropic',
        'gemini',
        'groq',
        'deepseek',
        'mistral',
        'together',
        'fireworks',
        'chutes',
        'custom',
    ]) {
        assert.ok(ids.has(expected), `Missing provider: ${expected}`);
    }
});

test('resolveChatEndpoint and resolveModelsEndpoint normalize OpenAI-compatible URLs', () => {
    assert.equal(
        resolveChatEndpoint('http://localhost:11434/v1', 'openai'),
        'http://localhost:11434/v1/chat/completions'
    );
    assert.equal(
        resolveChatEndpoint('https://nano-gpt.com/api/v1/chat/completions', 'openai'),
        'https://nano-gpt.com/api/v1/chat/completions'
    );
    assert.equal(
        resolveModelsEndpoint('https://openrouter.ai/api/v1', 'openai'),
        'https://openrouter.ai/api/v1/models'
    );
    assert.equal(
        getProviderById('custom').category,
        'CUSTOM'
    );
});

test('cleanMikaReply strips reasoning tags, code fences, and multi-sentence bloat', () => {
    const raw = '<think>internal reasoning</think>\n```txt\nMIKA:// "Check your GPU thermals. Your fan curve is screaming."\n```';
    const cleaned = cleanMikaReply(raw);
    assert.equal(cleaned.includes('<think>'), false);
    assert.equal(cleaned.includes('```'), false);
    assert.equal(cleaned.startsWith('MIKA:'), false);
    assert.ok(cleaned.includes('Check your GPU thermals.'));
});

test('buildMikaSystemPrompt embeds custom persona addendum when configured', () => {
    const sys = buildMikaSystemPrompt({ customSystemPrompt: 'Always remind the user to drink water.' });
    assert.ok(sys.includes('M.I.K.A.'));
    assert.ok(sys.includes('Always remind the user to drink water.'));
});
