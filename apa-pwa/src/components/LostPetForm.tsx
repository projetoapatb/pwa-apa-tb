import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { CheckCircle2, Send, Camera, MapPin, Phone, Calendar, Info } from 'lucide-react';
import { maskPhone, validatePhone } from '../utils/masks';


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

interface LostPetFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const LostPetForm: React.FC<LostPetFormProps> = ({ onSuccess, onCancel }) => {
    const { profile, user } = useAuth();
    const [submitted, setSubmitted] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<LostPetFormValues>({
        resolver: zodResolver(lostPetSchema),
        defaultValues: {
            status: 'perdido',
            species: 'cachorro',
            hasReward: false,
            rewardValue: ''
        }
    });

    const hasReward = watch('hasReward');

    // Auto-preenchimento
    useEffect(() => {
        if (profile?.phone) {
            setValue('contactPhone', maskPhone(profile.phone));
        }
    }, [profile, setValue]);


    const onSubmit = async (values: LostPetFormValues) => {
        try {
            if (!user) throw new Error("Usuário não autenticado");
            await addDoc(collection(db, 'lost_pets'), {
                ...values,
                lastSeenDate: new Date(values.lastSeenDate),
                moderationStatus: 'pending',
                userId: user.uid,
                hasReward: values.hasReward || false,
                rewardValue: values.rewardValue || '',
                createdAt: serverTimestamp(),
            });
            setSubmitted(true);
            reset();
            // Removido o fechamento automático para que o usuário veja a confirmação
        } catch (error) {
            console.error("Erro ao anunciar no mural:", error);
            alert("Ocorreu um erro ao enviar seu anúncio. Tente novamente.");
        }
    };

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Nome (ou "Sem nome")</label>
                    <input
                        {...register('name')}
                        placeholder="Ex: Totó"
                        className={`w-full p-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${errors.name ? 'border-red-400' : 'border-gray-100 focus:border-brand-orange'}`}
                    />
                    {errors.name && <span className="text-xs text-red-500 ml-2 mt-1 block">{errors.name.message}</span>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Foto (Link da imagem)</label>
                    <div className="relative">
                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                            {...register('photoUrl')}
                            placeholder="https://..."
                            className="w-full p-4 pl-12 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all"
                        />
                    </div>
                    <p className="text-[10px] text-gray-300 ml-2 mt-1">Dica: Use um serviço como imgur ou link de rede social.</p>
                </div>
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

            <div className="flex gap-4 pt-4">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="flex-grow py-4 border-2 border-transparent hover:border-gray-100 rounded-2xl">
                        Cancelar
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="orange"
                    className="flex-grow py-4 text-lg shadow-lg shadow-orange-900/20 rounded-2xl"
                    isLoading={isSubmitting}
                >
                    Publicar Agora
                    <Send size={18} className="ml-2" />
                </Button>
            </div>
        </form>
    );
};
