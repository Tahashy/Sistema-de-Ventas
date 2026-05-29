import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { cierreId, restauranteId } = req.body;

    if (!cierreId || !restauranteId) {
      return res.status(400).json({ error: 'Falta cierreId o restauranteId' });
    }

    // Inicializar Supabase usando las variables de entorno de Vercel
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    // Debemos usar el SERVICE_ROLE_KEY o el ANON_KEY dependiendo de la configuración
    // Se recomienda usar un KEY que tenga permisos de lectura
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey || !resendApiKey) {
      console.error('Variables de entorno faltantes:', { url: !!supabaseUrl, key: !!supabaseKey, resend: !!resendApiKey });
      return res.status(500).json({ error: 'Error de configuración de servidor' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Obtener datos del cierre
    const { data: cierre, error: cierreError } = await supabase
      .from('cierres_caja')
      .select('*, usuarios(nombre)')
      .eq('id', cierreId)
      .single();

    if (cierreError) throw cierreError;

    // 2. Obtener correos de los administradores de este restaurante
    const { data: admins, error: adminError } = await supabase
      .from('usuarios')
      .select('email')
      .eq('restaurante_id', restauranteId)
      .eq('rol', 'admin')
      .eq('activo', true);

    if (adminError) throw adminError;

    if (!admins || admins.length === 0) {
      return res.status(200).json({ message: 'No hay administradores a quienes enviar el correo' });
    }

    const adminEmails = admins.map(a => a.email);

    // 3. Formatear correo en HTML
    const formatMoney = (amount) => `S/ ${Number(amount).toFixed(2)}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">Resumen de Cierre de Caja</h2>
        
        <p><strong>Cajero:</strong> ${cierre.usuarios?.nombre || 'Desconocido'}</p>
        <p><strong>Fecha y Hora:</strong> ${new Date(cierre.fecha_cierre).toLocaleString('es-PE')}</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin-top: 0;">Resumen del Sistema</h3>
          <ul style="list-style: none; padding-left: 0;">
            <li style="margin-bottom: 8px;">💵 <strong>Efectivo en caja (sin contar sencillo):</strong> ${formatMoney(cierre.total_efectivo)}</li>
            <li style="margin-bottom: 8px;">💳 <strong>Tarjeta:</strong> ${formatMoney(cierre.total_tarjeta)}</li>
            <li style="margin-bottom: 8px;">📱 <strong>Yape:</strong> ${formatMoney(cierre.total_yape)}</li>
            <li style="margin-bottom: 8px;">📱 <strong>Plin:</strong> ${formatMoney(cierre.total_plin)}</li>
          </ul>
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 5px 0;"><strong>Ventas Netas:</strong> ${formatMoney(cierre.total_general)}</p>
            <p style="margin: 5px 0;"><strong>Pozo Delivery (Aparte):</strong> ${formatMoney(cierre.total_delivery)}</p>
          </div>
        </div>

        <div style="background-color: #ebf8ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin-top: 0;">Declarado por el Cajero</h3>
          <p style="font-size: 13px; color: #4a5568; margin-top: -10px;">(Sencillo inicial con el que empezó el turno: ${formatMoney(cierre.monto_inicial)})</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="text-align: left; border-bottom: 1px solid #bee3f8;">
              <th style="padding: 8px;">Método</th>
              <th style="padding: 8px;">Declarado</th>
              <th style="padding: 8px;">Diferencia (Sobrante/Faltante)</th>
            </tr>
            <tr style="border-bottom: 1px solid #bee3f8;">
              <td style="padding: 8px;">Efectivo (Inc. sencillo)</td>
              <td style="padding: 8px;">${formatMoney(cierre.declarado_efectivo)}</td>
              <td style="padding: 8px; color: ${cierre.diferencia_efectivo < 0 ? 'red' : (cierre.diferencia_efectivo > 0 ? 'green' : 'black')};">
                ${formatMoney(cierre.diferencia_efectivo)}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #bee3f8;">
              <td style="padding: 8px;">Tarjeta</td>
              <td style="padding: 8px;">${formatMoney(cierre.declarado_tarjeta)}</td>
              <td style="padding: 8px; color: ${cierre.diferencia_tarjeta < 0 ? 'red' : (cierre.diferencia_tarjeta > 0 ? 'green' : 'black')};">
                ${formatMoney(cierre.diferencia_tarjeta)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px;">Digital (Yape/Plin)</td>
              <td style="padding: 8px;">${formatMoney(cierre.declarado_digital)}</td>
              <td style="padding: 8px; color: ${cierre.diferencia_digital < 0 ? 'red' : (cierre.diferencia_digital > 0 ? 'green' : 'black')};">
                ${formatMoney(cierre.diferencia_digital)}
              </td>
            </tr>
          </table>
        </div>

        ${cierre.notas ? `
        <div style="background-color: #fffaf0; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #feebc8;">
          <h3 style="margin-top: 0; color: #dd6b20;">Notas del Cajero</h3>
          <p style="margin: 0;">${cierre.notas}</p>
        </div>
        ` : ''}

        <p style="font-size: 12px; color: #718096; margin-top: 30px; text-align: center;">
          Este es un correo automático generado por tu sistema POS.
        </p>
      </div>
    `;

    // 4. Enviar vía Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Takemi POS <onboarding@resend.dev>', // Si tienes tu propio dominio verificado, cámbialo aquí
        to: adminEmails,
        subject: `🚨 Cuadre de Caja: ${cierre.usuarios?.nombre || 'Turno'} - ${new Date(cierre.fecha_cierre).toLocaleDateString('es-PE')}`,
        html: htmlContent
      })
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Error de Resend:', data);
      return res.status(resendResponse.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en Vercel Serverless Function:', error);
    return res.status(500).json({ error: error.message });
  }
}
