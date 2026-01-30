import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
    if (!isOpen) return null;

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
                maxWidth: '400px',
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
                    margin: '0 0 24px 0', lineHeight: '1.5'
                }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            backgroundColor: 'white',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
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
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            backgroundColor: colors.btnBg,
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
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
