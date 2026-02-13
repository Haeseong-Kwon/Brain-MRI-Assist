'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Clock, ShieldCheck, X } from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    scanId: string;
}

export default function ShareModal({ isOpen, onClose, scanId }: ShareModalProps) {
    const [expiration, setExpiration] = useState('24h');
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    if (!isOpen) return null;

    const generateLink = () => {
        // Mock link generation logic
        const baseUrl = window.location.origin;
        const token = Math.random().toString(36).substring(7);
        const url = `${baseUrl}/share/${token}`;
        setShareUrl(url);
        setCopied(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-md p-8 flex flex-col gap-6 relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="p-4 bg-indigo-500/10 rounded-full">
                        <Share2 className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-100">Secure Medical Sharing</h2>
                    <p className="text-sm text-slate-400">
                        Generate a secure, time-limited link for external clinical consultation.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Link Expiration
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['1h', '24h', '7d'].map((time) => (
                                <button
                                    key={time}
                                    onClick={() => setExpiration(time)}
                                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${expiration === time
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        {!shareUrl ? (
                            <button
                                onClick={generateLink}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                Generate Secure Link
                            </button>
                        ) : (
                            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-indigo-300 truncate">
                                        {shareUrl}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-3 glass hover:bg-white/10 rounded-xl transition-colors"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    <p className="text-[10px] text-emerald-400/80 font-medium">Link is active and PII-masked for security.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                        Patient identification data will be automatically removed from the viewer for the recipient.
                    </p>
                </div>
            </div>
        </div>
    );
}
