'use client';

import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
    patientId: string;
    scanId: string;
    diceScore: number;
    totalVolume: number;
    tumorVolume: number;
    diagnosis: string;
}

export default function ReportGenerator({ data }: { data: ReportData }) {
    const generateSummary = () => {
        const { tumorVolume, diceScore, diagnosis } = data;
        let summary = `Clinical assessment reveals a brain lesion consistent with ${diagnosis}. `;
        summary += `AI-assisted segmentation measured a total tumor volume of ${tumorVolume} mm³, `;
        summary += `with a model confidence score (Dice) of ${(diceScore * 100).toFixed(1)}%. `;

        if (tumorVolume > 50) {
            summary += "The lesion size warrants urgent neurosurgical consultation.";
        } else {
            summary += "The lesion volume is currently stable; recommend follow-up scan in 3 months.";
        }

        return summary;
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('report-content');
        if (!element) return;

        const canvas = await html2canvas(element, {
            backgroundColor: '#0f172a',
            scale: 2
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Medical_Report_${data.scanId}.pdf`);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden" id="report-content">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <FileText className="w-24 h-24" />
                </div>

                <div className="flex items-center gap-2 text-indigo-400">
                    <FileText className="w-5 h-5" />
                    <h2 className="font-semibold text-slate-100">AI Clinical Summary</h2>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 italic text-sm text-slate-300 leading-relaxed">
                    "{generateSummary()}"
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence</p>
                            <p className="text-sm font-medium">High ({(data.diceScore * 100).toFixed(1)}%)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                            <p className="text-sm font-medium">Draft - Pending MD Review</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
                <Download className="w-4 h-4" />
                Download Clinical PDF Report
            </button>
        </div>
    );
}
