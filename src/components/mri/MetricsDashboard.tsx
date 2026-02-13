'use client';

import { Activity, BarChart3, Target, Zap } from 'lucide-react';

interface Metric {
    label: string;
    value: string | number;
    unit?: string;
    change?: number;
    type: 'score' | 'volume' | 'analysis';
}

interface MetricsDashboardProps {
    metrics?: Metric[];
}

export default function MetricsDashboard({ metrics = [] }: MetricsDashboardProps) {
    // Mock data if none provided
    const displayMetrics = metrics.length > 0 ? metrics : [
        { label: 'Dice Score', value: 0.942, unit: '', type: 'score' as const },
        { label: 'Total Volume', value: 1450, unit: 'mm³', type: 'volume' as const },
        { label: 'Tumor Volume', value: 42.5, unit: 'mm³', type: 'volume' as const },
        { label: 'Processing Time', value: 1.2, unit: 's', type: 'analysis' as const },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Activity className="w-5 h-5" />
                <h2 className="font-semibold text-slate-100">AI Analysis Metrics</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {displayMetrics.map((metric, index) => (
                    <div key={index} className="glass-card p-5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                {metric.type === 'score' && <Target className="w-3 h-3 text-emerald-400" />}
                                {metric.type === 'volume' && <BarChart3 className="w-3 h-3 text-indigo-400" />}
                                {metric.type === 'analysis' && <Zap className="w-3 h-3 text-amber-400" />}
                                {metric.label}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-slate-100">
                                    {typeof metric.value === 'number' && metric.type === 'score'
                                        ? metric.value.toFixed(3)
                                        : metric.value}
                                </span>
                                {metric.unit && (
                                    <span className="text-xs font-medium text-slate-500">{metric.unit}</span>
                                )}
                            </div>
                        </div>

                        {metric.type === 'score' && (
                            <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${(metric.value as number) * 100}%` }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
