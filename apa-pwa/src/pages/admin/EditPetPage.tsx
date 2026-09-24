import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ImageAdjuster } from '../../components/ImageAdjuster';
import {
    Save,
    ArrowLeft,
    Check,
    Camera,
    Crop
} from 'lucide-react';
import type { Pet } from '../../types';
import { maskPhone, validatePhone } from '../../utils/masks';
import { compressImage, validateImageFile } from '../../utils/imageCompression';
import { uploadImageToCloudinary, getOptimizedCloudinaryUrl } from '../../lib/cloudinary';

const petSchema = z.object({
    species: z.enum(['Cachorro', 'Gato']),
    gender: z.enum(['Macho', 'Fêmea']),
    name: z.string().min(2, 'Nome é obrigatório'),
    breed: z.string().optional(),
    color: z.string().optional(),
    ageValue: z.string().min(1, 'Idade é obrigatória'),
    ageUnit: z.enum(['anos', 'meses']),
    size: z.enum(['P', 'M', 'G']),
    description: z.string().min(10, 'Descrição insuficiente'),
    address: z.string().min(5, 'Endereço é obrigatório'),
    contactPhone: z.string().refine(validatePhone, 'Telefone deve ter 11 dígitos com DDD'),
    status: z.enum(['disponível', 'adotado', 'indisponível', 'pendente']),
});

type PetFormData = z.infer<typeof petSchema>;

const EditPetPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pet, setPet] = useState<Pet | null>(null);
    const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
    const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
    const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
    const [originalSourceFile, setOriginalSourceFile] = useState<File | null>(null);
    const [pendingAdjustment, setPendingAdjustment] = useState<{ file: File; url: string } | null>(null);
    const [fileError, setFileError] = useState('');
    const adjustmentUrlRef = useRef<string | null>(null);
    const newPreviewRef = useRef<string | null>(null);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PetFormData>({
        resolver: zodResolver(petSchema),
    });

    const selectedSpecies = watch('species');
    const selectedGender = watch('gender');
    const selectedSize = watch('size');
    const selectedStatus = watch('status');

    const clearAdjustment = () => {
        if (adjustmentUrlRef.current) {
            URL.revokeObjectURL(adjustmentUrlRef.current);
            adjustmentUrlRef.current = null;
        }
        setPendingAdjustment(null);
    };

    const clearNewPreview = () => {
        if (newPreviewRef.current) {
            URL.revokeObjectURL(newPreviewRef.current);
            newPreviewRef.current = null;
        }
        setNewPhotoPreview(null);
        setNewPhotoFile(null);
    };

    useEffect(() => {
        return () => {
            clearAdjustment();
            if (newPreviewRef.current) URL.revokeObjectURL(newPreviewRef.current);
        };
    }, []);

    useEffect(() => {
        const fetchPet = async () => {
            if (!id) return;
            try {
                const docSnap = await getDoc(doc(db, 'pets', id));
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Pet;
                    setPet(data);
                    setCurrentPhotos(data.photos || []);

                    (Object.keys(petSchema.shape) as Array<keyof PetFormData>).forEach((key) => {
                        if (key === 'ageValue' || key === 'ageUnit') return;
                        if (data[key as keyof Pet] !== undefined) {
                            setValue(key, data[key as keyof Pet] as any);
                        }
                    });

                    if (data.contactPhone) {
                        setValue('contactPhone', maskPhone(data.contactPhone));
                    }

                    if (data.age) {
                        const ageStr = String(data.age);
                        const parts = ageStr.split(' ');
                        if (parts.length >= 2) {
                            setValue('ageValue', parts[0]);
                            const unit = parts[1].toLowerCase().startsWith('mes') ? 'meses' : 'anos';
                            setValue('ageUnit', unit);
                        } else {
                            setValue('ageValue', ageStr);
                            setValue('ageUnit', 'anos');
                        }
                    }
                } else {
                    alert('Pet não encontrado');
                    navigate('/admin/caes');
                }
            } catch (error) {
                console.error('Erro ao buscar pet:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPet();
    }, [id, setValue, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        setFileError('');
        if (!file) return;

        const validationError = validateImageFile(file);
        if (validationError) {
            setFileError(validationError);
            return;
        }

        clearAdjustment();
        setOriginalSourceFile(file);
        const objectUrl = URL.createObjectURL(file);
        adjustmentUrlRef.current = objectUrl;
        setPendingAdjustment({ file, url: objectUrl });
    };

    const handleAdjustmentConfirm = (file: File, url: string) => {
        clearNewPreview();
        newPreviewRef.current = url;
        setNewPhotoFile(file);
        setNewPhotoPreview(url);
        clearAdjustment();
    };

    const handleUseOriginal = (file: File, url: string) => {
        handleAdjustmentConfirm(file, url);
    };

    const handleReframe = () => {
        const source = originalSourceFile || newPhotoFile;
        if (!source) {
            setFileError('Selecione uma nova foto para poder enquadrar.');
            return;
        }
        clearAdjustment();
        const objectUrl = URL.createObjectURL(source);
        adjustmentUrlRef.current = objectUrl;
        setPendingAdjustment({ file: source, url: objectUrl });
    };

    const onSubmit = async (data: PetFormData) => {
        if (!id) return;
        setSaving(true);
        try {
            const { ageValue, ageUnit, ...restData } = data;
            const finalAge = `${ageValue} ${ageValue === '1' ? ageUnit.replace('s', '') : ageUnit}`;

            let photos = currentPhotos;
            if (newPhotoFile) {
                const compressed = await compressImage(newPhotoFile);
                const uploaded = await uploadImageToCloudinary(compressed.file, {
                    folder: 'apa/adoption',
                    tags: ['adoption', 'apa'],
                });
                photos = [uploaded.secure_url, ...currentPhotos.slice(1)];
            }

            await updateDoc(doc(db, 'pets', id), {
                ...restData,
                age: finalAge,
                photos,
                updatedAt: serverTimestamp(),
                tags: [data.species, data.gender, data.size],
            });
            alert('Pet atualizado com sucesso!');
            navigate('/admin/caes');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    const displayPhoto = newPhotoPreview
        || (currentPhotos[0] ? getOptimizedCloudinaryUrl(currentPhotos[0]) : undefined);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/admin/caes')}
                className="flex items-center text-sm font-medium text-gray-500 hover:text-brand-green transition-colors"
            >
                <ArrowLeft size={16} className="mr-2" /> Voltar para lista
            </button>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Editar Perfil: {pet?.name}</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome</label>
                                <input {...register('name')} className="form-input-premium w-full" />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Raça</label>
                                <input {...register('breed')} className="form-input-premium w-full" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Idade Aproximada</label>
                                <div className="flex gap-2">
                                    <div className="flex-grow">
                                        <input
                                            type="number"
                                            {...register('ageValue')}
                                            placeholder="Valor"
                                            className="form-input-premium w-full p-4"
                                        />
                                    </div>
                                    <div className="w-[120px] flex-shrink-0">
                                        <select
                                            {...register('ageUnit')}
                                            className="form-input-premium w-full p-4"
                                        >
                                            <option value="anos">Anos</option>
                                            <option value="meses">Meses</option>
                                        </select>
                                    </div>
                                </div>
                                {errors.ageValue && <p className="text-xs text-red-500 mt-1">{errors.ageValue.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Espécie</label>
                                <div className="flex gap-2">
                                    {(['Cachorro', 'Gato'] as const).map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setValue('species', s)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedSpecies === s ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-gray-100 text-gray-400'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Gênero</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['Macho', 'Fêmea'] as const).map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setValue('gender', g)}
                                        className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedGender === g ? 'border-brand-acqua bg-brand-acqua/5 text-brand-acqua' : 'border-gray-100 text-gray-400'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição / História</label>
                            <textarea
                                {...register('description')}
                                rows={5}
                                className="form-input-premium w-full resize-none"
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">WhatsApp</label>
                                <input
                                    {...register('contactPhone')}
                                    onChange={(e) => {
                                        setValue('contactPhone', maskPhone(e.target.value), { shouldValidate: true });
                                    }}
                                    className="form-input-premium w-full"
                                />
                                {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Endereço</label>
                                <input {...register('address')} className="form-input-premium w-full" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Status Atual</label>
                            <div className="space-y-2">
                                {(['disponível', 'adotado', 'indisponível', 'pendente'] as const).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setValue('status', s)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-between ${selectedStatus === s ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-gray-50 text-gray-400'}`}
                                    >
                                        <span className="capitalize">{s}</span>
                                        {selectedStatus === s && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Porte</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['P', 'M', 'G'] as const).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setValue('size', s)}
                                        className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedSize === s ? 'border-brand-acqua bg-brand-acqua/5 text-brand-acqua' : 'border-gray-50 text-gray-400'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button
                                type="submit"
                                className="w-full py-4 gap-2 text-lg shadow-lg shadow-brand-green/20"
                                isLoading={saving}
                                disabled={!!pendingAdjustment}
                            >
                                <Save size={20} /> Salvar Alterações
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-4 space-y-4">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-2 bg-gray-100">
                            {displayPhoto ? (
                                <img src={displayPhoto} className="w-full h-full object-cover" alt="Foto principal" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sem foto</div>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest">
                            Foto Principal {newPhotoFile ? '(nova — salve para aplicar)' : ''}
                        </p>

                        {pendingAdjustment && (
                            <ImageAdjuster
                                file={pendingAdjustment.file}
                                imageUrl={pendingAdjustment.url}
                                onConfirm={handleAdjustmentConfirm}
                                onUseOriginal={handleUseOriginal}
                                onCancel={clearAdjustment}
                            />
                        )}

                        {!pendingAdjustment && (
                            <div className="flex flex-col gap-2">
                                <label className="w-full">
                                    <span className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-500 cursor-pointer hover:bg-gray-50">
                                        <Camera size={16} /> Trocar foto
                                    </span>
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                                </label>
                                {(newPhotoFile || originalSourceFile) && (
                                    <button
                                        type="button"
                                        onClick={handleReframe}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-100 text-sm font-bold text-brand-orange hover:bg-brand-orange/5"
                                    >
                                        <Crop size={16} /> Reenquadrar
                                    </button>
                                )}
                            </div>
                        )}

                        {fileError && (
                            <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{fileError}</p>
                        )}
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default EditPetPage;
