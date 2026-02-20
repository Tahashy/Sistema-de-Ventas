import React, { useState, useEffect } from 'react';
import { Printer, Plus, Trash2, CheckCircle2, XCircle, Wifi } from 'lucide-react';
import { impresorasService } from '../../../services/impresorasService';
import { impresionService } from '../../../services/impresionService';
import { showToast } from '../../../components/Toast';

const ConfiguracionImpresoras = () => {
    const [impresoras, setImpresoras] = useState([]);
    const [impresorasSistema, setImpresorasSistema] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [probando, setProbando] = useState(null);
    const [qzConectado, setQzConectado] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        ip: '', // Usaremos este campo para el nombre de la impresora en el SO
        puerto: '8080',
        tipo: 'cocina'
    });

    useEffect(() => {
        cargarImpresoras();
        verificarQZ();
    }, []);

    const verificarQZ = async () => {
        try {
            await impresionService.conectar();
            setQzConectado(true);
            const sistema = await impresionService.buscarImpresoras();
            setImpresorasSistema(sistema);
        } catch (error) {
            setQzConectado(false);
            console.error('QZ no detectado:', error);
        }
    };

    const cargarImpresoras = () => {
        setImpresoras(impresorasService.getImpresoras());
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const exito = impresorasService.saveImpresora(editando ? { ...editando, ...formData } : formData);

        if (exito) {
            showToast('Impresora guardada correctamente', 'success');
            setMostrarModal(false);
            setEditando(null);
            setFormData({ nombre: '', ip: '', puerto: '8080', tipo: 'cocina' });
            cargarImpresoras();
        } else {
            showToast('Error al guardar la impresora', 'error');
        }
    };

    const handleEliminar = (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta impresora?')) {
            impresorasService.deleteImpresora(id);
            cargarImpresoras();
            showToast('Impresora eliminada', 'success');
        }
    };

    const probarConexion = async (impresora) => {
        setProbando(impresora.id);
        try {
            const ops = impresionService.formatearTicket({
                numero_pedido: 'TEST-QZ',
                created_at: new Date().toISOString(),
                total: 0,
                pedido_items: [{ nombre: 'Prueba de Conexión', cantidad: 1, precio: 0 }]
            }, { empresa: 'SISTEMA MIRKOS' });

            await impresionService.enviarAlPlugin(ops, impresora.ip);
            showToast('¡Prueba enviada correctamente!', 'success');
        } catch (error) {
            showToast('Error al imprimir. Verifica que QZ Tray esté abierto y la impresora encendida.', 'error');
        } finally {
            setProbando(null);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>Configuración de Impresoras (QZ Tray)</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: qzConectado ? '#10B981' : '#EF4444' }} />
                        <span style={{ fontSize: '14px', color: '#718096' }}>
                            {qzConectado ? 'Agente QZ Conectado' : 'Agente QZ Desconectado'}
                        </span>
                        {!qzConectado && (
                            <button onClick={verificarQZ} style={{ fontSize: '12px', color: '#FF6B35', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => { setEditando(null); setMostrarModal(true); }}
                    style={{
                        padding: '10px 20px', backgroundColor: '#FF6B35', color: 'white',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Plus size={18} /> Agregar Impresora
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {impresoras.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', backgroundColor: '#f7fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                        <Printer size={48} style={{ color: '#a0aec0', marginBottom: '16px' }} />
                        <p style={{ color: '#718096' }}>No hay impresoras configuradas aún.</p>
                        <p style={{ fontSize: '13px', color: '#a0aec0' }}>Asegúrate de tener QZ Tray abierto para detectar tus impresoras.</p>
                    </div>
                ) : (
                    impresoras.map(imp => (
                        <div key={imp.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EBF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3182CE' }}>
                                        <Printer size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{imp.nombre}</h4>
                                        <span style={{ fontSize: '12px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: imp.tipo === 'cocina' ? '#FEF3C7' : '#D1FAE5', color: imp.tipo === 'cocina' ? '#92400E' : '#065F46', fontWeight: '600' }}>
                                            {imp.tipo}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => { setEditando(imp); setFormData(imp); setMostrarModal(true); }} style={{ padding: '6px', backgroundColor: '#E2E8F0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📝</button>
                                    <button onClick={() => handleEliminar(imp.id)} style={{ padding: '6px', backgroundColor: '#FEE2E2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '16px', fontSize: '14px', color: '#4a5568' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <Wifi size={14} /> <span style={{ fontWeight: '500' }}>Nombre Windows:</span> <span>{imp.ip}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => probarConexion(imp)}
                                disabled={probando === imp.id || !qzConectado}
                                style={{
                                    width: '100%', marginTop: '16px', padding: '8px',
                                    backgroundColor: (probando === imp.id || !qzConectado) ? '#edf2f7' : '#f0fff4',
                                    color: (probando === imp.id || !qzConectado) ? '#718096' : '#2f855a',
                                    border: `1px solid ${(probando === imp.id || !qzConectado) ? '#e2e8f0' : '#c6f6d5'}`,
                                    borderRadius: '8px', cursor: qzConectado ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600'
                                }}
                            >
                                {probando === imp.id ? 'Probando...' : '⚡ Probar Impresión'}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {mostrarModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 20px 0' }}>{editando ? 'Editar Impresora' : 'Nueva Impresora'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: '600' }}>Nombre Descriptivo (Sistema)</label>
                                <input
                                    required
                                    placeholder="Ej: Cocina Principal"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: '600' }}>Seleccionar Dispositivo (Windows)</label>
                                {impresorasSistema.length > 0 ? (
                                    <select
                                        required
                                        value={formData.ip}
                                        onChange={e => setFormData({ ...formData, ip: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                    >
                                        <option value="">-- Selecciona una impresora --</option>
                                        {impresorasSistema.map(nombre => (
                                            <option key={nombre} value={nombre}>{nombre}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '12px' }}>
                                        No se detectaron impresoras. Asegúrate de que QZ Tray esté abierto y tengas impresoras instaladas en Windows.
                                    </div>
                                )}
                                <p style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>El nombre debe coincidir exactamente con el de Impresoras del Panel de Control.</p>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: '600' }}>Tipo de Comprobante</label>
                                <select
                                    value={formData.tipo}
                                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                >
                                    <option value="cocina">Comandas (Cocina)</option>
                                    <option value="caja">Recibos (Caja)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setMostrarModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={!qzConectado} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: qzConectado ? '#FF6B35' : '#a0aec0', color: 'white', fontWeight: '600', cursor: qzConectado ? 'pointer' : 'not-allowed' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfiguracionImpresoras;
