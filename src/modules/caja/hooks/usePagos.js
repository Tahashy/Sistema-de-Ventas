// src/modules/caja/hooks/usePagos.js

import { useState, useEffect, useCallback } from 'react';
import { obtenerPagos, obtenerEstadisticas, buscarPago, prepararDatosExportacion } from '../../../services/pagosService';
import { showToast } from '../../../components/Toast';
import * as XLSX from 'xlsx';

export const usePagos = (restauranteId) => {
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [estadisticas, setEstadisticas] = useState(null);
    const [filtros, setFiltros] = useState({
        fechaInicio: new Date().toISOString().split('T')[0], // Hoy por defecto
        fechaFin: new Date().toISOString().split('T')[0],
        metodoPago: 'todos',
        tipoServicio: 'todos',
        limit: 100
    });
    const [busqueda, setBusqueda] = useState('');

    const cargarDatos = useCallback(async () => {
        if (!restauranteId) return;

        setLoading(true);
        try {
            // Cargar Pagos
            const { data: dataPagos, error: errorPagos } = await obtenerPagos(restauranteId, filtros);
            if (errorPagos) throw errorPagos;

            setPagos(dataPagos || []);

            // Cargar Estadísticas
            // Ajustar fechas para incluir todo el día final (hasta 23:59:59)
            const fechaFinAjustada = new Date(filtros.fechaFin);
            fechaFinAjustada.setHours(23, 59, 59, 999);

            const fechaInicioAjustada = new Date(filtros.fechaInicio);
            fechaInicioAjustada.setHours(0, 0, 0, 0);

            const { data: dataStats, error: errorStats } = await obtenerEstadisticas(
                restauranteId,
                fechaInicioAjustada.toISOString(),
                fechaFinAjustada.toISOString()
            );

            if (errorStats) throw errorStats;
            setEstadisticas(dataStats);

        } catch (error) {
            console.error('Error cargando datos de pagos:', error);
            showToast('Error al cargar historial de pagos', 'error');
        } finally {
            setLoading(false);
        }
    }, [restauranteId, filtros]);

    // Efecto para cargar datos cuando cambian filtros o ID
    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Búsqueda
    const realizarBusqueda = async (termino) => {
        setBusqueda(termino);
        if (!termino.trim()) {
            cargarDatos(); // Volver a cargar con filtros normales si se limpia búsqueda
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await buscarPago(restauranteId, termino);
            if (error) throw error;
            setPagos(data || []);
        } catch (error) {
            console.error('Error en búsqueda:', error);
            showToast('Error al buscar pedido', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Exportar a Excel
    const exportarExcel = async () => {
        try {
            const { data, error } = await prepararDatosExportacion(restauranteId, filtros);
            if (error) throw error;
            if (!data || data.length === 0) {
                showToast('No hay datos para exportar', 'info');
                return;
            }

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pagos");

            const fileName = `Reporte_Pagos_${filtros.fechaInicio}_${filtros.fechaFin}.xlsx`;
            XLSX.writeFile(wb, fileName);

            showToast('Reporte exportado exitosamente', 'success');
        } catch (error) {
            console.error('Error exportando:', error);
            showToast('Error al exportar reporte', 'error');
        }
    };

    const actualizarFiltros = (nuevoFiltro) => {
        setFiltros(prev => ({ ...prev, ...nuevoFiltro }));
    };

    return {
        pagos,
        loading,
        estadisticas,
        filtros,
        actualizarFiltros,
        realizarBusqueda,
        busqueda,
        exportarExcel,
        recargar: cargarDatos
    };
};
