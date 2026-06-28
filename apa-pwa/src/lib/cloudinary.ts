const DEFAULT_CLOUD_NAME = 'dpxv3wmks';
const DEFAULT_UPLOAD_PRESET = 'apa_uploads';

const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';

export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
}

export interface CloudinaryUploadOptions {
    folder?: string;
    tags?: string[];
}

function getCloudName(): string {
    return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD_NAME;
}

function getUploadPreset(): string {
    return import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || DEFAULT_UPLOAD_PRESET;
}

function getUploadUrl(): string {
    return `https://api.cloudinary.com/v1_1/${getCloudName()}/image/upload`;
}

async function postUpload(formData: FormData): Promise<CloudinaryUploadResult> {
    const response = await fetch(getUploadUrl(), {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        const message = typeof data?.error?.message === 'string'
            ? data.error.message
            : 'Falha no upload da imagem.';
        throw new Error(message);
    }

    return {
        secure_url: data.secure_url,
        public_id: data.public_id,
        format: data.format,
        bytes: data.bytes,
        width: data.width,
        height: data.height,
    };
}

function shouldRetryWithoutFolder(errorMessage: string): boolean {
    const normalized = errorMessage.toLowerCase();
    return normalized.includes('folder') || normalized.includes('upload preset');
}

/**
 * Upload unsigned para Cloudinary.
 * Não usa API Secret nem upload assinado.
 *
 * Se o preset não aceitar `folder` ou `tags`, a função tenta novamente sem esses campos.
 */
export async function uploadImageToCloudinary(
    file: Blob | File,
    options?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
    const folder = options?.folder ?? 'apa/lost-pets';
    const tags = options?.tags ?? ['lost-pet', 'apa'];

    const buildFormData = (includeFolderAndTags: boolean) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', getUploadPreset());

        if (includeFolderAndTags) {
            formData.append('folder', folder);
            formData.append('tags', tags.join(','));
        }

        return formData;
    };

    try {
        return await postUpload(buildFormData(true));
    } catch (error) {
        const message = error instanceof Error ? error.message : '';

        if (shouldRetryWithoutFolder(message)) {
            // Preset unsigned pode não permitir folder/tags no upload.
            return postUpload(buildFormData(false));
        }

        throw error;
    }
}

export function isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com/');
}

/**
 * Insere transformações Cloudinary na URL (ex.: f_auto,q_auto,w_600).
 * Registros antigos com URL externa permanecem inalterados.
 */
export function getOptimizedCloudinaryUrl(
    url: string,
    transforms = 'f_auto,q_auto,w_600'
): string {
    if (!url || !isCloudinaryUrl(url)) {
        return url;
    }

    const uploadIndex = url.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
    if (uploadIndex === -1) {
        return url;
    }

    const prefix = url.slice(0, uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length);
    const suffix = url.slice(uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length);

    if (suffix.startsWith(`${transforms}/`) || suffix.startsWith('f_auto')) {
        return url;
    }

    return `${prefix}${transforms}/${suffix}`;
}
