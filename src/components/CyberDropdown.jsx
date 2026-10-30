import React, { useState, useRef, useEffect } from 'react';

/**
 * ✨ CYBER_DROPDOWN ✨
 * Futuristic in-app custom select menu replacing native browser/OS dropdowns.
 * Canonical MIKA Visual Language control.
 */
export const CyberDropdown = ({
    label,
    value,
    options = [],
    onChange,
    accentColor = '#00E5FF',
    placeholder = 'Select option...',
    style = {},
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optValue) => {
        if (onChange) onChange(optValue);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
            {label && (
                <label
                    style={{
                        display: 'block',
                        fontSize: '10px',
                        color: accentColor,
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                style={{
                    width: '100%',
                    background: '#0B0914',
                    border: isOpen ? `1px solid ${accentColor}` : `1px solid ${accentColor}40`,
                    borderRadius: '6px',
                    color: value ? '#E0E7FF' : 'rgba(255, 255, 255, 0.4)',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: isOpen ? `0 0 12px ${accentColor}40` : 'none',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                    {(() => {
                        const match = options.find((opt) => (typeof opt === 'object' ? opt.value : opt) === value);
                        if (match && typeof match === 'object') return match.label;
                        return value || placeholder;
                    })()}
                </span>
                <span
                    style={{
                        fontSize: '9px',
                        color: accentColor,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                    }}
                >
                    ▼
                </span>
            </button>

            {isOpen && (
                <div
                    className="mika-scroll"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        background: 'rgba(11, 9, 20, 0.98)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: `1px solid ${accentColor}`,
                        borderRadius: '8px',
                        boxShadow: `0 10px 30px rgba(0,0,0,0.9), 0 0 15px ${accentColor}30`,
                        maxHeight: '195px',
                        overflowY: 'auto',
                        padding: '4px',
                    }}
                >
                    {options.map((opt) => {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        const isSelected = optValue === value;

                        return (
                            <div
                                key={optValue}
                                onClick={() => handleSelect(optValue)}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                                    color: isSelected ? accentColor : '#E0E7FF',
                                    background: isSelected ? `${accentColor}18` : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'background 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = `${accentColor}10`;
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {optLabel}
                                </span>
                                {isSelected && (
                                    <span style={{ fontSize: '10px', color: '#00E5FF', fontWeight: 'bold', marginLeft: '6px' }}>
                                        ✓
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CyberDropdown;
