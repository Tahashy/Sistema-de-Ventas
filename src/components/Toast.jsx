import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

let showToastFunction = null;
let toastCounter = 0;

export const showToast = (message, type = 'success') => {
  if (showToastFunction) {
    showToastFunction(message, type);
  }
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    showToastFunction = (message, type) => {
      const id = `${Date.now()}-${toastCounter++}`;
      setToasts(prev => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    return () => {
      showToastFunction = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      case 'info': return <Info size={20} />;
      default: return <Info size={20} />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success': return { bg: '#10B981', border: '#059669' };
      case 'error': return { bg: '#EF4444', border: '#DC2626' };
      case 'info': return { bg: '#3B82F6', border: '#2563EB' };
      default: return { bg: '#6B7280', border: '#4B5563' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {toasts.map(toast => {
        const colors = getColors(toast.type);
        return (
          <div
            key={toast.id}
            style={{
              background: colors.bg,
              color: 'white',
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '320px',
              maxWidth: '500px',
              animation: 'slideIn 0.3s ease-out',
              border: `2px solid ${colors.border}`
            }}
          >
            {getIcon(toast.type)}
            <p style={{
              margin: 0,
              flex: 1,
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;