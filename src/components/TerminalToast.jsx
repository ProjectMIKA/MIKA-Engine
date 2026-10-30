import React, { useState, useEffect } from 'react';

export const TerminalToast = ({ message, onComplete }) => {
    const [typedText, setTypedText] = useState('');
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        if (!message) return;
        let i = 0;
        setTypedText('');
        setIsFading(false);
        const intv = setInterval(() => {
            i += 1;
            setTypedText(message.substring(0, i));
            if (i >= message.length) clearInterval(intv);
        }, 15);

        const fadeTimeout = setTimeout(() => {
            setIsFading(true);
        }, 2500);
        const completeTimeout = setTimeout(() => {
            if (onComplete) onComplete();
        }, 3000);

        return () => {
            clearInterval(intv);
            clearTimeout(fadeTimeout);
            clearTimeout(completeTimeout);
        };
    }, [message, onComplete]);

    if (!message) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                left: 0,
                right: 0,
                zIndex: 99999,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    transform: 'translateZ(0)',
                    background: 'rgba(5, 3, 8, 0.92)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    borderRadius: '4px',
                    padding: '10px 18px',
                    color: '#00E5FF',
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                    fontSize: '11px',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 15px rgba(0,229,255,0.2), inset 0 0 10px rgba(0,229,255,0.1)',
                    animation: isFading ? 'gfPhaseOut 0.5s ease forwards' : 'gfPhaseIn 0.3s ease forwards',
                    whiteSpace: 'nowrap',
                }}
            >
                <span style={{ color: '#FF107A', animation: 'csd-pulse 1s infinite' }}>&gt;</span>
                <span>
                    {typedText}
                    {typedText.length < message.length ? (
                        <span style={{ animation: 'cursorBlink 0.5s infinite' }}>_</span>
                    ) : (
                        ''
                    )}
                </span>
            </div>
        </div>
    );
};

export default TerminalToast;
