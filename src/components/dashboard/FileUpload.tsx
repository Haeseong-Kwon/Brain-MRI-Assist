'use client';

import { useState } from 'react';
import { Upload, X, File, CheckCircle2 } from 'lucide-react';
import { uploadMRIFile } from '@/lib/supabase';

interface FileUploadProps {
    patientId: string;
    onUploadSuccess?: (data: any) => void;
}

export default function FileUpload({ patientId, onUploadSuccess }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setStatus('uploading');

        try {
            const data = await uploadMRIFile(file, patientId);
            setStatus('success');
            onUploadSuccess?.(data);
        } catch (error) {
            console.error('Upload failed:', error);
            setStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="glass-card p-8 flex flex-col items-center justify-center border-dashed border-indigo-500/30 hover:border-indigo-500/50 transition-all group">
            {!file ? (
                <>
                    <div className="p-4 bg-indigo-500/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">Click or drag NIfTI/DICOM file to upload</p>
                    <p className="text-xs text-slate-500 mt-2">Support for .nii, .nii.gz, .dcm</p>
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        accept=".nii,.gz,.dcm"
                    />
                </>
            ) : (
                <div className="w-full flex flex-col gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="p-3 bg-indigo-500/20 rounded-lg">
                            <File className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <button
                            onClick={() => setFile(null)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            disabled={isUploading}
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    {status === 'idle' && (
                        <button
                            onClick={handleUpload}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Start Upload
                        </button>
                    )}

                    {status === 'uploading' && (
                        <div className="w-full space-y-2">
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 animate-pulse w-[60%] animate-progress"></div>
                            </div>
                            <p className="text-center text-xs text-slate-400 animate-pulse">Uploading to medical cloud...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            <p className="text-sm font-medium text-emerald-400">Upload Complete</p>
                            <button
                                onClick={() => setFile(null)}
                                className="mt-2 text-xs text-indigo-400 hover:underline"
                            >
                                Upload another file
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-sm text-center text-red-400">Upload failed. Please check your connection.</p>
                            <button
                                onClick={handleUpload}
                                className="w-full mt-2 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-semibold text-red-400 transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
