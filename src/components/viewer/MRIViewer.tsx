'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Niivue, NVImage } from '@niivue/niivue';

interface MRIViewerProps {
    url?: string;
    overlays?: { url: string; color?: string; opacity?: number; name: string }[];
    className?: string;
    onLocationChange?: (location: any) => void;
}

export interface MRIViewerHandle {
    setOpacity: (index: number, opacity: number) => void;
    setVisibility: (index: number, visible: boolean) => void;
    setSliceType: (type: number) => void;
}

const MRIViewer = forwardRef<MRIViewerHandle, MRIViewerProps>(({
    url = 'https://niivue.github.io/niivue/images/mni152.nii.gz',
    overlays = [],
    className,
    onLocationChange
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nvRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useImperativeHandle(ref, () => ({
        setOpacity: (index: number, opacity: number) => {
            if (nvRef.current && nvRef.current.volumes[index + 1]) {
                nvRef.current.setOpacity(index + 1, opacity);
            }
        },
        setVisibility: (index: number, visible: boolean) => {
            if (nvRef.current && nvRef.current.volumes[index + 1]) {
                nvRef.current.setOpacity(index + 1, visible ? 1 : 0);
            }
        },
        setSliceType: (type: number) => {
            if (nvRef.current) {
                nvRef.current.setSliceType(type);
            }
        }
    }));

    const onLocationChangeRef = useRef(onLocationChange);
    useEffect(() => {
        onLocationChangeRef.current = onLocationChange;
    }, [onLocationChange]);

    useEffect(() => {
        if (!canvasRef.current || nvRef.current) return;

        const nv = new Niivue({
            backColor: [0, 0, 0, 1],
            show3Dcrosshair: true,
            isSliceMM: true,
            multiplanarForceRender: true,
        });

        nv.onLocationChange = (location: any) => {
            onLocationChangeRef.current?.(location);
        };

        nv.attachToCanvas(canvasRef.current);

        const loadVolumes = async () => {
            try {
                const volumesToLoad = [
                    { url, colorMap: 'gray', opacity: 1 },
                    ...overlays.map(o => ({
                        url: o.url,
                        colorMap: o.color || 'red',
                        opacity: o.opacity !== undefined ? o.opacity : 0.5,
                        name: o.name
                    }))
                ];

                await nv.loadVolumes(volumesToLoad);
                nv.setSliceType(nv.sliceTypeMultiplanar);
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load volumes:', error);
            }
        };

        loadVolumes();
        nvRef.current = nv;

        return () => {
            // nv.terminate(); // If niivue has a terminate method
        };
    }, []);

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                <canvas ref={canvasRef} className="w-full h-full" />

                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                    <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-700 text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                        Sync Active
                    </div>
                </div>
            </div>
        </div>
    );
});

MRIViewer.displayName = 'MRIViewer';

export default MRIViewer;
