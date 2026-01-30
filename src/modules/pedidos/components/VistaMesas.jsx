// src/modules/pedidos/components/VistaMesas.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, User, Plus, Edit, Trash2, Save, X, LayoutGrid } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import {
    getSalas,
    createSala,
    deleteSala,
    agregarMesa,
    eliminarMesa,
    updateMesa
} from '../../../services/mesasService';
import { showToast } from '../../../components/Toast';
import useWindowSize from '../../../hooks/useWindowSize';
import ConfirmationModal from '../../../components/ConfirmationModal';

const VistaMesas = ({ restauranteId, onMesaClick }) => {
    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modoEdicion, setModoEdicion] = useState(false);
    const { isMobile } = useWindowSize();

    // Estados para modales
    const [mostrarModalSala, setMostrarModalSala] = useState(false);
    const [nuevaSalaNombre, setNuevaSalaNombre] = useState('');

    // Estados para modales custom
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const [modalEditarMesa, setModalEditarMesa] = useState({ isOpen: false, mesa: null, nombre: '' });

    // Definir cargarMesas ANTES del useEffect que lo usa
    const cargarMesas = useCallback(async () => {
        const { data, error } = await getSalas(restauranteId);
        if (error) {
            console.error(error);
            showToast('Error cargando mesas', 'error');
        } else {
            setSalas(data || []);
        }
        setLoading(false);
    }, [restauranteId]);

    useEffect(() => {
        cargarMesas();

        // Suscripción Realtime
        const subscription = supabase
            .channel('mesas_db_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => {
                // console.log('Cambio en mesas:', payload);
                cargarMesas(); // Recargar al recibir cambios
            })
            .subscribe();

        if (!modoEdicion) {
            const interval = setInterval(cargarMesas, 30000); // Fallback polling
            return () => {
                clearInterval(interval);
                subscription.unsubscribe();
            };
        }

        return () => {
            subscription.unsubscribe();
        };
    }, [restauranteId, modoEdicion, cargarMesas]);

    // --- CRUD SALAS ---
    const handleCrearSala = async () => {
        if (!nuevaSalaNombre.trim()) return;

        const { error } = await createSala(restauranteId, nuevaSalaNombre, 1); // Crea con 1 mesa por defecto
        if (error) {
            showToast('Error creando sala', 'error');
        } else {
            showToast('Sala creada exitosamente', 'success');
            setNuevaSalaNombre('');
            setMostrarModalSala(false);
            cargarMesas();
        }
    };

    const handleEliminarSala = (salaId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Sala',
            message: '¿Seguro que deseas eliminar esta sala y todas sus mesas? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: async () => {
                const { error } = await deleteSala(salaId);
                if (error) {
                    showToast(error.message || 'Error eliminando sala', 'error');
                } else {
                    showToast('Sala eliminada', 'success');
                    cargarMesas();
                }
            }
        });
    };

    // --- CRUD MESAS ---
    const handleAgregarMesa = async (salaId, cantidadActual) => {
        const numero = cantidadActual + 1;
        const nombreMesa = `Mesa ${numero}`; // Lógica simple, se puede mejorar

        const { error } = await agregarMesa(salaId, nombreMesa);
        if (error) {
            showToast('Error agregando mesa', 'error');
        } else {
            showToast('Mesa agregada', 'success');
            cargarMesas();
        }
    };

    const ejecutarEliminacionMesa = async (mesaId, force = false) => {
        const { error } = await eliminarMesa(mesaId, force);
        if (error) {
            if (!force && (error.code === 'BUSY_TABLE' || error.message === 'Mesa ocupada')) {
                // Abrir segundo modal de confirmación para forzar
                setConfirmModal({
                    isOpen: true,
                    title: 'Mesa Ocupada',
                    message: 'La mesa está ocupada o bloqueada. ¿Deseas eliminarla de todos modos? Se perderá el enlace con el pedido actual.',
                    type: 'warning',
                    onConfirm: () => ejecutarEliminacionMesa(mesaId, true)
                });
            } else {
                showToast(error.message || 'Error eliminando mesa', 'error');
            }
        } else {
            showToast(force ? 'Mesa eliminada forzosamente' : 'Mesa eliminada', 'success');
            cargarMesas();
        }
    };

    const handleEliminarMesa = (mesaId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Mesa',
            message: '¿Estás seguro de eliminar esta mesa?',
            type: 'danger',
            onConfirm: () => ejecutarEliminacionMesa(mesaId, false)
        });
    };

    const handleEditarNombreMesa = (mesa) => {
        setModalEditarMesa({ isOpen: true, mesa, nombre: mesa.numero_mesa });
    };

    const guardarNombreMesa = async () => {
        const { mesa, nombre } = modalEditarMesa;
        if (nombre && nombre !== mesa.numero_mesa) {
            const { error } = await updateMesa(mesa.id, { numero_mesa: nombre });
            if (error) {
                showToast('Error al actualizar mesa', 'error');
            } else {
                showToast('Mesa actualizada', 'success');
                cargarMesas();
                setModalEditarMesa({ isOpen: false, mesa: null, nombre: '' });
            }
        } else {
            setModalEditarMesa({ isOpen: false, mesa: null, nombre: '' });
        }
    };

    const calcularTiempoTranscurrido = (horaInicio) => {
        if (!horaInicio) return '';

        // Supabase guarda en UTC normalizado (Zulu time 2024-01-01T12:00:00Z)
        // O dependiendo de configuración, pero Date() parsea correctamente ISO string
        const inicio = new Date(horaInicio).getTime();
        const ahora = Date.now(); // UTC Timestamp local

        // Si inicio es futuro (reloj desincronizado), mostramos 0m
        if (inicio > ahora) return '0m';

        const diffMinutes = Math.floor((ahora - inicio) / 1000 / 60);

        if (diffMinutes < 0) return '0m';
        if (diffMinutes < 60) return `${diffMinutes}m`;

        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Cargando mesas...</div>;

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1600px', margin: '0 auto' }}>

            {/* Header de Acciones */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px',
                backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a202c' }}>Mesas y Salas</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#718096' }}>
                        {modoEdicion ? '🔨 Modo Edición Activado' : 'Vista en tiempo real'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {modoEdicion ? (
                        <>
                            <button
                                onClick={() => setMostrarModalSala(true)}
                                style={{
                                    padding: '10px 16px', borderRadius: '8px', border: 'none',
                                    backgroundColor: '#FF6B35', color: 'white', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                                }}
                            >
                                <Plus size={18} /> Nueva Sala
                            </button>
                            <button
                                onClick={() => setModoEdicion(false)}
                                style={{
                                    padding: '10px 16px', borderRadius: '8px', border: '2px solid #E2E8F0',
                                    backgroundColor: 'white', color: '#4A5568', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                                }}
                            >
                                <Save size={18} /> Terminar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setModoEdicion(true)}
                            style={{
                                padding: '10px 16px', borderRadius: '8px', border: '2px solid #E2E8F0',
                                backgroundColor: 'white', color: '#4A5568', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                            }}
                        >
                            <LayoutGrid size={18} /> Editar Distribución
                        </button>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {salas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f7fafc', borderRadius: '12px' }}>
                    <p style={{ color: '#718096', marginBottom: '16px' }}>No hay mesas configuradas</p>
                    <button
                        onClick={() => { setModoEdicion(true); setMostrarModalSala(true); }}
                        style={{ padding: '10px 20px', background: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Comenzar a configurar
                    </button>
                </div>
            )}

            {/* Listado de Salas */}
            {salas.map(sala => (
                <div key={sala.id} style={{ marginBottom: '32px' }}>
                    {/* Header Sala */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'
                    }}>
                        <h3 style={{ margin: '0, fontSize: 18px, fontWeight: 700, color: #2D3748' }}>
                            {sala.nombre}
                        </h3>
                        {modoEdicion ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleAgregarMesa(sala.id, sala.mesas.length)}
                                    style={{
                                        padding: '6px 12px', fontSize: '13px', borderRadius: '6px',
                                        background: '#E6FFFA', color: '#059669', border: '1px solid #059669',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                >
                                    <Plus size={14} /> Mesa
                                </button>
                                <button
                                    onClick={() => handleEliminarSala(sala.id)}
                                    style={{
                                        padding: '6px', borderRadius: '6px', background: '#FFF5F5',
                                        color: '#C53030', border: '1px solid #C53030', cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <span style={{ fontSize: '14px', color: '#718096', fontWeight: '500' }}>
                                {sala.mesas.filter(m => m.estado === 'disponible').length}/{sala.mesas.length} libres
                            </span>
                        )}
                    </div>

                    {/* Grid de Mesas */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '16px'
                    }}>
                        {sala.mesas.map(mesa => (
                            <div key={mesa.id} style={{ position: 'relative' }}>
                                <TarjetaMesa
                                    mesa={mesa}
                                    onClick={() => !modoEdicion && onMesaClick(mesa)}
                                    calcularTiempo={calcularTiempoTranscurrido}
                                    isMobile={isMobile}
                                    disabled={modoEdicion}
                                />
                                {modoEdicion && (
                                    <div style={{ position: 'absolute', top: '-8px', right: '-8px', display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => handleEditarNombreMesa(mesa)}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: '#3B82F6', color: 'white', border: '2px solid white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            title="Editar Nombre"
                                        >
                                            <Edit size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleEliminarMesa(mesa.id)}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: '#EF4444', color: 'white', border: '2px solid white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            title="Eliminar Mesa"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Botón flotante agregar mesa si estamos en modo edición y no hay mesas */}
                        {modoEdicion && sala.mesas.length === 0 && (
                            <button
                                onClick={() => handleAgregarMesa(sala.id, 0)}
                                style={{
                                    height: '140px', border: '2px dashed #CBD5E0', borderRadius: '12px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: '#718096', background: 'transparent', cursor: 'pointer'
                                }}
                            >
                                <Plus size={24} style={{ marginBottom: '8px' }} />
                                Agg Mesa
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/* Modal Nueva Sala */}
            {
                mostrarModalSala && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '320px' }}>
                            <h3 style={{ margin: '0 0 16px 0' }}>Nueva Sala</h3>
                            <input
                                autoFocus
                                placeholder="Nombre (ej: Terraza)"
                                value={nuevaSalaNombre}
                                onChange={(e) => setNuevaSalaNombre(e.target.value)}
                                style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #CBD5E0' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setMostrarModalSala(false)}
                                    style={{ flex: 1, padding: '10px', background: '#EDF2F7', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCrearSala}
                                    style={{ flex: 1, padding: '10px', background: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Crear
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal Editar Mesa */}
            {
                modalEditarMesa.isOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '320px' }}>
                            <h3 style={{ margin: '0 0 16px 0' }}>Editar Nombre Mesa</h3>
                            <input
                                autoFocus
                                placeholder="Nombre (ej: Mesa 1)"
                                value={modalEditarMesa.nombre}
                                onChange={(e) => setModalEditarMesa({ ...modalEditarMesa, nombre: e.target.value })}
                                style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #CBD5E0' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setModalEditarMesa({ isOpen: false, mesa: null, nombre: '' })}
                                    style={{ flex: 1, padding: '10px', background: '#EDF2F7', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarNombreMesa}
                                    style={{ flex: 1, padding: '10px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />
        </div >
    );
};

// Componente TarjetaMesa (Simplificado para brevedad, mantener estilos originales)
const TarjetaMesa = ({ mesa, onClick, calcularTiempo, disabled }) => {
    const disponible = mesa.estado === 'disponible';

    return (
        <div
            onClick={disabled ? null : onClick}
            style={{
                padding: '20px', borderRadius: '12px', background: 'white',
                border: `2px solid ${disponible ? '#10B981' : '#EF4444'}`,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s'
            }}
            onMouseEnter={e => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🪑</span>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700' }}>{mesa.numero_mesa}</h4>
                {!disponible && mesa.hora_inicio && (
                    <span style={{ fontSize: '12px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Clock size={12} /> {calcularTiempo(mesa.hora_inicio)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default VistaMesas;
