
import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  Bar,
  Cell
} from 'recharts';
import { FORMATTERS } from '../constants';

interface MixedTrendProps {
  data: any[];
}

export const MixedTrendChart: React.FC<MixedTrendProps> = ({ data }) => {
  // Dados mockados para exemplo visual do gráfico se não houver trend real
  const chartData = data.length > 0 ? data : [
    { name: 'Jan', invest: 4000, vgv: 2400 },
    { name: 'Fev', invest: 3000, vgv: 4500 },
    { name: 'Mar', invest: 2000, vgv: 3800 },
    { name: 'Abr', invest: 2780, vgv: 6000 },
    { name: 'Mai', invest: 1890, vgv: 5200 },
    { name: 'Jun', invest: 2390, vgv: 7500 },
  ];

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
          <Bar dataKey="invest" name="Investimento" fill="#5992db" radius={[4, 4, 0, 0]} barSize={25} />
          <Line 
            type="monotone" 
            dataKey="vgv" 
            name="VGV Vendido" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6 }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
