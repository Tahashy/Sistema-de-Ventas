// src/modules/caja/hooks/useCierreCaja.js

import { useState, useEffect, useCallback } from 'react';
import { 
    obtenerUltimoCierre, 
    obtenerResumenVentasCaja, 
    registrarCierre 
} from '../../../services/cierreCajaService';
import { useAuth } from '../../auth/AuthContext';

export const useCierreCaja = (restauranteId) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ultimoCierre, setUltimoCierre] = useState(null);
    const [resumenActual, setResumenActual] = useState(null);
    const [fechaInicioCalculo, setFechaInicioCalculo] = useState(null);

    const cargarDatosCaja = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Obtener último cierre
            const { data: ultimo } = await obtenerUltimoCierre(restauranteId);
            setUltimoCierre(ultimo);

            // 2. Determinar la fecha de inicio para calcular ventas
            let fechaInicio;
            if (ultimo && ultimo.fecha_cierre) {
                fechaInicio = ultimo.fecha_cierre;
            } else {
                // Si nunca ha habido un cierre, tomamos el inicio del día actual (hora local)
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fechaInicio = hoy.toISOString();
            }
            setFechaInicioCalculo(fechaInicio);

            // 3. Obtener resumen de ventas desde esa fecha
            const { data: resumen } = await obtenerResumenVentasCaja(restauranteId, fechaInicio);
            if (resumen) {
                setResumenActual(resumen);
            }

        } catch (err) {
            console.error('Error cargando datos de caja:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [restauranteId]);

    useEffect(() => {
        if (restauranteId) {
            cargarDatosCaja();
        }
    }, [restauranteId, cargarDatosCaja]);

    // Función para ejecutar el cierre
    const realizarCierre = async (montoInicialSencillo, declaradoEfectivo, declaradoTarjeta, declaradoDigital, notas) => {
        if (!resumenActual) return { success: false, error: 'No hay datos de resumen' };

        const sencillo = parseFloat(montoInicialSencillo) || 0;
        
        // Calcular esperado
        const efectivoEsperado = (resumenActual.total_efectivo || 0) + sencillo;
        const digitalEsperado = (resumenActual.total_yape || 0) + (resumenActual.total_plin || 0);
        
        // Calcular diferencias
        const difEfectivo = (parseFloat(declaradoEfectivo) || 0) - efectivoEsperado;
        const difTarjeta = (parseFloat(declaradoTarjeta) || 0) - (resumenActual.total_tarjeta || 0);
        const difDigital = (parseFloat(declaradoDigital) || 0) - digitalEsperado;

        const datosCierre = {
            restaurante_id: restauranteId,
            usuario_id: user.id,
            fecha_inicio: fechaInicioCalculo,
            fecha_cierre: resumenActual.fecha_fin_calculada, // Fecha exacta del corte
            
            monto_inicial: sencillo,
            total_efectivo: resumenActual.total_efectivo,
            total_tarjeta: resumenActual.total_tarjeta,
            total_yape: resumenActual.total_yape,
            total_plin: resumenActual.total_plin,
            total_general: resumenActual.total_general,
            total_delivery: resumenActual.total_delivery || 0,
            num_pedidos: resumenActual.num_pedidos,
            
            declarado_efectivo: parseFloat(declaradoEfectivo) || 0,
            declarado_tarjeta: parseFloat(declaradoTarjeta) || 0,
            declarado_digital: parseFloat(declaradoDigital) || 0,
            
            diferencia_efectivo: difEfectivo,
            diferencia_tarjeta: difTarjeta,
            diferencia_digital: difDigital,
            
            notas: notas || ''
        };

        setLoading(true);
        const { data, error } = await registrarCierre(datosCierre);
        
        if (error) {
            setLoading(false);
            return { success: false, error: error.message };
        }

        // Recargar datos para que la vista se actualice
        await cargarDatosCaja();
        return { success: true, data };
    };

    return {
        loading,
        error,
        ultimoCierre,
        resumenActual,
        fechaInicioCalculo,
        cargarDatosCaja,
        realizarCierre
    };
};
