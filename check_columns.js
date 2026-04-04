
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvsbeiedrwsaxsdumoyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2c2JlaWVkcndzYXhzZHVtb3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjA4OTIsImV4cCI6MjA4MTIzNjg5Mn0.caaNm9w80KRqjTr1xK5BhLpzBkSZ8WqpjP8pnXa7qDI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("--- EXAMINANDO ESTRUCTURA DE TABLA PEDIDOS ---");
    
    // Consultar un solo registro para ver todas sus columnas
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .limit(1)
        .single();
    
    if (error) {
        console.error("Error al consultar tabla:", error);
    } else {
        console.log("\nColumnas disponibles en 'pedidos':");
        console.log(Object.keys(data).join(', '));
        
        console.log("\nEjemplo de datos en una fila:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkColumns();
