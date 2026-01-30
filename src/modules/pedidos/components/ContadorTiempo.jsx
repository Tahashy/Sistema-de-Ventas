// src/modules/pedidos/components/ContadorTiempo.jsx

import React from 'react';
import { Clock } from 'lucide-react';
import { parseSupabaseTimestamp, formatearTiempo, getColorTiempo } from '../utils/pedidoHelpers';

const ContadorTiempo = ({ fechaCreacion, tiempoFinal, estado, now }) => {
  if (!fechaCreacion) return null;

  const estadosFinalizados = ['listo', 'entregado', 'cancelado', 'anulado'];
  const estaFinalizado = estadosFinalizados.includes(estado);

  let minutos, segundos, tiempo, color;

  if (estaFinalizado && tiempoFinal !== null && tiempoFinal !== undefined) {
    minutos = Math.floor(tiempoFinal / 60);
    segundos = tiempoFinal % 60;
  } else {
    const inicio = parseSupabaseTimestamp(fechaCreacion).getTime();
    const diffMs = now - inicio;
    const diffSegundos = Math.max(0, Math.floor(diffMs / 1000));
    minutos = Math.floor(diffSegundos / 60);
    segundos = diffSegundos % 60;
  }

  tiempo = formatearTiempo(minutos, segundos);
  color = getColorTiempo(minutos);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      background: color + '20',
      color: color,
      opacity: estaFinalizado ? 0.8 : 1
    }}>
      <Clock size={14} />
      {tiempo}
      {estaFinalizado && ' ✓'}
    </span>
  );
};

export default ContadorTiempo;