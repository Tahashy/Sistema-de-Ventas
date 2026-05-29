import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvsbeiedrwsaxsdumoyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2c2JlaWVkcndzYXhzZHVtb3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjA4OTIsImV4cCI6MjA4MTIzNjg5Mn0.caaNm9w80KRqjTr1xK5BhLpzBkSZ8WqpjP8pnXa7qDI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    const { data, error } = await supabase.from('usuarios').select('rol');
    if (error) console.error(error);
    else {
        const roles = [...new Set(data.map(u => u.rol))];
        console.log("Roles existentes:", roles);
    }
}
checkRoles();
