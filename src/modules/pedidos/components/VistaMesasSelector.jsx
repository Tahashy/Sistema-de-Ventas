
import React, { useState, useEffect } from 'react';
import { getSalas } from '../../../services/mesasService';
import { X, User, MapPin } from 'lucide-react';
import { showToast } from '../../../components/Toast';

const VistaMesasSelector = ({ restauranteId, onSelect, onClose }) => {
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarMesas();
    }, [restauranteId]);

    const cargarMesas = async () => {
        try {
            const { data: salasData, error } = await getSalas(restauranteId);
            if (error) throw error;
            setSalas(salasData || []);
        } catch (error) {
            console.error('Error cargando mesas:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '100%', maxWidth: '900px',
                borderRadius: '16px', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                maxHeight: '90vh'
            }}>
                <div style={{
                    padding: '20px', borderBottom: '1px solid #E5E7EB',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Seleccionar Mesa</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{
                    padding: '20px', overflowY: 'auto',
                    flex: 1
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <p>Cargando mesas...</p>
                        </div>
                    ) : salas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                            <p>No hay mesas configuradas.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {salas.map(sala => (
                                <div key={sala.id}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        marginBottom: '16px', paddingBottom: '8px',
                                        borderBottom: '2px solid #F3F4F6'
                                    }}>
                                        <MapPin size={20} color="#4B5563" />
                                        <h4 style={{ margin: 0, fontSize: '18px', color: '#374151' }}>{sala.nombre}</h4>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                        gap: '16px'
                                    }}>
                                        {sala.mesas && sala.mesas.length > 0 ? (
                                            sala.mesas.map(mesa => {
                                                const isDisponible = mesa.estado === 'disponible';
                                                return (
                                                    <div
                                                        key={mesa.id}
                                                        onClick={() => {
                                                            if (isDisponible) {
                                                                onSelect(mesa);
                                                            } else {
                                                                showToast('Esta mesa está ocupada', 'warning');
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '16px', borderRadius: '12px',
                                                            border: `2px solid ${isDisponible ? '#10B981' : '#EF4444'} `,
                                                            backgroundColor: isDisponible ? '#ECFDF5' : '#FEF2F2',
                                                            cursor: isDisponible ? 'pointer' : 'not-allowed',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                                            transition: 'transform 0.2s',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (isDisponible) e.currentTarget.style.transform = 'translateY(-2px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1F2937' }}>{mesa.numero_mesa}</span>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px',
                                                            color: isDisponible ? '#059669' : '#DC2626',
                                                            fontWeight: '600'
                                                        }}>
                                                            <User size={14} />
                                                            {isDisponible ? 'Libre' : 'Ocupada'}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p style={{ color: '#9CA3AF', fontStyle: 'italic', gridColumn: '1/-1' }}>
                                                No hay mesas en esta sala.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VistaMesasSelector;
