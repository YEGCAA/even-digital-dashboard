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
}

export const MarketingEvolutionChart: React.FC<MarketingEvolutionChartProps> = ({ data }) => {
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

        const parseNum = (val: any) => {
            if (!val) return 0;
            const str = String(val).replace(/[R$\s]/g, '');
            // Handle comma/dot variations
            if (str.includes(',') && str.includes('.')) { return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0; }
            if (str.includes(',')) { return parseFloat(str.replace(',', '.')) || 0; }
            return parseFloat(str) || 0;
        };

        data.forEach(row => {
            // Find date key
            const dateVal = getRowVal(row, ['Date', 'Day', 'dia', 'data', 'created_at']);

            if (!dateVal) return;

            // Normalize date to YYYY-MM-DD for aggregation
            try {
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return;
                const key = d.toISOString().split('T')[0];

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
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(item => ({
                ...item,
                cpl: item.leads > 0 ? item.spend / item.leads : 0,
                formattedDate: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            }));
    }, [data]);

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
                    margin={{ top: 20, right: 20, bottom: 40, left: 20 }} // Increased bottom margin
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

                    {/* Leads Bar - Eixo Esquerdo (Volume) */}
                    <Bar
                        yAxisId="left"
                        dataKey="leads"
                        name="Leads"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />

                    {/* CPL Bar - Eixo Direito (Valor R$) */}
                    <Bar
                        yAxisId="right"
                        dataKey="cpl"
                        name="Custo por Lead"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />

                    {/* Spend Line - Eixo Direito (Valor R$) */}
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
