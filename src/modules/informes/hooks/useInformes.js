import { useState, useEffect, useCallback } from 'react';
import { obtenerDatosInforme, obtenerRankingCategorias } from '../../../services/informesService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const useInformes = (restauranteId) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        kpis: { ventasTotales: 0, totalPedidos: 0, ticketPromedio: 0, horaPico: '-', productoTop: '-' },
        rankingProductos: [],
        rankingCategorias: [],
        analisisHorarios: []
    });

    // Rango por defecto: Hoy
    const [rango, setRango] = useState('hoy');
    const [fechas, setFechas] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });

    // Calcular fechas según rango seleccionado
    const cambiarRango = (nuevoRango) => {
        setRango(nuevoRango);
        const hoy = new Date();
        let inicio = new Date();
        let fin = new Date();

        switch (nuevoRango) {
            case 'hoy':
                // Inicio y fin son hoy
                break;
            case 'ayer':
                inicio.setDate(hoy.getDate() - 1);
                fin.setDate(hoy.getDate() - 1);
                break;
            case 'semana':
                // Últimos 7 días
                inicio.setDate(hoy.getDate() - 6);
                break;
            case 'mes':
                inicio.setDate(1); // Primer día del mes
                break;
            case 'ano':
                inicio.setMonth(0, 1); // 1 de Enero
                break;
            default:
                break;
        }

        // Ajustar horas para cubrir todo el día
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);

        setFechas({
            inicio: inicio.toISOString(),
            fin: fin.toISOString()
        });
    };

    const cargarDatos = useCallback(async () => {
        if (!restauranteId) return;
        setLoading(true);
        try {
            // Cargar datos generales y productos
            const { data: generalData } = await obtenerDatosInforme(restauranteId, datesToIso(fechas.inicio), datesToIso(fechas.fin, true));

            // Cargar categorías (query separada)
            const { data: catsData } = await obtenerRankingCategorias(restauranteId, datesToIso(fechas.inicio), datesToIso(fechas.fin, true));

            setData({
                ...generalData,
                rankingCategorias: catsData || []
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [restauranteId, fechas]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const exportarExcel = () => {
        try {
            const wb = XLSX.utils.book_new();

            // 1. Hoja Resumen
            const resumenData = [
                ['Reporte de Ventas', 'Generado: ' + new Date().toLocaleString()],
                ['Rango:', rango],
                ['Fechas:', `${fechas.inicio} - ${fechas.fin}`],
                [''],
                ['KPIs Generales'],
                ['Ventas Totales', data.kpis.ventasTotales],
                ['Total Pedidos', data.kpis.totalPedidos],
                ['Ticket Promedio', data.kpis.ticketPromedio],
                ['Hora Pico', data.kpis.horaPico],
                ['Producto Top', data.kpis.productoTop]
            ];
            const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
            XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

            // 2. Hoja Productos
            const productosData = data.rankingProductos.map(p => ({
                Producto: p.nombre,
                Cantidad: p.cantidad,
                Ingresos: p.ingresos
            }));
            const wsProductos = XLSX.utils.json_to_sheet(productosData);
            XLSX.utils.book_append_sheet(wb, wsProductos, "Ranking Productos");

            // 3. Hoja Horarios
            const horariosData = data.analisisHorarios.map(h => ({
                Hora: `${h.hora}:00`,
                Pedidos: h.pedidos,
                Ventas: h.total
            }));
            const wsHorarios = XLSX.utils.json_to_sheet(horariosData);
            XLSX.utils.book_append_sheet(wb, wsHorarios, "Análisis Horario");

            // Descargar
            XLSX.writeFile(wb, `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error("Error exportando Excel:", error);
        }
    };

    const exportarPDF = () => {
        try {
            const doc = new jsPDF();

            // Título
            doc.setFontSize(18);
            doc.text("Reporte de Ventas", 14, 22);

            doc.setFontSize(11);
            doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
            doc.text(`Rango: ${rango.toUpperCase()} (${fechas.inicio.split('T')[0]} - ${fechas.fin.split('T')[0]})`, 14, 36);

            // KPIs
            doc.setFontSize(14);
            doc.text("Resumen General", 14, 48);

            const kpiData = [
                ['Ventas Totales', `$${data.kpis.ventasTotales.toFixed(2)}`],
                ['Total Pedidos', data.kpis.totalPedidos],
                ['Ticket Promedio', `$${data.kpis.ticketPromedio.toFixed(2)}`],
                ['Hora Pico', data.kpis.horaPico],
                ['Producto Mas Vendido', data.kpis.productoTop]
            ];

            autoTable(doc, {
                startY: 52,
                head: [['Métrica', 'Valor']],
                body: kpiData,
                theme: 'striped',
                headStyles: { fillColor: [255, 107, 53] } // Color naranja corporativo
            });

            // Ranking Productos
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.text("Top Productos", 14, finalY);

            autoTable(doc, {
                startY: finalY + 4,
                head: [['Producto', 'Cantidad', 'Ingresos']],
                body: data.rankingProductos.map(p => [p.nombre, p.cantidad, `$${p.ingresos.toFixed(2)}`]),
                theme: 'striped',
                headStyles: { fillColor: [255, 107, 53] }
            });

            doc.save(`Reporte_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error("Error exportando PDF:", error);
        }
    };

    return {
        loading,
        data,
        rango,
        cambiarRango,
        fechas,
        recargar: cargarDatos,
        exportarExcel,
        exportarPDF
    };
};

// Helper para asegurar formato ISO correcto para DB
const datesToIso = (dateStr, endOfDay = false) => {
    // Si viene string ISO completo, usarlo. Si viene YYYY-MM-DD construirlo.
    if (dateStr.includes('T')) return dateStr;
    const d = new Date(dateStr);
    if (endOfDay) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d.toISOString();
};
