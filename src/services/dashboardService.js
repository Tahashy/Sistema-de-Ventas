import { supabase } from './supabaseClient';

export const getDashboardKPIs = async (restauranteId) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString();

        // 1. Pedidos Hoy (Total y Ventas)
        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .gte('created_at', hoyISO);

        if (error) throw error;

        const pedidosHoy = pedidos.length;
        // Solo sumar ventas de pedidos no cancelados
        const ventasHoy = pedidos
            .filter(p => p.estado !== 'cancelado')
            .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

        // 2. Mesas Ocupadas
        const { count: mesasOcupadas, error: mesasError } = await supabase
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('restaurante_id', restauranteId)
            .eq('tipo', 'mesa')
            .neq('estado', 'cancelado')
            .neq('estado', 'entregado'); // Asumiendo 'entregado' es finalizado. Si hay 'finalizado' o 'pagado', ajustar.

        if (mesasError) throw mesasError;

        // 3. Producto Estrella Hoy (Calculado de items de pedidos hoy)
        const { data: items, error: itemsError } = await supabase
            .from('pedido_items')
            .select('producto_nombre, cantidad, pedidos!inner(created_at, restaurante_id)')
            .eq('pedidos.restaurante_id', restauranteId)
            .gte('pedidos.created_at', hoyISO);

        if (itemsError) throw itemsError;

        const productoCounts = {};
        items.forEach(item => {
            const nombre = item.producto_nombre;
            productoCounts[nombre] = (productoCounts[nombre] || 0) + item.cantidad;
        });

        let productoEstrella = '-';
        let maxVentas = 0;
        Object.entries(productoCounts).forEach(([nombre, cantidad]) => {
            if (cantidad > maxVentas) {
                maxVentas = cantidad;
                productoEstrella = nombre;
            }
        });

        // Comparativa Ayer (Simple: traer pedidos de ayer para calcular % cambio)
        // Por brevedad, devolveremos datos base. La UI puede calcular % si traemos ayer aquí o simplificamos.
        // Simularemos tendencia positiva por ahora o 0 si no hay data.

        return {
            pedidosHoy,
            ventasHoy,
            mesasOcupadas: mesasOcupadas || 0,
            productoEstrella,
            productoEstrellaVentas: maxVentas
        };

    } catch (error) {
        console.error('Error getDashboardKPIs:', error);
        return null;
    }
};

export const getSalesChartData = async (restauranteId, periodo = 'semana') => {
    try {
        const hoy = new Date();
        const inicio = new Date();

        if (periodo === 'semana') {
            inicio.setDate(hoy.getDate() - 6); // Últimos 7 días
        } else {
            inicio.setDate(hoy.getDate() - 29); // Últimos 30 días
        }
        inicio.setHours(0, 0, 0, 0);

        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select('created_at, total')
            .eq('restaurante_id', restauranteId)
            .neq('estado', 'cancelado')
            .gte('created_at', inicio.toISOString());

        if (error) throw error;

        // Agrupar por día
        const ventasMap = {};
        // Inicializar días en 0
        for (let d = new Date(inicio); d <= hoy; d.setDate(d.getDate() + 1)) {
            const dayStr = d.toISOString().split('T')[0];
            const diaNombre = d.toLocaleDateString('es-ES', { weekday: 'short' });
            ventasMap[dayStr] = {
                fecha: dayStr,
                dia: diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1),
                ventas: 0
            };
        }

        pedidos.forEach(p => {
            const dayStr = p.created_at.split('T')[0];
            if (ventasMap[dayStr]) {
                ventasMap[dayStr].ventas += parseFloat(p.total || 0);
            }
        });

        return Object.values(ventasMap);

    } catch (error) {
        console.error('Error getSalesChartData:', error);
        return [];
    }
};

export const getTopProducts = async (restauranteId) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Top productos de HOY
        const { data: items, error } = await supabase
            .from('pedido_items')
            .select(`
                producto_nombre, 
                cantidad, 
                precio_unitario,
                subtotal,
                productos (
                    categorias (nombre)
                ),
                pedidos!inner (
                    restaurante_id,
                    created_at,
                    estado
                )
            `)
            .eq('pedidos.restaurante_id', restauranteId)
            .neq('pedidos.estado', 'cancelado')
            .gte('pedidos.created_at', hoy.toISOString());

        if (error) throw error;

        const productMap = {};

        items.forEach(item => {
            const nombre = item.producto_nombre;
            if (!productMap[nombre]) {
                productMap[nombre] = {
                    id: nombre, // Usamos nombre como ID simple
                    nombre: nombre,
                    categoria: item.productos?.categorias?.nombre || 'General',
                    precio: item.precio_unitario,
                    ventas: 0,
                    ingresos: 0,
                    color: getRandomColor() // Asignar color visual
                };
            }
            productMap[nombre].ventas += item.cantidad;
            productMap[nombre].ingresos += parseFloat(item.subtotal || 0);
        });

        return Object.values(productMap)
            .sort((a, b) => b.ventas - a.ventas)
            .slice(0, 5);

    } catch (error) {
        console.error('Error getTopProducts:', error);
        return [];
    }
};

const colors = ['#FF6B35', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
