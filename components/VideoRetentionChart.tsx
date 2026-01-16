import React from 'react';
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Area,
    AreaChart
} from 'recharts';
import { CreativePlayback } from '../types';
import { Activity, Calendar, Layers, Layout } from 'lucide-react';
import { FORMATTERS } from '../constants';

interface VideoRetentionChartProps {
    data: CreativePlayback[];
}

export const VideoRetentionChart: React.FC<VideoRetentionChartProps> = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.slice(0, 9).map((creative, index) => {
                const chartData = [
                    { name: '0s', value: 100 }, // Start at 100% implicitly
                    { name: '3s', value: 100 }, // Baselined to 3s views as 100% of "viewed"
                    { name: '25%', value: creative.views3s > 0 ? (creative.p25 / creative.views3s) * 100 : 0 },
                    { name: '50%', value: creative.views3s > 0 ? (creative.p50 / creative.views3s) * 100 : 0 },
                    { name: '75%', value: creative.views3s > 0 ? (creative.p75 / creative.views3s) * 100 : 0 },
                    { name: '100%', value: creative.views3s > 0 ? (creative.p100 / creative.views3s) * 100 : 0 },
                ];

                return (
                    <div key={index} className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col hover:bg-white dark:hover:bg-slate-900 hover:shadow-md transition-all group min-h-[300px]">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">#{index + 1}</span>
                                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-1" title={creative.adName}>{creative.adName}</h4>
                                </div>
                                <div className="flex items-center gap-2 pl-8">
                                    {/* Campaign Icon Button with Tooltip */}
                                    <div className="relative group/campaign">
                                        <button
                                            className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-help"
                                            title={creative.campaign}
                                        >
                                            <Layers size={14} className="text-blue-500" />
                                        </button>
                                        <div className="absolute left-0 top-full mt-1 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-medium rounded-lg shadow-lg opacity-0 invisible group-hover/campaign:opacity-100 group-hover/campaign:visible transition-all z-10 whitespace-nowrap">
                                            <div className="text-[8px] text-slate-400 uppercase tracking-wide mb-0.5">Campanha</div>
                                            {creative.campaign}
                                        </div>
                                    </div>

                                    {/* Ad Set Icon Button with Tooltip */}
                                    <div className="relative group/adset">
                                        <button
                                            className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-help"
                                            title={creative.adSet}
                                        >
                                            <Layout size={14} className="text-purple-500" />
                                        </button>
                                        <div className="absolute left-0 top-full mt-1 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-medium rounded-lg shadow-lg opacity-0 invisible group-hover/adset:opacity-100 group-hover/adset:visible transition-all z-10 whitespace-nowrap">
                                            <div className="text-[8px] text-slate-400 uppercase tracking-wide mb-0.5">Conjunto</div>
                                            {creative.adSet}
                                        </div>
                                    </div>

                                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>

                                    <p className="text-[10px] font-medium text-slate-500">{FORMATTERS.number(creative.views3s)} views (3s)</p>
                                    {creative.date && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={9} className="text-primary" />
                                                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">{creative.date}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-[9px] font-bold text-primary uppercase tracking-wider block mb-0.5">Retenção</span>
                                <p className="text-xl font-bold text-primary leading-none">{creative.retentionRate.toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        interval={0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retenção']}
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fill={`url(#gradient-${index})`}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
