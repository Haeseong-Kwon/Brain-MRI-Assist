'use client';

import { useState } from 'react';
import FileUpload from '@/components/dashboard/FileUpload';
import { Database, Search, Filter, MoreVertical, ExternalLink, Calendar, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

// Mock data for scan history
const MOCK_SCANS = [
    { id: 'SCN-8821', patientId: 'PAT-2024-001', date: '2024-05-12', status: 'Completed', modality: 'MRI', description: 'Brain T1/T2 Contrast' },
    { id: 'SCN-8819', patientId: 'PAT-2024-001', date: '2024-04-15', status: 'Completed', modality: 'MRI', description: 'Cervical Spine' },
    { id: 'SCN-8790', patientId: 'PAT-2024-005', date: '2024-03-20', status: 'Analytical', modality: 'CT', description: 'Abdomen/Pelvis' },
];

export default function DashboardPage() {
    return (
        <main className="min-h-screen p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Medical Imaging Dashboard</h1>
                    <p className="text-slate-400">Manage patient scans, upload new data, and perform cloud-based analysis.</p>
                </div>

                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-emerald-400">Supabase Connected</span>
                    </div>
                    <div className="px-4 py-2 glass rounded-xl flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium">3.2 GB / 50 GB Used</span>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <section className="lg:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold">New Scan Upload</h2>
                    </div>
                    <FileUpload patientId="PAT-2024-001" />

                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Upload Instructions</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex gap-2">
                                <span className="text-indigo-400 font-bold">01.</span>
                                Prepare NIfTI (.nii) or DICOM (.dcm) files.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-indigo-400 font-bold">02.</span>
                                Anonymize patient data if required by local policy.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-indigo-400 font-bold">03.</span>
                                Upload begins automatically after selection.
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Scan History Section */}
                <section className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold">Recent Scan History</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search ID..."
                                    className="pl-10 pr-4 py-2 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-48"
                                />
                            </div>
                            <button className="p-2 glass rounded-xl hover:bg-white/10 transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {MOCK_SCANS.map((scan) => (
                            <div key={scan.id} className="glass-card p-5 hover:bg-white/[0.04] transition-all group border-transparent hover:border-indigo-500/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors text-indigo-400">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-200">{scan.id}</span>
                                                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full font-bold uppercase">{scan.modality}</span>
                                            </div>
                                            <p className="text-sm text-slate-500">{scan.description}</p>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex flex-col items-end text-sm text-slate-500 gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {scan.date}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <UserIcon className="w-3.5 h-3.5" />
                                            {scan.patientId}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/mri/${scan.id}`}
                                            className="p-3 glass rounded-xl hover:text-indigo-400 transition-colors"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </Link>
                                        <button className="p-3 glass rounded-xl hover:bg-white/10 transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 text-sm font-semibold text-slate-500 hover:text-indigo-400 transition-colors">
                        View All Scan History →
                    </button>
                </section>
            </div>
        </main>
    );
}
