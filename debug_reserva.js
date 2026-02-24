
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const normalizeStr = (s) => String(s || '').toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]/g, '');

const isDateToday = (dStr) => {
    if (!dStr || dStr === "---") return false;
    let s = dStr.trim();
    if (s.includes('/') && s.split('/').length === 3) {
        const [d, m, y] = s.split('/');
        s = `${y}-${m}-${d}`;
    }
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let leadDateStr = "";
    if (s.includes('T')) {
        const dObj = new Date(s);
        leadDateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
    } else {
        leadDateStr = s; // YYYY-MM-DD
    }

    return leadDateStr === todayStr;
};

async function investigate() {
    const { data: sales, error } = await supabase.from('Vendas_2').select('*');
    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    console.log("--- DEBUG: RESERVA DO SAL LEADS ---");
    let count = 0;
    sales.forEach(row => {
        const pipelineId = row['id pipeline'] || row['ID Pipeline'] || row.id_pipeline || "";
        const pipelineName = row.pipeline || row.Pipeline || row.funil_nome || "";
        const name = row.nome || row.name;
        const atualizado = row['atualizado?'] || row.atualizado;

        const pNorm = normalizeStr(pipelineName);
        const isReserva = pNorm.includes("reserva") && String(pipelineId).trim() === "3";

        if (isReserva) {
            count++;
            const dateToday = isDateToday(atualizado);
            console.log(`Lead: ${name} | Pipeline: ${pipelineName} | ID Pipe: ${pipelineId} | Atualizado: ${atualizado} | IsDateToday: ${dateToday}`);
        }
    });

    console.log(`\nTotal Reserva Leads: ${count}`);
    console.log("\n--- TEST: isDateToday('23/02/2026') ---");
    console.log("Result:", isDateToday('23/02/2026'));
}

investigate();
