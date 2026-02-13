'use client';

import { useEffect, useRef, useState } from 'react';
import { Niivue } from '@niivue/niivue';

interface MRIViewerProps {
    url?: string;
    className?: string;
}

export default function MRIViewer({
    url = 'https://niivue.github.io/niivue/images/mni152.nii.gz', // Default sample
    className
}: MRIViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nvRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!canvasRef.current) return;

        const nv = new Niivue({
            backColor: [0, 0, 0, 1],
            show3Dcrosshair: true,
            isSliceMM: true,
            multiplanarForceRender: true,
        });

        nv.attachToCanvas(canvasRef.current);

        const loadVolume = async () => {
            try {
                await nv.loadVolumes([{ url }]);
                nv.setSliceType(nv.sliceTypeMultiplanar);
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load volume:', error);
            }
        };

        loadVolume();
        nvRef.current = nv;

        return () => {
            // Cleanup
        };
    }, [url]);

    const handleSliceType = (type: number) => {
        if (nvRef.current) {
            nvRef.current.setSliceType(type);
        }
    };

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                <canvas ref={canvasRef} className="w-full h-full" />

                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-700 text-xs text-slate-300 font-medium">
                        Window: Right Click + Drag
                    </div>
                    <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-700 text-xs text-slate-300 font-medium">
                        Slice: Scroll Wheel
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800">
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSliceType(0)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        Axial
                    </button>
                    <button
                        onClick={() => handleSliceType(1)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        Coronal
                    </button>
                    <button
                        onClick={() => handleSliceType(2)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        Sagittal
                    </button>
                    <button
                        onClick={() => handleSliceType(3)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                    >
                        Multiplanar
                    </button>
                </div>
            </div>
        </div>
    );
}
