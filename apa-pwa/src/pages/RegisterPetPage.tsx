import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
    Dog,
    Cat,
    Camera,
    Upload,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    MapPin,
    Phone,
    Info,
    Check,
    Crop
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { PrivacyConsentCheckbox } from '../components/PrivacyConsentCheckbox';
import { ImageAdjuster } from '../components/ImageAdjuster';
import { maskPhone, validatePhone } from '../utils/masks';
import { compressImage, validateImageFile } from '../utils/imageCompression';
import { uploadImageToCloudinary } from '../lib/cloudinary';


const petSchema = z.object({
    species: z.enum(['Cachorro', 'Gato']),
    gender: z.enum(['Macho', 'Fêmea']),
    name: z.string().min(2, 'Nome é obrigatório'),
    breed: z.string().optional(),
    color: z.string().optional(),
    ageValue: z.string().min(1, 'Idade é obrigatória'),
    ageUnit: z.enum(['anos', 'meses']),
    size: z.enum(['P', 'M', 'G']),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    address: z.string().min(5, 'Endereço é obrigatório'),
    contactPhone: z.string().refine(validatePhone, 'Telefone deve ter 11 dígitos com DDD'),
});


type PetFormData = z.infer<typeof petSchema>;

const RegisterPetPage: React.FC = () => {
    const { isAdmin, user, profile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [originalSources, setOriginalSources] = useState<(File | null)[]>([]);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [privacyConsent, setPrivacyConsent] = useState(false);
    const [consentError, setConsentError] = useState('');
    const [fileError, setFileError] = useState('');
    const [pendingAdjustment, setPendingAdjustment] = useState<{ file: File; url: string } | null>(null);
    const [adjustmentQueue, setAdjustmentQueue] = useState<File[]>([]);
    const [reframeIndex, setReframeIndex] = useState<number | null>(null);
    const previewUrlsRef = useRef<string[]>([]);
    const adjustmentUrlRef = useRef<string | null>(null);

    const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<PetFormData>({
        resolver: zodResolver(petSchema),
        defaultValues: {
            species: 'Cachorro',
            gender: 'Macho',
            size: 'M',
            ageUnit: 'anos',
            contactPhone: '',
            address: '',
            name: '',
            ageValue: '',
            description: '',
        },
    });

    useEffect(() => {
        if (profile?.phone) {
            setValue('contactPhone', maskPhone(profile.phone));
        }
    }, [profile?.phone, setValue]);

    useEffect(() => {
        previewUrlsRef.current = previews;
    }, [previews]);

    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            if (adjustmentUrlRef.current) {
                URL.revokeObjectURL(adjustmentUrlRef.current);
            }
        };
    }, []);

    const selectedSpecies = watch('species');
    const selectedGender = watch('gender');
    const selectedSize = watch('size');

    const clearAdjustment = () => {
        if (adjustmentUrlRef.current) {
            URL.revokeObjectURL(adjustmentUrlRef.current);
            adjustmentUrlRef.current = null;
        }
        setPendingAdjustment(null);
        setReframeIndex(null);
    };

    const openAdjustment = (file: File, indexToReplace: number | null = null) => {
        clearAdjustment();
        const objectUrl = URL.createObjectURL(file);
        adjustmentUrlRef.current = objectUrl;
        setReframeIndex(indexToReplace);
        setPendingAdjustment({ file, url: objectUrl });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        e.target.value = '';
        setFileError('');

        if (files.length === 0) return;

        const remainingSpots = 3 - photos.length;
        if (remainingSpots <= 0) {
            setFileError('Você já atingiu o limite de 3 fotos.');
            return;
        }

        const accepted: File[] = [];
        for (const file of files.slice(0, remainingSpots)) {
            const validationError = validateImageFile(file);
            if (validationError) {
                setFileError(validationError);
                continue;
            }
            accepted.push(file);
        }

        if (accepted.length === 0) return;

        if (files.length > remainingSpots) {
            setFileError(`Apenas as primeiras ${remainingSpots} fotos serão usadas (limite de 3).`);
        }

        const [first, ...rest] = accepted;
        setAdjustmentQueue(rest);
        openAdjustment(first);
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => {
            const url = prev[index];
            if (url) URL.revokeObjectURL(url);
            return prev.filter((_, i) => i !== index);
        });
        setOriginalSources((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAdjustmentConfirm = (file: File, url: string) => {
        const queueSnapshot = adjustmentQueue;

        if (reframeIndex !== null) {
            setPhotos((prev) => prev.map((p, i) => (i === reframeIndex ? file : p)));
            setPreviews((prev) => {
                const next = [...prev];
                if (next[reframeIndex]) URL.revokeObjectURL(next[reframeIndex]);
                next[reframeIndex] = url;
                return next;
            });
            clearAdjustment();
            return;
        }

        const sourceOriginal = pendingAdjustment?.file ?? file;
        setPhotos((prev) => [...prev, file]);
        setPreviews((prev) => [...prev, url]);
        setOriginalSources((prev) => [...prev, sourceOriginal]);
        clearAdjustment();

        if (queueSnapshot.length > 0) {
            const [next, ...rest] = queueSnapshot;
            setAdjustmentQueue(rest);
            openAdjustment(next);
        } else {
            setAdjustmentQueue([]);
        }
    };

    const handleUseOriginalImage = (file: File, url: string) => {
        handleAdjustmentConfirm(file, url);
    };

    const handleAdjustmentCancel = () => {
        clearAdjustment();
        setAdjustmentQueue([]);
        setFileError('');
    };

    const handleReframe = (index: number) => {
        const source = originalSources[index] || photos[index];
        if (!source) return;
        openAdjustment(source, index);
    };

    const onSubmit = async (data: PetFormData) => {
        if (!user) {
            alert('Você precisa estar logado para cadastrar um pet.');
            return;
        }

        if (photos.length === 0) {
            alert('Adicione pelo menos uma foto do pet.');
            return;
        }

        if (!privacyConsent) {
            setConsentError('É necessário aceitar a Política de Privacidade para continuar.');
            return;
        }
        setConsentError('');

        setUploading(true);
        try {
            const photoUrls = await Promise.all(
                photos.map(async (file) => {
                    const compressed = await compressImage(file);
                    const uploaded = await uploadImageToCloudinary(compressed.file, {
                        folder: 'apa/adoption',
                        tags: ['adoption', 'apa'],
                    });
                    return uploaded.secure_url;
                })
            );

            const { ageValue, ageUnit, ...restData } = data;
            const finalAge = `${ageValue} ${ageValue === '1' ? ageUnit.replace('s', '') : ageUnit}`;

            await addDoc(collection(db, 'pets'), {
                ...restData,
                age: finalAge,
                photos: photoUrls,
                status: isAdmin ? 'disponível' : 'pendente',
                userId: user.uid,
                tags: [data.species, data.gender, data.size],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setSuccess(true);
        } catch (error) {
            console.error('Erro ao cadastrar pet:', error);
            alert('Não foi possível enviar o anúncio. Verifique sua conexão e as fotos selecionadas, e tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const nextStep = async () => {
        let fieldsToValidate: (keyof PetFormData)[] = [];
        if (step === 1) fieldsToValidate = ['species', 'gender'];
        if (step === 2) {
            if (pendingAdjustment) {
                alert('Confirme ou cancele o enquadramento da foto antes de continuar.');
                return;
            }
            if (photos.length === 0) {
                alert('Adicione pelo menos uma foto.');
                return;
            }
        }
        if (step === 3) fieldsToValidate = ['name', 'ageValue', 'description'];
        if (step === 4) fieldsToValidate = ['address', 'contactPhone'];

        if (fieldsToValidate.length > 0) {
            const isStepValid = await trigger(fieldsToValidate);
            if (!isStepValid) return;
        }

        setStep((prev) => prev + 1);
    };
    const prevStep = () => setStep((prev) => prev - 1);

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <SEO
                    title="Pedido de Anúncio Enviado | APA Telêmaco Borba"
                    description="Seu pet foi cadastrado e está em análise. Juntos ajudamos mais animais a encontrarem lares."
                />
                <Card className="max-w-md w-full p-10 text-center animate-bounce-in">
                    <div className="bg-brand-green/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 size={48} className="text-brand-green" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4 font-merriweather">
                        {isAdmin ? 'Animal Cadastrado!' : 'Pedido Enviado!'}
                    </h2>
                    <p className="text-gray-600 mb-10 leading-relaxed">
                        {isAdmin
                            ? 'O animal já está disponível no mural de adoção e pronto para encontrar um novo lar!'
                            : 'Seu anúncio foi enviado para análise. Assim que um administrador aprovar, ele ficará visível para todos!'}
                    </p>
                    <Button onClick={() => navigate('/adocao')} variant="primary" className="w-full py-4">
                        Voltar para Adoção
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20 pt-10">
            <SEO
                title="Anunciar Pet para Adoção | APA Telêmaco Borba"
                description="Cadastre um animal que precisa de um lar. Sua ajuda é fundamental para darmos visibilidade a quem precisa de cuidado."
            />
            <div className="container mx-auto px-4 max-w-2xl">

                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 font-merriweather mb-2">Anunciar Pet</h1>
                    <p className="text-gray-500">Passo {step} de 4</p>
                    <div className="flex gap-2 mt-4 max-w-xs mx-auto">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`h-2 flex-grow rounded-full transition-all duration-500 ${step >= s ? 'bg-brand-orange shadow-sm' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {step === 1 && (
                        <Card className="p-8 space-y-8 animate-fade-in">
                            <div>
                                <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Espécie</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setValue('species', 'Cachorro')}
                                        className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${selectedSpecies === 'Cachorro' ? 'border-brand-green bg-brand-green/5 shadow-inner' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <Dog size={40} className={selectedSpecies === 'Cachorro' ? 'text-brand-green' : 'text-gray-300'} />
                                        <span className={`mt-2 font-bold ${selectedSpecies === 'Cachorro' ? 'text-brand-green' : 'text-gray-500'}`}>Cachorro</span>
                                        {selectedSpecies === 'Cachorro' && <Check size={16} className="mt-1 text-brand-green" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue('species', 'Gato')}
                                        className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${selectedSpecies === 'Gato' ? 'border-brand-green bg-brand-green/5 shadow-inner' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <Cat size={40} className={selectedSpecies === 'Gato' ? 'text-brand-green' : 'text-gray-300'} />
                                        <span className={`mt-2 font-bold ${selectedSpecies === 'Gato' ? 'text-brand-green' : 'text-gray-500'}`}>Gato</span>
                                        {selectedSpecies === 'Gato' && <Check size={16} className="mt-1 text-brand-green" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Gênero</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['Macho', 'Fêmea'] as const).map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setValue('gender', g)}
                                            className={`p-4 rounded-2xl border-2 font-bold transition-all ${selectedGender === g ? 'border-brand-acqua bg-brand-acqua/5 text-brand-acqua' : 'border-gray-100 text-gray-500'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button type="button" onClick={nextStep} className="w-full py-6 text-lg">
                                Prosseguir <ChevronRight size={20} className="ml-2" />
                            </Button>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="p-8 space-y-8 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Fotos do Pet</h3>
                                <p className="text-sm text-gray-500 mb-2">
                                    Arraste para enquadrar o animal. Limite: 3 fotos.
                                </p>
                                <p className="text-sm font-bold text-brand-orange mb-6">Proporção do card: 4:3</p>

                                {pendingAdjustment && (
                                    <div className="mb-6">
                                        <ImageAdjuster
                                            file={pendingAdjustment.file}
                                            imageUrl={pendingAdjustment.url}
                                            onConfirm={handleAdjustmentConfirm}
                                            onUseOriginal={handleUseOriginalImage}
                                            onCancel={handleAdjustmentCancel}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {previews.map((url, idx) => (
                                        <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden group bg-gray-100">
                                            <img src={url} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleReframe(idx)}
                                                    className="bg-white text-gray-800 p-2 rounded-full"
                                                    title="Reenquadrar"
                                                >
                                                    <Crop size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(idx)}
                                                    className="bg-red-500 text-white p-2 rounded-full"
                                                    title="Remover"
                                                >
                                                    <ChevronLeft size={16} className="rotate-45" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {!pendingAdjustment && photos.length < 3 && (
                                        <label className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Camera size={32} className="text-gray-300 mb-2" />
                                            <span className="text-xs text-gray-400 font-medium text-center px-4">
                                                Adicionar ({3 - photos.length} restantes)
                                            </span>
                                            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}
                                </div>

                                {fileError && (
                                    <p className="text-sm text-red-600 mt-4 bg-red-50 border border-red-100 rounded-2xl p-3">
                                        {fileError}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">Voltar</Button>
                                <Button type="button" onClick={nextStep} className="flex-[2]" disabled={photos.length === 0 || !!pendingAdjustment}>
                                    Continuar
                                </Button>
                            </div>
                        </Card>
                    )}

                    {step === 3 && (
                        <Card className="p-8 space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome do Pet</label>
                                    <input
                                        {...register('name')}
                                        placeholder="Ex: Paçoca"
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-acqua transition-all"
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Raça (Opcional)</label>
                                        <input
                                            {...register('breed')}
                                            placeholder="Ex: SRD"
                                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-acqua transition-all"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <Info size={14} className="text-brand-orange" /> Idade Aproximada
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex-grow">
                                                <input
                                                    type="number"
                                                    placeholder="Valor (Ex: 2)"
                                                    className={`w-full p-4 rounded-3xl border-2 transition-all outline-none font-bold placeholder:text-gray-200 ${errors.ageValue ? 'border-red-100 bg-red-50 text-red-500' : 'border-gray-50 focus:border-brand-acqua text-gray-800 bg-white'
                                                        }`}
                                                    {...register('ageValue')}
                                                />
                                            </div>
                                            <div className="w-[120px] flex-shrink-0">
                                                <select
                                                    className="w-full p-4 rounded-3xl border-2 border-gray-50 bg-white font-bold text-gray-800 outline-none focus:border-brand-acqua transition-all"
                                                    {...register('ageUnit')}
                                                >
                                                    <option value="anos">Anos</option>
                                                    <option value="meses">Meses</option>
                                                </select>
                                            </div>
                                        </div>
                                        {errors.ageValue && <p className="text-red-500 text-[10px] font-bold pl-4 mt-1 uppercase tracking-wider">{errors.ageValue.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Porte</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['P', 'M', 'G'] as const).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setValue('size', s)}
                                                className={`p-3 rounded-xl border-2 font-bold transition-all ${selectedSize === s ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-gray-100 text-gray-400'}`}
                                            >
                                                {s === 'P' ? 'Pequeno' : s === 'M' ? 'Médio' : 'Grande'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">História / Descrição</label>
                                    <textarea
                                        {...register('description')}
                                        rows={4}
                                        placeholder="Conte um pouco sobre a personalidade e como ele foi encontrado..."
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-acqua transition-all resize-none"
                                    />
                                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">Voltar</Button>
                                <Button type="button" onClick={nextStep} className="flex-[2]">Continuar</Button>
                            </div>
                        </Card>
                    )}

                    {step === 4 && (
                        <Card className="p-8 space-y-8 animate-fade-in">
                            <div className="space-y-6">
                                {!isAdmin && (
                                    <div className="bg-brand-green/5 p-4 rounded-2xl flex items-start">
                                        <Info size={20} className="text-brand-green flex-shrink-0 mt-1 mr-3" />
                                        <p className="text-sm text-gray-600">
                                            Seu anúncio passa por aprovação do administrador. O WhatsApp informado ficará visível para quem quiser adotar.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="flex items-center text-xs font-bold text-gray-400 uppercase mb-2">
                                        <MapPin size={14} className="mr-1" /> Endereço Visualizado
                                    </label>
                                    <input
                                        {...register('address')}
                                        placeholder="Ex: Centro, Telêmaco Borba - PR"
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-acqua transition-all"
                                    />
                                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                                </div>

                                <div>
                                    <label className="flex items-center text-xs font-bold text-gray-400 uppercase mb-2">
                                        <Phone size={14} className="mr-1" /> WhatsApp para Contato
                                    </label>
                                    <input
                                        {...register('contactPhone')}
                                        placeholder="(42) 99999-9999"
                                        onChange={(e) => {
                                            const masked = maskPhone(e.target.value);
                                            setValue('contactPhone', masked, { shouldValidate: true });
                                        }}
                                        className={`w-full p-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.contactPhone ? 'border-red-400' : 'border-gray-100 focus:border-brand-acqua'}`}
                                    />
                                    {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone.message}</p>}
                                    <p className="text-[11px] text-gray-400 mt-2">
                                        Interessados poderão falar com você direto pelo WhatsApp.
                                    </p>
                                </div>

                            </div>

                            <PrivacyConsentCheckbox
                                checked={privacyConsent}
                                onChange={(checked) => {
                                    setPrivacyConsent(checked);
                                    if (checked) setConsentError('');
                                }}
                                id="registerPetPrivacyConsent"
                                error={consentError}
                            />

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">Voltar</Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-[2] py-6 text-lg"
                                    isLoading={uploading}
                                >
                                    Finalizar Anúncio <Upload size={20} className="ml-2" />
                                </Button>
                            </div>
                        </Card>
                    )}
                </form>
            </div>
        </main>
    );
};

export default RegisterPetPage;
