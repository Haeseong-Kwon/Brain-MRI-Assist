import MRIViewer from '@/components/viewer/MRIViewer';
import { ArrowLeft, Share2, Download, Info } from 'lucide-react';
import Link from 'next/link';

export default function MRIViewerPage({ params }: { params: { id: string } }) {
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
                        <h1 className="text-2xl font-semibold tracking-tight">Scan ID: {params.id}</h1>
                        <p className="text-slate-400 text-sm">Patient ID: PAT-2024-001 • Modality: MRI</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition-colors">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Viewer Area */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <MRIViewer className="w-full" />
                </div>

                {/* Sidebar Info */}
                <aside className="flex flex-col gap-6">
                    <div className="glass-card p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Info className="w-5 h-5" />
                            <h2 className="font-semibold">Scan Information</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Acquisition Date</dt>
                                <p className="text-sm font-medium">May 12, 2024, 14:30 PM</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Scanning Sequence</dt>
                                <p className="text-sm font-medium">T1-weighted Graduate Echo</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Slice Thickness</dt>
                                <p className="text-sm font-medium">1.5 mm</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Field Strength</dt>
                                <p className="text-sm font-medium">3.0 Tesla</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <button className="w-full py-3 glass hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">
                                View Metadata
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-6 flex flex-col gap-4">
                        <h3 className="font-semibold">Quick Analysis</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Volumes</p>
                                <p className="text-lg font-bold">175</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Artifacts</p>
                                <p className="text-lg font-bold">None</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}
