// src/modules/pedidos/components/ModalPersonalizarProducto.jsx

import React, { useState } from 'react';
import { X, Minus, Plus, MessageSquare } from 'lucide-react';
import { formatearMoneda } from '../utils/pedidoHelpers';
import { showToast } from '../../../components/Toast';

const ModalPersonalizarProducto = ({ producto, onClose, onConfirmar }) => {
    const [cantidad, setCantidad] = useState(1);
    const [notas, setNotas] = useState('');
    // agregadosSeleccionados: array plano de { nombre, precio, grupo_id?, grupo_nombre? }
    const [agregadosSeleccionados, setAgregadosSeleccionados] = useState([]);

    // Separar grupos y simples del producto
    const todosLosAgregados = producto.agregados || [];
    const grupos = todosLosAgregados.filter(a => a.tipo === 'grupo');
    // Retrocompatible: sin tipo o tipo 'simple'
    const simples = todosLosAgregados.filter(a => a.tipo === 'simple' || !a.tipo);
    const limiteSimples = producto.limite_agregados || 0;
    const hayAgregados = todosLosAgregados.length > 0;

    const getSeleccionadosPorGrupo = (grupoId) =>
        agregadosSeleccionados.filter(a => a.grupo_id === grupoId);

    const getSeleccionadosSimples = () =>
        agregadosSeleccionados.filter(a => !a.grupo_id);

    // ── Handlers Simples ──────────────────────────────────────────────────────

    const agregarSimple = (agregado) => {
        const selSimples = getSeleccionadosSimples();
        const totalSimples = selSimples.reduce((s, a) => s + (a.cantidad || 1), 0);
        if (limiteSimples > 0 && totalSimples >= limiteSimples) {
            showToast(`Solo puedes elegir hasta ${limiteSimples} opciones simples.`, 'warning');
            return;
        }
        const existe = selSimples.find(a => a.nombre === agregado.nombre);
        if (existe) {
            setAgregadosSeleccionados(prev =>
                prev.map(a => (!a.grupo_id && a.nombre === agregado.nombre)
                    ? { ...a, cantidad: (a.cantidad || 1) + 1 } : a)
            );
        } else {
            setAgregadosSeleccionados(prev => [...prev, { ...agregado, cantidad: 1 }]);
        }
    };

    const restarSimple = (agregado, e) => {
        e.stopPropagation();
        const existe = agregadosSeleccionados.find(a => !a.grupo_id && a.nombre === agregado.nombre);
        if (!existe) return;
        if ((existe.cantidad || 1) > 1) {
            setAgregadosSeleccionados(prev =>
                prev.map(a => (!a.grupo_id && a.nombre === agregado.nombre)
                    ? { ...a, cantidad: a.cantidad - 1 } : a)
            );
        } else {
            setAgregadosSeleccionados(prev =>
                prev.filter(a => !(a.nombre === agregado.nombre && !a.grupo_id))
            );
        }
    };

    // ── Handlers Grupos ───────────────────────────────────────────────────────

    const toggleOpcionGrupo = (grupo, opcion) => {
        const selGrupo = getSeleccionadosPorGrupo(grupo.id);
        const yaEsta = selGrupo.find(a => a.nombre === opcion.nombre);

        if (yaEsta) {
            setAgregadosSeleccionados(prev =>
                prev.filter(a => !(a.grupo_id === grupo.id && a.nombre === opcion.nombre))
            );
        } else {
            if (grupo.limite && selGrupo.length >= grupo.limite) {
                if (grupo.limite === 1) {
                    // Reemplazar la única selección
                    setAgregadosSeleccionados(prev => [
                        ...prev.filter(a => a.grupo_id !== grupo.id),
                        { ...opcion, cantidad: 1, grupo_id: grupo.id, grupo_nombre: grupo.nombre }
                    ]);
                    return;
                }
                showToast(`Solo puedes elegir ${grupo.limite} opciones en "${grupo.nombre}".`, 'warning');
                return;
            }
            setAgregadosSeleccionados(prev => [
                ...prev,
                { ...opcion, cantidad: 1, grupo_id: grupo.id, grupo_nombre: grupo.nombre }
            ]);
        }
    };

    // ── Totales ───────────────────────────────────────────────────────────────

    const calcularTotal = () => {
        const precioBase = parseFloat(producto.precio || 0);
        const precioAgregados = agregadosSeleccionados.reduce(
            (sum, a) => sum + (parseFloat(a.precio || 0) * (a.cantidad || 1)), 0
        );
        return (precioBase + precioAgregados) * cantidad;
    };

    const handleConfirmar = () => {
        onConfirmar({
            ...producto,
            cantidad,
            notas,
            agregados: agregadosSeleccionados,
            precioUnitarioFinal: parseFloat(producto.precio) +
                agregadosSeleccionados.reduce((sum, a) => sum + (parseFloat(a.precio || 0) * (a.cantidad || 1)), 0),
            subtotal: calcularTotal()
        });
    };

    const isMobile = window.innerWidth < 640;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: isMobile ? 0 : '20px'
        }}>
            <style>{`
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .opt-chip { transition: all 0.15s ease; }
                .opt-chip:hover { transform: translateY(-1px); }
            `}</style>
            <div style={{
                backgroundColor: 'white',
                borderRadius: isMobile ? '0' : '16px',
                width: '100%', maxWidth: '480px',
                height: isMobile ? '100%' : 'auto',
                maxHeight: isMobile ? '100%' : '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c', fontWeight: '800' }}>
                        Personalizar Producto
                    </h3>
                    <button onClick={onClose} style={{ background: '#f7fafc', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={20} color="#718096" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {/* Info producto */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '1.4rem', fontWeight: '800' }}>{producto.nombre}</h2>
                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FF6B35', backgroundColor: '#fff5f0', padding: '4px 14px', borderRadius: '999px' }}>
                            {formatearMoneda(producto.precio)}
                        </span>
                    </div>

                    {hayAgregados && (
                        <div style={{ marginBottom: '20px' }}>

                            {/* ── GRUPOS DE OPCIONES ── */}
                            {grupos.map((grupo) => {
                                const selGrupo = getSeleccionadosPorGrupo(grupo.id);
                                return (
                                    <div key={grupo.id} style={{ marginBottom: '18px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #e0e7ff' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '11px', background: '#6366F1', color: 'white', borderRadius: '6px', padding: '2px 8px', fontWeight: '700', textTransform: 'uppercase' }}>Grupo</span>
                                                <span style={{ fontSize: '15px', fontWeight: '700', color: '#3730a3' }}>{grupo.nombre}</span>
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: selGrupo.length > 0 ? '#6366F1' : '#94a3b8', background: selGrupo.length > 0 ? '#e0e7ff' : '#f1f5f9', padding: '3px 8px', borderRadius: '10px' }}>
                                                {selGrupo.length}/{grupo.limite}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {grupo.opciones.map((op) => {
                                                const isSelected = selGrupo.some(a => a.nombre === op.nombre);
                                                return (
                                                    <div key={op.id} className="opt-chip"
                                                        onClick={() => toggleOpcionGrupo(grupo, op)}
                                                        style={{
                                                            padding: '8px 14px', borderRadius: '20px',
                                                            border: `2px solid ${isSelected ? '#6366F1' : '#e2e8f0'}`,
                                                            backgroundColor: isSelected ? '#eef2ff' : 'white',
                                                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                            minWidth: '80px', boxShadow: isSelected ? '0 2px 8px rgba(99,102,241,0.2)' : 'none',
                                                        }}>
                                                        {isSelected && <span style={{ fontSize: '10px', fontWeight: '800', color: '#4338ca', marginBottom: '2px' }}>✓</span>}
                                                        <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#3730a3' : '#4a5568' }}>{op.nombre}</span>
                                                        {parseFloat(op.precio) > 0 && (
                                                            <span style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? '#6366F1' : '#a0aec0' }}>+{formatearMoneda(op.precio)}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* ── OPCIONES SIMPLES ── */}
                            {simples.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #d1fae5' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#065f46' }}>Extras opcionales</span>
                                        {limiteSimples > 0 && (
                                            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600', background: '#f0fdf4', padding: '3px 8px', borderRadius: '10px' }}>
                                                Máx: {limiteSimples} ({getSeleccionadosSimples().reduce((s, a) => s + (a.cantidad || 1), 0)}/{limiteSimples})
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {simples.map((agregado, idx) => {
                                            const item = agregadosSeleccionados.find(a => !a.grupo_id && a.nombre === agregado.nombre);
                                            const cantidadActual = item ? item.cantidad || 1 : 0;
                                            const isSelected = cantidadActual > 0;
                                            const reachedLimit = limiteSimples > 0 && getSeleccionadosSimples().reduce((s, a) => s + (a.cantidad || 1), 0) >= limiteSimples;
                                            return (
                                                <div key={idx} className="opt-chip"
                                                    onClick={() => { if (!reachedLimit || isSelected) agregarSimple(agregado); }}
                                                    style={{
                                                        position: 'relative', padding: '8px 14px', borderRadius: '20px',
                                                        border: `1.5px solid ${isSelected ? '#bbf7d0' : '#e2e8f0'}`,
                                                        backgroundColor: isSelected ? '#f0fdf4' : 'white',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                        cursor: (reachedLimit && !isSelected) ? 'not-allowed' : 'pointer',
                                                        minWidth: '80px', boxShadow: isSelected ? '0 2px 4px rgba(16,185,129,0.1)' : 'none',
                                                        opacity: (reachedLimit && !isSelected) ? 0.5 : 1
                                                    }}>
                                                    {isSelected && (
                                                        <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#EF4444', color: 'white', fontSize: '11px', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>x{cantidadActual}</div>
                                                    )}
                                                    <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#166534' : '#4a5568', marginTop: isSelected ? '4px' : '0' }}>{agregado.nombre}</span>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? '#10B981' : '#a0aec0' }}>+{formatearMoneda(agregado.precio)}</span>
                                                    {isSelected && (
                                                        <button onClick={(e) => restarSimple(agregado, e)} style={{ marginTop: '6px', background: 'white', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                            <Minus size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notas */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={18} /> Notas o instrucciones
                        </h4>
                        <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
                            placeholder="Ej: Sin cebolla, poca sal..."
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', minHeight: '70px', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
                        <button onClick={() => cantidad > 1 && setCantidad(cantidad - 1)} style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f7fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={24} color="#4a5568" />
                        </button>
                        <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#2d3748', width: '60px', textAlign: 'center' }}>{cantidad}</span>
                        <button onClick={() => setCantidad(cantidad + 1)} style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FF6B35', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
                            <Plus size={24} color="white" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <button onClick={handleConfirmar} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', border: 'none', color: 'white', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Agregar al Pedido</span>
                        <span>{formatearMoneda(calcularTotal())}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalPersonalizarProducto;

