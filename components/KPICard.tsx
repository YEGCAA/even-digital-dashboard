
import React from 'react';
import { useCountAnimation } from '../hooks/useCountAnimation';


export type KPITrend = 'up' | 'down' | 'neutral';
export type KPIStatus = 'EXCELENTE' | 'MÉDIA' | 'OTIMIZAR' | 'BOM' | 'RUIM' | undefined;

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
  onClick?: () => void;
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
  statusTag,
  onClick
}) => {
  // Extract numeric value for animation
  const getNumericValue = (val: string | number): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Remove currency symbols and spaces
      let cleaned = val.replace(/[R$\s]/g, '');

      // Check for multipliers BEFORE extracting the number
      let multiplier = 1;
      if (cleaned.toLowerCase().includes('mi')) {
        multiplier = 1000000; // milhões
        cleaned = cleaned.replace(/mi/gi, '');
      } else if (cleaned.toLowerCase().includes('mil')) {
        multiplier = 1000;
        cleaned = cleaned.replace(/mil/gi, '');
      }

      // Remove percentage sign if exists
      cleaned = cleaned.replace(/%/g, '');

      // Normalize decimal separator (replace comma with dot)
      const normalized = cleaned.replace(',', '.');
      const baseValue = parseFloat(normalized) || 0;

      return baseValue * multiplier;
    }
    return 0;
  };

  const numericValue = getNumericValue(value);
  const numericMetaValue = metaValue ? getNumericValue(metaValue) : 0;

  // Determine decimal places based on value
  const getDecimals = (val: number): number => {
    if (val === 0) return 0;
    if (val < 10) return 2;
    if (val < 100) return 1;
    return 0;
  };

  // Animate the values
  const animatedValue = useCountAnimation(numericValue, {
    duration: 1500,
    decimals: getDecimals(numericValue)
  });
  const animatedMetaValue = useCountAnimation(numericMetaValue, {
    duration: 1500,
    decimals: getDecimals(numericMetaValue)
  });

  // Format the animated value back to match the original format
  const getFormattedValue = (original: string | number, animated: number): string | number => {
    if (typeof original === 'number') return animated;
    if (typeof original === 'string') {
      const originalStr = original;

      // Detect "Mi" (milhões) - usado em summarized
      if (originalStr.toLowerCase().includes('mi') && !originalStr.toLowerCase().includes('mil')) {
        const hasRS = originalStr.includes('R$');
        const divided = animated / 1000000;
        const formatted = divided.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
        return hasRS ? `R$ ${formatted} Mi` : `${formatted} Mi`;
      }

      // Detect "mil" - usado em summarized
      if (originalStr.toLowerCase().includes('mil')) {
        const hasRS = originalStr.includes('R$');
        const divided = animated / 1000;
        const formatted = divided.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
        return hasRS ? `R$ ${formatted} mil` : `${formatted} mil`;
      }

      // Detect currency (R$)
      if (originalStr.includes('R$')) {
        return `R$ ${animated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      // Detect percentage
      if (originalStr.includes('%')) {
        return `${animated.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
      }

      // Default: just return the number formatted
      return animated.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return animated;
  };

  const displayValue = typeof value === 'object' ? value : getFormattedValue(value, animatedValue);
  const displayMetaValue = metaValue ? getFormattedValue(metaValue, animatedMetaValue) : metaValue;

  const getIconBgColor = () => {
    if (!statusTag) {
      if (!trend || trend === 'neutral') return 'bg-blue-50 dark:bg-blue-900/10';
      const isPositive = trend === 'up';
      const isGood = inverseColors ? !isPositive : isPositive;
      return isGood ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10';
    }

    switch (statusTag) {
      case 'EXCELENTE': return 'bg-emerald-50 dark:bg-emerald-900/10';
      case 'BOM': return 'bg-emerald-50 dark:bg-emerald-900/10';
      case 'MÉDIA': return 'bg-blue-50 dark:bg-blue-900/10';
      case 'OTIMIZAR': return 'bg-orange-50 dark:bg-orange-900/10';
      case 'RUIM': return 'bg-orange-50 dark:bg-orange-900/10';
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
      case 'EXCELENTE': return 'text-emerald-500';
      case 'BOM': return 'text-emerald-500';
      case 'MÉDIA': return 'text-blue-500';
      case 'OTIMIZAR': return 'text-orange-500';
      case 'RUIM': return 'text-orange-500';
      default: return 'text-primary';
    }
  };

  const getAccentClass = () => {
    if (statusTag === 'BOM' || statusTag === 'EXCELENTE') return 'card-accent-green';
    if (statusTag === 'MÉDIA') return 'card-accent-blue';
    if (statusTag === 'OTIMIZAR' || statusTag === 'RUIM') return 'card-accent-amber';

    const t = title.toLowerCase();
    if (t.includes('vgv') || t.includes('faturamento') || t.includes('venda')) return 'card-accent-green';
    if (t.includes('investimento') || t.includes('gasto') || t.includes('custo')) return 'card-accent-amber';
    if (t.includes('lead') || t.includes('contato')) return 'card-accent-blue';
    if (t.includes('meta') || t.includes('progresso')) return 'card-accent-purple';

    return 'card-accent-blue';
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-xl p-5 card-shadow hover:shadow-md transition-all border border-slate-100 dark:border-slate-700 h-full flex flex-col justify-between animate-slide-up ${getAccentClass()} ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
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
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white leading-tight break-words">
            {displayValue}
          </h3>
          {statusTag && <StatusBadge status={statusTag} />}
        </div>
      </div>

      {/* Meta e Contexto */}
      <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
        {meta && (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{meta}: <span className="text-slate-600 dark:text-slate-300 font-bold ml-1">{displayMetaValue}</span></p>
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
