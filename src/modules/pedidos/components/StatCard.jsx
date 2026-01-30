// src/modules/pedidos/components/StatCard.jsx

import React from 'react';

const StatCard = ({ title, value, color }) => {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{
      background: 'white',
      padding: isMobile ? '16px' : '20px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <p style={{
        margin: '0 0 8px 0',
        fontSize: '12px',
        color: '#718096',
        fontWeight: '500'
      }}>
        {title}
      </p>
      <p style={{
        margin: 0,
        fontSize: isMobile ? '24px' : '28px',
        fontWeight: '700',
        color: color
      }}>
        {value}
      </p>
    </div>
  );
};

export default StatCard;