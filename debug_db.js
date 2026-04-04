
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvsbeiedrwsaxsdumoyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2c2JlaWVkcndzYXhzZHVtb3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjA4OTIsImV4cCI6MjA4MTIzNjg5Mn0.caaNm9w80KRqjTr1xK5BhLpzBkSZ8WqpjP8pnXa7qDI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("--- INICIANDO ESCANEO DE DATOS ---");
    
    // 1. Ver últimos pedidos
    const { data: pedidos, error: pErr } = await supabase
        .from('pedidos')
        .select('id, numero_mesa, estado, created_at, numero_pedido')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (pErr) console.error("Error pedidos:", pErr);
    else {
        console.log("\nÚltimos 10 pedidos en la DB:");
        pedidos.forEach(p => {
            console.log(`ID: ${p.id} | Mesa: "${p.numero_mesa}" | Estado: ${p.estado} | Pedido: ${p.numero_pedido}`);
        });
    }

    // 2. Ver estados de las mesas reales
    const { data: mesas, error: mErr } = await supabase
        .from('mesas')
        .select('id, numero_mesa, estado')
        .eq('estado', 'ocupada');

    if (mErr) console.error("Error mesas:", mErr);
    else {
        console.log("\nMesas actualmente OCUPADAS en la DB:");
        mesas.forEach(m => {
            console.log(`ID: ${m.id} | Nombre en DB: "${m.numero_mesa}"`);
        });
    }
}

debug();
