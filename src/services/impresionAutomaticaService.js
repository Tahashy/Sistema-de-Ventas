import { supabase } from './supabaseClient';
import { impresionService } from './impresionService';
import { impresorasService } from './impresorasService';
import { showToast } from '../components/Toast';

// Set global en window para deduplicar de forma infalible entre módulos y eventos Realtime
const getPedidosProcesados = () => {
    if (typeof window !== 'undefined') {
        if (!window.__pedidosProcesadosAuto) {
            window.__pedidosProcesadosAuto = new Set();
        }
        return window.__pedidosProcesadosAuto;
    }
    return new Set();
};

/**
 * Obtiene lista de impresoras deduplicada por IP/nombre para evitar enviar doble a la misma impresora física
 */
const getImpresorasUnicas = (tipo) => {
    const list = impresorasService.getImpresorasPorTipo(tipo);
    const unicas = [];
    const vistas = new Set();
    for (const imp of list) {
        const clave = (imp.ip || imp.nombre || '').trim().toLowerCase();
        if (clave && !vistas.has(clave)) {
            vistas.add(clave);
            unicas.push(imp);
        }
    }
    return unicas;
};

/**
 * Función centralizada para ejecutar la impresión automática de un pedido nuevo
 * @param {Object} pedido - Pedido completo con sus pedido_items
 * @param {Object} restaurante - Datos del restaurante
 * @returns {Promise<boolean>}
 */
export const imprimirPedidoAutomatico = async (pedido, restaurante) => {
    if (!pedido || !pedido.id) return false;

    // Verificar si la impresión automática está activada
    const config = impresorasService.getAutoPrintConfig();
    if (!config || !config.activo) {
        return false;
    }

    // Evitar imprimir dos veces el mismo pedido nuevo
    const procesados = getPedidosProcesados();
    if (procesados.has(pedido.id)) {
        return false;
    }
    procesados.add(pedido.id);

    try {
        let seImprimio = false;

        // 1. Imprimir comanda de cocina si está configurado
        if (config.tipo === 'cocina' || config.tipo === 'ambas') {
            const impresorasCocina = getImpresorasUnicas('cocina');
            if (impresorasCocina.length > 0) {
                const opsCocina = impresionService.formatearComanda(pedido);
                for (const imp of impresorasCocina) {
                    await impresionService.enviarAlPlugin(opsCocina, imp.ip);
                    seImprimio = true;
                }
            } else {
                console.warn('Auto-impresión: No hay impresoras de tipo cocina configuradas.');
            }
        }

        // 2. Imprimir ticket de caja si está configurado
        if (config.tipo === 'caja' || config.tipo === 'ambas') {
            const impresorasCaja = getImpresorasUnicas('caja');
            if (impresorasCaja.length > 0) {
                const opsCaja = impresionService.formatearTicket(pedido, { restaurante });
                for (const imp of impresorasCaja) {
                    await impresionService.enviarAlPlugin(opsCaja, imp.ip);
                    seImprimio = true;
                }
            } else {
                console.warn('Auto-impresión: No hay impresoras de tipo caja configuradas.');
            }
        }

        if (seImprimio) {
            showToast(
                `🖨️ Pedido #${pedido.orden_dia || pedido.numero_pedido} impreso automáticamente`,
                'info'
            );

            // Actualizar estado en Supabase
            const itemIds = (pedido.pedido_items || []).map((i) => i.id).filter(Boolean);
            if (itemIds.length > 0) {
                await supabase
                    .from('pedido_items')
                    .update({ impreso: true })
                    .in('id', itemIds);

                await supabase
                    .from('pedidos')
                    .update({ tiene_productos_sin_imprimir: false })
                    .eq('id', pedido.id);
            }
            return true;
        } else {
            console.warn('Auto-impresión: Ninguna impresora ejecutó la orden.');
            return false;
        }
    } catch (error) {
        console.error('Error al imprimir pedido automáticamente:', error);
        showToast('Error en auto-impresión. Verifica que QZ Tray esté abierto.', 'warning');
        return false;
    }
};

/**
 * Imprime automáticamente únicamente los productos/agregados nuevos que se añaden a un pedido existente
 * @param {Object} pedido - Objeto del pedido (para cabecera: mesa, orden_dia, etc.)
 * @param {Array} nuevosItems - Lista de items recién agregados
 * @param {Object} restaurante - Datos del restaurante
 */
export const imprimirAdicionalesAutomatico = async (pedido, nuevosItems, restaurante) => {
    if (!pedido || !nuevosItems || nuevosItems.length === 0) return false;

    const config = impresorasService.getAutoPrintConfig();
    if (!config || !config.activo) return false;

    // Solo mandamos adicionales a la cocina si cocina o ambas está activada
    if (config.tipo !== 'cocina' && config.tipo !== 'ambas') return false;

    try {
        const impresorasCocina = getImpresorasUnicas('cocina');
        if (impresorasCocina.length === 0) {
            console.warn('Auto-impresión adicionales: No hay impresoras de cocina configuradas.');
            return false;
        }

        const pedidoAdicional = {
            ...pedido,
            esAdicional: true,
            pedido_items: nuevosItems
        };

        const opsCocina = impresionService.formatearComanda(pedidoAdicional);
        for (const imp of impresorasCocina) {
            await impresionService.enviarAlPlugin(opsCocina, imp.ip);
        }

        showToast(
            `🖨️ Agregados de #${pedido.orden_dia || pedido.numero_pedido} impresos en cocina`,
            'info'
        );

        // Marcar items como impresos en base de datos si tienen ID
        const itemIds = nuevosItems.map(i => i.id || i.item_id).filter(Boolean);
        if (itemIds.length > 0) {
            await supabase
                .from('pedido_items')
                .update({ impreso: true })
                .in('id', itemIds);

            await supabase
                .from('pedidos')
                .update({ tiene_productos_sin_imprimir: false })
                .eq('id', pedido.id);
        }

        return true;
    } catch (error) {
        console.error('Error al imprimir adicionales automáticamente:', error);
        showToast('Error al imprimir adicionales en cocina', 'warning');
        return false;
    }
};
