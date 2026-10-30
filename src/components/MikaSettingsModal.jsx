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

const CADENCE_OPTIONS = [
    { value: 'quiet', label: 'QUIET // Rare Unprompted Sass' },
    { value: 'balanced', label: 'BALANCED // Standard MIKA Cadence (Default)' },
    { value: 'chatty', label: 'CHATTY // Frequent Terminal Commentary' },
];

const BUILTIN_PRESETS = {
    '★ M.I.K.A.': {
        avatarStyle: 'vector_pixel',
        scale: 1,
        alwaysOnTop: true,
        roamEnabled: true,
        roamCadence: 'balanced',
        llmAmbient: false,
        sfxEnabled: true,
        temperature: 0.85,
        maxTokens: 180,
    },
    LOCAL_ECO: {
        provider: 'ollama',
        protocol: 'openai',
        baseUrl: 'http://localhost:11434/v1',
        model: 'llama3.2',
        avatarStyle: 'vector_pixel',
        roamEnabled: true,
        roamCadence: 'balanced',
        llmAmbient: false,
        temperature: 0.8,
        maxTokens: 160,
    },
    CLOUD_MAX: {
        provider: 'openrouter',
        protocol: 'openai',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'deepseek/deepseek-chat',
        avatarStyle: 'vector_pixel',
        roamEnabled: true,
        roamCadence: 'chatty',
        llmAmbient: true,
        temperature: 0.9,
        maxTokens: 220,
    },
    SILENT_GUARD: {
        avatarStyle: 'retro_pixel',
        roamEnabled: false,
        roamCadence: 'quiet',
        llmAmbient: false,
        sfxEnabled: false,
    },
};

export const MikaSettingsModal = ({
    settings,
    onUpdateSettings,
    onClose,
    onSay,
    onShowToast,
    mikaBridgeRef = null,
    appVersion = '1.1.0',
}) => {
    const [settingsTab, setSettingsTab] = useState('core'); // 'core' | 'uplink' | 'voice'
    const [hideRecommendation, setHideRecommendation] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const [providerFilter, setProviderFilter] = useState('ALL'); // 'ALL' | 'LOCAL' | 'CLOUD' | 'CUSTOM'
    const [showApiKey, setShowApiKey] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [fetchedModels, setFetchedModels] = useState([]);
    const [testingUplink, setTestingUplink] = useState(false);
    const [uplinkStatus, setUplinkStatus] = useState(null); // { ok, text, detail }
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
    const filteredProviders = LLM_PROVIDERS.filter((p) =>
        providerFilter === 'ALL' ? true : p.category === providerFilter
    );
    const providerOptions = (filteredProviders.length > 0 ? filteredProviders : LLM_PROVIDERS).map((p) => ({
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

    const savedPresets = settings.savedPresets || {};
    const allPresetNames = [...Object.keys(BUILTIN_PRESETS), ...Object.keys(savedPresets)];

    const handleApplyPreset = (presetName) => {
        const cfg = BUILTIN_PRESETS[presetName] || savedPresets[presetName];
        if (!cfg) return;
        onUpdateSettings({
            ...cfg,
            activePresetName: presetName,
        });
        onShowToast?.(`[ PRESET_LOADED // ${presetName.toUpperCase()} ]`, 'success');
    };

    const handleSavePreset = () => {
        const clean = newPresetName.trim().slice(0, 18);
        if (!clean || BUILTIN_PRESETS[clean]) return;
        const snapshot = {
            provider: settings.provider,
            protocol: settings.protocol,
            baseUrl: settings.baseUrl,
            model: settings.model,
            avatarStyle: settings.avatarStyle,
            scale: settings.scale,
            roamEnabled: settings.roamEnabled,
            roamCadence: settings.roamCadence,
            llmAmbient: settings.llmAmbient,
            sfxEnabled: settings.sfxEnabled,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            userTitle: settings.userTitle,
        };
        onUpdateSettings({
            activePresetName: clean,
            savedPresets: {
                ...savedPresets,
                [clean]: snapshot,
            },
        });
        setNewPresetName('');
        onShowToast?.(`[ PRESET_SAVED // ${clean.toUpperCase()} ]`, 'success');
    };

    const handleDeletePreset = (presetName) => {
        if (BUILTIN_PRESETS[presetName]) return;
        const next = { ...savedPresets };
        delete next[presetName];
        onUpdateSettings({
            savedPresets: next,
            activePresetName: settings.activePresetName === presetName ? '★ M.I.K.A.' : settings.activePresetName,
        });
        onShowToast?.(`[ PRESET_DELETED // ${presetName.toUpperCase()} ]`, 'info');
    };

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
                    detail: `Endpoint: ${settings.baseUrl || activePreset.baseUrl}`,
                });
                if (!settings.model && res.models[0]) {
                    updateProviderField('model', res.models[0]);
                }
            } else {
                setFetchedModels(res.models || []);
                setUplinkStatus({
                    ok: false,
                    text: `[ MODELS_FETCH_WARN // ${res.error || 'Using preset list'} ]`,
                    detail: 'Check endpoint URL or type your model ID manually below.',
                });
            }
        } finally {
            setFetchingModels(false);
        }
    };

    const handleTestUplink = async () => {
        if (testingUplink) return;
        setTestingUplink(true);
        setUplinkStatus({ ok: true, text: '[ PINGING_NEURAL_UPLINK... ]', detail: 'Transmitting handshake packet...' });
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
                    detail: `RX: "${res.line}"`,
                });
                onSay?.(res.line, { tone: 'green', ms: 6200 });
                onShowToast?.(`[ NEURAL_UPLINK_OK // ${res.latencyMs}MS ]`, 'success');
            } else {
                setUplinkStatus({
                    ok: false,
                    text: `[ ERROR_DETECTED // ${res.error} ]`,
                    detail: `Target: ${settings.baseUrl || activePreset.baseUrl}`,
                });
                onSay?.(
                    mikaQuip('uplinkFail', { provider: activePreset.shortName }, Date.now()),
                    { tone: 'warn', ms: 5400 }
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
                onShowToast?.('[ CUSTOM_HEADERS_SAVED ]', 'success');
            }
        } catch (e) {
            setUplinkStatus({
                ok: false,
                text: '[ INVALID_JSON // Custom headers must be valid JSON object ]',
                detail: 'Example: {"X-Custom-Auth": "token"}',
            });
        }
    };

    const activePresetName = settings.activePresetName || '★ M.I.K.A.';

    return (
        <div
            data-mika-interactive="true"
            className="mika-scroll"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9800,
                background: '#050308',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '0',
                animation: 'fadeIn 0.18s ease-out',
                pointerEvents: 'auto',
            }}
        >
            <div
                data-mika-interactive="true"
                className="mika-director-panel swipe-scanlines"
            >
                {/* ── GachaSwipe DIRECTOR_SETTINGS Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
                    <h2
                        style={{
                            fontSize: '18px',
                            margin: 0,
                            fontFamily: 'monospace',
                            color: '#00E5FF',
                            textShadow: '0 0 10px rgba(0, 229, 255, 0.4)',
                            letterSpacing: '0.05em',
                        }}
                    >
                        &gt; DIRECTOR_SETTINGS
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            style={{
                                fontSize: '9px',
                                fontFamily: 'monospace',
                                color: '#39FF14',
                                background: 'rgba(57, 255, 20, 0.1)',
                                border: '1px solid rgba(57, 255, 20, 0.35)',
                                borderRadius: '4px',
                                padding: '3px 6px',
                                fontWeight: 'bold',
                            }}
                        >
                            v{appVersion} // OVERLAY
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 16, 122, 0.15)',
                                border: '1px solid #FF107A',
                                color: '#FF107A',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            [X] EXIT
                        </button>
                    </div>
                </div>
                <p
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        marginBottom: '12px',
                        fontFamily: 'monospace',
                        marginTop: '4px',
                    }}
                >
                    // Fine-tune your M.I.K.A. Proxy overlay &amp; neural uplink.
                </p>

                {/* ── Dismissible M.I.K.A_RECOMMENDATION Banner (Exact GachaSwipe Pattern) ── */}
                {!hideRecommendation && (
                    <div
                        style={{
                            marginBottom: '16px',
                            padding: '12px 14px',
                            background: 'rgba(0, 229, 255, 0.05)',
                            border: '1px dashed #00E5FF',
                            borderRadius: '8px',
                            position: 'relative',
                            animation: 'csd-pulse 3s infinite',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setHideRecommendation(true)}
                            style={{
                                position: 'absolute',
                                top: '6px',
                                right: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(0, 229, 255, 0.5)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                            }}
                            title="Dismiss"
                        >
                            [X]
                        </button>
                        <div
                            style={{
                                fontSize: '10px',
                                color: '#00E5FF',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                marginBottom: '4px',
                                letterSpacing: '0.05em',
                            }}
                        >
                            &gt; M.I.K.A_RECOMMENDATION
                        </div>
                        <div
                            style={{
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.85)',
                                fontFamily: 'monospace',
                                lineHeight: '1.4',
                            }}
                        >
                            Always-on-top transparent avatar overlay active. Drag MIKA anywhere on your screen, or link a{' '}
                            <span style={{ color: '#39FF14', fontWeight: 'bold' }}>LOCAL</span> or{' '}
                            <span style={{ color: '#FF107A', fontWeight: 'bold' }}>CLOUD</span> LLM in{' '}
                            <span style={{ color: '#00E5FF' }}>NEURAL UPLINK</span>.
                        </div>
                    </div>
                )}

                {/* ── Sticky Settings Tab Bar (Exact GachaSwipe .settings-tab-nav & Custom SVGs) ── */}
                <div className="settings-tab-nav">
                    <button
                        type="button"
                        className={`settings-tab-btn ${settingsTab === 'core' ? 'active' : ''}`}
                        onClick={() => setSettingsTab('core')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 3c0 5 10 5 10 10s-10 5-10 10" />
                            <path d="M17 3c0 5-10 5-10 10s10 5 10 10" />
                            <line x1="8.5" y1="6" x2="15.5" y2="6" strokeOpacity="0.6" />
                            <line x1="12" y1="13" x2="12" y2="13.01" strokeWidth="3" />
                            <line x1="8.5" y1="18" x2="15.5" y2="18" strokeOpacity="0.6" />
                        </svg>
                        <span>CORE MATRIX</span>
                    </button>

                    <button
                        type="button"
                        className={`settings-tab-btn ${settingsTab === 'uplink' ? 'active' : ''}`}
                        onClick={() => setSettingsTab('uplink')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3H9C7.34 3 6 4.34 6 6v1" strokeOpacity="0.6" />
                            <path d="M5 9h10c1.66 0 3 1.34 3 3v5c0 1.66-1.34 3-3 3H9l-4 3v-3c-1.66 0-3-1.34-3-3v-5c0-1.66 1.34-3 3-3z" fill="currentColor" fillOpacity="0.1" />
                            <line x1="8" y1="13" x2="12" y2="13" />
                            <line x1="8" y1="16" x2="10" y2="16" />
                        </svg>
                        <span>NEURAL UPLINK</span>
                    </button>

                    <button
                        type="button"
                        className={`settings-tab-btn ${settingsTab === 'voice' ? 'active' : ''}`}
                        onClick={() => setSettingsTab('voice')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" fillOpacity="0.05" />
                            <path d="M6 12h2l2-5 4 10 2-5h2" />
                        </svg>
                        <span>P.U.R.R. &amp; VOICE</span>
                    </button>
                </div>

                {/* ============================================================
                    TAB 1: CORE MATRIX (System Presets, MIKA Engine, Chassis, Overrides)
                   ============================================================ */}
                {settingsTab === 'core' && (
                    <div>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#00E5FF',
                                fontFamily: 'monospace',
                                marginTop: '4px',
                                marginBottom: '8px',
                                letterSpacing: '0.1em',
                            }}
                        >
                            &gt; SYSTEM PRESETS
                        </div>

                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#E0E7FF' }}>
                                    &gt; CONFIGURATION_PROFILES
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // Save &amp; hot-swap your entire MIKA Engine configuration
                                </div>
                            </div>

                            {/* Preset Chips */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {allPresetNames.map((name) => {
                                    const isActive = activePresetName === name;
                                    const isMika = name === '★ M.I.K.A.';
                                    return (
                                        <div key={name} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleApplyPreset(name)}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: !BUILTIN_PRESETS[name] ? '6px 0 0 6px' : '6px',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    fontFamily: 'monospace',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    background: isActive
                                                        ? isMika
                                                            ? 'rgba(0, 229, 255, 0.25)'
                                                            : 'rgba(255, 16, 122, 0.25)'
                                                        : 'rgba(255, 255, 255, 0.05)',
                                                    color: isActive ? (isMika ? '#00E5FF' : '#FF107A') : 'var(--text-secondary)',
                                                    border: isActive
                                                        ? isMika
                                                            ? '1px solid #00E5FF'
                                                            : '1px solid #FF107A'
                                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                                    boxShadow: isActive
                                                        ? isMika
                                                            ? '0 0 10px rgba(0, 229, 255, 0.3)'
                                                            : '0 0 10px rgba(255, 16, 122, 0.3)'
                                                        : 'none',
                                                }}
                                            >
                                                {name}
                                            </button>
                                            {!BUILTIN_PRESETS[name] && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePreset(name)}
                                                    style={{
                                                        padding: '6px 6px',
                                                        borderRadius: '0 6px 6px 0',
                                                        fontSize: '10px',
                                                        fontFamily: 'monospace',
                                                        cursor: 'pointer',
                                                        background: 'rgba(255, 0, 85, 0.15)',
                                                        color: '#FF0055',
                                                        border: '1px solid rgba(255, 0, 85, 0.3)',
                                                        borderLeft: 'none',
                                                    }}
                                                    title="Delete Preset"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Save Current As Row */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="save_current_as..."
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    maxLength={18}
                                    style={{ flex: 1, padding: '6px 10px', fontSize: '11px' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSavePreset}
                                    disabled={!newPresetName.trim() || Boolean(BUILTIN_PRESETS[newPresetName.trim()])}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                        background: newPresetName.trim() ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                                        color: newPresetName.trim() ? '#00E5FF' : 'rgba(255,255,255,0.3)',
                                        border: newPresetName.trim() ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.1)',
                                        cursor: newPresetName.trim() ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    + SAVE
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: '12px',
                                color: '#00E5FF',
                                fontFamily: 'monospace',
                                marginTop: '18px',
                                marginBottom: '8px',
                                letterSpacing: '0.1em',
                            }}
                        >
                            &gt; MIKA_ENGINE OVERLAY MATRIX
                        </div>

                        {/* MIKA_ENGINE Row (Exact GachaSwipe line 21319 pattern) */}
                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ paddingRight: '12px' }}>
                                    <div
                                        style={{
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            fontFamily: 'monospace',
                                            color: '#00E5FF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        &gt; MIKA_ENGINE
                                        <span
                                            style={{
                                                fontSize: '9px',
                                                background: 'rgba(255, 213, 79, 0.15)',
                                                color: '#FFD54F',
                                                padding: '2px 5px',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(255, 213, 79, 0.35)',
                                            }}
                                        >
                                            OVERLAY
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                        // Autonomous 8-way roaming chibi familiar. Tap her for radial actions or hold to headpat!
                                    </div>
                                </div>
                                <label className="toggle-switch" style={{ flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.roamEnabled !== false}
                                        onChange={(e) => onUpdateSettings({ roamEnabled: e.target.checked })}
                                    />
                                    <span className="slider" />
                                </label>
                            </div>

                            <div style={{ paddingTop: '6px', borderTop: '1px dashed rgba(0, 229, 255, 0.2)' }}>
                                <CyberDropdown
                                    label="> PROXY_AVATAR_CHASSIS"
                                    value={settings.avatarStyle || 'vector_pixel'}
                                    options={MIKA_AVATAR_STYLES}
                                    onChange={(val) => {
                                        onUpdateSettings({ avatarStyle: val });
                                        onShowToast?.(`[ CHASSIS // ${val.toUpperCase()} ]`, 'info');
                                    }}
                                    accentColor="#39FF14"
                                />
                            </div>

                            <div style={{ paddingTop: '4px' }}>
                                <CyberDropdown
                                    label="> CHASSIS_SCALE_MATRIX"
                                    value={settings.scale || 1}
                                    options={SCALE_OPTIONS}
                                    onChange={(val) => onUpdateSettings({ scale: Number(val) || 1 })}
                                    accentColor="#00E5FF"
                                />
                            </div>
                        </div>

                        {/* Always on top toggle */}
                        <div className="list-item">
                            <div style={{ paddingRight: '12px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#E0E7FF' }}>
                                    &gt; ALWAYS_ON_TOP_OVERLAY
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // Keep MIKA floating above all OS windows on Windows, Linux &amp; Android
                                </div>
                            </div>
                            <label className="toggle-switch" style={{ flexShrink: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={settings.alwaysOnTop !== false}
                                    onChange={(e) => onUpdateSettings({ alwaysOnTop: e.target.checked })}
                                />
                                <span className="slider" />
                            </label>
                        </div>

                        {/* Direct Chassis Overrides */}
                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#00E5FF' }}>
                                    &gt; DIRECT_CHASSIS_OVERRIDES
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // Trigger MIKA&apos;s special overlay animations on demand
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose?.();
                                        mikaBridgeRef?.current?.pilotSpaceship?.();
                                    }}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                        background: 'rgba(0, 229, 255, 0.1)',
                                        color: '#00E5FF',
                                        border: '1px solid rgba(0, 229, 255, 0.35)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🚀 STARFIGHTER
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose?.();
                                        mikaBridgeRef?.current?.openHackerTerminal?.();
                                    }}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                        background: 'rgba(57, 255, 20, 0.1)',
                                        color: '#39FF14',
                                        border: '1px solid rgba(57, 255, 20, 0.35)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    💻 HOLO_TTY
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose?.();
                                        mikaBridgeRef?.current?.dropFromCeiling?.();
                                    }}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                        background: 'rgba(255, 16, 122, 0.1)',
                                        color: '#FF107A',
                                        border: '1px solid rgba(255, 16, 122, 0.35)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ☄ CEILING_DROP
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose?.();
                                        mikaBridgeRef?.current?.ask?.();
                                    }}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                        background: 'rgba(255, 213, 79, 0.1)',
                                        color: '#FFD54F',
                                        border: '1px solid rgba(255, 213, 79, 0.35)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ⚡ ASK_MIKA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================
                    TAB 2: NEURAL UPLINK (Local, Cloud & Custom OpenAI Endpoints)
                   ============================================================ */}
                {settingsTab === 'uplink' && (
                    <div>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#00E5FF',
                                fontFamily: 'monospace',
                                marginTop: '4px',
                                marginBottom: '8px',
                                letterSpacing: '0.1em',
                            }}
                        >
                            &gt; ENGINE_PROVIDER_MATRIX
                        </div>

                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#E0E7FF' }}>
                                    &gt; NEURAL_UPLINK_GATEWAY
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // Filter by Local Rig, Cloud API (OpenRouter, NanoGPT, OpenAI, Anthropic, etc.), or Custom URL
                                </div>
                            </div>

                            {/* Category Filter Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                {[
                                    { id: 'ALL', label: '⚡ ALL', color: '#00E5FF' },
                                    { id: 'LOCAL', label: '🏠 LOCAL', color: '#39FF14' },
                                    { id: 'CLOUD', label: '☁️ CLOUD', color: '#FF107A' },
                                    { id: 'CUSTOM', label: '🔧 CUSTOM', color: '#FFD54F' },
                                ].map((cat) => {
                                    const active = providerFilter === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                setProviderFilter(cat.id);
                                                if (cat.id === 'CUSTOM') handleProviderChange('custom');
                                            }}
                                            style={{
                                                padding: '6px 4px',
                                                borderRadius: '6px',
                                                fontSize: '9.5px',
                                                fontWeight: 'bold',
                                                fontFamily: 'monospace',
                                                cursor: 'pointer',
                                                background: active ? `${cat.color}22` : 'rgba(255,255,255,0.04)',
                                                color: active ? cat.color : 'var(--text-secondary)',
                                                border: active ? `1px solid ${cat.color}` : '1px solid rgba(255,255,255,0.1)',
                                                boxShadow: active ? `0 0 10px ${cat.color}33` : 'none',
                                            }}
                                        >
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <CyberDropdown
                                label="> ACTIVE_LLM_PROVIDER"
                                value={settings.provider || 'ollama'}
                                options={providerOptions}
                                onChange={handleProviderChange}
                                accentColor="#00E5FF"
                            />

                            {/* Dashed Cyan Sub-Panel (Exact GachaSwipe line 21276 pattern) */}
                            <div
                                style={{
                                    padding: '10px',
                                    background: 'rgba(0, 229, 255, 0.03)',
                                    borderRadius: '6px',
                                    border: '1px dashed rgba(0, 229, 255, 0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                }}
                            >
                                <div style={{ fontSize: '10px', color: 'rgba(200, 232, 240, 0.75)', fontFamily: 'monospace', lineHeight: 1.4 }}>
                                    // {activePreset.hint}
                                </div>

                                {/* Endpoint Base URL */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '10px', color: '#00E5FF', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                            &gt; ENDPOINT_BASE_URL
                                        </span>
                                        {settings.baseUrl !== activePreset.baseUrl && (
                                            <button
                                                type="button"
                                                onClick={() => updateProviderField('baseUrl', activePreset.baseUrl)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#FF9100',
                                                    fontSize: '9px',
                                                    fontFamily: 'monospace',
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
                                        className="search-input"
                                        value={settings.baseUrl || ''}
                                        onChange={(e) => updateProviderField('baseUrl', e.target.value)}
                                        placeholder="https://openrouter.ai/api/v1 or http://localhost:11434/v1"
                                        style={{ padding: '8px 10px', fontSize: '11px' }}
                                    />
                                </div>

                                {/* API Bearer Key */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                color: activePreset.requiresKey ? '#FF107A' : '#00E5FF',
                                                fontWeight: 'bold',
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            &gt; API_BEARER_KEY {activePreset.requiresKey ? '[REQUIRED]' : '[OPTIONAL]'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey((v) => !v)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#00E5FF',
                                                fontSize: '9.5px',
                                                fontWeight: 'bold',
                                                fontFamily: 'monospace',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {showApiKey ? '[HIDE]' : '[SHOW]'}
                                        </button>
                                    </div>
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        className="search-input"
                                        value={settings.apiKey || ''}
                                        onChange={(e) => updateProviderField('apiKey', e.target.value)}
                                        placeholder={
                                            activePreset.requiresKey
                                                ? `Paste ${activePreset.shortName} API Key...`
                                                : 'Leave blank for local server (or enter bearer token)...'
                                        }
                                        style={{ padding: '8px 10px', fontSize: '11px' }}
                                    />
                                    {activePreset.requiresKey && !settings.apiKey && (
                                        <div style={{ fontSize: '10px', color: '#FF0055', fontFamily: 'monospace', marginTop: '4px' }}>
                                            [!] WARNING: {activePreset.shortName} requires an API key for neural uplink.
                                        </div>
                                    )}
                                </div>

                                {/* Target Model ID */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '10px', color: '#39FF14', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                            &gt; TARGET_MODEL_ID
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleFetchModels}
                                            disabled={fetchingModels}
                                            style={{
                                                background: 'rgba(57, 255, 20, 0.12)',
                                                border: '1px solid rgba(57, 255, 20, 0.45)',
                                                borderRadius: '4px',
                                                color: '#39FF14',
                                                fontSize: '9px',
                                                fontWeight: 'bold',
                                                fontFamily: 'monospace',
                                                padding: '2px 7px',
                                                cursor: fetchingModels ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            {fetchingModels ? '↻ SCANNING...' : '↻ FETCH_MODELS'}
                                        </button>
                                    </div>

                                    {modelPool.length > 0 && (
                                        <div style={{ marginBottom: '6px' }}>
                                            <CyberDropdown
                                                value={settings.model || ''}
                                                options={modelPool.map((m) => ({ value: m, label: m }))}
                                                onChange={(val) => updateProviderField('model', val)}
                                                accentColor="#39FF14"
                                                placeholder="Select preset or fetched model..."
                                            />
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        className="search-input"
                                        value={settings.model || ''}
                                        onChange={(e) => updateProviderField('model', e.target.value)}
                                        placeholder="Or type any model ID (e.g. deepseek/deepseek-chat, llama3.2)..."
                                        style={{ padding: '8px 10px', fontSize: '11px' }}
                                    />
                                </div>

                                {/* Custom HTTP Headers (for Custom Endpoint or reverse proxies) */}
                                <div>
                                    <span
                                        style={{
                                            display: 'block',
                                            fontSize: '10px',
                                            color: '#B533FF',
                                            fontWeight: 'bold',
                                            fontFamily: 'monospace',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        &gt; CUSTOM_HTTP_HEADERS_JSON (OPTIONAL)
                                    </span>
                                    <input
                                        type="text"
                                        className="search-input"
                                        value={customHeadersText}
                                        onChange={(e) => setCustomHeadersText(e.target.value)}
                                        onBlur={handleCustomHeadersBlur}
                                        placeholder='{"X-Custom-Header": "value"}'
                                        style={{ padding: '8px 10px', fontSize: '11px' }}
                                    />
                                </div>
                            </div>

                            {/* Verify Neural Uplink Button & OobTraceModal-style Phosphor Status Box */}
                            <button
                                type="button"
                                onClick={handleTestUplink}
                                disabled={testingUplink}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.08em',
                                    background: testingUplink ? 'rgba(0, 229, 255, 0.08)' : 'rgba(57, 255, 20, 0.14)',
                                    color: testingUplink ? '#00E5FF' : '#39FF14',
                                    border: `1px solid ${testingUplink ? '#00E5FF' : '#39FF14'}`,
                                    boxShadow: testingUplink ? 'none' : '0 0 12px rgba(57, 255, 20, 0.25)',
                                    cursor: testingUplink ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {testingUplink ? '⚡ PINGING_NEURAL_UPLINK...' : '⚡ VERIFY_NEURAL_UPLINK'}
                            </button>

                            {uplinkStatus && (
                                <div
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(4, 12, 10, 0.85)',
                                        border: `1px solid ${uplinkStatus.ok ? 'rgba(57, 255, 20, 0.45)' : 'rgba(255, 51, 85, 0.55)'}`,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '10.5px',
                                            fontWeight: 'bold',
                                            color: uplinkStatus.ok ? '#39FF14' : '#FF3355',
                                            textShadow: `0 0 8px ${uplinkStatus.ok ? 'rgba(57,255,20,0.4)' : 'rgba(255,51,85,0.4)'}`,
                                        }}
                                    >
                                        {uplinkStatus.text}
                                    </div>
                                    {uplinkStatus.detail && (
                                        <div style={{ fontSize: '9.5px', color: 'rgba(216, 245, 208, 0.72)', marginTop: '3px', wordBreak: 'break-word' }}>
                                            // {uplinkStatus.detail}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ============================================================
                    TAB 3: P.U.R.R. & VOICE (Honorific, Cadence, Ambient LLM, SFX, Persona)
                   ============================================================ */}
                {settingsTab === 'voice' && (
                    <div>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#00E5FF',
                                fontFamily: 'monospace',
                                marginTop: '4px',
                                marginBottom: '8px',
                                letterSpacing: '0.1em',
                            }}
                        >
                            &gt; VOICE_&amp;_AUTONOMY
                        </div>

                        {/* User Honorific Title */}
                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#FF107A' }}>
                                    &gt; USER_HONORIFIC_TITLE
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // How MIKA addresses you in her terminal speech bubbles &amp; LLM prompts
                                </div>
                            </div>
                            <input
                                type="text"
                                className="search-input"
                                value={settings.userTitle ?? 'Master'}
                                maxLength={32}
                                onChange={(e) => onUpdateSettings({ userTitle: e.target.value })}
                                placeholder="Master"
                                style={{ padding: '8px 10px', fontSize: '11px' }}
                            />
                        </div>

                        {/* Unprompted Roam Cadence */}
                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#E0E7FF' }}>
                                    &gt; UNPROMPTED_ROAM_CADENCE
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // Frequency of MIKA&apos;s autonomous quips &amp; ambient remarks
                                </div>
                            </div>
                            <CyberDropdown
                                value={settings.roamCadence || 'balanced'}
                                options={CADENCE_OPTIONS}
                                onChange={(val) => onUpdateSettings({ roamCadence: val })}
                                accentColor="#FF9100"
                            />
                        </div>

                        {/* Proactive LLM Thoughts */}
                        <div className="list-item">
                            <div style={{ paddingRight: '12px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#B533FF' }}>
                                    &gt; PROACTIVE_LLM_THOUGHTS
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // Periodically query your active LLM for spontaneous remarks while roaming
                                </div>
                            </div>
                            <label className="toggle-switch" style={{ flexShrink: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(settings.llmAmbient)}
                                    onChange={(e) => onUpdateSettings({ llmAmbient: e.target.checked })}
                                />
                                <span className="slider" />
                            </label>
                        </div>

                        {/* WebAudio Synth SFX */}
                        <div className="list-item">
                            <div style={{ paddingRight: '12px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#39FF14' }}>
                                    &gt; WEBAUDIO_SYNTH_SFX
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // Procedural sound effects for headpats, sighs, hacker windows, and bites
                                </div>
                            </div>
                            <label className="toggle-switch" style={{ flexShrink: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={settings.sfxEnabled !== false}
                                    onChange={(e) => onUpdateSettings({ sfxEnabled: e.target.checked })}
                                />
                                <span className="slider" />
                            </label>
                        </div>

                        {/* Temperature & Max Tokens */}
                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#00E5FF' }}>
                                &gt; SAMPLING_PARAMETERS
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#00E5FF', fontFamily: 'monospace', marginBottom: '4px' }}>
                                        &gt; TEMP: {Number(settings.temperature ?? 0.85).toFixed(2)}
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
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#FF107A', fontFamily: 'monospace', marginBottom: '4px' }}>
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
                        </div>

                        {/* Custom Persona Directive */}
                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', color: '#00E5FF' }}>
                                    &gt; CUSTOM_PERSONA_DIRECTIVE
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                    // Optional extra instructions appended to MIKA&apos;s system prompt
                                </div>
                            </div>
                            <textarea
                                className="search-input"
                                rows={3}
                                value={settings.customSystemPrompt || ''}
                                onChange={(e) => onUpdateSettings({ customSystemPrompt: e.target.value })}
                                placeholder="e.g., Remind me to drink water and roast my debugging habits..."
                                style={{ padding: '8px 10px', fontSize: '11px', resize: 'vertical', lineHeight: 1.45 }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Exact GachaSwipe Footer Button ── */}
                <button
                    type="button"
                    className="btn btn-outline"
                    style={{ marginTop: '14px', width: '100%', fontFamily: 'monospace' }}
                    onClick={onClose}
                >
                    &gt; BACK_TO_OVERLAY
                </button>
            </div>
        </div>
    );
};

export default MikaSettingsModal;
