'use client';

import { useState, useRef } from 'react';
import MRIViewer from '@/components/viewer/MRIViewer';
import MetricsDashboard from '@/components/mri/MetricsDashboard';
import { ShieldCheck, Calendar, Info, Share2, Activity, Database } from 'lucide-react';

export default function SharedViewerPage({ params }: { params: { shareId: string } }) {
    const [location, setLocation] = useState<any>(null);

    // Anonymized mock data
    const mockMetrics = [
        { label: 'Dice Score', value: 0.942, unit: '', type: 'score' as const },
        { label: 'Tumor Volume', value: 42.5, unit: 'mm³', type: 'volume' as const },
    ];

    const layers = [
        {
            id: 'brain',
            name: 'Base Scan',
            url: 'https://niivue.github.io/niivue/images/mni152.nii.gz'
        },
        {
            id: 'tumor',
            name: 'Segmentation',
            url: 'https://niivue.github.io/niivue/images/mni152.nii.gz'
        },
    ];

    return (
        <main className="min-h-screen bg-[#050810] text-slate-200">
            {/* Secure Banner */}
            <div className="bg-indigo-600/10 border-b border-indigo-500/20 px-6 py-2">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                        <ShieldCheck className="w-4 h-4" />
                        Secure Shared Access • PII Masked
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                        Link Expires in: 23h 54m
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Clinical Consultation View</h1>
                        <p className="text-slate-500 text-xs mt-1">Ref ID: {params.shareId.toUpperCase()} • Anonymized Clinical Data</p>
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Database className="w-3.5 h-3.5" />
                            Processed via Brain-MRI-Assist AI
                        </div>
                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg uppercase">
                            Active Analysis
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Viewer */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <MRIViewer
                            className="w-full"
                            overlays={layers.map(l => ({ url: l.url, name: l.name, opacity: 0.5 }))}
                            onLocationChange={setLocation}
                        />

                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 text-indigo-400 mb-4">
                                <Activity className="w-5 h-5" />
                                <h2 className="font-semibold text-slate-100 italic">Diagnostic Interpretation</h2>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/30 pl-4">
                                "Automatic segmentation identifies a localized hyper-intensity in the parietal lobe.
                                Volumetric assessment (42.5mm³) suggests high-grade neoplastic activity.
                                Cross-correlation with T1-contrast images verified via Niivue core."
                            </p>
                        </div>
                    </div>

                    {/* Side Panels */}
                    <aside className="space-y-6">
                        <MetricsDashboard metrics={mockMetrics} />

                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Info className="w-5 h-5" />
                                <h2 className="font-semibold text-slate-100">Patient Profile</h2>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Name</p>
                                    <p className="text-sm font-mono text-slate-300">ANON_USER_{params.shareId.substring(0, 4)}</p>
                                </div>
                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Gender / Age</p>
                                    <p className="text-sm font-mono text-slate-300">M / [MASKED]</p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Personally Identifiable Information Redacted
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-4 glass hover:bg-white/5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all">
                            <Share2 className="w-4 h-4" />
                            Request Full Access
                        </button>
                    </aside>
                </div>
            </div>
        </main>
    );
}
