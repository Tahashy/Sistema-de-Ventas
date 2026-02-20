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

    /**
     * Obtiene impresoras por tipo (cocina, caja, etc.)
     */
    getImpresorasPorTipo: (tipo) => {
        return impresorasService.getImpresoras().filter(i => i.tipo === tipo && i.activo);
    }
};
