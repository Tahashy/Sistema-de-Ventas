// src/modules/pedidos/components/DropdownButton.jsx

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const DropdownButton = ({
    label,
    icon: Icon,
    options,
    onSelect,
    variant = 'primary',
    disabled = false
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
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                    color: 'white',
                    border: 'none'
                };
            case 'secondary':
                return {
                    background: 'white',
                    color: '#4a5568',
                    border: '2px solid #e2e8f0'
                };
            case 'success':
                return {
                    background: '#10B981',
                    color: 'white',
                    border: 'none'
                };
            default:
                return {
                    background: 'white',
                    color: '#4a5568',
                    border: '2px solid #e2e8f0'
                };
        }
    };

    const variantStyles = getVariantStyles();

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                style={{
                    padding: '10px 16px',
                    ...variantStyles,
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    opacity: disabled ? 0.5 : 1,
                    boxShadow: variant === 'primary' ? '0 4px 12px rgba(255,107,53,0.3)' : 'none'
                }}
            >
                {Icon && <Icon size={18} />}
                <span>{label}</span>
                <ChevronDown
                    size={16}
                    style={{
                        transition: 'transform 0.2s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0, // Align right to prevent overflow
                    left: 'auto',
                    background: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    zIndex: 1000,
                    minWidth: '200px',
                    width: 'max-content',
                    maxWidth: '90vw', // Prevent wider than screen
                    animation: 'slideDown 0.2s ease-out'
                }}>
                    <style>{`
                        @keyframes slideDown {
                            from {
                                opacity: 0;
                                transform: translateY(-10px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}</style>
                    {options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                onSelect(option.value);
                                setIsOpen(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                background: 'white',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '14px',
                                color: '#4a5568',
                                transition: 'background 0.2s',
                                borderBottom: index < options.length - 1 ? '1px solid #f7fafc' : 'none'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f7fafc'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                            {option.icon && <option.icon size={18} color={option.color || '#4a5568'} />}
                            <span style={{ fontWeight: '500' }}>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropdownButton;
