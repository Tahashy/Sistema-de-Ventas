/**
 * Servicio para gestionar la configuración de impresoras locales
 * Persiste en localStorage para evitar dependencias de DB en configuraciones de hardware local.
 */

const STORAGE_KEY = 'mirkos_impresoras';

export const impresorasService = {
    /**
     * Obtiene la lista de impresoras configuradas
     */
    getImpresoras: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error cargando impresoras:', error);
            return [];
        }
    },

    /**
     * Guarda una nueva impresora o actualiza una existente
     */
    saveImpresora: (impresora) => {
        try {
            const impresoras = impresorasService.getImpresoras();
            const index = impresoras.findIndex(i => i.id === impresora.id);

            // Asegurar que tipos es un array
            if (!impresora.tipos) {
                impresora.tipos = impresora.tipo ? [impresora.tipo] : ['cocina'];
            }

            if (index >= 0) {
                impresoras[index] = { ...impresora, updated_at: new Date().toISOString() };
            } else {
                impresoras.push({
                    ...impresora,
                    id: Date.now().toString(),
                    created_at: new Date().toISOString(),
                    activo: true
                });
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(impresoras));
            return true;
        } catch (error) {
            console.error('Error guardando impresora:', error);
            return false;
        }
    },

    /**
     * Elimina una impresora
     */
    deleteImpresora: (id) => {
        try {
            const impresoras = impresorasService.getImpresoras();
            const filtered = impresoras.filter(i => i.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            return false;
        }
    },

    getImpresorasPorTipo: (tipoBuscado) => {
        return impresorasService.getImpresoras().filter(i => {
            // Solo descartar si está explícitamente inactiva
            if (i.activo === false) return false;

            // Si tipos es array, verificar si incluye el tipo buscado
            if (i.tipos && Array.isArray(i.tipos)) {
                return i.tipos.includes(tipoBuscado);
            }
            // Si tiene tipo como string
            if (i.tipo) {
                return i.tipo === tipoBuscado;
            }
            // Si no tiene tipo especificado, asumimos cocina por defecto
            return tipoBuscado === 'cocina';
        });
    },

    /**
     * Obtiene la configuración de impresión automática en tiempo real
     */
    getAutoPrintConfig: () => {
        try {
            const data = localStorage.getItem('mirkos_autoprint');
            return data ? JSON.parse(data) : { activo: false, tipo: 'cocina' };
        } catch (error) {
            console.error('Error cargando configuración de auto-impresión:', error);
            return { activo: false, tipo: 'cocina' };
        }
    },

    /**
     * Guarda la configuración de impresión automática en tiempo real
     */
    saveAutoPrintConfig: (config) => {
        try {
            localStorage.setItem('mirkos_autoprint', JSON.stringify(config));
            // Disparar evento de storage para que otros componentes/hooks se enteren si es necesario
            window.dispatchEvent(new Event('autoprint_config_changed'));
            return true;
        } catch (error) {
            console.error('Error guardando configuración de auto-impresión:', error);
            return false;
        }
    }
};
