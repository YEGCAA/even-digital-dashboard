
import React from 'react';

export type KPITrend = 'up' | 'down' | 'neutral';
export type KPIStatus = 'BOM' | 'MÉDIA' | 'RUIM' | undefined;

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
  const getStatusColor = () => {
    if (!statusTag) {
        if (!trend || trend === 'neutral') return 'bg-slate-200 dark:bg-slate-700';
        const isPositive = trend === 'up';
        const isGood = inverseColors ? !isPositive : isPositive;
        return isGood ? 'bg-emerald-500' : 'bg-rose-500';
    }
    
    switch (statusTag) {
      case 'BOM': return 'bg-emerald-500';
      case 'MÉDIA': return 'bg-amber-500';
      case 'RUIM': return 'bg-rose-500';
      default: return 'bg-slate-200 dark:bg-slate-700';
    }
  };

  const getTextColor = () => {
    if (!statusTag) {
        if (!trend || trend === 'neutral') return color || 'text-primary';
        const isPositive = trend === 'up';
        const isGood = inverseColors ? !isPositive : isPositive;
        return isGood ? 'text-emerald-500' : 'text-rose-500';
    }
    
    switch (statusTag) {
        case 'BOM': return 'text-emerald-500';
        case 'MÉDIA': return 'text-amber-500';
        case 'RUIM': return 'text-rose-500';
        default: return color || 'text-primary';
      }
  };

  const getBgColor = () => {
    if (!statusTag) {
        if (!trend || trend === 'neutral') return 'bg-slate-100 dark:bg-slate-900/50';
        const isPositive = trend === 'up';
        const isGood = inverseColors ? !isPositive : isPositive;
        return isGood ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-rose-50 dark:bg-rose-900/10';
    }
    
    switch (statusTag) {
        case 'BOM': return 'bg-emerald-50 dark:bg-emerald-900/10';
        case 'MÉDIA': return 'bg-amber-50 dark:bg-amber-900/10';
        case 'RUIM': return 'bg-rose-50 dark:bg-rose-900/10';
        default: return 'bg-slate-100 dark:bg-slate-900/50';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col justify-between h-full hover:shadow-lg transition-all group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-1.5 h-full ${getStatusColor()}`} />
      
      {statusTag && (
        <div className={`absolute top-3 right-4 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter text-white z-10 shadow-sm ${getStatusColor()}`}>
          {statusTag}
        </div>
      )}
      
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${getBgColor()} ${getTextColor()} group-hover:scale-110 transition-transform shadow-sm`}>
              {icon}
            </div>
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">{title}</h3>
          </div>
          {action && <div className="z-10">{action}</div>}
        </div>
        
        <div className="mb-2">
          <span className={`text-2xl font-black ${statusTag ? getTextColor() : trend && trend !== 'neutral' ? getTextColor() : 'text-slate-800 dark:text-white'} tracking-tighter leading-none italic`}>
            {value}
          </span>
        </div>
      </div>

      {(meta || metaValue) && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">{meta || 'META MÊS'}</span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{metaValue}</span>
        </div>
      )}
    </div>
  );
};
