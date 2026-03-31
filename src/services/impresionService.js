/**
 * Servicio de Impresión para Impresoras Térmicas usando QZ Tray
 * Proporciona una conexión estable vía Websockets y soporte para comandos RAW (ESC/POS).
 */
import * as qz from 'qz-tray';
import { formatearFechaHora } from '../modules/pedidos/utils/pedidoHelpers';

export const impresionService = {
    /**
     * Asegura que exista una conexión activa con el agente QZ Tray
     */
    conectar: async () => {
        try {
            if (qz.websocket.isActive()) return true;
            await qz.websocket.connect();
            return true;
        } catch (error) {
            console.error('Error al conectar con QZ Tray:', error);
            throw new Error('QZ Tray no está ejecutándose. Por favor ábrelo.');
        }
    },

    /**
     * Busca impresoras instaladas en el Sistema Operativo
     */
    buscarImpresoras: async () => {
        await impresionService.conectar();
        return await qz.printers.find();
    },

    /**
     * Envía una lista de comandos RAW a una impresora específica
     */
    enviarAlPlugin: async (operaciones, nombreImpresora) => {
        try {
            await impresionService.conectar();

            const config = qz.configs.create(nombreImpresora);

            // QZ Tray espera los comandos ESC/POS tal cual o a través de su API de dibujo
            // Para máxima compatibilidad con el código anterior, convertimos los comandos
            await qz.print(config, operaciones);

            return true;
        } catch (error) {
            console.error('Error de impresión QZ:', error);
            throw error;
        }
    },

    /**
     * Genera comandos ESC/POS para QZ Tray
     * Nota: QZ usa caracteres de escape estándar o Hex.
     */
    formatearTicket: (pedido, opciones = {}) => {
        // Estructura de datos para QZ Tray (RAW commands)
        const char = {
            init: '\x1B\x40',
            center: '\x1B\x61\x01',
            left: '\x1B\x61\x00',
            right: '\x1B\x61\x02',
            boldOn: '\x1B\x45\x01',
            boldOff: '\x1B\x45\x00',
            cut: '\x1D\x56\x41\x03'
        };

        const rest = opciones.restaurante || {};
        const nombreEmpresa = (rest.nombre || 'RESTAURANTE').toUpperCase();
        const direccion = rest.direccion || '';
        const telefono = rest.telefono || '';

        let data = "";
        data += char.init;
        data += char.center + char.boldOn + nombreEmpresa + "\n" + char.boldOff;
        
        if (direccion) data += direccion + "\n";
        if (telefono) data += "Tel: " + telefono + "\n";
        
        data += "\n";
        data += char.boldOn + "ORDEN #" + (pedido.orden_dia || '-') + char.boldOff + "\n";
        data += "ID: #" + pedido.numero_pedido + "\n";
        data += "Fecha: " + formatearFechaHora(pedido.created_at) + "\n";
        data += "Cliente: " + (pedido.cliente_nombre || 'General') + "\n";
        data += "--------------------------------\n";

        data += char.left;
        (pedido.pedido_items || []).forEach(item => {
            let nombreLimpio = (item.nombre || item.producto_nombre || 'Producto').substring(0, 20);
            const cant = item.cantidad.toString().padStart(2, ' ');
            const precio = (parseFloat(item.precio || item.precio_unitario || item.subtotal || 0) * (item.subtotal ? 1 : item.cantidad)).toFixed(2);
            data += `${cant}x ${nombreLimpio.padEnd(20, ' ')} ${precio.padStart(7, ' ')}\n`;

            if (item.agregados && item.agregados.length > 0) {
                item.agregados.forEach(ag => {
                    data += `   + ${ag.nombre.substring(0, 25)}\n`;
                });
            }
        });

        data += "--------------------------------\n";
        
        // Extras
        const subtotalBase = parseFloat(pedido.subtotal || 0);
        const dto = parseFloat(pedido.descuento || 0);
        const svc = parseFloat(pedido.cargo_servicio || 0);
        const emb = parseFloat(pedido.cargo_embalaje || 0);
        const prop = parseFloat(pedido.propina || 0);

        data += char.right;
        
        if (dto > 0 || svc > 0 || emb > 0 || prop > 0) {
            data += `Subtotal: $${subtotalBase.toFixed(2)}\n`;
            if (dto > 0) data += `Descuento: -$${dto.toFixed(2)}\n`;
            if (svc > 0) data += `Servicio: +$${svc.toFixed(2)}\n`;
            if (emb > 0) data += `Embalaje: +$${emb.toFixed(2)}\n`;
            if (prop > 0) data += `Propina: +$${prop.toFixed(2)}\n`;
            data += "--------------------------------\n";
        }

        data += char.boldOn + "TOTAL: $" + parseFloat(pedido.total || 0).toFixed(2) + "\n" + char.boldOff;

        data += char.center + "\n¡Gracias por su preferencia!\n\n\n";
        data += char.cut;

        return [data];
    },

    /**
     * Genera comandos para comanda de cocina
     */
    formatearComanda: (pedido) => {
        const char = {
            init: '\x1B\x40',
            center: '\x1B\x61\x01',
            left: '\x1B\x61\x00',
            boldOn: '\x1B\x45\x01',
            boldOff: '\x1B\x45\x00',
            doubleH: '\x1B\x21\x10',
            normal: '\x1B\x21\x00',
            cut: '\x1D\x56\x41\x03'
        };

        let data = "";
        data += char.init;
        data += char.center + char.boldOn + "*** COMANDA DE COCINA ***\n" + char.boldOff;
        data += char.doubleH + "ORDEN #" + (pedido.orden_dia || '-') + char.normal + "\n";
        data += "ID Pedido: #" + pedido.numero_pedido + "\n";
        
        data += "\n";
        data += char.left;

        if (pedido.numero_mesa) {
            data += char.boldOn + "MESA: " + pedido.numero_mesa + "\n" + char.boldOff;
        } else {
            data += "Cliente: " + (pedido.cliente_nombre || 'General') + "\n";
        }
        
        data += "Tipo: " + (pedido.tipo_servicio || 'Mostrador').toUpperCase() + "\n";
        data += "Fecha: " + formatearFechaHora(pedido.created_at) + "\n";

        data += "--------------------------------\n";

        (pedido.pedido_items || []).forEach(item => {
            data += char.boldOn + item.cantidad + "x " + (item.producto_nombre || item.nombre) + "\n" + char.boldOff;
            
            if (item.agregados && item.agregados.length > 0) {
                // Notas y Agregados en Negrita
                data += char.boldOn;
                item.agregados.forEach(ag => {
                    data += `  > +${ag.nombre}\n`;
                });
                data += char.boldOff;
            }
            if (item.notas) {
                data += char.boldOn + `  NOTA: ${item.notas}\n` + char.boldOff;
            }
        });

        if (pedido.notas) {
            data += "--------------------------------\n";
            data += char.center + char.boldOn + "NOTAS GENERALES:\n" + char.boldOff + char.left;
            data += char.boldOn + pedido.notas + "\n" + char.boldOff;
        }

        data += "\n\n" + char.cut;

        return [data];
    }
};
