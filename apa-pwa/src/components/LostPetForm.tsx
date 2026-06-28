import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { PrivacyConsentCheckbox } from './PrivacyConsentCheckbox';
import { ImageAdjuster } from './ImageAdjuster';
import { CheckCircle2, Send, Camera, MapPin, Phone, Calendar, Info, X, Link2 } from 'lucide-react';
import { maskPhone, validatePhone } from '../utils/masks';
import { compressImage, validateImageFile } from '../utils/imageCompression';
import { uploadImageToCloudinary } from '../lib/cloudinary';


const lostPetSchema = z.object({
    name: z.string().min(2, 'Nome muito curto ou "Sem Nome"'),
    species: z.enum(['cachorro', 'gato', 'outro']),
    status: z.enum(['perdido', 'encontrado']),
    description: z.string().min(10, 'Descreva com mais detalhes (cor, coleira, comportamento)'),
    lastSeenLocation: z.string().min(5, 'Informe o local ou bairro'),
    lastSeenDate: z.string().min(1, 'Informe a data aproximada'),
    contactPhone: z.string().refine(validatePhone, 'Telefone deve ter 11 dígitos com DDD'),
    photoUrl: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
    hasReward: z.boolean().optional(),
    rewardValue: z.string().optional(),
});


type LostPetFormValues = z.infer<typeof lostPetSchema>;

type UploadStatus = '' | 'preparing' | 'uploading' | 'saving';

interface LostPetFormProps {
    onCancel?: () => void;
}

export const LostPetForm: React.FC<LostPetFormProps> = ({ onCancel }) => {
    const { profile, user } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const [privacyConsent, setPrivacyConsent] = useState(false);
    const [consentError, setConsentError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileError, setFileError] = useState('');
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('');
    const [useManualLink, setUseManualLink] = useState(false);
    const [pendingAdjustment, setPendingAdjustment] = useState<{ file: File; url: string } | null>(null);
    const [originalSourceFile, setOriginalSourceFile] = useState<File | null>(null);
    const previewUrlRef = useRef<string | null>(null);
    const adjustmentUrlRef = useRef<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<LostPetFormValues>({
        resolver: zodResolver(lostPetSchema),
        defaultValues: {
            status: 'perdido',
            species: 'cachorro',
            hasReward: false,
            rewardValue: '',
            photoUrl: '',
        }
    });

    const hasReward = watch('hasReward');
    const isBusy = isSubmitting || uploadStatus !== '';

    const clearAdjustment = () => {
        if (adjustmentUrlRef.current) {
            URL.revokeObjectURL(adjustmentUrlRef.current);
            adjustmentUrlRef.current = null;
        }
        setPendingAdjustment(null);
    };

    const setPreviewFromFile = (file: File, url: string) => {
        clearPreview();
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setSelectedFile(file);
        setUseManualLink(false);
        setValue('photoUrl', '');
    };

    const clearPreview = () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
        setPreviewUrl(null);
    };

    useEffect(() => {
        if (profile?.phone) {
            setValue('contactPhone', maskPhone(profile.phone));
        }
    }, [profile, setValue]);

    useEffect(() => {
        return () => {
            clearPreview();
            clearAdjustment();
        };
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setFileError('');
        event.target.value = '';

        if (!file) return;

        const validationError = validateImageFile(file);
        if (validationError) {
            setFileError(validationError);
            return;
        }

        clearPreview();
        clearAdjustment();
        setSelectedFile(null);
        setOriginalSourceFile(file);

        const objectUrl = URL.createObjectURL(file);
        adjustmentUrlRef.current = objectUrl;
        setPendingAdjustment({ file, url: objectUrl });
    };

    const handleRemoveFile = () => {
        clearPreview();
        clearAdjustment();
        setSelectedFile(null);
        setOriginalSourceFile(null);
        setFileError('');
    };

    const handleAdjustAgain = () => {
        if (!originalSourceFile || isBusy) return;

        clearPreview();
        setSelectedFile(null);
        clearAdjustment();

        const objectUrl = URL.createObjectURL(originalSourceFile);
        adjustmentUrlRef.current = objectUrl;
        setPendingAdjustment({ file: originalSourceFile, url: objectUrl });
    };

    const handleAdjustmentConfirm = (file: File, url: string) => {
        clearAdjustment();
        setPreviewFromFile(file, url);
    };

    const handleUseOriginalImage = (file: File, url: string) => {
        clearAdjustment();
        setPreviewFromFile(file, url);
    };

    const handleAdjustmentCancel = () => {
        clearAdjustment();
        setFileError('');
    };

    const onSubmit = async (values: LostPetFormValues) => {
        if (!privacyConsent) {
            setConsentError('É necessário aceitar a Política de Privacidade para continuar.');
            return;
        }
        setConsentError('');

        if (!user) {
            alert('Faça login para publicar um anúncio.');
            return;
        }

        const manualPhotoUrl = values.photoUrl?.trim() || '';

        if (!selectedFile && !manualPhotoUrl) {
            setFileError('Envie uma foto ou informe um link de imagem.');
            return;
        }

        if (selectedFile && manualPhotoUrl) {
            setFileError('Use apenas upload de arquivo ou link manual, não os dois ao mesmo tempo.');
            return;
        }

        try {
            let photoUrl = manualPhotoUrl;
            let imagePayload: Record<string, unknown> = {};

            if (selectedFile) {
                setUploadStatus('preparing');
                const compressed = await compressImage(selectedFile);

                setUploadStatus('uploading');
                const uploaded = await uploadImageToCloudinary(compressed.file, {
                    folder: 'apa/lost-pets',
                    tags: ['lost-pet', 'apa'],
                });

                photoUrl = uploaded.secure_url;
                imagePayload = {
                    cloudinaryPublicId: uploaded.public_id,
                    imageProvider: 'cloudinary',
                    originalImageSize: compressed.originalSize,
                    compressedImageSize: compressed.compressedSize,
                    imageWidth: uploaded.width ?? compressed.width,
                    imageHeight: uploaded.height ?? compressed.height,
                    imageDeletedAt: null,
                };
            } else if (manualPhotoUrl) {
                imagePayload = {
                    imageProvider: 'external',
                    imageDeletedAt: null,
                };
            }

            setUploadStatus('saving');

            await addDoc(collection(db, 'lost_pets'), {
                name: values.name,
                species: values.species,
                status: values.status,
                description: values.description,
                lastSeenLocation: values.lastSeenLocation,
                lastSeenDate: new Date(values.lastSeenDate),
                contactPhone: values.contactPhone,
                hasReward: values.hasReward || false,
                rewardValue: values.rewardValue || '',
                photoUrl,
                ...imagePayload,
                moderationStatus: 'pending',
                userId: user.uid,
                createdAt: serverTimestamp(),
            });

            setSubmitted(true);
            reset();
            handleRemoveFile();
            setUseManualLink(false);
        } catch (error) {
            console.error('Erro ao anunciar no mural:', error);
            const message = error instanceof Error
                ? error.message
                : 'Não foi possível enviar seu anúncio. Verifique os dados e tente novamente.';
            alert(message);
        } finally {
            setUploadStatus('');
        }
    };

    const statusMessage = uploadStatus === 'preparing'
        ? 'Preparando imagem...'
        : uploadStatus === 'uploading'
            ? 'Enviando foto...'
            : uploadStatus === 'saving'
                ? 'Salvando anúncio...'
                : '';

    if (submitted) {
        return (
            <div className="text-center py-10 animate-bounce-in bg-brand-green/5 rounded-3xl p-8 border border-brand-green/20">
                <div className="bg-brand-green w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20">
                    <CheckCircle2 size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-merriweather">Anúncio Enviado!</h2>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                    Obrigado por ajudar! Seu anúncio passará por uma rápida moderação administrativa e logo estará visível para todos.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                    Fazer outro anúncio
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-orange/10 p-3 rounded-2xl text-brand-orange">
                    <Info size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 font-merriweather">Anunciar no Mural</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Utilidade Pública</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Status</label>
                    <select
                        {...register('status')}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all appearance-none"
                    >
                        <option value="perdido">Perdi um animal</option>
                        <option value="encontrado">Encontrei um animal</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Espécie</label>
                    <select
                        {...register('species')}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all appearance-none"
                    >
                        <option value="cachorro">Cachorro</option>
                        <option value="gato">Gato</option>
                        <option value="outro">Outro</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Nome (ou "Sem nome")</label>
                <input
                    {...register('name')}
                    placeholder="Ex: Totó"
                    className={`w-full p-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.name ? 'border-red-400' : 'border-gray-100 focus:border-brand-orange'}`}
                />
                {errors.name && <span className="text-xs text-red-500 ml-2 mt-1 block">{errors.name.message}</span>}
            </div>

            <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Foto do animal</label>
                <p className="text-sm text-gray-500 ml-2 leading-relaxed">
                    Envie uma foto nítida do animal. O sistema reduzirá o tamanho da imagem antes do envio.
                </p>

                {pendingAdjustment ? (
                    <ImageAdjuster
                        file={pendingAdjustment.file}
                        imageUrl={pendingAdjustment.url}
                        onConfirm={handleAdjustmentConfirm}
                        onUseOriginal={handleUseOriginalImage}
                        onCancel={handleAdjustmentCancel}
                    />
                ) : previewUrl ? (
                    <div className="space-y-2 max-w-xs">
                        <div className="relative rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                            <img src={previewUrl} alt="Pré-visualização" className="w-full aspect-[4/3] object-cover" />
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-gray-600 hover:text-red-500 shadow-sm"
                                aria-label="Remover foto"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {originalSourceFile && (
                            <button
                                type="button"
                                onClick={handleAdjustAgain}
                                className="text-xs font-bold text-brand-green hover:underline ml-2"
                                disabled={isBusy}
                            >
                                Ajustar novamente
                            </button>
                        )}
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-brand-orange/50 hover:bg-brand-orange/5 transition-all">
                        <Camera size={32} className="text-gray-300" />
                        <span className="text-sm font-bold text-gray-600">Selecionar foto</span>
                        <span className="text-xs text-gray-400">JPG, PNG ou WEBP · até 5 MB</span>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isBusy}
                        />
                    </label>
                )}

                {fileError && <p className="text-xs text-red-500 ml-2">{fileError}</p>}

                {!selectedFile && !pendingAdjustment && (
                    <button
                        type="button"
                        onClick={() => setUseManualLink((prev) => !prev)}
                        className="text-xs font-bold text-brand-green hover:underline ml-2 flex items-center gap-1"
                    >
                        <Link2 size={14} />
                        {useManualLink ? 'Ocultar link manual' : 'Ou usar link de imagem'}
                    </button>
                )}

                {useManualLink && !selectedFile && !pendingAdjustment && (
                    <div className="relative animate-fade-in">
                        <input
                            {...register('photoUrl')}
                            placeholder="https://..."
                            className={`w-full p-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.photoUrl ? 'border-red-400' : 'border-gray-100 focus:border-brand-orange'}`}
                        />
                        {errors.photoUrl && <span className="text-xs text-red-500 ml-2 mt-1 block">{errors.photoUrl.message}</span>}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Descrição Detalhada</label>
                <textarea
                    {...register('description')}
                    placeholder="Ex: Usava coleira azul, é muito dócil, tem uma mancha branca na pata esquerda..."
                    rows={3}
                    className={`w-full p-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all resize-none ${errors.description ? 'border-red-400' : 'border-gray-100 focus:border-brand-orange'}`}
                ></textarea>
                {errors.description && <span className="text-xs text-red-500 ml-2 mt-1 block">{errors.description.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Onde foi visto?</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange" size={18} />
                        <input
                            {...register('lastSeenLocation')}
                            placeholder="Bairro ou ponto de referência"
                            className={`w-full p-4 pl-12 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.lastSeenLocation ? 'border-red-400' : 'border-gray-100 focus:border-brand-orange'}`}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Quando foi visto?</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange" size={18} />
                        <input
                            type="date"
                            {...register('lastSeenDate')}
                            className={`w-full p-4 pl-12 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.lastSeenDate ? 'border-red-400' : 'border-gray-100 focus:border-brand-orange'}`}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Telefone de Contato</label>
                <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange" size={18} />
                    <input
                        {...register('contactPhone')}
                        placeholder="(42) 99999-9999"
                        onChange={(e) => {
                            const masked = maskPhone(e.target.value);
                            setValue('contactPhone', masked, { shouldValidate: true });
                        }}
                        className={`w-full p-4 pl-12 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.contactPhone ? 'border-red-400' : 'border-gray-100 focus:border-brand-orange'}`}
                    />
                </div>
                {errors.contactPhone && <span className="text-xs text-red-500 ml-2 mt-1 block">{errors.contactPhone.message}</span>}
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        {...register('hasReward')}
                        id="hasReward"
                        className="w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <label htmlFor="hasReward" className="text-sm font-bold text-gray-700 cursor-pointer">
                        Oferecer Recompensa?
                    </label>
                </div>

                {hasReward && (
                    <div className="animate-fade-in">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Valor ou Descrição da Recompensa</label>
                        <input
                            {...register('rewardValue')}
                            placeholder="Ex: R$ 200,00 ou Cesta de Café"
                            className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all"
                        />
                    </div>
                )}
            </div>

            {statusMessage && (
                <p className="text-sm text-brand-green font-medium text-center animate-pulse">{statusMessage}</p>
            )}

            <PrivacyConsentCheckbox
                checked={privacyConsent}
                onChange={(checked) => {
                    setPrivacyConsent(checked);
                    if (checked) setConsentError('');
                }}
                id="lostPetPrivacyConsent"
                error={consentError}
            />

            <div className="flex gap-4 pt-4">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="flex-grow py-4 border-2 border-transparent hover:border-gray-100 rounded-2xl" disabled={isBusy}>
                        Cancelar
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="orange"
                    className="flex-grow py-4 text-lg shadow-lg shadow-orange-900/20 rounded-2xl"
                    isLoading={isBusy}
                >
                    Publicar Agora
                    <Send size={18} className="ml-2" />
                </Button>
            </div>
        </form>
    );
};
