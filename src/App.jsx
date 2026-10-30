import React, { useState, useEffect, useRef, useCallback } from 'react';
import MikaProxy from './components/MikaProxy.jsx';
import { MikaSettingsModal } from './components/MikaSettingsModal.jsx';
import TerminalToast from './components/TerminalToast.jsx';
import { DEFAULT_LLM_SETTINGS, getProviderPreset, askMikaLlm } from './utils/llmClient.js';
import { pickMikaQuip } from './utils/mikaQuips.js';
import { playClick } from './utils/mikaAudio.js';

const SETTINGS_STORAGE_KEY = 'mika_engine_settings_v1';
const MSG_LOG_STORAGE_KEY = 'mika_engine_msg_log_v1';

const loadSavedSettings = () => {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_LLM_SETTINGS };
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT_LLM_SETTINGS,
            ...parsed,
            providerConfigs: {
                ...DEFAULT_LLM_SETTINGS.providerConfigs,
                ...(parsed.providerConfigs || {}),
            },
        };
    } catch {
        return { ...DEFAULT_LLM_SETTINGS };
    }
};

const loadSavedMsgLog = () => {
    try {
        const raw = localStorage.getItem(MSG_LOG_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(-80) : [];
    } catch {
        return [];
    }
};

const App = () => {
    const [settings, setSettings] = useState(loadSavedSettings);
    const [msgLog, setMsgLog] = useState(loadSavedMsgLog);
    const [activeModal, setActiveModal] = useState(null); // 'settings' | 'msgs' | 'dossier' | null
    const [toast, setToast] = useState(null);
    const [hudCollapsed, setHudCollapsed] = useState(false);
    const mikaRef = useRef({});

    const activeProvider = getProviderPreset(settings.provider);
    const activeModel = settings.model || activeProvider.defaultModel || 'local-quips';
    const isOverlay = settings.stageMode === 'overlay';

    // Save settings to localStorage & sync desktop Electron window state
    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // ignore storage quota errors
        }
        document.documentElement.classList.toggle('mika-overlay-mode', isOverlay);
        document.body.classList.toggle('mika-overlay-mode', isOverlay);

        if (typeof window !== 'undefined' && window.mikaDesktop) {
            window.mikaDesktop.setStageMode?.(settings.stageMode);
            window.mikaDesktop.setAlwaysOnTop?.(Boolean(settings.alwaysOnTop));
        }
    }, [settings, isOverlay]);

    // Save message log
    useEffect(() => {
        try {
            localStorage.setItem(MSG_LOG_STORAGE_KEY, JSON.stringify(msgLog.slice(-80)));
        } catch {
            // ignore
        }
    }, [msgLog]);

    // Electron Desktop Overlay Click-Through Hit-Testing
    useEffect(() => {
        if (typeof window === 'undefined' || !window.mikaDesktop?.setIgnoreMouseEvents) return undefined;

        if (!isOverlay || activeModal) {
            window.mikaDesktop.setIgnoreMouseEvents(false);
            return undefined;
        }

        let lastIgnore = null;
        const onPointerMove = (ev) => {
            const target = ev.target;
            const interactive = Boolean(
                target &&
                typeof target.closest === 'function' &&
                target.closest('[data-mika-interactive="true"]')
            );
            const shouldIgnore = !interactive;
            if (shouldIgnore !== lastIgnore) {
                lastIgnore = shouldIgnore;
                window.mikaDesktop.setIgnoreMouseEvents(shouldIgnore, { forward: true });
            }
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.mikaDesktop.setIgnoreMouseEvents(false);
        };
    }, [isOverlay, activeModal]);

    // Listen for system tray / IPC commands from Electron main process
    useEffect(() => {
        if (typeof window === 'undefined' || !window.mikaDesktop?.onCommand) return undefined;
        return window.mikaDesktop.onCommand((cmd) => {
            if (cmd === 'open-settings') setActiveModal('settings');
            else if (cmd === 'open-ask') mikaRef.current?.ask?.();
            else if (cmd === 'toggle-stage') {
                setSettings((prev) => ({
                    ...prev,
                    stageMode: prev.stageMode === 'overlay' ? 'stage' : 'overlay',
                }));
            } else if (cmd === 'summon-center') {
                mikaRef.current?.dropFromCeiling?.();
            }
        });
    }, []);

    // Optional LLM-driven ambient thoughts
    useEffect(() => {
        if (!settings.llmAmbient || !settings.roamEnabled) return undefined;
        const intervalSec = settings.roamCadence === 'chatty' ? 30 : settings.roamCadence === 'quiet' ? 75 : 48;
        const timer = setInterval(async () => {
            if (document.hidden || activeModal) return;
            try {
                const res = await askMikaLlm({
                    config: settings,
                    mode: 'ambient',
                });
                if (res && res.ok && res.line) {
                    mikaRef.current?.say?.(res.line, { tone: 'cyan', ms: 6800 });
                }
            } catch {
                // Silent fallback on ambient timer
            }
        }, intervalSec * 1000);
        return () => clearInterval(timer);
    }, [settings, activeModal]);

    const appendLogEntry = useCallback((entryOrText) => {
        const payload = typeof entryOrText === 'string'
            ? { text: entryOrText, category: 'TTY' }
            : entryOrText;
        if (!payload?.text) return;
        setMsgLog((prev) => [
            ...prev.slice(-79),
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                ts: new Date().toLocaleTimeString([], { hour12: false }),
                ...payload,
            },
        ]);
    }, []);

    const handleUpdateSettings = useCallback((partial) => {
        setSettings((prev) => ({
            ...prev,
            ...partial,
        }));
    }, []);

    const handlePoke = () => {
        if (settings.sfxEnabled !== false) playClick();
        const line = pickMikaQuip('poked', { name: settings.userTitle || 'Master' });
        mikaRef.current?.say?.(line, { tone: 'warn', ms: 5200 });
    };

    const toggleStageMode = () => {
        if (settings.sfxEnabled !== false) playClick();
        setSettings((prev) => {
            const nextMode = prev.stageMode === 'overlay' ? 'stage' : 'overlay';
            setToast({
                message: nextMode === 'overlay'
                    ? 'OVERLAY_MODE // TRANSPARENT_DESKTOP_ROAM_ACTIVE'
                    : 'STAGE_MODE // CYBER_SANCTUARY_DECK_ACTIVE',
                type: 'info',
            });
            return { ...prev, stageMode: nextMode };
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                background: isOverlay
                    ? 'transparent'
                    : 'radial-gradient(circle at 50% 28%, rgba(26, 15, 46, 0.85) 0%, rgba(11, 9, 20, 0.96) 55%, #050308 100%)',
                pointerEvents: isOverlay ? 'none' : 'auto',
                userSelect: 'none',
            }}
        >
            {/* ── CYBER-STAGE ATMOSPHERE LAYER (Hidden in Transparent Overlay Mode) ── */}
            {!isOverlay && (
                <>
                    <div className="swipe-scanlines" />
                    <div className="swipe-scanline-move" />
                    <div className="swipe-vignette" />

                    {/* Perspective Cyber Grid Floor & Telemetry Watermark */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            backgroundImage: `
                                linear-gradient(rgba(0, 229, 255, 0.045) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 229, 255, 0.045) 1px, transparent 1px)
                            `,
                            backgroundSize: '42px 42px',
                            maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 85%)',
                            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 85%)',
                        }}
                    />

                    {/* Center Stage Ambient Telemetry Badge */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: 0.22,
                        }}
                    >
                        <div
                            style={{
                                width: '240px',
                                height: '240px',
                                borderRadius: '50%',
                                border: '1px dashed rgba(0, 229, 255, 0.45)',
                                boxShadow: '0 0 60px rgba(0, 229, 255, 0.12), inset 0 0 40px rgba(255, 16, 122, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                style={{
                                    width: '168px',
                                    height: '168px',
                                    borderRadius: '50%',
                                    border: '1px solid rgba(255, 16, 122, 0.35)',
                                }}
                            />
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.24em', color: '#00E5FF' }}>
                            MIKA_ENGINE // AUTONOMOUS_CHIBI_STAGE
                        </div>
                        <div style={{ fontSize: '8.5px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)' }}>
                            TAP_CHIBI_FOR_RADIAL_HUD • DRAG_TO_THROW • SETTINGS_FOR_LLM_UPLINK
                        </div>
                    </div>
                </>
            )}

            {/* ── TOP FLOATING COMMAND PILL (Interactive in both Stage & Overlay modes) ── */}
            <div
                data-mika-interactive="true"
                style={{
                    position: 'fixed',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9500,
                    pointerEvents: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: hudCollapsed ? '5px 10px' : '6px 12px',
                    borderRadius: '999px',
                    background: 'rgba(8, 6, 16, 0.84)',
                    backdropFilter: 'blur(14px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
                    border: '1px solid rgba(0, 229, 255, 0.35)',
                    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.65), 0 0 16px rgba(0, 229, 255, 0.14)',
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                    maxWidth: '96vw',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                }}
            >
                <button
                    onClick={() => {
                        if (settings.sfxEnabled !== false) playClick();
                        setHudCollapsed((v) => !v);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#00E5FF',
                        fontSize: '10px',
                        fontWeight: 900,
                        letterSpacing: '0.12em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 4px',
                        fontFamily: 'inherit',
                    }}
                    title="Collapse or expand MIKA Engine status bar"
                >
                    <span style={{ color: '#39FF14', textShadow: '0 0 8px #39FF14' }}>●</span>
                    <span>▸ MIKA_ENGINE</span>
                    <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.45)' }}>v1.0.0</span>
                </button>

                {!hudCollapsed && (
                    <>
                        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '10px' }}>|</span>

                        {/* Active Provider Pill */}
                        <button
                            onClick={() => {
                                if (settings.sfxEnabled !== false) playClick();
                                setActiveModal('settings');
                            }}
                            style={{
                                background: 'rgba(0, 229, 255, 0.08)',
                                border: '1px solid rgba(0, 229, 255, 0.28)',
                                borderRadius: '999px',
                                padding: '2px 8px',
                                fontSize: '8.5px',
                                fontWeight: 800,
                                color: '#EBE3D6',
                                letterSpacing: '0.06em',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                            }}
                            title="Configure LLM Provider & API Endpoint"
                        >
                            <span style={{ color: '#00E5FF' }}>{activeProvider.shortName}</span>
                            <span style={{ color: 'rgba(255,255,255,0.45)' }}>/</span>
                            <span style={{ color: '#39FF14', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {activeModel}
                            </span>
                        </button>

                        {/* Stage vs Overlay Mode Toggle */}
                        <button
                            onClick={toggleStageMode}
                            style={{
                                background: isOverlay ? 'rgba(57, 255, 20, 0.14)' : 'rgba(181, 51, 255, 0.14)',
                                border: `1px solid ${isOverlay ? 'rgba(57, 255, 20, 0.45)' : 'rgba(181, 51, 255, 0.45)'}`,
                                borderRadius: '6px',
                                padding: '3px 7px',
                                fontSize: '8.5px',
                                fontWeight: 900,
                                color: isOverlay ? '#39FF14' : '#E0AAFF',
                                letterSpacing: '0.08em',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                            title="Toggle between Transparent Desktop Overlay and Cyber-Stage Window"
                        >
                            {isOverlay ? '◈ OVERLAY' : '▣ STAGE'}
                        </button>

                        {/* Quick ASK Button */}
                        <button
                            onClick={() => {
                                if (settings.sfxEnabled !== false) playClick();
                                mikaRef.current?.ask?.();
                            }}
                            style={{
                                background: 'rgba(57, 255, 20, 0.12)',
                                border: '1px solid rgba(57, 255, 20, 0.45)',
                                borderRadius: '6px',
                                padding: '3px 7px',
                                fontSize: '8.5px',
                                fontWeight: 900,
                                color: '#39FF14',
                                letterSpacing: '0.08em',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            ⚡ ASK
                        </button>

                        {/* Quick SETTINGS Button */}
                        <button
                            onClick={() => {
                                if (settings.sfxEnabled !== false) playClick();
                                setActiveModal('settings');
                            }}
                            style={{
                                background: 'rgba(0, 229, 255, 0.14)',
                                border: '1px solid rgba(0, 229, 255, 0.5)',
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '8.5px',
                                fontWeight: 900,
                                color: '#00E5FF',
                                letterSpacing: '0.08em',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            ⚙ SETTINGS
                        </button>
                    </>
                )}
            </div>

            {/* ── THE AUTONOMOUS MIKA CHIBI PROXY ── */}
            <MikaProxy
                mikaBridgeRef={mikaRef}
                settings={settings}
                avatarStyle={settings.avatarStyle || 'vector_pixel'}
                scale={Number(settings.scale) || 1}
                roamEnabled={settings.roamEnabled !== false}
                onPoke={handlePoke}
                onOpenSettings={() => {
                    if (settings.sfxEnabled !== false) playClick();
                    setActiveModal('settings');
                }}
                onOpenMsgs={() => {
                    if (settings.sfxEnabled !== false) playClick();
                    setActiveModal('msgs');
                }}
                onOpenDossier={() => {
                    if (settings.sfxEnabled !== false) playClick();
                    setActiveModal('dossier');
                }}
                onLogMessage={appendLogEntry}
            />

            {/* ── MESSAGE LOG MODAL (MSGS RADIAL NODE) ── */}
            {activeModal === 'msgs' && (
                <div
                    data-mika-interactive="true"
                    className="modal-overlay"
                    onClick={() => setActiveModal(null)}
                >
                    <div
                        className="modal-content cyber-border"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '540px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 213, 79, 0.3)' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.14em', color: '#FFD54F', textShadow: '0 0 10px rgba(255, 213, 79, 0.35)' }}>
                                    ▸ MIKA_PROXY // MESSAGE_ARCHIVE_TTY
                                </div>
                                <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                    Recent speech bubbles, user prompts, and neural uplink transmissions ({msgLog.length} packets)
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {msgLog.length > 0 && (
                                    <button
                                        className="deck-btn"
                                        style={{ padding: '4px 8px', fontSize: '9px' }}
                                        onClick={() => setMsgLog([])}
                                    >
                                        CLEAR_LOG
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveModal(null)}
                                    style={{
                                        background: 'rgba(255, 16, 122, 0.14)',
                                        border: '1px solid rgba(255, 16, 122, 0.45)',
                                        borderRadius: '6px',
                                        color: '#FF107A',
                                        fontWeight: 900,
                                        fontSize: '11px',
                                        padding: '4px 10px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    ✕ ESC
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                            {msgLog.length === 0 ? (
                                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '10.5px', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '8px' }}>
                                    [ NO_TTY_PACKETS_RECORDED_YET // POKE_OR_ASK_MIKA ]
                                </div>
                            ) : (
                                [...msgLog].reverse().map((entry) => (
                                    <div
                                        key={entry.id}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: '6px',
                                            background: 'rgba(10, 14, 22, 0.78)',
                                            border: '1px solid rgba(0, 229, 255, 0.2)',
                                            borderLeft: `3px solid ${entry.category === 'ASK' ? '#39FF14' : entry.category === 'BITE' ? '#FF3355' : '#00E5FF'}`,
                                            fontSize: '10.5px',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: '4px', letterSpacing: '0.08em' }}>
                                            <span style={{ color: '#00E5FF' }}>[{entry.category || 'TTY'}]</span>
                                            <span>{entry.ts}</span>
                                        </div>
                                        <div style={{ color: '#EBE3D6' }}>{entry.text}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── SYSTEM DOSSIER MODAL (DOSSIER RADIAL NODE) ── */}
            {activeModal === 'dossier' && (
                <div
                    data-mika-interactive="true"
                    className="modal-overlay"
                    onClick={() => setActiveModal(null)}
                >
                    <div
                        className="modal-content cyber-border"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '520px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(181, 51, 255, 0.35)' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.14em', color: '#E0AAFF', textShadow: '0 0 10px rgba(181, 51, 255, 0.45)' }}>
                                    ▸ MIKA_ENGINE // FAMILIAR_DOSSIER_v1.0.0
                                </div>
                                <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                    Autonomous Cyber-Familiar Telemetry & Direct Action Overrides
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveModal(null)}
                                style={{
                                    background: 'rgba(255, 16, 122, 0.14)',
                                    border: '1px solid rgba(255, 16, 122, 0.45)',
                                    borderRadius: '6px',
                                    color: '#FF107A',
                                    fontWeight: 900,
                                    fontSize: '11px',
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                ✕ ESC
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginBottom: '14px' }}>
                            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                                <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>DESIGNATION</span>
                                <span style={{ fontSize: '11px', color: '#00E5FF', fontWeight: 900 }}>MIKA // CHIBI_PROXY</span>
                            </div>
                            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                                <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>ACTIVE_UPLINK</span>
                                <span style={{ fontSize: '11px', color: '#39FF14', fontWeight: 900 }}>{activeProvider.shortName}</span>
                            </div>
                            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                                <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>CHASSIS_RENDERER</span>
                                <span style={{ fontSize: '11px', color: '#FF107A', fontWeight: 900 }}>
                                    {settings.avatarStyle === 'retro_pixel' ? '24x24 RETRO_PIXEL' : 'VECTOR_RGB_NEON'}
                                </span>
                            </div>
                            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                                <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>STAGE_TOPOLOGY</span>
                                <span style={{ fontSize: '11px', color: '#FFD54F', fontWeight: 900 }}>
                                    {isOverlay ? 'TRANSPARENT_OVERLAY' : 'CYBER_STAGE_WINDOW'}
                                </span>
                            </div>
                        </div>

                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#00E5FF', letterSpacing: '0.1em', marginBottom: '8px' }}>
                            ▸ DIRECT_CHASSIS_OVERRIDES
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginBottom: '12px' }}>
                            <button
                                className="deck-btn"
                                onClick={() => {
                                    setActiveModal(null);
                                    mikaRef.current?.pilotSpaceship?.();
                                }}
                            >
                                🚀 LAUNCH_STARFIGHTER
                            </button>
                            <button
                                className="deck-btn"
                                onClick={() => {
                                    setActiveModal(null);
                                    mikaRef.current?.openHackerTerminal?.();
                                }}
                            >
                                💻 HOLO_HACKER_TTY
                            </button>
                            <button
                                className="deck-btn"
                                onClick={() => {
                                    setActiveModal(null);
                                    mikaRef.current?.dropFromCeiling?.();
                                }}
                            >
                                ☄ CEILING_DROP
                            </button>
                            <button
                                className="deck-btn"
                                onClick={() => {
                                    setActiveModal('settings');
                                }}
                            >
                                ⚙ NEURAL_SETTINGS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SETTINGS MODAL (SETTINGS RADIAL NODE) ── */}
            {activeModal === 'settings' && (
                <div data-mika-interactive="true">
                    <MikaSettingsModal
                        settings={settings}
                        onUpdateSettings={handleUpdateSettings}
                        onSay={(text, opts) => mikaRef.current?.say?.(text, opts)}
                        onShowToast={(msg, type) => setToast({ message: msg, type: type || 'info' })}
                        onClose={() => setActiveModal(null)}
                    />
                </div>
            )}

            {/* ── TERMINAL TOAST ── */}
            {toast && (
                <TerminalToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default App;
