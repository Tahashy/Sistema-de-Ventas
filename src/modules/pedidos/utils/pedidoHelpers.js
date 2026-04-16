
export const parseSupabaseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  return new Date(timestamp.replace(' ', 'T') + 'Z');
};

export const getEstadoColor = (estado) => {
  const colores = {
    pendiente: '#F59E0B',
    preparando: '#FF6B35',
    listo: '#10B981',
    entregado: '#6B7280',
    cancelado: '#EF4444'
  };
  return colores[estado] || '#6B7280';
};

export const getTipoIcon = (tipo) => {
  const iconMap = {
    mesa: 'Utensils',
    llevar: 'Package',
    delivery: 'Truck'
  };
  return iconMap[tipo] || 'ShoppingBag';
};

export const generarNumeroPedido = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `ORD-${timestamp}${random}`;
};

export const calcularTotales = (carrito, tapersAgregados = []) => {
  const subtotal = carrito.reduce((sum, item) => {
    const precioItem = item.precio * item.cantidad;
    const precioAgregados = item.agregados.reduce((s, a) => s + parseFloat(a.precio), 0) * item.cantidad;
    return sum + precioItem + precioAgregados;
  }, 0);

  const costoTaper = tapersAgregados.reduce((sum, t) => sum + parseFloat(t.precio), 0);
  const subtotalConTaper = subtotal + costoTaper;
  const iva = subtotalConTaper * 0.10;
  const total = subtotalConTaper + iva;

  return { subtotal, costoTaper, iva, total };
};

export const formatearTiempo = (minutos, segundos) => {
  return minutos >= 60
    ? '60:00+'
    : `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
};

export const getColorTiempo = (minutos) => {
  if (minutos < 20) return '#10B981';
  if (minutos < 30) return '#F59E0B';
  return '#EF4444';
};

export const formatearMoneda = (cantidad) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(cantidad || 0);
};

export const formatearFechaHora = (fecha) => {
  if (!fecha) return '-';

  // Si es un string de Supabase sin 'Z' ni offset, forzar UTC para que la conversión a Lima sea correcta
  let date;
  if (typeof fecha === 'string' && !fecha.includes('Z') && !fecha.includes('+')) {
    date = new Date(fecha.replace(' ', 'T') + 'Z');
  } else {
    date = new Date(fecha);
  }

  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Lima'
  }).format(date);
};

/**
 * Ajusta una fecha a formato ISO garantizando el rango de un día completo en Lima convertido a UTC
 */
export const obtenerRangoFechaLimaUTC = (fechaStr, esFin = false) => {
  // Construimos la fecha asumiendo que es Lima (UTC-5)
  // Simplificado: YYYY-MM-DD + T00:00:00-05:00
  const isoStr = `${fechaStr}T${esFin ? '23:59:59.999' : '00:00:00.000'}-05:00`;
  return new Date(isoStr).toISOString();
};

export const sanitizarNombreMesa = (nombre) => {
  if (!nombre) return '';
  if (typeof nombre !== 'string') return String(nombre);

  // Si por error se guardó como JSON stringificado {"numero_mesa":"..."}
  if (nombre.startsWith('{') && nombre.includes('numero_mesa')) {
    try {
      const parsed = JSON.parse(nombre);
      return parsed.numero_mesa || nombre;
    } catch (e) {
      return nombre;
    }
  }
  return nombre;
};

/**
 * Genera el enlace de WhatsApp con el mensaje preformateado del pedido.
 * @param {Object} pedido - Objeto completo del pedido
 * @param {Object} restaurante - Datos del restaurante
 * @returns {string|null} - URL completa o null si no hay teléfono
 */
export const generarResumenWhatsApp = (pedido, restaurante) => {
  console.log("🟢 v1.2 - Iniciando Generación de Resumen WhatsApp...");

  // 1. Limpieza de teléfono
  const rawTel = pedido.cliente_celular || pedido.telefono || '';
  if (!rawTel) return null;
  let tel = rawTel.replace(/[^0-9]/g, '');
  if (tel.length === 9) tel = '51' + tel;

  // 2. INYECCIÓN DINÁMICA ES6 (Sintaxis ultra-segura \u{xxxx})
  // Esta técnica es 'en caliente' y evita rombos por codificación de archivo
  const E = {
    ROCKET:   '\u{1F680}', STORE:    '\u{1F3EA}', CAL:      '\u{1F4C5}',
    USER:     '\u{1F464}', PIN:      '\u{1F4CC}', CHAT:     '\u{1F4AC}',
    CART:     '\u{1F6D2}', ITEM:     '\u{1F538}', MONEY:    '\u{1F4B5}',
    FIRE:     '\u{1F525}', TAG:      '\u{1F3F7}', BELL:     '\u{1F6CE}',
    BOX:      '\u{1F4E6}', HAND:     '\u{1F91D}', CARD:     '\u{1F4B3}',
    HANDS:    '\u{1F64C}', MEMO:     '\u{1F4DD}'
  };

  const fmt = (d) => {
    const f = d ? new Date(d) : new Date();
    return `${f.toLocaleDateString()} ${f.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // 3. Bloque de Items
  const itemsText = (pedido.pedido_items || []).map(it => {
    let raw = `${E.ITEM} *${it.cantidad}x ${it.producto_nombre || it.nombre}*`;
    if (it.agregados?.length > 0) raw += '\n' + it.agregados.map(a => `   └ + ${a.nombre}`).join('\n');
    if (it.notas) raw += `\n   ${E.MEMO} ${it.notas}`;
    raw += `\n   ${E.MONEY} ${formatearMoneda(parseFloat(it.subtotal || it.precio * it.cantidad))}`;
    return raw;
  }).join('\n\n');

  // 4. Bloque de Extras
  let extras = '';
  if (parseFloat(pedido.costo_taper) > 0) extras += `\n${E.BOX} Tapers: +${formatearMoneda(pedido.costo_taper)}`;
  if (parseFloat(pedido.iva) > 0) extras += `\n${E.MONEY} IGV/IVA: +${formatearMoneda(pedido.iva)}`;
  if (parseFloat(pedido.descuento) > 0) extras += `\n${E.TAG} Desc: -${formatearMoneda(pedido.descuento)}`;
  if (parseFloat(pedido.cargo_servicio) > 0) extras += `\n${E.BELL} Serv: +${formatearMoneda(pedido.cargo_servicio)}`;
  if (parseFloat(pedido.cargo_embalaje) > 0) extras += `\n${E.BOX} Emb: +${formatearMoneda(pedido.cargo_embalaje)}`;
  if (parseFloat(pedido.propina) > 0) extras += `\n${E.HAND} Propina: +${formatearMoneda(pedido.propina)}`;

  // 5. Cuerpo del Mensaje
  const body = 
    `${E.ROCKET} *NUEVO PEDIDO: #${pedido.numero_pedido}* ${E.ROCKET}\n` +
    `--------------------------------\n` +
    `${E.STORE} *${restaurante.nombre || 'Restaurante'}*\n` +
    `${E.CAL} ${fmt(pedido.created_at || pedido.fecha)}\n\n` +
    `${E.USER} *CLIENTE*\n` +
    `*Nombre:* ${pedido.cliente_nombre || 'General'}\n` +
    (pedido.direccion_delivery ? `${E.PIN} *Dir:* ${pedido.direccion_delivery}\n` : '') +
    (pedido.notas ? `${E.CHAT} *Nota:* ${pedido.notas}\n` : '') +
    `\n${E.CART} *DETALLE*\n` +
    `--------------------------------\n` +
    `${itemsText}\n` +
    `--------------------------------\n` +
    `${E.MONEY} *IMPORTE*\n` +
    `Subtotal: ${formatearMoneda(pedido.subtotal || 0)}` +
    `${extras}\n\n` +
    `${E.FIRE} *TOTAL: ${formatearMoneda(pedido.total || 0)}* ${E.FIRE}\n` +
    `--------------------------------\n` +
    `${E.CARD} Pago: ${(pedido.metodo_pago || '').toUpperCase()}\n\n` +
    `${E.HANDS} ¡Gracias por tu compra!`;

  // 6. Generación de Enlace con URL base de API
  return `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(body)}`;
};

export const generarLinkWhatsapp = generarResumenWhatsApp;