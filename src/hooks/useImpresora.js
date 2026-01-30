import { useState, useCallback, useRef, useEffect } from 'react';

export const useImpresora = () => {
    const [imprimiendo, setImprimiendo] = useState(false);
    const iframeRef = useRef(null);

    // Crear iframe oculto al montar
    useEffect(() => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.style.zIndex = '-1'; // Detrás de todo
        document.body.appendChild(iframe);
        iframeRef.current = iframe;

        return () => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        };
    }, []);

    const imprimir = useCallback(async (contentRef) => {
        if (!contentRef.current || !iframeRef.current) return;

        setImprimiendo(true);

        try {
            const content = contentRef.current.innerHTML;
            const doc = iframeRef.current.contentWindow.document;

            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Impresión</title>
                    <style>
                        @page { margin: 0; size: auto; }
                        body { margin: 0; padding: 0; font-family: monospace; }
                        ${getEstilosImpresion()}
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        // Esperar a que carguen imagenes si las hubiera, aunque para tickets es texto mayormente
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                // Opcional: Avisar al padre que terminó, pero window.print es bloqueante en muchos navegadores
                            }, 100);
                        }
                    </script>
                </body>
                </html>
            `);
            doc.close();

            // En Chrome, print() bloquea JS, así que esto se ejecuta después (o inmediatamente si es async)
            // Damos un pequeño delay para resetear estado
            setTimeout(() => {
                setImprimiendo(false);
            }, 1000);

        } catch (error) {
            console.error('Error al imprimir:', error);
            setImprimiendo(false);
        }
    }, []);

    return { imprimir, imprimiendo };
};

// Estilos globales para el ticket dentro del iframe
const getEstilosImpresion = () => `
    .ticket-print {
        width: 100%;
        max-width: 80mm;
        margin: 0 auto;
        padding-bottom: 20px;
    }
    .no-print { display: none !important; }
    
    /* Utilidades simples si se necesitan */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { fontWeight: bold; }
`;

export default useImpresora;
