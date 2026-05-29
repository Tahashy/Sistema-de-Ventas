
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvsbeiedrwsaxsdumoyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2c2JlaWVkcndzYXhzZHVtb3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjA4OTIsImV4cCI6MjA4MTIzNjg5Mn0.caaNm9w80KRqjTr1xK5BhLpzBkSZ8WqpjP8pnXa7qDI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCaja() {
    console.log("--- PROBANDO TABLA cierres_caja ---");
    
    // 2. Probar si la columna fecha_cierre existe
    const { data: dataCol, error: errorCol } = await supabase
        .from('cierres_caja')
        .select('fecha_cierre')
        .limit(1);
    
    if (errorCol) {
        console.log("\nError al consultar columna 'fecha_cierre':");
        console.log("Mensaje:", errorCol.message);
    } else {
        console.log("\n¡La columna 'fecha_cierre' existe!");
    }
}

debugCaja();
