import React from 'react';
import { DollarSign, ShoppingCart, Calculator, ArrowUp, Zap, Clock } from 'lucide-react';
import { formatearMoneda } from '../../pedidos/utils/pedidoHelpers';

const ResumenVentas = ({ kpis }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Ventas Totales */}
            <KpiCard
                title="Ventas Totales"
                value={formatearMoneda(kpis.ventasTotales)}
                icon={DollarSign}
                trend="+12.5%"
                color="#10B981"
                bgIcon="#D1FAE5"
            />

            {/* Total Pedidos */}
            <KpiCard
                title="Total Pedidos"
                value={kpis.totalPedidos}
                icon={ShoppingCart}
                trend="+8.3%"
                color="#3B82F6"
                bgIcon="#DBEAFE"
            />

            {/* Ticket Promedio */}
            <KpiCard
                title="Ticket Promedio"
                value={formatearMoneda(kpis.ticketPromedio)}
                icon={Calculator}
                trend="+3.8%"
                color="#8B5CF6"
                bgIcon="#EDE9FE"
            />

            {/* Fila inferior */}
            <KpiSmallCard
                title="Producto Más Vendido"
                value={kpis.productoTop}
                subtext="Top Ventas"
            />

            <KpiSmallCard
                title="Hora Pico"
                value={kpis.horaPico}
                subtext="Mayor afluencia"
            />
        </div>
    );
};

const KpiCard = ({ title, value, icon: Icon, trend, color, bgIcon }) => (
    <div style={{
        background: 'white', padding: '24px', borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
    }}>
        <div>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>{title}</p>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>{value}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', color: '#10B981', fontSize: '13px', fontWeight: '600' }}>
                <ArrowUp size={14} />
                <span>{trend} vs período anterior</span>
            </div>
        </div>
        <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: bgIcon, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color
        }}>
            <Icon size={24} />
        </div>
    </div>
);

const KpiSmallCard = ({ title, value, subtext }) => (
    <div style={{
        background: 'white', padding: '24px', borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
    }}>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>{title}</p>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>{value}</h3>
        {/*<p style={{ marginTop: '4px', fontSize: '13px', color: '#9CA3AF' }}>{subtext}</p>*/}
    </div>
);

export default ResumenVentas;
