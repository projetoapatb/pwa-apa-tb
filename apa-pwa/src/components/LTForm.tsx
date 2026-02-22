import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { CheckCircle2, Send, Home, LogIn, Clock, AlertTriangle, User as UserIcon, ChevronRight, XCircle, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LeadLT } from '../types';
import { maskPhone } from '../utils/masks';


const ltSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    hasOtherPets: z.enum(['sim', 'nao']).optional(),
    petDetails: z.string().optional(),
    householdCount: z.string().optional(),
    dwellingType: z.enum(['casa', 'apartamento', 'sitio']).optional(),
    spaceDescription: z.string().optional(),
    availability: z.string().optional(),
});

type LTFormValues = z.infer<typeof ltSchema>;

export const LTForm: React.FC = () => {
    const { profile, user } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const [currentLead, setCurrentLead] = useState<LeadLT | null>(null);
    const [loadingLead, setLoadingLead] = useState(true);

    const { handleSubmit, formState: { isSubmitting }, reset, setValue } = useForm<LTFormValues>({
        resolver: zodResolver(ltSchema),
        defaultValues: {
            hasOtherPets: 'nao',
            dwellingType: 'casa'
        }
    });

    const isProfileComplete = !!(
        profile?.displayName &&
        profile?.phone &&
        profile?.address &&
        profile?.dwellingType &&
        profile?.householdCount &&
        profile?.spaceDescription &&
        profile?.availability
    );

    // Auto-preenchimento
    useEffect(() => {
        if (profile) {
            setValue('name', profile.displayName || '');
            setValue('email', user?.email || '');
            setValue('phone', profile.phone || '');
            setValue('address', profile.address || '');
            setValue('dwellingType', (profile.dwellingType as any) || 'casa');
            setValue('hasOtherPets', (profile.hasOtherPets as any) || 'nao');
            setValue('petDetails', profile.petDetails || '');
            setValue('householdCount', profile.householdCount || '');
            setValue('spaceDescription', profile.spaceDescription || '');
            setValue('availability', profile.availability || '');
        }

        if (!user) {
            setLoadingLead(false);
            return;
        }

        const q = query(
            collection(db, 'leads_lt'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                setCurrentLead({ id: snap.docs[0].id, ...snap.docs[0].data() } as LeadLT);
            } else {
                setCurrentLead(null);
            }
            setLoadingLead(false);
        }, (error) => {
            console.error("Erro no monitoramento de status (LT):", error);
            setLoadingLead(false);
        });

        return () => unsubscribe();
    }, [profile, user, setValue]);


    const onSubmit = async (values: LTFormValues) => {
        try {
            if (!user) throw new Error("Aguarde o carregamento do login...");
            if (!isProfileComplete) throw new Error("Seu perfil residencial está incompleto.");

            await addDoc(collection(db, 'leads_lt'), {
                ...values,
                name: profile?.displayName,
                email: user.email,
                phone: profile?.phone,
                address: profile?.address,
                dwellingType: profile?.dwellingType,
                hasOtherPets: profile?.hasOtherPets || 'nao',
                petDetails: profile?.petDetails || '',
                householdCount: profile?.householdCount,
                spaceDescription: profile?.spaceDescription,
                availability: profile?.availability,
                userId: user.uid,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            setSubmitted(true);
            reset();
        } catch (error: any) {
            console.error("Erro ao enviar cadastro de LT:", error);
            alert(`Erro ao confirmar: ${error.message || 'Tente novamente.'}`);
        }
    };

    if (loadingLead) {
        return <div className="p-20 text-center animate-pulse text-gray-400">Verificando status...</div>;
    }

    // Se estiver pendente ou aprovado, bloqueia novo envio
    if (currentLead && (currentLead.status === 'pending' || currentLead.status === 'approved' || currentLead.status === 'contacted')) {
        const isApproved = currentLead.status === 'approved' || currentLead.status === 'contacted';

        return (
            <div className={`text-center py-10 animate-fade-in rounded-3xl p-8 border ${isApproved ? 'bg-brand-green/5 border-brand-green/20' : 'bg-brand-orange/5 border-brand-orange/20'}`}>
                <div className={`${isApproved ? 'bg-brand-green' : 'bg-brand-orange'} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    {isApproved ? <CheckCircle2 size={40} className="text-white" /> : <Clock size={40} className="text-white" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-merriweather">
                    {isApproved ? 'Você é um Lar Temporário!' : 'Solicitação em Análise'}
                </h2>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                    {isApproved
                        ? 'Seu perfil foi aprovado pela nossa equipe. Obrigado por abrir as portas do seu lar para quem precisa! 🐾'
                        : 'Sua solicitação está sendo avaliada por nossos administradores. Entraremos em contato via WhatsApp ou e-mail em breve!'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/" className="flex-1 max-w-[200px]">
                        <Button variant="outline" className="w-full">Ir para Home</Button>
                    </Link>
                    <Link to="/perfil" className="flex-1 max-w-[200px]">
                        <Button variant="ghost" className="w-full bg-gray-100 text-gray-600">Ver Perfil</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Se foi rejeitado, mostra o motivo e permite tentar novamente
    if (currentLead?.status === 'rejected' && !submitted) {
        return (
            <div className="text-center py-10 animate-fade-in bg-red-50 rounded-3xl p-8 border border-red-100">
                <div className="bg-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/20">
                    <XCircle size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-merriweather">Solicitação Recusada</h2>
                <div className="bg-white/60 p-4 rounded-2xl mb-6 max-w-sm mx-auto border border-red-100 italic text-gray-600 text-sm">
                    {currentLead.rejectionReason || "Infelizmente sua solicitação não pôde ser aprovada no momento."}
                </div>
                <p className="text-gray-500 mb-8 text-xs uppercase font-bold tracking-widest">Você pode ajustar seu perfil e tentar novamente</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => setCurrentLead(null)} variant="primary" className="gap-2">
                        <RotateCcw size={18} /> Tentar Novamente
                    </Button>
                    <Link to="/perfil">
                        <Button variant="outline">Ajustar Perfil</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="text-center py-10 animate-fade-in bg-brand-green/5 rounded-3xl p-8 border border-brand-green/20">
                <div className="bg-brand-green w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20">
                    <CheckCircle2 size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-merriweather">Interesse Confirmado!</h2>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                    Que alegria! Recebemos seu interesse em ser um Lar Temporário. Nossa equipe entrará em contato para os próximos passos.
                </p>
                <div className="flex justify-center">
                    <Link to="/">
                        <Button variant="primary" className="px-10">Ir para Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-gray-50 max-w-4xl mx-auto overflow-hidden relative">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-brand-green/10 p-4 rounded-2xl text-brand-green">
                    <Home size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 font-merriweather">Seja um Lar Temporário</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Acolhimento & Carinho</p>
                </div>
            </div>

            {!user ? (
                // ... same login code
                <div className="bg-brand-orange/5 border-2 border-brand-orange/20 p-8 rounded-[2.5rem] text-center space-y-4">
                    <p className="text-gray-700 font-bold text-lg">Faça login para se candidatar como LT</p>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">Para garantir a segurança dos animais, precisamos identificar nossos colaboradores.</p>
                    <Button
                        type="button"
                        variant="orange"
                        className="w-full py-5 rounded-2xl flex items-center justify-center gap-2 text-lg shadow-lg shadow-orange-900/10"
                        onClick={() => window.location.href = '/login'}
                    >
                        <LogIn size={20} />
                        Fazer Login Agora
                    </Button>
                </div>
            ) : !isProfileComplete ? (
                <div className="bg-brand-orange/5 border-2 border-brand-orange/20 p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-3 text-brand-orange">
                        <AlertTriangle size={28} />
                        <h3 className="text-lg font-bold">Perfil Residencial Incompleto</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                        Para se candidatar como Lar Temporário, precisamos conhecer melhor sua estrutura (tipo de residência, espaço disponível, etc).
                        Esses dados agora são salvos diretamente no seu **Perfil**.
                    </p>
                    <div className="bg-white/50 p-4 rounded-2xl border border-brand-orange/10">
                        <p className="text-sm text-gray-500 italic">Preencha uma única vez no perfil e depois peça LT com apenas um clique!</p>
                    </div>
                    <Link
                        to="/perfil"
                        className="flex items-center justify-center gap-2 w-full py-5 bg-brand-orange text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/10"
                    >
                        <UserIcon size={20} />
                        Completar Perfil Agora
                    </Link>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">
                            <CheckCircle2 size={14} className="text-brand-green" /> Seu Perfil Residencial está Pronto
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Responsável</p>
                                <p className="font-bold text-gray-700">{profile?.displayName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Contato</p>
                                <p className="font-bold text-gray-700">{maskPhone(profile?.phone || '')}</p>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Endereço de Acolhimento</p>
                                <p className="font-bold text-gray-700">{profile?.address}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Tipo de Residência</p>
                                <p className="font-bold text-gray-700 capitalize">{profile?.dwellingType}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Pessoas na Casa</p>
                                <p className="font-bold text-gray-700">{profile?.householdCount}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 flex items-center justify-between group">
                            <span className="text-xs text-gray-400 italic">Deseja alterar esses dados?</span>
                            <Link to="/perfil" className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1">
                                Editar no Perfil <ChevronRight size={12} />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-brand-green/5 p-6 rounded-3xl border border-brand-green/10">
                        <p className="text-sm text-gray-600 text-center leading-relaxed">
                            Ao clicar abaixo, você confirma seu interesse em ser **Lar Temporário** utilizando as informações acima.
                            Entratemos em contato para os próximos passos!
                        </p>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full py-6 rounded-2xl text-xl flex items-center justify-center gap-3 shadow-xl shadow-green-900/20"
                        isLoading={isSubmitting}
                        onClick={handleSubmit(onSubmit)}
                    >
                        Confirmar Interesse em ser LT
                        <Send size={24} />
                    </Button>
                </div>
            )}

            <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] mt-8">
                🐾 SEU AMOR PODE SALVAR UMA VIDA HOJE. 🐾
            </p>
        </div>
    );
};
