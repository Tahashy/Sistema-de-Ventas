// src/modules/pedidos/components/PedidoRow.jsx

import React from 'react';
import { Edit, CheckCircle, XCircle, Trash2, Utensils, Package, Truck, ShoppingBag, Printer, MoreVertical, Ban, AlertCircle } from 'lucide-react';
import ContadorTiempo from './ContadorTiempo';
import { getEstadoColor } from '../utils/pedidoHelpers';
import DropdownButton from './DropdownButton';

const tdStyle = {
  padding: '16px',
  fontSize: '14px',
  color: '#4a5568'
};

const PedidoRow = ({ pedido, onCambiarEstado, onVerDetalle, onEliminar, onTogglePago, isAdmin, now }) => {
  const estadoNormalizado = pedido.estado ? pedido.estado.toLowerCase() : '';
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'mesa': return <Utensils size={16} />;
      case 'llevar': return <Package size={16} />;
      case 'delivery': return <Truck size={16} />;
      default: return <ShoppingBag size={16} />;
    }
  };

  return (
    <tr
      onClick={() => onVerDetalle(pedido)}
      style={{
        borderBottom: '1px solid #f7fafc',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = '#f7fafc'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <td style={tdStyle}>
        <span style={{ fontWeight: '700', color: '#1a202c' }}>
          #{pedido.numero_pedido}
        </span>
      </td>
      <td style={tdStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: '#f7fafc',
          borderRadius: '6px',
          width: 'fit-content'
        }}>
          {getTipoIcon(pedido.tipo)}
          <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>
            {pedido.tipo}
          </span>
        </div>
      </td>
      <td style={tdStyle}>
        {pedido.tipo === 'mesa' ? pedido.numero_mesa : pedido.cliente_nombre || '-'}
      </td>
      <td style={tdStyle}>
        <span style={{
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          background: '#Edf2f7',
          color: '#4a5568',
          display: 'inline-block'
        }}>
          {pedido.metodo_pago}
        </span>
      </td>
      <td style={tdStyle}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePago(pedido.id, pedido.pagado);
          }}
          title={pedido.pagado ? "Marcar como No Pagado" : "Marcar como Pagado"}
          style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer',
            background: pedido.pagado ? '#DEF7EC' : '#FDE8E8',
            color: pedido.pagado ? '#03543F' : '#9B1C1C',
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          {pedido.pagado ? (
            <><CheckCircle size={12} /> PAGADO</>
          ) : (
            <><AlertCircle size={12} /> PENDIENTE</>
          )}
        </button>
      </td>

      <td style={tdStyle}>
        <span style={{ fontWeight: '700', color: '#FF6B35', fontSize: '16px' }}>
          ${parseFloat(pedido.total).toFixed(2)}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          background: getEstadoColor(pedido.estado) + '20',
          color: getEstadoColor(pedido.estado),
          textTransform: 'capitalize'
        }}>
          {pedido.estado}
        </span>
      </td>
      <td style={tdStyle}>
        <ContadorTiempo
          fechaCreacion={pedido.created_at}
          tiempoFinal={pedido.tiempo_preparacion}
          estado={pedido.estado}
          now={now}
        />
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          {/* Menú de Acciones (Anular / Eliminar) */}
          {/* Acciones Rápidas */}
          {estadoNormalizado !== 'entregado' && estadoNormalizado !== 'anulado' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCambiarEstado(pedido.id, 'anulado');
              }}
              title="Anular Pedido"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: '#FEF2F2',
                color: '#EF4444',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
            >
              <Ban size={18} />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEliminar(pedido.id);
              }}
              title="Eliminar Pedido"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: '#FEF2F2',
                color: '#DC2626',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FECACA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};


export default PedidoRow;