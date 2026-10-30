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
        if (!raw) return { ...DEFAULT_LLM_SETTINGS, stageMode: 'overlay' };
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT_LLM_SETTINGS,
            ...parsed,
            stageMode: 'overlay',
            providerConfigs: {
                ...DEFAULT_LLM_SETTINGS.providerConfigs,
                ...(parsed.providerConfigs || {}),
            },
        };
    } catch {
        return { ...DEFAULT_LLM_SETTINGS, stageMode: 'overlay' };
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
    const [activeModal, setActiveModal] = useState(null); // 'settings' | null
    const [memoryPopup, setMemoryPopup] = useState(null); // GachaSwipe openMemoryPopup: { title, subtitle, lines }
    const [toast, setToast] = useState(null);
    const mikaRef = useRef({});

    const activeProvider = getProviderPreset(settings.provider);
    const activeModel = settings.model || activeProvider.defaultModel || 'local-quips';

    // Save settings to localStorage & sync desktop Electron window state
    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // ignore storage quota errors
        }
        document.documentElement.classList.add('mika-overlay-mode');
        document.body.classList.add('mika-overlay-mode');

        if (typeof window !== 'undefined' && window.mikaDesktop) {
            window.mikaDesktop.setStageMode?.('overlay');
            window.mikaDesktop.setAlwaysOnTop?.(settings.alwaysOnTop !== false);
        }
    }, [settings]);

    // Save message log
    useEffect(() => {
        try {
            localStorage.setItem(MSG_LOG_STORAGE_KEY, JSON.stringify(msgLog.slice(-80)));
        } catch {
            // ignore
        }
    }, [msgLog]);

    // Electron Desktop Overlay Click-Through Hit-Testing (renderer fallback alongside main-process cursor poll)
    useEffect(() => {
        if (typeof window === 'undefined' || !window.mikaDesktop?.setIgnoreMouseEvents) return undefined;

        if (activeModal || memoryPopup) {
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
    }, [activeModal, memoryPopup]);

    // Listen for system tray / IPC commands from Electron main process
    useEffect(() => {
        if (typeof window === 'undefined' || !window.mikaDesktop?.onCommand) return undefined;
        return window.mikaDesktop.onCommand((cmd) => {
            if (cmd === 'open-settings') setActiveModal('settings');
            else if (cmd === 'open-ask') mikaRef.current?.ask?.();
            else if (cmd === 'summon-center') {
                mikaRef.current?.dropFromCeiling?.();
            }
        });
    }, []);

    // Optional LLM-driven ambient thoughts
    useEffect(() => {
        if (!settings.llmAmbient || !settings.roamEnabled) return undefined;
        const intervalSec = settings.roamCadence === 'chatty' ? 30 : settings.roamCadence === 'quiet' ? 75 : 48;
        const timer = setInterval(async () => {
            if (document.hidden || activeModal || memoryPopup) return;
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
    }, [settings, activeModal, memoryPopup]);

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
            stageMode: 'overlay',
        }));
    }, []);

    const handlePoke = () => {
        if (settings.sfxEnabled !== false) playClick();
        const line = pickMikaQuip('poked', { name: settings.userTitle || 'Master' });
        mikaRef.current?.say?.(line, { tone: 'warn', ms: 5200 });
    };

    const handleOpenLogs = () => {
        if (settings.sfxEnabled !== false) playClick();
        setMemoryPopup({
            title: 'SYSTEM_AUDIT_LOG',
            subtitle: `ENGINE_v1.1.1 // ${activeProvider.shortName.toUpperCase()}`,
            lines: [
                `[AVATAR_OVERLAY] ACTIVE // 100% Transparent Always-On-Top`,
                `[NEURAL_GATEWAY] ${activeProvider.label}`,
                `[TARGET_MODEL_ID] ${activeModel}`,
                `[CHASSIS_ENGINE] ${(settings.avatarStyle || 'vector_pixel').toUpperCase()} (${settings.scale || 1}x)`,
                `[ROAM_AUTONOMY] ${settings.roamEnabled !== false ? 'ENABLED' : 'LOCKED'} // CADENCE: ${(settings.roamCadence || 'balanced').toUpperCase()}`,
            ],
        });
    };

    const handleOpenMsgs = () => {
        if (settings.sfxEnabled !== false) playClick();
        const recent = [...msgLog].slice(-8).reverse();
        setMemoryPopup({
            title: 'TTY_MESSAGE_BUFFER',
            subtitle: `${msgLog.length} PACKETS RECORDED`,
            lines: recent.length > 0
                ? recent.map((m) => `[${m.ts} // ${m.category || 'TTY'}] ${m.text}`)
                : [
                    '[BUFFER_EMPTY] No recent transmissions recorded yet.',
                    'Tap ASK on MIKA\'s radial ring to open the neural relay terminal.',
                ],
        });
    };

    const handleOpenDossier = () => {
        if (settings.sfxEnabled !== false) playClick();
        setMemoryPopup({
            title: 'FAMILIAR_DOSSIER',
            subtitle: `DESIGNATION: M.I.K.A. // USER: ${(settings.userTitle || 'Master').toUpperCase()}`,
            lines: [
                'CLASS: Autonomous Cyber-Catgirl Avatar Overlay Familiar',
                'DOCTRINE: Mouthless Silent Chibi — all emotion expressed via eyes & physics',
                'CAPABILITIES: 8-Way Roaming, Wall-Scratching, Cat-Loaf Naps, RGB Starfighter, Hacker TTY',
                `ACTIVE UPLINK: ${activeProvider.shortName} -> ${activeModel}`,
            ],
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                background: 'transparent',
                pointerEvents: 'none',
                userSelect: 'none',
            }}
        >
            {/* ── THE AUTONOMOUS MIKA CHIBI PROXY (100% Transparent Always-On-Top Overlay) ── */}
            <MikaProxy
                mikaBridgeRef={mikaRef}
                settings={settings}
                avatarStyle={settings.avatarStyle || 'vector_pixel'}
                scale={Number(settings.scale) || 1}
                roamEnabled={settings.roamEnabled !== false}
                externalModalOpen={Boolean(activeModal || memoryPopup)}
                onPoke={handlePoke}
                onOpenLogs={handleOpenLogs}
                onOpenMsgs={handleOpenMsgs}
                onOpenDossier={handleOpenDossier}
                onOpenSettings={() => {
                    if (settings.sfxEnabled !== false) playClick();
                    setActiveModal('settings');
                }}
                onLogMessage={appendLogEntry}
            />

            {/* ── EXACT GACHASWIPE NEURAL_DATA_EXTRACTED POPUP (LOGS / MSGS / DOSSIER) ── */}
            {memoryPopup && (
                <div
                    data-mika-interactive="true"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9900,
                        background: 'rgba(5, 3, 8, 0.45)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        pointerEvents: 'auto',
                    }}
                >
                    <div
                        data-mika-interactive="true"
                        style={{
                            width: 'min(340px, 92vw)',
                            background: 'linear-gradient(160deg, rgba(16, 12, 28, 0.88) 0%, rgba(8, 5, 16, 0.94) 100%)',
                            backdropFilter: 'blur(18px) saturate(150%)',
                            WebkitBackdropFilter: 'blur(18px) saturate(150%)',
                            border: '1px solid rgba(0, 229, 255, 0.45)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.35)',
                            borderRadius: '14px',
                            padding: '18px 16px 14px 16px',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 28px rgba(0, 229, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            fontFamily: 'monospace',
                            animation: 'memoryPopupFade 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '6px' }}>
                            <span style={{ fontSize: '10px', color: '#00E5FF', fontWeight: 'bold', letterSpacing: '0.12em' }}>
                                &gt; NEURAL_DATA_EXTRACTED
                            </span>
                            <span style={{ fontSize: '10px', color: '#FF107A', fontWeight: 'bold' }}>[MEM_OK]</span>
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFD54F', marginBottom: '2px', letterSpacing: '0.04em' }}>
                            {memoryPopup.title}
                        </div>
                        {memoryPopup.subtitle && (
                            <div style={{ fontSize: '10px', color: 'rgba(0, 229, 255, 0.75)', marginBottom: '10px' }}>
                                // {memoryPopup.subtitle}
                            </div>
                        )}

                        <div
                            className="mika-scroll"
                            style={{
                                maxHeight: '220px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                marginBottom: '14px',
                            }}
                        >
                            {(memoryPopup.lines || []).map((line, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        fontSize: '11px',
                                        color: 'rgba(255, 255, 255, 0.92)',
                                        lineHeight: '1.45',
                                        padding: '7px 9px',
                                        background: 'rgba(0, 229, 255, 0.04)',
                                        border: '1px solid rgba(0, 229, 255, 0.16)',
                                        borderLeft: '2.5px solid #00E5FF',
                                        borderRadius: '4px',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {line}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {memoryPopup.title === 'TTY_MESSAGE_BUFFER' && msgLog.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMsgLog([]);
                                        setMemoryPopup(null);
                                        setToast({ message: '[ TTY_BUFFER_PURGED ]', type: 'info' });
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        background: 'rgba(255, 16, 122, 0.12)',
                                        border: '1px solid rgba(255, 16, 122, 0.45)',
                                        borderRadius: '8px',
                                        color: '#FF107A',
                                        fontFamily: 'monospace',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    [PURGE_LOG]
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setMemoryPopup(null)}
                                style={{
                                    flex: 2,
                                    padding: '8px',
                                    background: 'rgba(0, 229, 255, 0.14)',
                                    border: '1px solid rgba(0, 229, 255, 0.45)',
                                    borderRadius: '8px',
                                    color: '#00E5FF',
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    letterSpacing: '0.1em',
                                }}
                            >
                                [ACKNOWLEDGE]
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DIRECTOR_SETTINGS MODAL (SETTINGS RADIAL NODE) ── */}
            {activeModal === 'settings' && (
                <div data-mika-interactive="true" style={{ pointerEvents: 'auto' }}>
                    <MikaSettingsModal
                        settings={settings}
                        onUpdateSettings={handleUpdateSettings}
                        onSay={(text, opts) => mikaRef.current?.say?.(text, opts)}
                        onShowToast={(msg, type) => setToast({ message: msg, type: type || 'info' })}
                        mikaBridgeRef={mikaRef}
                        onClose={() => setActiveModal(null)}
                        appVersion="1.1.1"
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
