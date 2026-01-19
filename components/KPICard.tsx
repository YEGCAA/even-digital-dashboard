
import React from 'react';

export type KPITrend = 'up' | 'down' | 'neutral';
export type KPIStatus = 'EXCELENTE' | 'BOM' | 'MÉDIA' | 'RUIM' | undefined;

interface KPICardProps {
  title: string;
  value: string | number;
  meta?: string;
  metaValue?: string | number;
  icon?: React.ReactNode;
  color?: string;
  trend?: KPITrend;
  inverseColors?: boolean;
  action?: React.ReactNode;
  statusTag?: KPIStatus;
}

import { StatusBadge } from '../App';

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  meta,
  metaValue,
  icon,
  color,
  trend,
  inverseColors = false,
  action,
  statusTag
}) => {
  const getIconBgColor = () => {
    if (!statusTag) {
      if (!trend || trend === 'neutral') return 'bg-blue-50 dark:bg-blue-900/10';
      const isPositive = trend === 'up';
      const isGood = inverseColors ? !isPositive : isPositive;
      return isGood ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10';
    }

    switch (statusTag) {
      case 'EXCELENTE': return 'bg-cyan-50 dark:bg-cyan-900/10';
      case 'BOM': return 'bg-emerald-50 dark:bg-emerald-900/10';
      case 'MÉDIA': return 'bg-amber-50 dark:bg-amber-900/10';
      case 'RUIM': return 'bg-red-50 dark:bg-red-900/10';
      default: return 'bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const getIconColor = () => {
    if (!statusTag) {
      if (!trend || trend === 'neutral') return 'text-primary';
      const isPositive = trend === 'up';
      const isGood = inverseColors ? !isPositive : isPositive;
      return isGood ? 'text-emerald-500' : 'text-red-500';
    }

    switch (statusTag) {
      case 'EXCELENTE': return 'text-cyan-500';
      case 'BOM': return 'text-emerald-500';
      case 'MÉDIA': return 'text-amber-500';
      case 'RUIM': return 'text-red-500';
      default: return 'text-primary';
    }
  };

  const getAccentClass = () => {
    if (statusTag === 'BOM') return 'card-accent-green';
    if (statusTag === 'MÉDIA') return 'card-accent-amber';
    if (statusTag === 'RUIM') return 'card-accent-red';

    const t = title.toLowerCase();
    if (t.includes('vgv') || t.includes('faturamento') || t.includes('venda')) return 'card-accent-green';
    if (t.includes('investimento') || t.includes('gasto') || t.includes('custo')) return 'card-accent-amber';
    if (t.includes('lead') || t.includes('contato')) return 'card-accent-blue';
    if (t.includes('meta') || t.includes('progresso')) return 'card-accent-purple';

    return 'card-accent-blue';
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-5 card-shadow hover:shadow-md transition-all border border-slate-100 dark:border-slate-700 h-full flex flex-col justify-between ${getAccentClass()}`}>
      <div>
        {/* Header com título e ícone */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</span>
          <div className={`w-10 h-10 rounded-lg ${getIconBgColor()} flex items-center justify-center ${getIconColor()}`}>
            {icon}
          </div>
        </div>

        {/* Valor principal */}
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {value}
          </h3>
          {statusTag && <StatusBadge status={statusTag} />}
        </div>
      </div>

      {/* Meta e Contexto */}
      <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
        {meta && (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{meta}: <span className="text-slate-600 dark:text-slate-300 font-bold ml-1">{metaValue}</span></p>
          </div>
        )}
        {trend && (
          <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'} flex items-center gap-0.5`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>

      {/* Ação adicional */}
      {action && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          {action}
        </div>
      )}
    </div>
  );
};
