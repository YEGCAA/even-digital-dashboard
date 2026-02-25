import React, { useMemo } from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { FORMATTERS } from '../constants';

interface MarketingEvolutionChartProps {
    data: any[]; // Raw marketing rows
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
}

export const MarketingEvolutionChart: React.FC<MarketingEvolutionChartProps> = ({ data, startDate, endDate }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const dailyStats: Record<string, { leads: number; spend: number; date: string }> = {};

        // Helper for fuzzy key matching (Case Insensitive + Ignore Spaces)
        const getRowVal = (r: any, keys: string[]) => {
            const rowKeys = Object.keys(r);
            for (const k of keys) {
                const normalizedSearch = k.toLowerCase().replace(/[\s_]/g, '');
                const found = rowKeys.find(rk => rk.toLowerCase().replace(/[\s_]/g, '') === normalizedSearch);
                if (found) return r[found];
            }
            return null;
        };

        const parseNum = (val: any): number => {
            if (val === null || val === undefined || val === "" || val === "---") return 0;
            if (typeof val === 'number') return val;
            let s = val.toString().replace(/[R$\sBRL]/g, '').trim();
            while (s.length > 0 && !/[0-9]/.test(s.slice(-1))) {
                s = s.slice(0, -1).trim();
            }
            if (!s) return 0;
            if (s.includes(',') && s.includes('.')) {
                if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
                    s = s.replace(/\./g, '').replace(',', '.');
                } else {
                    s = s.replace(/,/g, '');
                }
            } else if (s.includes(',')) {
                const parts = s.split(',');
                if (parts[parts.length - 1].length <= 2) {
                    s = s.replace(',', '.');
                } else {
                    s = s.replace(',', '');
                }
            } else if (s.includes('.')) {
                const parts = s.split('.');
                if (parts[parts.length - 1].length > 2) {
                    s = s.replace(/\./g, '');
                }
            }
            const num = parseFloat(s);
            return isNaN(num) ? 0 : num;
        };

        data.forEach(row => {
            // Find date key
            const dateVal = getRowVal(row, ['Date', 'Day', 'dia', 'data', 'created_at']);

            if (!dateVal) return;

            // Normalize date to YYYY-MM-DD for aggregation
            try {
                // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
                let key: string;
                const dateStr = String(dateVal);

                // Se já está no formato YYYY-MM-DD, usar diretamente
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    key = dateStr;
                } else if (dateStr.includes('T')) {
                    // Optimized for ISO strings: 2026-02-23T00:00:00+00:00 -> 2026-02-23
                    key = dateStr.split('T')[0];
                } else {
                    const d = new Date(dateVal);
                    if (isNaN(d.getTime())) return;
                    // Use UTC to avoid local timezone shifts
                    const year = d.getUTCFullYear();
                    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(d.getUTCDate()).padStart(2, '0');
                    key = `${year}-${month}-${day}`;
                }

                // Find metrics using robust matching
                const leadsRaw = getRowVal(row, ['leads', 'lead count', 'leads_gerados', 'results', 'cadastro_realizado']);
                const spendRaw = getRowVal(row, ['Amount Spent', 'investimento', 'valor gasto', 'spent', 'amount_spent', 'custo']);

                const leads = parseNum(leadsRaw);
                const spend = parseNum(spendRaw);

                if (!dailyStats[key]) {
                    dailyStats[key] = { leads: 0, spend: 0, date: key };
                }

                dailyStats[key].leads += leads;
                dailyStats[key].spend += spend;
            } catch (e) {
                // invalid date
            }
        });

        return Object.values(dailyStats)
            .filter(item => {
                // Aplicar filtro de data se fornecido - COMPARAÇÃO EXATA DE STRINGS
                if (startDate && item.date < startDate) return false;
                if (endDate && item.date > endDate) return false;
                return true;
            })
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(item => {
                // Formatar data sem timezone issues
                const [year, month, day] = item.date.split('-');
                const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                return {
                    ...item,
                    cpl: item.leads > 0 ? item.spend / item.leads : 0,
                    formattedDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                };
            });
    }, [data, startDate, endDate]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
                Sem dados suficientes para o período selecionado.
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Geração de Leads e Custo</h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="formattedDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        dy={10}
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        label={{ value: 'Leads', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, dy: 40 }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(val) => `R$ ${val}`}
                        label={{ value: 'R$', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10, dy: -40 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        formatter={(value: number, name: string) => {
                            if (name === 'Total Gasto') return [FORMATTERS.currency(value), name];
                            if (name === 'Custo por Lead') return [FORMATTERS.currency(value), name];
                            return [value, name];
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />

                    <Bar
                        yAxisId="left"
                        dataKey="leads"
                        name="Leads"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />

                    <Bar
                        yAxisId="right"
                        dataKey="cpl"
                        name="Custo por Lead"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />

                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="spend"
                        name="Total Gasto"
                        stroke="#60a5fa"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#60a5fa', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
