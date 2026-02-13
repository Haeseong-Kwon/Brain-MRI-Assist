'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

const MOCK_DATA = [
    { date: '2023-11', volume: 1580 },
    { date: '2023-12', volume: 1565 },
    { date: '2024-01', volume: 1520 },
    { date: '2024-02', volume: 1490 },
    { date: '2024-03', volume: 1475 },
    { date: '2024-04', volume: 1460 },
    { date: '2024-05', volume: 1450 },
];

export default function VolumeChart() {
    const currentVolume = MOCK_DATA[MOCK_DATA.length - 1].volume;
    const previousVolume = MOCK_DATA[MOCK_DATA.length - 2].volume;
    const percentageChange = ((currentVolume - previousVolume) / previousVolume) * 100;
    const isRemission = percentageChange < 0;

    return (
        <div className="glass-card p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                    <TrendingDown className="w-5 h-5" />
                    <h2 className="font-semibold text-slate-100">Longitudinal Analysis</h2>
                </div>

                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isRemission ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {isRemission ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {isRemission ? 'Remission Detected' : 'Progression Alert'}
                </div>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_DATA}>
                        <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #1e293b',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: '#6366f1' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="volume"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorVolume)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Monthly Change</p>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-lg font-bold ${isRemission ? 'text-emerald-400' : 'text-red-400'}`}>
                            {percentageChange.toFixed(1)}%
                        </span>
                        {isRemission ? <TrendingDown className="w-4 h-4 text-emerald-400" /> : <TrendingUp className="w-4 h-4 text-red-400" />}
                    </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Growth Status</p>
                    <span className="text-sm font-semibold text-slate-200">
                        {isRemission ? 'Decreasing' : 'Increasing'}
                    </span>
                </div>
            </div>
        </div>
    );
}
