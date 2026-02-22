import React, { useState } from 'react';
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
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { maskPhone, validatePhone } from '../utils/masks';


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
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<PetFormData>({
        resolver: zodResolver(petSchema),
        defaultValues: {
            species: 'Cachorro',
            gender: 'Macho',
            size: 'M'
        },
        values: profile ? {
            contactPhone: maskPhone(profile.phone || ''),
            address: '',

            name: '',
            ageValue: '',
            ageUnit: 'anos',
            description: '',
            species: 'Cachorro',
            gender: 'Macho',
            size: 'M'
        } as any : undefined
    });

    const selectedSpecies = watch('species');
    const selectedGender = watch('gender');
    const selectedSize = watch('size');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const remainingSpots = 3 - photos.length;

            if (remainingSpots <= 0) {
                alert('Você já atingiu o limite de 3 fotos.');
                return;
            }

            const filesToUpload = filesArray.slice(0, remainingSpots);
            setPhotos(prev => [...prev, ...filesToUpload]);

            const newPreviews = filesToUpload.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);

            if (filesArray.length > remainingSpots) {
                alert(`Apenas as primeiras ${remainingSpots} fotos foram selecionadas (limite de 3).`);
            }
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
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

        setUploading(true);
        try {
            // 1. Upload das fotos para o Cloudinary (Sem necessidade de cartão de crédito no Firebase)
            const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/dpxv3wmks/image/upload`;
            const photoUrls = await Promise.all(
                photos.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', 'apa_uploads');

                    const response = await fetch(CLOUDINARY_URL, {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Cloudinary Error:', errorData);
                        throw new Error('Falha no upload para o Cloudinary');
                    }

                    const data = await response.json();
                    return data.secure_url; // Retorna a URL segura do Cloudinary
                })
            );

            // 2. Salvar no Firestore com status condicional
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
            alert('Erro ao salvar os dados. Verifique sua conexão.');
        } finally {
            setUploading(false);
        }
    };

    const nextStep = async () => {
        let fieldsToValidate: (keyof PetFormData)[] = [];
        if (step === 1) fieldsToValidate = ['species', 'gender'];
        if (step === 2) {
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

        setStep(prev => prev + 1);
    };
    const prevStep = () => setStep(prev => prev - 1);

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

                {/* Progress Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 font-merriweather mb-2">Anunciar Pet</h1>
                    <p className="text-gray-500">Passo {step} de 4</p>
                    <div className="flex gap-2 mt-4 max-w-xs mx-auto">
                        {[1, 2, 3, 4].map(s => (
                            <div
                                key={s}
                                className={`h-2 flex-grow rounded-full transition-all duration-500 ${step >= s ? 'bg-brand-orange shadow-sm' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Step 1: Espécie e Gênero */}
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
                                    {['Macho', 'Fêmea'].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setValue('gender', g as any)}
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

                    {/* Step 2: Fotos */}
                    {step === 2 && (
                        <Card className="p-8 space-y-8 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Fotos do Pet</h3>
                                <p className="text-sm text-gray-500 mb-6 font-bold text-brand-orange">Limite: 3 fotos por animal.</p>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {previews.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                                            <img src={url} className="w-full h-full object-cover" alt="Preview" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronLeft size={16} className="rotate-45" />
                                            </button>
                                        </div>
                                    ))}

                                    {photos.length < 3 && (
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Camera size={32} className="text-gray-300 mb-2" />
                                            <span className="text-xs text-gray-400 font-medium text-center px-4">
                                                Adicionar ({3 - photos.length} restantes)
                                            </span>
                                            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">Voltar</Button>
                                <Button type="button" onClick={nextStep} className="flex-[2]" disabled={photos.length === 0}>
                                    Continuar
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Step 3: Detalhes */}
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
                                    {/* Idade Estruturada */}
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
                                        {['P', 'M', 'G'].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setValue('size', s as any)}
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

                    {/* Step 4: Localização e Contato */}
                    {step === 4 && (
                        <Card className="p-8 space-y-8 animate-fade-in">
                            <div className="space-y-6">
                                {!isAdmin && (
                                    <div className="bg-brand-green/5 p-4 rounded-2xl flex items-start">
                                        <Info size={20} className="text-brand-green flex-shrink-0 mt-1 mr-3" />
                                        <p className="text-sm text-gray-600">Para sua segurança, entraremos em contato para validar os dados antes da publicação.</p>
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
                                </div>

                            </div>

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
