import React from 'react';
import useApi from '../hooks/useApi';
import { Icons } from '../constants';
import { User, InstanceStatus } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value.toLocaleString('pt-BR')}</p>
    </div>
  </div>
);

const InstanceStatusChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
    const totalInstances = data.reduce((sum, item) => sum + item.value, 0);
    const maxValue = totalInstances > 0 ? Math.max(...data.map(d => d.value)) : 1;
    const chartHeight = 250;
    const barWidth = 50;
    const barMargin = 30;
    const totalWidth = data.length * (barWidth + barMargin);
    
    return (
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Status das Instâncias</h3>
            {totalInstances === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-500">Nenhuma instância para exibir no gráfico.</p>
                </div>
            ) : (
                <div className="flex-1 flex items-end justify-center pt-8 pb-10">
                     <svg width="100%" height="100%" viewBox={`0 0 ${totalWidth} ${chartHeight + 40}`}>
                        <g>
                            {/* Y-axis lines (for reference) */}
                             {[...Array(5)].map((_, i) => (
                                <line
                                    key={i}
                                    x1="0"
                                    y1={chartHeight - (i * (chartHeight / 4))}
                                    x2={totalWidth}
                                    y2={chartHeight - (i * (chartHeight / 4))}
                                    strokeDasharray="3 3"
                                    className="stroke-slate-700"
                                />
                            ))}
                        </g>
                        {data.map((item, index) => {
                            const barHeight = item.value > 0 ? (item.value / maxValue) * chartHeight : 0;
                            const x = index * (barWidth + barMargin) + (barMargin / 2);
                            const y = chartHeight - barHeight;
                            return (
                                <g key={item.name} className="transition-all duration-300">
                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        className={item.color}
                                        rx="4"
                                        ry="4"
                                    />
                                    <text
                                        x={x + barWidth / 2}
                                        y={y - 8}
                                        textAnchor="middle"
                                        className="fill-white font-bold text-base"
                                    >
                                        {item.value}
                                    </text>
                                    <text
                                        x={x + barWidth / 2}
                                        y={chartHeight + 20}
                                        textAnchor="middle"
                                        className="fill-slate-400 text-sm"
                                    >
                                        {item.name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            )}
        </div>
    );
};


interface DashboardViewProps {
  api: ReturnType<typeof useApi>;
  user: User;
}

const DashboardView: React.FC<DashboardViewProps> = ({ api }) => {
  const { getDashboardStats, instances } = api;
  const stats = getDashboardStats();

  const statusCounts = instances.reduce((acc, instance) => {
    acc[instance.status] = (acc[instance.status] || 0) + 1;
    return acc;
  }, {} as Record<InstanceStatus, number>);

  const chartData = [
    { name: InstanceStatus.ONLINE, value: statusCounts[InstanceStatus.ONLINE] || 0, color: 'fill-green-500 hover:fill-green-400' },
    { name: InstanceStatus.OFFLINE, value: statusCounts[InstanceStatus.OFFLINE] || 0, color: 'fill-slate-600 hover:fill-slate-500' },
    { name: InstanceStatus.CONNECTING, value: statusCounts[InstanceStatus.CONNECTING] || 0, color: 'fill-yellow-500 hover:fill-yellow-400' },
    { name: InstanceStatus.ERROR, value: statusCounts[InstanceStatus.ERROR] || 0, color: 'fill-red-500 hover:fill-red-400' },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Instâncias" 
          value={stats.totalInstances} 
          icon={<Icons.Instances className="w-6 h-6 text-white"/>} 
          colorClass="bg-blue-500"
        />
        <StatCard 
          title="Instâncias Online" 
          value={`${stats.onlineInstances} / ${stats.totalInstances}`}
          icon={<Icons.Dashboard className="w-6 h-6 text-white"/>} 
          colorClass="bg-green-500"
        />
        <StatCard 
          title="Mensagens Enviadas (24h)" 
          value={stats.messagesSent} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>} 
          colorClass="bg-amber-500"
        />
        <StatCard 
          title="Webhooks Disparados (24h)" 
          value={stats.webhooksTriggered} 
          icon={<Icons.Webhooks className="w-6 h-6 text-white"/>} 
          colorClass="bg-purple-500"
        />
      </div>

      {/* Placeholder for charts and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <InstanceStatusChart data={chartData} />
        </div>
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 h-96 flex items-center justify-center">
          <p className="text-slate-500">Registro de Atividade Recente (Exemplo)</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;