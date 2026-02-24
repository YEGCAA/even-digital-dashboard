
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
    const dObj = new Date(s);
    return dObj.getFullYear() === today.getFullYear() &&
        dObj.getMonth() === today.getMonth() &&
        dObj.getDate() === today.getDate();
};

async function investigate() {
    const { data: sales } = await supabase.from('Vendas_2').select('*');
    const { data: status } = await supabase.from('Status_venda_2').select('*');

    const statusByIdMap = {};
    const statusByNameMap = {};

    (status || []).forEach(row => {
        const idNegocio = row['id_negocio'] || row['ID negocio'];
        const name = row['nome'] || row['name'];
        const statusVal = row.status || row.venda_status || row.status_venda;
        const info = { status: statusVal, name, raw: row };
        if (idNegocio) statusByIdMap[String(idNegocio).trim()] = info;
        if (name) statusByNameMap[normalizeStr(name)] = info;
    });

    const startDate = new Date('2026-02-01T00:00:00');
    const endDate = new Date('2026-02-23T23:59:59');

    console.log("--- LEADS EM ATENDIMENTO NO SITE (FEV 1 - FEV 23) ---");
    let count = 0;
    sales.forEach(row => {
        const stageName = row.nome_etapa || row.Status || row.etapa || "";
        const idNegocio = row.id_negocio || row['ID negocio'];
        const name = row.nome || row.name;
        const atualizado = row['atualizado?'] || row.atualizado;
        const data = row.data;

        // Date Filter (as in App.tsx)
        let rowDate = data;
        if (rowDate && rowDate.includes('/') && rowDate.split('/').length === 3) {
            const [d, m, y] = rowDate.split('/');
            rowDate = `${y}-${m}-${d}`;
        }
        const dObj = new Date(rowDate);
        if (dObj < startDate || dObj > endDate) return;

        const stageNorm = normalizeStr(stageName);
        const statusInfo = (idNegocio && statusByIdMap[String(idNegocio).trim()]) || statusByNameMap[normalizeStr(name)];

        let statusVendaRaw = statusInfo ? statusInfo.status : row.status_venda_2;
        if (isDateToday(data) || isDateToday(atualizado)) {
            statusVendaRaw = "atual";
        } else if (atualizado !== null && atualizado !== undefined) {
            const aStr = String(atualizado).trim();
            const aNorm = normalizeStr(aStr);
            if (aStr === "") statusVendaRaw = "perdido";
            else if (aNorm.includes("vendido")) statusVendaRaw = "ganho";
            else if (aNorm.includes("perdido")) statusVendaRaw = "perdido";
            else statusVendaRaw = "atual";
        }

        const isAtendimento = stageNorm.includes("atendimento") && !stageNorm.includes("pre");

        if (isAtendimento && (statusVendaRaw !== "perdido" && statusVendaRaw !== "ganho")) {
            count++;
            console.log(`${count}. Name: ${name} | StatusVendaRaw: ${statusVendaRaw} | ID: ${idNegocio}`);
        }
    });

    console.log("\nTotal:", count);
}

investigate();
