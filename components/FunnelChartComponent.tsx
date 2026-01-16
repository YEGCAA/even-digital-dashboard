
import React from 'react';
import { FunnelStage } from '../types';

interface Props {
  data: FunnelStage[];
}

export const FunnelChartComponent: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxCount = data[0]?.count || 1;

  return (
    <div className="w-full space-y-6 py-2">
      {data.map((stage, index) => {
        const prevCount = index > 0 ? data[index - 1].count : null;
        const convRate = prevCount ? ((stage.count / prevCount) * 100).toFixed(1) : null;

        return (
          <div key={stage.stage} className="flex items-center gap-4 group">
            {/* Box de Conversão à esquerda */}
            <div className="w-24 flex justify-end">
              {convRate && (
                <div className="px-2 py-1 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded text-[10px] font-bold text-primary-500 shadow-sm whitespace-nowrap">
                  {convRate}% conv.
                </div>
              )}
            </div>

            {/* Label da Etapa */}
            <div className="w-32 text-right">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate block">
                {stage.stage}
              </span>
            </div>

            <div className="flex-1 h-8 bg-slate-50 dark:bg-slate-950/50 overflow-hidden relative rounded-r-md border-l-4" style={{ borderColor: stage.color }}>
              <div
                className="h-full transition-all duration-1000 opacity-80"
                style={{
                  width: `${(stage.count / maxCount) * 100}%`,
                  backgroundColor: stage.color,
                  boxShadow: `0 0 15px ${stage.color}40`
                }}
              />
            </div>

            {/* Valor final à direita da barra */}
            <div className="w-16">
              <span className="text-sm font-black text-slate-800 dark:text-white">
                {stage.count.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
