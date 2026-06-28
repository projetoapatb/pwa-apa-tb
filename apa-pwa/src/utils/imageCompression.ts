export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const MAX_INPUT_IMAGE_BYTES = 5 * 1024 * 1024;

export const MAX_IMAGE_DIMENSION = 1600;

export const DEFAULT_COMPRESSION_QUALITY = 0.78;

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    width: number;
    height: number;
}

export function isAllowedImageType(type: string): type is AllowedImageType {
    return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function validateImageFile(file: File): string | null {
    if (!isAllowedImageType(file.type)) {
        return 'Formato não permitido. Use JPG, PNG ou WEBP.';
    }
    if (file.size > MAX_INPUT_IMAGE_BYTES) {
        return 'A imagem deve ter no máximo 5 MB.';
    }
    return null;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Não foi possível ler a imagem selecionada.'));
        };

        img.src = url;
    });
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Falha ao comprimir a imagem.'));
                    return;
                }
                resolve(blob);
            },
            type,
            quality
        );
    });
}

export { loadImageFromFile };

export const LOST_PET_CROP_ASPECT_RATIO = 4 / 3;

export interface ImageCropParams {
    scale: number;
    offsetX: number;
    offsetY: number;
    viewportWidth: number;
    viewportHeight: number;
}

function getOutputMimeType(sourceType: AllowedImageType): { mime: string; extension: string } {
    if (sourceType === 'image/jpeg') {
        return { mime: 'image/jpeg', extension: 'jpg' };
    }
    return { mime: 'image/webp', extension: 'webp' };
}

export function getCoverScale(
    imageWidth: number,
    imageHeight: number,
    viewportWidth: number,
    viewportHeight: number
): number {
    return Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
}

export function clampCropOffset(
    offsetX: number,
    offsetY: number,
    imageWidth: number,
    imageHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    scale: number
): { offsetX: number; offsetY: number } {
    const baseScale = getCoverScale(imageWidth, imageHeight, viewportWidth, viewportHeight);
    const effectiveScale = baseScale * scale;
    const displayWidth = imageWidth * effectiveScale;
    const displayHeight = imageHeight * effectiveScale;

    const minOffsetX = viewportWidth - displayWidth;
    const minOffsetY = viewportHeight - displayHeight;

    return {
        offsetX: Math.min(0, Math.max(minOffsetX, offsetX)),
        offsetY: Math.min(0, Math.max(minOffsetY, offsetY)),
    };
}

export async function exportCroppedImage(
    file: File,
    image: HTMLImageElement,
    params: ImageCropParams,
    aspectRatio = LOST_PET_CROP_ASPECT_RATIO
): Promise<File> {
    const outputWidth = MAX_IMAGE_DIMENSION;
    const outputHeight = Math.round(outputWidth / aspectRatio);

    const baseScale = getCoverScale(
        image.naturalWidth,
        image.naturalHeight,
        params.viewportWidth,
        params.viewportHeight
    );
    const effectiveScale = baseScale * params.scale;

    const sourceX = -params.offsetX / effectiveScale;
    const sourceY = -params.offsetY / effectiveScale;
    const sourceWidth = params.viewportWidth / effectiveScale;
    const sourceHeight = params.viewportHeight / effectiveScale;

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Seu navegador não suporta enquadramento de imagem.');
    }

    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
    );

    const { mime, extension } = getOutputMimeType(file.type as AllowedImageType);
    const blob = await canvasToBlob(canvas, mime, DEFAULT_COMPRESSION_QUALITY);

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'lost-pet';
    return new File([blob], `${baseName}-crop.${extension}`, {
        type: mime,
        lastModified: Date.now(),
    });
}

export async function compressImage(
    file: File,
    options?: { quality?: number; maxDimension?: number }
): Promise<CompressionResult> {
    const validationError = validateImageFile(file);
    if (validationError) {
        throw new Error(validationError);
    }

    const quality = options?.quality ?? DEFAULT_COMPRESSION_QUALITY;
    const maxDimension = options?.maxDimension ?? MAX_IMAGE_DIMENSION;

    const img = await loadImageFromFile(file);

    let { width, height } = img;
    const largestSide = Math.max(width, height);

    if (largestSide > maxDimension) {
        const scale = maxDimension / largestSide;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Seu navegador não suporta compressão de imagem.');
    }

    ctx.drawImage(img, 0, 0, width, height);

    const { mime, extension } = getOutputMimeType(file.type as AllowedImageType);
    const blob = await canvasToBlob(canvas, mime, quality);

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'lost-pet';
    const compressedFile = new File([blob], `${baseName}.${extension}`, {
        type: mime,
        lastModified: Date.now(),
    });

    return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        width,
        height,
    };
}
