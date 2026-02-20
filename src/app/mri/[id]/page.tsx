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
    const [isAnalyzed, setIsAnalyzed] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
            url: '/mni152.nii.gz'
        },
        {
            id: 'tumor',
            name: 'Tumor (AI-Predicted)',
            opacity: 0.8,
            visible: false, // Hidden initially
            color: '#ef4444',
            url: '/mni152.nii.gz' // Mock overlay
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

    const runAnalysis = () => {
        setIsAnalyzing(true);
        // Immediate start to bypass "Generating" delay
        setTimeout(() => {
            setIsAnalyzed(true);
            setIsAnalyzing(false);

            // Show tumor layer with smooth fade-in
            const tumorLayerId = 'tumor';
            const index = layers.findIndex(l => l.id === tumorLayerId);

            setLayers(prev => prev.map(l => l.id === tumorLayerId ? { ...l, visible: true, opacity: 0 } : l));
            viewerRef.current?.setVisibility(index, true);
            viewerRef.current?.setOpacity(index, 0);

            let currentOpacity = 0;
            const targetOpacity = 0.8;
            const fadeInterval = setInterval(() => {
                currentOpacity += 0.05;
                if (currentOpacity >= targetOpacity) {
                    currentOpacity = targetOpacity;
                    clearInterval(fadeInterval);
                }
                setLayers(prev => prev.map(l => l.id === tumorLayerId ? { ...l, opacity: currentOpacity } : l));
                viewerRef.current?.setOpacity(index, currentOpacity);
            }, 50);

        }, 100);
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
                        {!isAnalyzed ? (
                            <div className="flex items-center gap-3">
                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                    Ready for Segmentation
                                </p>
                                <button
                                    onClick={runAnalysis}
                                    disabled={isAnalyzing}
                                    className="ml-4 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Settings2 className="w-3 h-3" />
                                            Run AI Analysis
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <p className="text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-500">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                AI Analysis Complete
                            </p>
                        )}
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
                        url="/mni152.nii.gz"
                        overlays={layers.map(l => ({ url: l.url, color: l.color, opacity: l.opacity, name: l.name }))}
                        onLocationChange={setLocation}
                    />

                    <div className="flex items-center justify-center gap-3 p-4 glass rounded-2xl">
                        <button onClick={() => viewerRef.current?.setSliceType(0)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors">Axial</button>
                        <button onClick={() => viewerRef.current?.setSliceType(1)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors">Coronal</button>
                        <button onClick={() => viewerRef.current?.setSliceType(2)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors">Sagittal</button>
                        <button onClick={() => viewerRef.current?.setSliceType(3)} className="px-6 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-indigo-500/30">Multiplanar</button>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${isAnalyzed ? 'opacity-100 translate-y-0' : 'opacity-50 blur-sm grayscale pointer-events-none'}`}>
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

                            {isAnalyzed && (
                                <div className="pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-700">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Diagnosis</label>
                                    <p className="text-sm font-medium text-emerald-400 font-bold">Suspected Glioma (G3)</p>

                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                            <label className="text-[9px] text-red-300 uppercase font-bold">Tumor Vol</label>
                                            <p className="text-lg font-bold text-red-400">42.5 <span className="text-xs font-normal">cm³</span></p>
                                        </div>
                                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                            <label className="text-[9px] text-indigo-300 uppercase font-bold">Confidence</label>
                                            <p className="text-lg font-bold text-indigo-400">94.2%</p>
                                        </div>
                                    </div>
                                </div>
                            )}
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
