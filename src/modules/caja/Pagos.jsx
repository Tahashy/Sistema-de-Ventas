// src/modules/caja/Pagos.jsx

import React, { useState } from 'react';
import { usePagos } from './hooks/usePagos';
import ModalDetallePago from './components/ModalDetallePago';
import {
    Search, Calendar, Filter, Download,
    CreditCard, DollarSign, TrendingUp, ShoppingBag,
    Eye, Smartphone
} from 'lucide-react';
import { formatearMoneda, formatearFechaHora } from '../pedidos/utils/pedidoHelpers';

const Pagos = ({ restauranteId }) => {
    const {
        pagos,
        loading,
        estadisticas,
        filtros,
        actualizarFiltros,
        realizarBusqueda,
        exportarExcel
    } = usePagos(restauranteId);

    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Reset to page 1 when pagos changes (filters, search)
    React.useEffect(() => {
        setCurrentPage(1);
    }, [pagos.length]);

    // Calculate pagination
    const totalPages = Math.ceil(pagos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPagos = pagos.slice(startIndex, endIndex);

    const handleSearch = (e) => {
        realizarBusqueda(e.target.value);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Header & Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <StatsCard
                    title="Ventas Totales"
                    value={formatearMoneda(estadisticas?.totalVentas || 0)}
                    icon={DollarSign}
                    color="#10b981"
                    subtext={`${estadisticas?.cantidadPedidos || 0} pedidos`}
                />
                <StatsCard
                    title="Ticket Promedio"
                    value={formatearMoneda(estadisticas?.ticketPromedio || 0)}
                    icon={TrendingUp}
                    color="#3b82f6"
                />
                <StatsCard
                    title="Efectivo"
                    value={formatearMoneda(estadisticas?.porMetodoPago?.efectivo || 0)}
                    icon={CreditCard}
                    color="#f59e0b"
                />
                <StatsCard
                    title="Tarjetas"
                    value={formatearMoneda(estadisticas?.porMetodoPago?.tarjeta || 0)}
                    icon={CreditCard}
                    color="#8b5cf6"
                />
                <StatsCard
                    title="Yape/Plin"
                    value={formatearMoneda((estadisticas?.porMetodoPago?.yape || 0) + (estadisticas?.porMetodoPago?.plin || 0))}
                    icon={Smartphone}
                    color="#d946ef"
                />
                <StatsCard
                    title="Bebidas"
                    value={formatearMoneda(estadisticas?.totalBebidas || 0)}
                    icon={ShoppingBag}
                    color="#FF6B35"
                    subtext="Total recaudado"
                />
            </div>

            {/* Filters & Actions Bar */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                alignItems: 'center'
            }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Buscar por # pedido o cliente..."
                        onChange={handleSearch}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 40px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.95rem'
                        }}
                    />
                </div>

                {/* Date Filter */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Calendar size={18} color="#64748b" />
                    <input
                        type="date"
                        value={filtros.fechaInicio}
                        onChange={(e) => actualizarFiltros({ fechaInicio: e.target.value })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <span style={{ color: '#94a3b8' }}>-</span>
                    <input
                        type="date"
                        value={filtros.fechaFin}
                        onChange={(e) => actualizarFiltros({ fechaFin: e.target.value })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={filtros.metodoPago}
                    onChange={(e) => actualizarFiltros({ metodoPago: e.target.value })}
                    style={{ padding: '9px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                >
                    <option value="todos">Todos los Métodos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="transferencia">Transferencia</option>
                </select>

                <button
                    onClick={exportarExcel}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 16px',
                        backgroundColor: '#1e293b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    <Download size={18} /> Exportar
                </button>
            </div>

            {/* Table */}
            <div style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ overflowX: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <Th>Pedido</Th>
                                <Th>Fecha</Th>
                                <Th>Cliente</Th>
                                <Th>Tipo</Th>
                                <Th>Total</Th>
                                <Th>Método Pago</Th>
                                <Th>Estado</Th>
                                <Th>Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                        Cargando historial...
                                    </td>
                                </tr>
                            ) : currentPagos.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            ) : (
                                currentPagos.map((pago) => (
                                    <tr key={pago.id} style={{ borderBottom: '1px solid #f1f5f9', ':hover': { backgroundColor: '#f8fafc' } }}>
                                        <Td style={{ fontWeight: '600' }}>#{pago.numero_pedido}</Td>
                                        <Td>{formatearFechaHora(pago.fecha_finalizacion || pago.created_at)}</Td>
                                        <Td>{pago.cliente_nombre || 'General'}</Td>
                                        <Td>
                                            <BadgeType type={pago.tipo_servicio} />
                                        </Td>
                                        <Td style={{ fontWeight: '600' }}>{formatearMoneda(pago.total)}</Td>
                                        <Td style={{ textTransform: 'capitalize' }}>{pago.metodo_pago}</Td>
                                        <Td>
                                            <BadgeStatus status={pago.estado} />
                                        </Td>
                                        <Td>
                                            <button
                                                onClick={() => setPedidoSeleccionado(pago)}
                                                style={{
                                                    padding: '6px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e2e8f0',
                                                    backgroundColor: 'white',
                                                    cursor: 'pointer',
                                                    color: '#475569'
                                                }}
                                                title="Ver Detalles"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && pagos.length > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderTop: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        {/* Info */}
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            Mostrando {startIndex + 1} - {Math.min(endIndex, pagos.length)} de {pagos.length} registros
                        </div>

                        {/* Items per page */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Por página:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        {/* Page navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    fontSize: '0.85rem'
                                }}
                            >
                                ««
                            </button>
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    fontSize: '0.85rem'
                                }}
                            >
                                «
                            </button>

                            {getPageNumbers().map((page) => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    style={{
                                        padding: '8px 12px',
                                        border: currentPage === page ? '2px solid #FF6B35' : '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        backgroundColor: currentPage === page ? '#FF6B35' : 'white',
                                        color: currentPage === page ? 'white' : '#334155',
                                        cursor: 'pointer',
                                        fontWeight: currentPage === page ? '600' : '400',
                                        fontSize: '0.85rem',
                                        minWidth: '36px'
                                    }}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === totalPages ? 0.5 : 1,
                                    fontSize: '0.85rem'
                                }}
                            >
                                »
                            </button>
                            <button
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === totalPages ? 0.5 : 1,
                                    fontSize: '0.85rem'
                                }}
                            >
                                »»
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detalle */}
            {pedidoSeleccionado && (
                <ModalDetallePago
                    pedido={pedidoSeleccionado}
                    onClose={() => setPedidoSeleccionado(null)}
                />
            )}
        </div>
    );
};

// Subcomponentes UI utilitarios
const StatsCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    }}>
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
        }}>
            <Icon size={24} />
        </div>
        <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{title}</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>{value}</h3>
            {subtext && <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{subtext}</p>}
        </div>
    </div>
);

const Th = ({ children }) => (
    <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>{children}</th>
);

const Td = ({ children, style }) => (
    <td style={{ padding: '16px', color: '#334155', fontSize: '0.95rem', ...style }}>{children}</td>
);

const BadgeStatus = ({ status }) => {
    const colors = {
        entregado: { bg: '#dcfce7', text: '#166534' },
        cancelado: { bg: '#fee2e2', text: '#991b1b' },
        anulado: { bg: '#f1f5f9', text: '#475569' }
    };
    const style = colors[status] || colors.anulado;

    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: style.bg,
            color: style.text,
            textTransform: 'uppercase'
        }}>
            {status}
        </span>
    );
};

const BadgeType = ({ type }) => {
    const icons = {
        mesa: '🍽️',
        domicilio: '🛵',
        mostrador: '🏪'
    };
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{icons[type] || '📦'}</span>
            <span style={{ textTransform: 'capitalize' }}>{type}</span>
        </span>
    );
};

export default Pagos;
