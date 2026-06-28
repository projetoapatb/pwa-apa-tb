import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Check, RotateCcw, X } from 'lucide-react';
import { Button } from './ui/Button';
import {
    LOST_PET_CROP_ASPECT_RATIO,
    clampCropOffset,
    exportCroppedImage,
    getCoverScale,
} from '../utils/imageCompression';

interface ImageAdjusterProps {
    file: File;
    imageUrl: string;
    onConfirm: (file: File, previewUrl: string) => void;
    onUseOriginal: (file: File, previewUrl: string) => void;
    onCancel: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export const ImageAdjuster: React.FC<ImageAdjusterProps> = ({
    file,
    imageUrl,
    onConfirm,
    onUseOriginal,
    onCancel,
}) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

    const [imageLoaded, setImageLoaded] = useState(false);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const updateViewportSize = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const width = viewport.clientWidth;
        const height = Math.round(width / LOST_PET_CROP_ASPECT_RATIO);
        setViewportSize({ width, height });
    }, []);

    const centerOffset = useCallback((nextScale: number, width: number, height: number) => {
        const img = imageRef.current;
        if (!img || !width || !height) return { offsetX: 0, offsetY: 0 };

        const baseScale = getCoverScale(img.naturalWidth, img.naturalHeight, width, height);
        const effectiveScale = baseScale * nextScale;
        const displayWidth = img.naturalWidth * effectiveScale;
        const displayHeight = img.naturalHeight * effectiveScale;

        return clampCropOffset(
            (width - displayWidth) / 2,
            (height - displayHeight) / 2,
            img.naturalWidth,
            img.naturalHeight,
            width,
            height,
            nextScale
        );
    }, []);

    useEffect(() => {
        updateViewportSize();
        window.addEventListener('resize', updateViewportSize);
        return () => window.removeEventListener('resize', updateViewportSize);
    }, [updateViewportSize]);

    useEffect(() => {
        if (!imageLoaded || !viewportSize.width || !naturalSize.width) return;

        setOffset((prev) => {
            const clamped = clampCropOffset(
                prev.x,
                prev.y,
                naturalSize.width,
                naturalSize.height,
                viewportSize.width,
                viewportSize.height,
                scale
            );
            return { x: clamped.offsetX, y: clamped.offsetY };
        });
    }, [viewportSize.width, viewportSize.height, imageLoaded, naturalSize.width, naturalSize.height, scale]);

    const handleImageLoad = () => {
        const img = imageRef.current;
        if (!img) return;

        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoaded(true);
        updateViewportSize();

        requestAnimationFrame(() => {
            const viewport = viewportRef.current;
            if (!viewport) return;

            const width = viewport.clientWidth;
            const height = Math.round(width / LOST_PET_CROP_ASPECT_RATIO);
            const centered = centerOffset(1, width, height);
            setOffset({ x: centered.offsetX, y: centered.offsetY });
            setViewportSize({ width, height });
        });
    };

    const handleZoomChange = (nextScale: number) => {
        const clampedScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScale));
        const img = imageRef.current;
        if (!img || !viewportSize.width) {
            setScale(clampedScale);
            return;
        }

        const centered = centerOffset(clampedScale, viewportSize.width, viewportSize.height);
        setScale(clampedScale);
        setOffset({ x: centered.offsetX, y: centered.offsetY });
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!imageLoaded) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragStateRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            originX: offset.x,
            originY: offset.y,
        };
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const dragState = dragStateRef.current;
        const img = imageRef.current;
        if (!dragState || !img || !viewportSize.width) return;

        const nextOffset = clampCropOffset(
            dragState.originX + (event.clientX - dragState.startX),
            dragState.originY + (event.clientY - dragState.startY),
            img.naturalWidth,
            img.naturalHeight,
            viewportSize.width,
            viewportSize.height,
            scale
        );

        setOffset({ x: nextOffset.offsetX, y: nextOffset.offsetY });
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        dragStateRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const buildPreviewUrl = (nextFile: File) => URL.createObjectURL(nextFile);

    const handleConfirm = async () => {
        const img = imageRef.current;
        if (!img || !viewportSize.width) return;

        setProcessing(true);
        setError('');

        try {
            const croppedFile = await exportCroppedImage(file, img, {
                scale,
                offsetX: offset.x,
                offsetY: offset.y,
                viewportWidth: viewportSize.width,
                viewportHeight: viewportSize.height,
            });
            onConfirm(croppedFile, buildPreviewUrl(croppedFile));
        } catch (cropError) {
            console.error('Erro ao enquadrar imagem:', cropError);
            setError('Não foi possível enquadrar a foto. Tente novamente ou use a imagem original.');
        } finally {
            setProcessing(false);
        }
    };

    const handleUseOriginal = () => {
        onUseOriginal(file, buildPreviewUrl(file));
    };

    const baseScale = imageLoaded && viewportSize.width && naturalSize.width
        ? getCoverScale(naturalSize.width, naturalSize.height, viewportSize.width, viewportSize.height)
        : 1;
    const effectiveScale = baseScale * scale;
    const displayWidth = naturalSize.width * effectiveScale;
    const displayHeight = naturalSize.height * effectiveScale;

    return (
        <div className="rounded-3xl border-2 border-brand-orange/20 bg-brand-orange/5 p-5 space-y-4 animate-fade-in">
            <div>
                <h3 className="text-base font-bold text-gray-800 font-merriweather">
                    Ajuste a foto para destacar o animal.
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Arraste para reposicionar e use o zoom para enquadrar melhor. Proporção do mural: 4:3.
                </p>
            </div>

            <div
                ref={viewportRef}
                className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-gray-900 touch-none select-none cursor-grab active:cursor-grabbing"
                style={{ aspectRatio: '4 / 3' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Ajuste da foto"
                    draggable={false}
                    onLoad={handleImageLoad}
                    className="absolute max-w-none pointer-events-none"
                    style={{
                        width: displayWidth || '100%',
                        height: displayHeight || 'auto',
                        left: offset.x,
                        top: offset.y,
                    }}
                />
                <div className="pointer-events-none absolute inset-0 ring-2 ring-white/70 ring-inset rounded-2xl" />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Zoom
                </label>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => handleZoomChange(scale - 0.1)}
                        className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-brand-orange"
                        aria-label="Diminuir zoom"
                        disabled={processing || scale <= MIN_ZOOM}
                    >
                        <ZoomOut size={18} />
                    </button>
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={scale}
                        onChange={(event) => handleZoomChange(Number(event.target.value))}
                        className="flex-grow accent-brand-orange"
                        disabled={processing || !imageLoaded}
                    />
                    <button
                        type="button"
                        onClick={() => handleZoomChange(scale + 0.1)}
                        className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-brand-orange"
                        aria-label="Aumentar zoom"
                        disabled={processing || scale >= MAX_ZOOM}
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3">
                    {error}
                </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    type="button"
                    variant="orange"
                    className="flex-1"
                    onClick={handleConfirm}
                    isLoading={processing}
                    disabled={!imageLoaded}
                >
                    <Check size={18} className="mr-2" />
                    Confirmar enquadramento
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleUseOriginal}
                    disabled={processing || !imageLoaded}
                >
                    <RotateCcw size={18} className="mr-2" />
                    Usar imagem original
                </Button>
            </div>

            <button
                type="button"
                onClick={onCancel}
                className="w-full text-sm font-bold text-gray-500 hover:text-red-500 flex items-center justify-center gap-2"
                disabled={processing}
            >
                <X size={16} />
                Cancelar e escolher outra foto
            </button>
        </div>
    );
};
