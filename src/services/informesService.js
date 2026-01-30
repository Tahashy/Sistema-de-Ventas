import { supabase } from './supabaseClient';

export const obtenerDatosInforme = async (restauranteId, fechaInicio, fechaFin, periodoAnteriorInicio = null) => {
    try {
        // 1. Obtener Pedidos del rango actual
        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                pedido_items (
                    cantidad,
                    precio_unitario,
                    subtotal,
                    producto_nombre,
                    producto_id
                )
            `)
            .eq('restaurante_id', restauranteId)
            .in('estado', ['entregado', 'cancelado']) // Solo entregados y cancelados cuentan para info (cancelados para tasa de cancelación)
            .gte('fecha_finalizacion', fechaInicio)
            .lte('fecha_finalizacion', fechaFin);

        if (error) throw error;

        // Filtrar solo entregados para ventas
        const ventas = pedidos.filter(p => p.estado === 'entregado');

        // 2. Calcular KPIs Generales
        const totalVentas = ventas.reduce((sum, p) => sum + parseFloat(p.total), 0);
        const totalPedidos = ventas.length;
        const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

        // 3. Procesar Productos y Categorías
        const productosMap = {};
        const horasMap = {};

        // Inicializar horas 0-23
        for (let i = 0; i < 24; i++) horasMap[i] = { hora: i, total: 0, pedidos: 0 };

        ventas.forEach(p => {
            // Análisis Horario
            const hora = new Date(p.fecha_finalizacion || p.created_at).getHours();
            if (horasMap[hora]) {
                horasMap[hora].total += parseFloat(p.total);
                horasMap[hora].pedidos += 1;
            }

            // Análisis Productos
            p.pedido_items.forEach(item => {
                const nombre = item.producto_nombre || 'Desconocido';
                if (!productosMap[nombre]) {
                    productosMap[nombre] = {
                        nombre,
                        cantidad: 0,
                        ingresos: 0
                    };
                }
                productosMap[nombre].cantidad += item.cantidad;
                productosMap[nombre].ingresos += parseFloat(item.subtotal);
            });
        });

        // Convertir mapas a arrays ordenados
        const rankingProductos = Object.values(productosMap)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10); // Top 10

        const analisisHorarios = Object.values(horasMap);

        // Calcular Hora Pico
        const horaPicoData = analisisHorarios.reduce((max, curr) => curr.pedidos > max.pedidos ? curr : max, analisisHorarios[0]);
        const horaPico = `${horaPicoData.hora}:00 - ${horaPicoData.hora + 1}:00`;

        // Producto Top
        const productoTop = rankingProductos.length > 0 ? rankingProductos[0].nombre : '-';

        // TODO: Para categorías se necesitaría join con tabla productos->categorias, 
        // por ahora simularemos o intentaremos inferir si hay data, o haremos una segunda query si es crítico.
        // Asumiremos que por ahora productos es suficiente start.

        return {
            data: {
                kpis: {
                    ventasTotales: totalVentas,
                    totalPedidos,
                    ticketPromedio,
                    horaPico,
                    productoTop
                },
                rankingProductos,
                analisisHorarios,
                // Placeholder para categorías si no hacemos la query compleja ahora
                rankingCategorias: []
            },
            error: null
        };

    } catch (error) {
        console.error('Error obteniendo informe:', error);
        return { data: null, error };
    }
};


// Función auxiliar para obtener categorías (requiere query adicional si no está en join anterior)
export const obtenerRankingCategorias = async (restauranteId, fechaInicio, fechaFin) => {
    try {
        // Esta query es más costosa, idealmente usar una view o function RPC en Supabase
        // Por simplicidad en frontend, traemos items + producto + categoria
        const { data: items, error } = await supabase
            .from('pedido_items')
            .select(`
                subtotal,
                cantidad,
                productos!inner (
                    categorias!inner (
                        nombre
                    )
                ),
                pedidos!inner (
                    fecha_finalizacion
                )
            `)
            .eq('pedidos.restaurante_id', restauranteId)
            .eq('pedidos.estado', 'entregado')
            .gte('pedidos.fecha_finalizacion', fechaInicio)
            .lte('pedidos.fecha_finalizacion', fechaFin);

        if (error) throw error;

        const categoriasMap = {};

        items.forEach(item => {
            const catNombre = item.productos?.categorias?.nombre || 'Sin Categoría';
            if (!categoriasMap[catNombre]) {
                categoriasMap[catNombre] = {
                    nombre: catNombre,
                    pedidos: 0, // Aproximado, son items
                    ingresos: 0
                };
            }
            categoriasMap[catNombre].pedidos += item.cantidad;
            categoriasMap[catNombre].ingresos += parseFloat(item.subtotal);
        });

        const rankingCategorias = Object.values(categoriasMap)
            .sort((a, b) => b.ingresos - a.ingresos);

        return { data: rankingCategorias, error: null };

    } catch (error) {
        console.error('Error categorias:', error);
        return { data: [], error };
    }
}
