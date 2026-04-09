import { useState, useEffect, useCallback } from 'react';
import { obtenerDatosInforme, obtenerRankingCategorias } from '../../../services/informesService';
import { obtenerRangoFechaLimaUTC } from '../../pedidos/utils/pedidoHelpers';
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

    // Helper para obtener fecha actual en formato YYYY-MM-DD de Lima
    const getFechaLima = (fecha = new Date()) => {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(fecha);
    };

    // Rango por defecto: Hoy (en Lima)
    const [rango, setRango] = useState('hoy');
    const [fechas, setFechas] = useState({
        inicio: getFechaLima(),
        fin: getFechaLima()
    });

    // Calcular fechas según rango seleccionado
    const cambiarRango = (nuevoRango) => {
        setRango(nuevoRango);
        const hoy = new Date();
        let inicio = new Date();
        let fin = new Date();

        switch (nuevoRango) {
            case 'hoy':
                const hoyLima = getFechaLima();
                setFechas({ inicio: hoyLima, fin: hoyLima });
                break;
            case 'ayer':
                const ayer = new Date();
                ayer.setHours(ayer.getHours() - 24); // Retroceder un día
                const ayerLima = getFechaLima(ayer);
                setFechas({ inicio: ayerLima, fin: ayerLima });
                break;
            case 'semana':
                const inicioSemana = new Date();
                inicioSemana.setDate(inicioSemana.getDate() - 6);
                setFechas({ inicio: getFechaLima(inicioSemana), fin: getFechaLima() });
                break;
            case 'mes':
                const primerDiaMes = new Date();
                // Necesitamos el primer día del mes en Lima
                const year = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric' }).format(new Date());
                const month = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', month: '2-digit' }).format(new Date());
                setFechas({ inicio: `${year}-${month}-01`, fin: getFechaLima() });
                break;
            case 'ano':
                const yearSolo = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric' }).format(new Date());
                setFechas({ inicio: `${yearSolo}-01-01`, fin: getFechaLima() });
                break;
            default:
                break;
        }
    };

    const cargarDatos = useCallback(async () => {
        if (!restauranteId) return;
        setLoading(true);
        try {
            // Convertir fechas YYYY-MM-DD a ISO UTC considerando Lima (-05:00)
            const isoInicio = obtenerRangoFechaLimaUTC(fechas.inicio, false);
            const isoFin = obtenerRangoFechaLimaUTC(fechas.fin, true);

            // Cargar datos generales y productos
            const { data: generalData } = await obtenerDatosInforme(restauranteId, isoInicio, isoFin);

            // Cargar categorías (query separada)
            const { data: catsData } = await obtenerRankingCategorias(restauranteId, isoInicio, isoFin);

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

