
import React, { useState } from 'react';
import { showToast } from '../../../components/Toast';

const ModalAgregados = ({ producto, onClose, onConfirmar }) => {
  const [agregadosSeleccionados, setAgregadosSeleccionados] = useState([]);

  const limite = producto.limite_agregados || 0;
  const totalSeleccionados = agregadosSeleccionados.reduce((sum, a) => sum + (a.cantidad || 1), 0);
  const reachedLimit = limite > 0 && totalSeleccionados >= limite;

  const agregarAgregado = (agregado) => {
    if (reachedLimit) {
      showToast(`Solo puedes elegir hasta ${limite} opciones para este producto.`, 'warning');
      return;
    }
    const existe = agregadosSeleccionados.find(a => a.id === agregado.id);
    if (existe) {
      setAgregadosSeleccionados(agregadosSeleccionados.map(a => 
        a.id === agregado.id ? { ...a, cantidad: (a.cantidad || 1) + 1 } : a
      ));
    } else {
      setAgregadosSeleccionados([...agregadosSeleccionados, { ...agregado, cantidad: 1 }]);
    }
  };

  const restarAgregado = (agregado, e) => {
    if (e) e.stopPropagation();
    const existe = agregadosSeleccionados.find(a => a.id === agregado.id);
    if (existe) {
      if ((existe.cantidad || 1) > 1) {
        setAgregadosSeleccionados(agregadosSeleccionados.map(a => 
          a.id === agregado.id ? { ...a, cantidad: a.cantidad - 1 } : a
        ));
      } else {
        setAgregadosSeleccionados(agregadosSeleccionados.filter(a => a.id !== agregado.id));
      }
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
          {limite > 0 && (
            <div style={{ 
              background: '#f8fafc', padding: '10px', borderRadius: '8px', 
              marginBottom: '16px', border: '1px solid #e2e8f0', textAlign: 'center' 
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#4a5568', fontWeight: '500' }}>
                Puedes elegir hasta <strong style={{ color: '#FF6B35' }}>{limite}</strong> {limite === 1 ? 'opción' : 'opciones'}. 
                ({totalSeleccionados} seleccionadas)
              </p>
            </div>
          )}
          {producto.agregados.map(agregado => {
            const itemSeleccionado = agregadosSeleccionados.find(a => a.id === agregado.id);
            const cantidadActual = itemSeleccionado ? itemSeleccionado.cantidad || 1 : 0;
            const isSelected = cantidadActual > 0;
            const isDisabled = reachedLimit;

            return (
              <div
                key={agregado.id}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px', marginBottom: '8px',
                  border: '2px solid #e2e8f0', borderRadius: '10px',
                  background: isSelected ? '#fff5f0' : 'white',
                  opacity: (isDisabled && !isSelected) ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                     {/* Counter UI replacing Checkbox */}
                     {isSelected ? (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', borderRadius: '20px', padding: '2px', border: '1px solid #e2e8f0' }}>
                         <button onClick={(e) => restarAgregado(agregado, e)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>-</button>
                         <span style={{ fontSize: '14px', fontWeight: 'bold', width: '16px', textAlign: 'center' }}>{cantidadActual}</span>
                         <button onClick={() => !isDisabled && agregarAgregado(agregado)} disabled={isDisabled} style={{ width: '24px', height: '24px', borderRadius: '50%', background: isDisabled ? '#f3f4f6' : '#FF6B35', color: isDisabled ? '#9ca3af' : 'white', border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                       </div>
                     ) : (
                       <button onClick={() => !isDisabled && agregarAgregado(agregado)} disabled={isDisabled} style={{ width: '28px', height: '28px', borderRadius: '50%', background: isDisabled ? '#f3f4f6' : '#FF6B35', color: isDisabled ? '#9ca3af' : 'white', border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                         +
                       </button>
                     )}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: isSelected ? '#166534' : '#1f2937' }}>
                    {agregado.nombre}
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#10B981' }}>
                  +${parseFloat(agregado.precio).toFixed(2)}
                </span>
              </div>
            );
          })}
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
            Agregar ({totalSeleccionados})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAgregados;