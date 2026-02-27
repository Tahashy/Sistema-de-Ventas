/**
 * Servicio de Impresión para Impresoras Térmicas usando QZ Tray
 * Proporciona una conexión estable vía Websockets y soporte para comandos RAW (ESC/POS).
 */
import * as qz from 'qz-tray';

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
        // \x1B es el caracter ESC (decimal 27)
        const char = {
            init: '\x1B\x40',
            center: '\x1B\x61\x01',
            left: '\x1B\x61\x00',
            right: '\x1B\x61\x02',
            boldOn: '\x1B\x45\x01',
            boldOff: '\x1B\x45\x00',
            cut: '\x1D\x56\x41\x03'
        };

        let data = "";
        data += char.init;
        data += char.center + char.boldOn + (opciones.empresa || 'MIRKOS').toUpperCase() + "\n" + char.boldOff;
        data += char.boldOn + "ORDEN #" + (pedido.orden_dia || '-') + char.boldOff + "\n";
        data += "ID: #" + pedido.numero_pedido + "\n";
        data += "Fecha: " + new Date(pedido.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' }) + "\n";
        data += "--------------------------------\n";

        data += char.left;
        (pedido.pedido_items || []).forEach(item => {
            const nombre = (item.nombre || item.producto_nombre || 'Producto').substring(0, 20);
            const cant = item.cantidad.toString().padStart(2, ' ');
            const precio = (parseFloat(item.precio || item.precio_unitario || 0) * item.cantidad).toFixed(2);
            data += `${cant}x ${nombre.padEnd(20, ' ')} ${precio.padStart(7, ' ')}\n`;

            if (item.agregados && item.agregados.length > 0) {
                item.agregados.forEach(ag => {
                    data += `   + ${ag.nombre.substring(0, 25)}\n`;
                });
            }
        });

        data += "--------------------------------\n";
        data += char.right + char.boldOn + "TOTAL: $" + parseFloat(pedido.total || 0).toFixed(2) + "\n" + char.boldOff;

        data += char.center + "\n¡Gracias por su preferencia!\n\n\n";
        data += char.cut;

        return [data]; // QZ espera un array
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
        data += "Pedido #" + pedido.numero_pedido + "\n";

        if (pedido.numero_mesa) {
            data += "MESA: " + pedido.numero_mesa + "\n";
        }
        data += "--------------------------------\n";

        data += char.left;
        (pedido.pedido_items || []).forEach(item => {
            data += char.boldOn + item.cantidad + "x " + (item.producto_nombre || item.nombre) + "\n" + char.boldOff;
            if (item.agregados && item.agregados.length > 0) {
                item.agregados.forEach(ag => {
                    data += `  > ${ag.nombre}\n`;
                });
            }
            if (item.notas) {
                data += `  NOTA: ${item.notas}\n`;
            }
        });

        data += "\n\n" + char.cut;

        return [data];
    }
};
