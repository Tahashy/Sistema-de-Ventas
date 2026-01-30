
import React, { useState } from 'react';

const ModalAgregados = ({ producto, onClose, onConfirmar }) => {
  const [agregadosSeleccionados, setAgregadosSeleccionados] = useState([]);

  const toggleAgregado = (agregado) => {
    const existe = agregadosSeleccionados.find(a => a.id === agregado.id);
    if (existe) {
      setAgregadosSeleccionados(agregadosSeleccionados.filter(a => a.id !== agregado.id));
    } else {
      setAgregadosSeleccionados([...agregadosSeleccionados, agregado]);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        maxWidth: '400px', width: '100%', padding: '24px'
      }}>
        <h3 style={{
          margin: '0 0 16px 0', fontSize: '20px',
          fontWeight: '700', color: '#1a202c'
        }}>
          Agregados para {producto.nombre}
        </h3>

        <div style={{ marginBottom: '20px' }}>
          {producto.agregados.map(agregado => (
            <label
              key={agregado.id}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px', marginBottom: '8px',
                border: '2px solid #e2e8f0', borderRadius: '10px',
                cursor: 'pointer', transition: 'all 0.2s',
                background: agregadosSeleccionados.find(a => a.id === agregado.id) ? '#fff5f0' : 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!agregadosSeleccionados.find(a => a.id === agregado.id)}
                  onChange={() => toggleAgregado(agregado)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {agregado.nombre}
                </span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#10B981' }}>
                +${parseFloat(agregado.precio).toFixed(2)}
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', background: 'white',
              border: '2px solid #e2e8f0', borderRadius: '10px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(agregadosSeleccionados)}
            style={{
              flex: 1, padding: '12px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Agregar ({agregadosSeleccionados.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAgregados;