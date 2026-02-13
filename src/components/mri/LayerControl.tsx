'use client';

import { Eye, EyeOff, Layers, Sliders } from 'lucide-react';
import { useState } from 'react';

interface Layer {
    id: string;
    name: string;
    opacity: number;
    visible: boolean;
    color: string;
}

interface LayerControlProps {
    layers: Layer[];
    onOpacityChange: (id: string, opacity: number) => void;
    onVisibilityToggle: (id: string) => void;
}

export default function LayerControl({ layers, onOpacityChange, onVisibilityToggle }: LayerControlProps) {
    return (
        <div className="glass-card p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 text-indigo-400">
                <Layers className="w-5 h-5" />
                <h2 className="font-semibold text-slate-100">Layer Control</h2>
            </div>

            <div className="space-y-6">
                {layers.map((layer) => (
                    <div key={layer.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                    style={{ backgroundColor: layer.color }}
                                />
                                <span className="text-sm font-medium text-slate-300">{layer.name}</span>
                            </div>
                            <button
                                onClick={() => onVisibilityToggle(layer.id)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {layer.visible ? (
                                    <Eye className="w-4 h-4 text-indigo-400" />
                                ) : (
                                    <EyeOff className="w-4 h-4 text-slate-500" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <Sliders className="w-3.5 h-3.5 text-slate-500" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={layer.opacity}
                                onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
                                className="flex-1 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-[10px] font-mono text-slate-500 w-8 text-right">
                                {Math.round(layer.opacity * 100)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
                    Overlaying segmentation masks with real-time opacity blending.
                </p>
            </div>
        </div>
    );
}
