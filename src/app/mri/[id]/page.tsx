'use client';

import { useRef, useState } from 'react';
import MRIViewer, { MRIViewerHandle } from '@/components/viewer/MRIViewer';
import LayerControl from '@/components/mri/LayerControl';
import MetricsDashboard from '@/components/mri/MetricsDashboard';
import VolumeChart from '@/components/mri/VolumeChart';
import ReportGenerator from '@/components/mri/ReportGenerator';
import ShareModal from '@/components/mri/ShareModal';
import { ArrowLeft, Share2, Download, Info, Settings2, History } from 'lucide-react';
import Link from 'next/link';

export default function MRIViewerPage({ params }: { params: { id: string } }) {
    const viewerRef = useRef<MRIViewerHandle>(null);
    const [location, setLocation] = useState<any>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const mockReportData = {
        patientId: 'PAT-2024-001',
        scanId: params.id,
        diceScore: 0.942,
        totalVolume: 1450,
        tumorVolume: 42.5,
        diagnosis: 'Suspected Glioma (G3)'
    };

    const [layers, setLayers] = useState([
        {
            id: 'brain',
            name: 'Brain Tissue',
            opacity: 0.5,
            visible: true,
            color: '#4f46e5',
            url: 'https://niivue.github.io/niivue/images/mni152.nii.gz'
        },
        {
            id: 'tumor',
            name: 'Tumor (AI-Predicted)',
            opacity: 0.8,
            visible: true,
            color: '#ef4444',
            url: 'https://niivue.github.io/niivue/images/mni152.nii.gz' // Mock overlay
        },
    ]);

    const handleOpacityChange = (id: string, opacity: number) => {
        const index = layers.findIndex(l => l.id === id);
        setLayers(layers.map(l => l.id === id ? { ...l, opacity } : l));
        viewerRef.current?.setOpacity(index, opacity);
    };

    const handleVisibilityToggle = (id: string) => {
        const index = layers.findIndex(l => l.id === id);
        const layer = layers[index];
        setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
        viewerRef.current?.setVisibility(index, !layer.visible);
    };

    return (
        <main className="min-h-screen p-6 lg:p-10 flex flex-col gap-8">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 glass hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Analysis: {params.id}</h1>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            AI Processing Complete
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center gap-4 px-4 py-2 glass rounded-xl mr-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Location</span>
                            <span className="text-xs font-mono text-indigo-400">
                                {location ? `${location.mm[0].toFixed(1)}, ${location.mm[1].toFixed(1)}, ${location.mm[2].toFixed(1)}` : '0.0, 0.0, 0.0'}
                            </span>
                        </div>
                        <Settings2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Viewer Area */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <MetricsDashboard />
                    <MRIViewer
                        ref={viewerRef}
                        className="w-full"
                        overlays={layers.map(l => ({ url: l.url, color: l.color, opacity: l.opacity, name: l.name }))}
                        onLocationChange={setLocation}
                    />

                    <div className="flex items-center justify-center gap-3 p-4 glass rounded-2xl">
                        <button onClick={() => viewerRef.current?.setSliceType(0)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors">Axial</button>
                        <button onClick={() => viewerRef.current?.setSliceType(1)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors">Coronal</button>
                        <button onClick={() => viewerRef.current?.setSliceType(2)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors">Sagittal</button>
                        <button onClick={() => viewerRef.current?.setSliceType(3)} className="px-6 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-indigo-500/30">Multiplanar</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <VolumeChart />
                        <ReportGenerator data={mockReportData} />
                    </div>
                </div>

                {/* Sidebar Info */}
                <aside className="flex flex-col gap-6">
                    <LayerControl
                        layers={layers}
                        onOpacityChange={handleOpacityChange}
                        onVisibilityToggle={handleVisibilityToggle}
                    />

                    <div className="glass-card p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Info className="w-5 h-5" />
                            <h2 className="font-semibold">Patient Information</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Age</label>
                                    <p className="text-sm font-medium">64</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Gender</label>
                                    <p className="text-sm font-medium">Male</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Diagnosis</label>
                                <p className="text-sm font-medium text-indigo-300">Suspected Glioma (G3)</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                scanId={params.id}
            />
        </main>
    );
}
