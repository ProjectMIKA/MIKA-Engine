import React, { useState } from 'react';
import CyberDropdown from './CyberDropdown.jsx';
import { LLM_PROVIDERS, getProviderPreset, fetchProviderModels, askMikaLlm } from '../utils/llmClient.js';
import { MIKA_AVATAR_STYLES } from './MikaProxy.jsx';
import { mikaQuip } from '../utils/mikaQuips.js';

const SCALE_OPTIONS = [
    { value: 1, label: '1.00x // Standard Chibi (66×77)' },
    { value: 1.25, label: '1.25x // Crisp Enhanced' },
    { value: 1.5, label: '1.50x // Mega Chibi' },
];

const STAGE_MODE_OPTIONS = [
    { value: 'overlay', label: 'DESKTOP_OVERLAY // Transparent Click-Through' },
    { value: 'stage', label: 'CYBER_STAGE // Obsidian Neon Terminal' },
];

const CADENCE_OPTIONS = [
    { value: 'quiet', label: 'QUIET // Rare Unprompted Sass' },
    { value: 'balanced', label: 'BALANCED // Standard MIKA Cadence (Default)' },
    { value: 'chatty', label: 'CHATTY // Frequent Terminal Commentary' },
];

export const MikaSettingsModal = ({
    settings,
    onUpdateSettings,
    onClose,
    onSay,
    onShowToast,
    appVersion = '1.0.0',
}) => {
    const [activeTab, setActiveTab] = useState('llm'); // 'llm' | 'chassis' | 'autonomy'
    const [showApiKey, setShowApiKey] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [fetchedModels, setFetchedModels] = useState([]);
    const [testingUplink, setTestingUplink] = useState(false);
    const [uplinkStatus, setUplinkStatus] = useState(null); // { ok, text }
    const [customHeadersText, setCustomHeadersText] = useState(() => {
        try {
            return settings.customHeaders && Object.keys(settings.customHeaders).length > 0
                ? JSON.stringify(settings.customHeaders)
                : '';
        } catch (e) {
            return '';
        }
    });

    const activePreset = getProviderPreset(settings.provider);
    const providerOptions = LLM_PROVIDERS.map((p) => ({
        value: p.id,
        label: p.label,
    }));

    const modelPool = Array.from(
        new Set([
            ...(fetchedModels || []),
            ...(activePreset.suggestedModels || []),
            ...(settings.model ? [settings.model] : []),
        ])
    ).filter(Boolean);

    const handleProviderChange = (newProviderId) => {
        const nextPreset = getProviderPreset(newProviderId);
        const savedMap = settings.providerConfigs || {};
        const prevSaved = savedMap[newProviderId] || {};
        onUpdateSettings({
            provider: newProviderId,
            protocol: nextPreset.protocol || 'openai',
            baseUrl: prevSaved.baseUrl || nextPreset.baseUrl,
            apiKey: prevSaved.apiKey ?? '',
            model: prevSaved.model || nextPreset.defaultModel,
        });
        setUplinkStatus(null);
        setFetchedModels([]);
    };

    const updateProviderField = (field, val) => {
        const provId = settings.provider || 'ollama';
        const prevConfigs = settings.providerConfigs || {};
        const curProvCfg = prevConfigs[provId] || {};
        onUpdateSettings({
            [field]: val,
            providerConfigs: {
                ...prevConfigs,
                [provId]: {
                    ...curProvCfg,
                    baseUrl: field === 'baseUrl' ? val : settings.baseUrl,
                    apiKey: field === 'apiKey' ? val : settings.apiKey,
                    model: field === 'model' ? val : settings.model,
                },
            },
        });
    };

    const handleFetchModels = async () => {
        if (fetchingModels) return;
        setFetchingModels(true);
        setUplinkStatus(null);
        try {
            const res = await fetchProviderModels(settings);
            if (res.ok && res.models.length > 0) {
                setFetchedModels(res.models);
                setUplinkStatus({
                    ok: true,
                    text: `[ MODELS_SYNCED // ${res.models.length} AVAILABLE ]`,
                });
                if (!settings.model && res.models[0]) {
                    updateProviderField('model', res.models[0]);
                }
            } else {
                setFetchedModels(res.models || []);
                setUplinkStatus({
                    ok: false,
                    text: `[ MODELS_FETCH_WARN // ${res.error || 'Using preset list'} ]`,
                });
            }
        } finally {
            setFetchingModels(false);
        }
    };

    const handleTestUplink = async () => {
        if (testingUplink) return;
        setTestingUplink(true);
        setUplinkStatus({ ok: true, text: '[ PINGING_NEURAL_UPLINK... ]' });
        try {
            const res = await askMikaLlm({
                config: settings,
                userMessage: 'Confirm neural uplink is online in one short sassy sentence.',
                mode: 'relay',
                timeoutMs: 18000,
            });
            if (res.ok) {
                setUplinkStatus({
                    ok: true,
                    text: `[ UPLINK_LOCKED // ${res.provider} (${res.latencyMs}ms) ]`,
                });
                onSay?.(res.line, 'green');
                onShowToast?.(`NEURAL_UPLINK_OK // ${res.latencyMs}MS`);
            } else {
                setUplinkStatus({
                    ok: false,
                    text: `[ ERROR_DETECTED // ${res.error} ]`,
                });
                onSay?.(
                    mikaQuip('uplinkFail', { provider: activePreset.shortName }, Date.now()),
                    'warn'
                );
            }
        } finally {
            setTestingUplink(false);
        }
    };

    const handleCustomHeadersBlur = () => {
        const trimmed = customHeadersText.trim();
        if (!trimmed) {
            onUpdateSettings({ customHeaders: {} });
            return;
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                onUpdateSettings({ customHeaders: parsed });
                onShowToast?.('CUSTOM_HEADERS_SAVED');
            }
        } catch (e) {
            setUplinkStatus({
                ok: false,
                text: '[ INVALID_JSON // Custom headers must be valid JSON object ]',
            });
        }
    };

    return (
        <div
            data-mika-interactive="true"
            onPointerDown={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9800,
                background: 'rgba(5, 3, 8, 0.72)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                animation: 'fadeIn 0.22s ease-out',
            }}
        >
            <div
                className="mika-sanct-panel mika-scroll"
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                    width: 'min(480px, 95vw)',
                    maxHeight: '88vh',
                    overflowY: 'auto',
                    background: 'rgba(11, 9, 20, 0.96)',
                    backdropFilter: 'blur(18px) saturate(1.25)',
                    WebkitBackdropFilter: 'blur(18px) saturate(1.25)',
                    border: '1px solid rgba(0, 229, 255, 0.45)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    boxShadow:
                        '0 20px 50px rgba(0,0,0,0.92), 0 0 28px rgba(0,229,255,0.22), inset 0 0 20px rgba(0,229,255,0.06)',
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                    color: '#EBE3D6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {/* ── Modal Header ── */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(0, 229, 255, 0.25)',
                        paddingBottom: '10px',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: 900,
                                color: '#00E5FF',
                                letterSpacing: '0.12em',
                                textShadow: '0 0 8px rgba(0, 229, 255, 0.45)',
                            }}
                        >
                            &gt; MIKA_ENGINE // SYSTEM_SETTINGS
                        </div>
                        <div
                            style={{
                                fontSize: '9.5px',
                                color: 'rgba(200, 232, 240, 0.55)',
                                marginTop: '2px',
                                letterSpacing: '0.06em',
                            }}
                        >
                            // STANDALONE PROXY DAEMON v{appVersion} · NEURAL &amp; CHASSIS MATRIX
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="deck-btn pink"
                        style={{ padding: '5px 10px', fontSize: '10px' }}
                    >
                        ✕ CLOSE
                    </button>
                </div>

                {/* ── Settings Tab Navigation (mika-visual-language) ── */}
                <div className="settings-tab-nav">
                    <button
                        type="button"
                        className={`settings-tab-btn ${activeTab === 'llm' ? 'active' : ''}`}
                        onClick={() => setActiveTab('llm')}
                    >
                        <span>⚡ NEURAL_UPLINK</span>
                    </button>
                    <button
                        type="button"
                        className={`settings-tab-btn ${activeTab === 'chassis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chassis')}
                    >
                        <span>🐾 CHASSIS_&amp;_STAGE</span>
                    </button>
                    <button
                        type="button"
                        className={`settings-tab-btn ${activeTab === 'autonomy' ? 'active' : ''}`}
                        onClick={() => setActiveTab('autonomy')}
                    >
                        <span>🌀 AUTONOMY_&amp;_VOICE</span>
                    </button>
                </div>

                {/* ============================================================
                    TAB 1: NEURAL UPLINK (Local, Cloud & Custom OpenAI Endpoints)
                   ============================================================ */}
                {activeTab === 'llm' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Quick Category Pills */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[
                                { id: 'ollama', label: 'OLLAMA (LOCAL)', color: '#39FF14' },
                                { id: 'lmstudio', label: 'LM_STUDIO', color: '#39FF14' },
                                { id: 'openrouter', label: 'OPENROUTER', color: '#00E5FF' },
                                { id: 'nanogpt', label: 'NANOGPT', color: '#FF107A' },
                                { id: 'openai', label: 'OPENAI', color: '#00E5FF' },
                                { id: 'custom', label: 'CUSTOM_ENDPOINT', color: '#B533FF' },
                            ].map((pill) => {
                                const isSel = settings.provider === pill.id;
                                return (
                                    <button
                                        key={pill.id}
                                        type="button"
                                        onClick={() => handleProviderChange(pill.id)}
                                        style={{
                                            background: isSel ? `${pill.color}22` : 'rgba(0, 229, 255, 0.03)',
                                            border: `1px solid ${isSel ? pill.color : 'rgba(255,255,255,0.16)'}`,
                                            color: isSel ? pill.color : 'rgba(235, 227, 214, 0.65)',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: '9.5px',
                                            fontWeight: 800,
                                            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                                            letterSpacing: '0.05em',
                                            cursor: 'pointer',
                                            boxShadow: isSel ? `0 0 10px ${pill.color}33` : 'none',
                                            transition: 'all 0.16s ease',
                                        }}
                                    >
                                        {isSel ? '▸ ' : ''}
                                        {pill.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <CyberDropdown
                                label="> LLM_PROVIDER_PRESET (LOCAL // CLOUD // CUSTOM)"
                                value={settings.provider || 'ollama'}
                                options={providerOptions}
                                onChange={handleProviderChange}
                                accentColor="#00E5FF"
                            />
                            <div
                                style={{
                                    fontSize: '9.5px',
                                    color: 'rgba(200, 232, 240, 0.6)',
                                    marginTop: '6px',
                                    lineHeight: 1.45,
                                }}
                            >
                                // {activePreset.hint}
                            </div>
                        </div>

                        {/* Base URL Endpoint */}
                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '5px',
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: '#00E5FF',
                                        letterSpacing: '0.06em',
                                    }}
                                >
                                    &gt; OPENAI_COMPATIBLE_ENDPOINT_URL
                                </label>
                                {settings.baseUrl !== activePreset.baseUrl && (
                                    <button
                                        type="button"
                                        onClick={() => updateProviderField('baseUrl', activePreset.baseUrl)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#FF9100',
                                            fontSize: '9px',
                                            fontFamily: 'inherit',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                        }}
                                    >
                                        [RESET_DEFAULT]
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                className="deck-input"
                                value={settings.baseUrl || ''}
                                onChange={(e) => updateProviderField('baseUrl', e.target.value)}
                                placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                            />
                        </div>

                        {/* API Key */}
                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '5px',
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: activePreset.requiresKey ? '#FF107A' : '#00E5FF',
                                        letterSpacing: '0.06em',
                                    }}
                                >
                                    &gt; API_KEY_BEARER_TOKEN{' '}
                                    {activePreset.requiresKey ? '[REQUIRED]' : '[OPTIONAL_FOR_LOCAL]'}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey((v) => !v)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#00E5FF',
                                        fontSize: '9.5px',
                                        fontWeight: 800,
                                        fontFamily: 'inherit',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showApiKey ? '[ HIDE_KEY ]' : '[ SHOW_KEY ]'}
                                </button>
                            </div>
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                className="deck-input"
                                value={settings.apiKey || ''}
                                onChange={(e) => updateProviderField('apiKey', e.target.value)}
                                placeholder={
                                    activePreset.requiresKey
                                        ? `Paste your ${activePreset.shortName} API Key...`
                                        : 'Leave blank for local server (or enter bearer token)...'
                                }
                            />
                        </div>

                        {/* Model Selector + Direct Input + Fetch Button */}
                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '6px',
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: '#39FF14',
                                        letterSpacing: '0.06em',
                                    }}
                                >
                                    &gt; TARGET_MODEL_IDENTIFIER
                                </label>
                                <button
                                    type="button"
                                    onClick={handleFetchModels}
                                    disabled={fetchingModels}
                                    className="deck-btn green"
                                    style={{ padding: '3px 8px', fontSize: '9.5px' }}
                                >
                                    {fetchingModels ? '↻ SCANNING...' : '↻ FETCH_MODELS'}
                                </button>
                            </div>

                            {modelPool.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <CyberDropdown
                                        value={settings.model || ''}
                                        options={modelPool.map((m) => ({ value: m, label: m }))}
                                        onChange={(val) => updateProviderField('model', val)}
                                        accentColor="#39FF14"
                                        placeholder="Pick a preset or fetched model..."
                                    />
                                </div>
                            )}

                            <input
                                type="text"
                                className="deck-input"
                                value={settings.model || ''}
                                onChange={(e) => updateProviderField('model', e.target.value)}
                                placeholder="Or type any model ID directly (e.g. deepseek/deepseek-chat, llama3.2)..."
                            />
                        </div>

                        {/* Custom Protocol & Headers (shown for Custom Endpoint or advanced tuning) */}
                        {settings.provider === 'custom' && (
                            <div className="term-list-item" style={{ marginBottom: 0 }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: '#B533FF',
                                        letterSpacing: '0.06em',
                                        marginBottom: '5px',
                                    }}
                                >
                                    &gt; CUSTOM_HTTP_HEADERS_JSON (OPTIONAL)
                                </label>
                                <input
                                    type="text"
                                    className="deck-input"
                                    value={customHeadersText}
                                    onChange={(e) => setCustomHeadersText(e.target.value)}
                                    onBlur={handleCustomHeadersBlur}
                                    placeholder='{"X-Custom-Header": "value"}'
                                />
                            </div>
                        )}

                        {/* Temperature & Max Tokens */}
                        <div
                            className="term-list-item"
                            style={{
                                marginBottom: 0,
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '9.5px',
                                        fontWeight: 800,
                                        color: '#00E5FF',
                                        marginBottom: '4px',
                                    }}
                                >
                                    &gt; TEMPERATURE: {Number(settings.temperature ?? 0.85).toFixed(2)}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1.5"
                                    step="0.05"
                                    value={settings.temperature ?? 0.85}
                                    onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                                    style={{ width: '100%', accentColor: '#00E5FF', cursor: 'pointer' }}
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '9.5px',
                                        fontWeight: 800,
                                        color: '#00E5FF',
                                        marginBottom: '4px',
                                    }}
                                >
                                    &gt; MAX_TOKENS: {settings.maxTokens ?? 180}
                                </label>
                                <input
                                    type="range"
                                    min="60"
                                    max="512"
                                    step="20"
                                    value={settings.maxTokens ?? 180}
                                    onChange={(e) => onUpdateSettings({ maxTokens: parseInt(e.target.value, 10) })}
                                    style={{ width: '100%', accentColor: '#FF107A', cursor: 'pointer' }}
                                />
                            </div>
                        </div>

                        {/* Test Connection Action Bar */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                marginTop: '2px',
                            }}
                        >
                            <button
                                type="button"
                                onClick={handleTestUplink}
                                disabled={testingUplink}
                                className="deck-btn"
                                style={{ flexShrink: 0 }}
                            >
                                {testingUplink ? '⚡ PINGING...' : '⚡ TEST_UPLINK'}
                            </button>

                            {uplinkStatus && (
                                <div
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: uplinkStatus.ok ? '#39FF14' : '#FF3355',
                                        textShadow: `0 0 8px ${uplinkStatus.ok ? '#39FF1466' : '#FF335566'}`,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {uplinkStatus.text}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ============================================================
                    TAB 2: CHASSIS & STAGE (Avatar Style, Overlay vs Stage, Scale)
                   ============================================================ */}
                {activeTab === 'chassis' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <CyberDropdown
                                label="> PROXY_AVATAR_CHASSIS"
                                value={settings.avatarStyle || 'vector_pixel'}
                                options={MIKA_AVATAR_STYLES}
                                onChange={(val) => {
                                    onUpdateSettings({ avatarStyle: val });
                                    onShowToast?.(`CHASSIS_SET // ${val.toUpperCase()}`);
                                }}
                                accentColor="#39FF14"
                            />
                            <div style={{ fontSize: '9.5px', color: 'rgba(200,232,240,0.55)', marginTop: '6px' }}>
                                // VECTOR_PIXEL renders mood-reactive RGB contour lines over translucent terminal glass;
                                RETRO_PIXEL renders her classic 24×28 multi-tone sprite.
                            </div>
                        </div>

                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <CyberDropdown
                                label="> DISPLAY_STAGE_MODE (OVERLAY // CYBER_STAGE)"
                                value={settings.stageMode || 'overlay'}
                                options={STAGE_MODE_OPTIONS}
                                onChange={(val) => {
                                    onUpdateSettings({ stageMode: val });
                                    onShowToast?.(`STAGE_MODE // ${val.toUpperCase()}`);
                                }}
                                accentColor="#00E5FF"
                            />
                            <div style={{ fontSize: '9.5px', color: 'rgba(200,232,240,0.55)', marginTop: '6px' }}>
                                // DESKTOP_OVERLAY makes the background 100% transparent &amp; click-through on Windows/Linux
                                so MIKA walks directly over your OS windows. CYBER_STAGE renders the Obsidian Neon terminal backdrop.
                            </div>
                        </div>

                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <CyberDropdown
                                label="> CHIBI_RENDER_SCALE"
                                value={settings.scale || 1}
                                options={SCALE_OPTIONS}
                                onChange={(val) => onUpdateSettings({ scale: Number(val) || 1 })}
                                accentColor="#B533FF"
                            />
                        </div>

                        <div
                            className="term-list-item"
                            style={{
                                marginBottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#00E5FF' }}>
                                    &gt; ALWAYS_ON_TOP_WINDOW
                                </div>
                                <div style={{ fontSize: '9.5px', color: 'rgba(200,232,240,0.55)', marginTop: '2px' }}>
                                    Keep MIKA floating above all desktop windows (Windows / Linux Electron)
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.alwaysOnTop !== false}
                                    onChange={(e) => onUpdateSettings({ alwaysOnTop: e.target.checked })}
                                />
                                <span className="slider" />
                            </label>
                        </div>

                        <div
                            className="term-list-item"
                            style={{
                                marginBottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#FF107A' }}>
                                    &gt; SHOW_TOP_STATUS_PILL
                                </div>
                                <div style={{ fontSize: '9.5px', color: 'rgba(200,232,240,0.55)', marginTop: '2px' }}>
                                    Display the floating MIKA_ENGINE status bar at the top of the viewport
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.showStatusPill !== false}
                                    onChange={(e) => onUpdateSettings({ showStatusPill: e.target.checked })}
                                />
                                <span className="slider" />
                            </label>
                        </div>

                        <div
                            className="term-list-item"
                            style={{
                                marginBottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#39FF14' }}>
                                    &gt; PROCEDURAL_SFX_AUDIO
                                </div>
                                <div style={{ fontSize: '9.5px', color: 'rgba(200,232,240,0.55)', marginTop: '2px' }}>
                                    WebAudio synth chimes for sighs, hacker windows, headpats, and bites
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={!settings.audioMuted}
                                    onChange={(e) => onUpdateSettings({ audioMuted: !e.target.checked })}
                                />
                                <span className="slider" />
                            </label>
                        </div>
                    </div>
                )}

                {/* ============================================================
                    TAB 3: AUTONOMY & VOICE (Roaming, Ambient LLM Sass, Persona)
                   ============================================================ */}
                {activeTab === 'autonomy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div
                            className="term-list-item"
                            style={{
                                marginBottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#39FF14' }}>
                                    &gt; AUTONOMOUS_8WAY_ROAMING
                                </div>
                                <div style={{ fontSize: '9.5px', color: 'rgba(200,232,240,0.55)', marginTop: '2px' }}>
                                    Allow MIKA to patrol the screen, scratch walls, and nap on her own schedule
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.roamEnabled !== false}
                                    onChange={(e) => onUpdateSettings({ roamEnabled: e.target.checked })}
                                />
                                <span className="slider" />
                            </label>
                        </div>

                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <CyberDropdown
                                label="> AMBIENT_SASS_CADENCE"
                                value={settings.ambientCadence || 'balanced'}
                                options={CADENCE_OPTIONS}
                                onChange={(val) => onUpdateSettings({ ambientCadence: val })}
                                accentColor="#FF9100"
                            />
                        </div>

                        <div
                            className="term-list-item"
                            style={{
                                marginBottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#B533FF' }}>
                                    &gt; LLM_POWERED_AMBIENT_THOUGHTS
                                </div>
                                <div style={{ fontSize: '9.5px', color: 'rgba(200,232,240,0.55)', marginTop: '2px' }}>
                                    Periodically query your configured LLM for spontaneous remarks (falls back to built-in voice engine when offline)
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={Boolean(settings.llmAmbient)}
                                    onChange={(e) => onUpdateSettings({ llmAmbient: e.target.checked })}
                                />
                                <span className="slider" />
                            </label>
                        </div>

                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    color: '#FF107A',
                                    letterSpacing: '0.06em',
                                    marginBottom: '5px',
                                }}
                            >
                                &gt; HOW_MIKA_ADDRESSES_YOU (USER_TITLE)
                            </label>
                            <input
                                type="text"
                                className="deck-input"
                                value={settings.userTitle ?? 'Master'}
                                maxLength={32}
                                onChange={(e) => onUpdateSettings({ userTitle: e.target.value })}
                                placeholder="Master"
                            />
                        </div>

                        <div className="term-list-item" style={{ marginBottom: 0 }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    color: '#00E5FF',
                                    letterSpacing: '0.06em',
                                    marginBottom: '5px',
                                }}
                            >
                                &gt; CUSTOM_PERSONA_DIRECTIVE (OPTIONAL)
                            </label>
                            <textarea
                                className="deck-input"
                                rows={3}
                                value={settings.customSystemPrompt || ''}
                                onChange={(e) => onUpdateSettings({ customSystemPrompt: e.target.value })}
                                placeholder="Optional extra context for MIKA (e.g., 'Remind me to drink water and roast my coding habits')..."
                                style={{ resize: 'vertical', lineHeight: 1.45 }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MikaSettingsModal;
