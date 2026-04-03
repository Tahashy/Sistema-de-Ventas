import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

const ConfirmationModal = ({ 
    isOpen, onClose, onConfirm, title, message, 
    type = 'danger', confirmText = 'Confirmar', cancelText = 'Cancelar',
    showInput = false, inputPlaceholder = "Escribe el motivo aquí...",
    requiredInput = false
}) => {
    const [inputValue, setInputValue] = React.useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (requiredInput && !inputValue.trim()) return;
        onConfirm(inputValue);
        setInputValue(''); // Reset for next time
        onClose();
    };

    const colors = type === 'danger' ? {
        bgIcon: '#FEE2E2',
        colorIcon: '#DC2626',
        btnBg: '#DC2626',
        btnHover: '#B91C1C'
    } : {
        bgIcon: '#FEF3C7',
        colorIcon: '#D97706',
        btnBg: '#D97706',
        btnHover: '#B45309'
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                animation: 'scaleIn 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '48px', height: '48px',
                    borderRadius: '50%',
                    backgroundColor: colors.bgIcon,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px'
                }}>
                    <AlertTriangle size={24} color={colors.colorIcon} />
                </div>

                <h3 style={{
                    fontSize: '18px', fontWeight: '700', color: '#111827',
                    margin: '0 0 8px 0'
                }}>
                    {title}
                </h3>

                <p style={{
                    fontSize: '14px', color: '#6B7280',
                    margin: '0 0 20px 0', lineHeight: '1.5'
                }}>
                    {message}
                </p>

                {showInput && (
                    <div style={{ width: '100%', marginBottom: '24px' }}>
                        <textarea
                            autoFocus
                            placeholder={inputPlaceholder}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid #D1D5DB',
                                outline: 'none',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'none',
                                transition: 'all 0.2s',
                                focus: 'border-color: #D97706'
                            }}
                        />
                        {requiredInput && !inputValue.trim() && (
                            <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px', textAlign: 'left' }}>
                                * El motivo es obligatorio
                            </p>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button
                        onClick={() => { setInputValue(''); onClose(); }}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            backgroundColor: 'white',
                            border: '1px solid #D1D5DB',
                            borderRadius: '10px',
                            color: '#374151',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <X size={16} />
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={requiredInput && !inputValue.trim()}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            backgroundColor: requiredInput && !inputValue.trim() ? '#E5E7EB' : colors.btnBg,
                            border: 'none',
                            borderRadius: '10px',
                            color: requiredInput && !inputValue.trim() ? '#9CA3AF' : 'white',
                            fontWeight: '600',
                            cursor: requiredInput && !inputValue.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Check size={16} />
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
