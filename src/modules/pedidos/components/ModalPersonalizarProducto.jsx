// src/modules/pedidos/components/ModalPersonalizarProducto.jsx

import React, { useState } from 'react';
import { X, Minus, Plus, MessageSquare } from 'lucide-react';
import { formatearMoneda } from '../utils/pedidoHelpers';

const ModalPersonalizarProducto = ({ producto, onClose, onConfirmar }) => {
    const [cantidad, setCantidad] = useState(1);
    const [notas, setNotas] = useState('');
    const [agregadosSeleccionados, setAgregadosSeleccionados] = useState([]);

    // Agregados disponibles del producto (si existen)
    // Asumimos que producto.agregados es un array de objetos { nombre, precio }
    // O si vienen de otra tabla, ajustamos. Por ahora asumimos estructura simple.
    const agregadosDisponibles = producto.agregados || [];

    const toggleAgregado = (agregado) => {
        const existe = agregadosSeleccionados.find(a => a.nombre === agregado.nombre);
        if (existe) {
            setAgregadosSeleccionados(agregadosSeleccionados.filter(a => a.nombre !== agregado.nombre));
        } else {
            setAgregadosSeleccionados([...agregadosSeleccionados, agregado]);
        }
    };

    const calcularTotal = () => {
        const precioBase = parseFloat(producto.precio || 0);
        const precioAgregados = agregadosSeleccionados.reduce((sum, a) => sum + parseFloat(a.precio || 0), 0);
        return (precioBase + precioAgregados) * cantidad;
    };

    const handleConfirmar = () => {
        onConfirmar({
            ...producto,
            cantidad,
            notas,
            agregados: agregadosSeleccionados,
            precioUnitarioFinal: parseFloat(producto.precio) + agregadosSeleccionados.reduce((sum, a) => sum + parseFloat(a.precio), 0),
            subtotal: calcularTotal()
        });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '16px',
                width: '100%', maxWidth: '450px',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>
                        Personalizar Producto
                    </h3>
                    <button onClick={onClose} style={{
                        background: '#f7fafc', border: 'none', borderRadius: '8px',
                        width: '32px', height: '32px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <X size={20} color="#718096" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {/* Producto Info */}
                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '1.5rem' }}>
                            {producto.nombre}
                        </h2>
                        <span style={{
                            fontSize: '1.25rem', fontWeight: '700', color: '#FF6B35',
                            backgroundColor: '#fff5f0', padding: '4px 12px', borderRadius: '999px'
                        }}>
                            {formatearMoneda(producto.precio)}
                        </span>
                    </div>

                    {/* Agregados */}
                    {agregadosDisponibles.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#4a5568' }}>
                                Agregados
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {agregadosDisponibles.map((agregado, idx) => {
                                    const isSelected = agregadosSeleccionados.find(a => a.nombre === agregado.nombre);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => toggleAgregado(agregado)}
                                            style={{
                                                padding: '12px', borderRadius: '10px',
                                                border: `2px solid ${isSelected ? '#FF6B35' : '#e2e8f0'}`,
                                                backgroundColor: isSelected ? '#fff5f0' : 'white',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <span style={{ fontWeight: isSelected ? '600' : '400', color: isSelected ? '#FF6B35' : '#4a5568' }}>
                                                {agregado.nombre}
                                            </span>
                                            <span style={{ fontWeight: '600', color: '#4a5568' }}>
                                                +{formatearMoneda(agregado.precio)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Notas */}
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={18} /> Notas o instrucciones
                        </h4>
                        <textarea
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Ej: Sin cebolla, poca sal..."
                            style={{
                                width: '100%', padding: '12px', borderRadius: '10px',
                                border: '2px solid #e2e8f0', minHeight: '80px',
                                fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
                        <button
                            onClick={() => cantidad > 1 && setCantidad(cantidad - 1)}
                            style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: '#f7fafc', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <Minus size={24} color="#4a5568" />
                        </button>
                        <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#2d3748', width: '60px', textAlign: 'center' }}>
                            {cantidad}
                        </span>
                        <button
                            onClick={() => setCantidad(cantidad + 1)}
                            style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: '#FF6B35', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(255,107,53,0.3)'
                            }}
                        >
                            <Plus size={24} color="white" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <button
                        onClick={handleConfirmar}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                            border: 'none', color: 'white', fontSize: '1.1rem', fontWeight: '700',
                            cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                    >
                        <span>Agregar al Pedido</span>
                        <span>{formatearMoneda(calcularTotal())}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalPersonalizarProducto;
