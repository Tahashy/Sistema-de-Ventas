
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
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

/**
 * Genera el enlace de WhatsApp con el mensaje preformateado del pedido.
 * @param {Object} pedido - Objeto completo del pedido
 * @param {Object} restaurante - Datos del restaurante
 * @returns {string|null} - URL completa o null si no hay teléfono
 */
/**
 * Genera el enlace de WhatsApp con el mensaje preformateado del pedido.
 * @param {Object} pedido - Objeto completo del pedido
 * @param {Object} restaurante - Datos del restaurante
 * @returns {string|null} - URL completa o null si no hay teléfono
 */
export const generarLinkWhatsapp = (pedido, restaurante) => {
  const telefono = pedido.cliente_celular || pedido.telefono || '';
  if (!telefono) return null;

  const telefonoLimpio = telefono.replace(/[^0-9]/g, '');

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Emojis en Unicode para evitar errores de encoding
  const e = {
    rocket: '\uD83D\uDE80',
    store: '\uD83C\uDFEA',
    calendar: '\uD83D\uDCC5',
    user: '\uD83D\uDC64',
    pin: '\uD83D\uDCCD',
    chat: '\uD83D\uDCAC',
    cart: '\uD83D\uDED2',
    item: '\uD83D\uDD38', // Orange diamond
    money: '\uD83D\uDCB5',
    fire: '\uD83D\uDD25',
    label: '\uD83C\uDFF7',
    bell: '\uD83D\uDECE',
    box: '\uD83D\uDCE6',
    hand: '\uD83E\uDD1D',
    card: '\uD83D\uDCB3',
    hands: '\uD83D\uDE4C'
  };

  // Construcción de items
  const itemsText = (pedido.pedido_items || []).map(item => {
    let text = `${e.item} *${item.cantidad}x ${item.producto_nombre || item.nombre}*`;

    // Agregados
    if (item.agregados && item.agregados.length > 0) {
      const agregadosText = item.agregados.map(ag => `   └ + ${ag.nombre}`).join('\n');
      text += `\n${agregadosText}`;
    }

    // Notas
    if (item.notas) {
      text += `\n   📝 ${item.notas}`;
    }

    // Precio
    text += `\n   ${e.money} ${formatearMoneda(parseFloat(item.subtotal || item.precio * item.cantidad))}`;

    return text;
  }).join('\n\n');

  const subtotal = parseFloat(pedido.subtotal || 0).toFixed(2);
  const total = parseFloat(pedido.total || 0).toFixed(2);

  let extrasText = '';
  if (parseFloat(pedido.descuento) > 0) extrasText += `\n${e.label} Descuento: -${formatearMoneda(pedido.descuento)}`;
  if (parseFloat(pedido.cargo_servicio) > 0) extrasText += `\n${e.bell} Servicio: +${formatearMoneda(pedido.cargo_servicio)}`;
  if (parseFloat(pedido.cargo_embalaje) > 0) extrasText += `\n${e.box} Embalaje: +${formatearMoneda(pedido.cargo_embalaje)}`;
  if (parseFloat(pedido.propina) > 0) extrasText += `\n${e.hand} Propina: +${formatearMoneda(pedido.propina)}`;

  // Diseño final
  const message = `${e.rocket} *NUEVO PEDIDO: #${pedido.numero_pedido}* ${e.rocket}\n` +
    `--------------------------------\n` +
    `${e.store} *${restaurante.nombre || 'Restaurante'}*\n` +
    `${e.calendar} ${formatDate(pedido.created_at)}\n\n` +

    `${e.user} *CLIENTE*\n` +
    `*Nombre:* ${pedido.cliente_nombre || 'General'}\n` +
    (pedido.direccion_delivery ? `${e.pin} *Dirección:* ${pedido.direccion_delivery}\n` : '') +
    (pedido.notas ? `${e.chat} *Nota:* ${pedido.notas}\n` : '') +
    `\n${e.cart} *DETALLE DEL PEDIDO*\n` +
    `--------------------------------\n` +
    `${itemsText}\n` +
    `--------------------------------\n` +

    `${e.money} *IMPORTE*\n` +
    `Subtotal: ${formatearMoneda(subtotal)}` +
    `${extrasText}\n\n` +
    `${e.fire} *TOTAL: ${formatearMoneda(total)}* ${e.fire}\n` +
    `--------------------------------\n` +
    `${e.card} Pago: ${(pedido.metodo_pago || '').toUpperCase()}\n\n` +
    `${e.hands} ¡Gracias por tu compra!`;

  return `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(message)}`;
};