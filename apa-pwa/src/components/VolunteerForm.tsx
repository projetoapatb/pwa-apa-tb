import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { CheckCircle2, Send, LogIn, Clock, AlertTriangle, User as UserIcon, XCircle, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LeadVolunteer } from '../types';
import { maskPhone } from '../utils/masks';


const volunteerSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    area: z.enum(['limpeza', 'eventos', 'passeios', 'outros']),
    message: z.string().optional(),
});

type VolunteerFormValues = z.infer<typeof volunteerSchema>;

interface VolunteerFormProps {
    defaultArea?: 'limpeza' | 'eventos' | 'passeios' | 'outros';
}

export const VolunteerForm: React.FC<VolunteerFormProps> = ({ defaultArea }) => {
    const { profile, user } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const [currentLead, setCurrentLead] = useState<LeadVolunteer | null>(null);
    const [loadingLead, setLoadingLead] = useState(true);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<VolunteerFormValues>({
        resolver: zodResolver(volunteerSchema),
        defaultValues: {
            area: defaultArea
        }
    });

    const isProfileComplete = !!(profile?.displayName && profile?.phone);

    // Auto-preenchimento e Trava de Duplicidade
    useEffect(() => {
        if (profile) {
            setValue('name', profile.displayName || '');
            setValue('email', user?.email || '');
            setValue('phone', profile.phone || '');
        }

        if (!user) {
            setLoadingLead(false);
            return;
        }

        const q = query(
            collection(db, 'leads_volunteer'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                setCurrentLead({ id: snap.docs[0].id, ...snap.docs[0].data() } as LeadVolunteer);
            } else {
                setCurrentLead(null);
            }
            setLoadingLead(false);
        }, (error) => {
            console.error("Erro no monitoramento de status (Voluntariado):", error);
            setLoadingLead(false);
        });

        return () => unsubscribe();
    }, [profile, user, setValue]);

    const onSubmit = async (values: VolunteerFormValues) => {
        try {
            if (!user) throw new Error("Aguarde o carregamento do login...");
            if (!profile?.displayName || !profile?.phone) {
                throw new Error("Seu perfil está incompleto. Preencha nome e telefone no seu perfil.");
            }

            await addDoc(collection(db, 'leads_volunteer'), {
                ...values,
                name: profile.displayName,
                email: user.email,
                phone: profile.phone,
                userId: user.uid,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            setSubmitted(true);
            reset();
        } catch (error: any) {
            console.error("Erro ao enviar interesse em voluntariado:", error);
            alert(`Erro ao enviar: ${error.message || 'Tente novamente.'}`);
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
                    {isApproved ? 'Você é do Time APA!' : 'Solicitação em Análise'}
                </h2>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                    {isApproved
                        ? 'Seu cadastro de voluntário foi aprovado! Em breve nossa equipe entrará em contato para alinhar os próximos passos. Bem-vindo(a) ao time! 🤝🐾'
                        : `Sua solicitação está sendo avaliada por nossos administradores. Entraremos em contato via WhatsApp (${maskPhone(currentLead.phone)}) ou e-mail em breve!`}
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
                <p className="text-gray-500 mb-8 text-xs uppercase font-bold tracking-widest">Você pode revisar seus dados e tentar novamente</p>
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
            <div className="text-center py-10 animate-bounce-in bg-brand-green/5 rounded-3xl p-8 border border-brand-green/20">
                <div className="bg-brand-green w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20">
                    <CheckCircle2 size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-merriweather">Cadastro Recebido!</h2>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                    Agradecemos seu interesse em nos ajudar. Nossa equipe entrará em contato em breve para combinar os próximos passos.
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
        <div className="space-y-6">
            {!user ? (
                <div className="bg-brand-green/5 border-2 border-brand-green/20 p-6 rounded-3xl text-center">
                    <p className="text-gray-700 font-bold mb-4">Faça login para se candidatar como voluntário</p>
                    <Button
                        type="button"
                        variant="primary"
                        className="w-full py-4 rounded-xl flex items-center justify-center gap-2"
                        onClick={() => window.location.href = '/login'}
                    >
                        <LogIn size={18} />
                        Entrar Agora
                    </Button>
                </div>
            ) : !isProfileComplete ? (
                <div className="bg-brand-orange/5 border-2 border-brand-orange/20 p-6 rounded-3xl">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-brand-orange/20 p-3 rounded-2xl text-brand-orange">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Perfil Incompleto</h3>
                            <p className="text-sm text-gray-600">Para se candidatar, precisamos que você complete seu nome e telefone no seu perfil.</p>
                        </div>
                    </div>
                    <Link to="/perfil">
                        <Button variant="outline" className="w-full border-brand-orange text-brand-orange hover:bg-brand-orange/10 rounded-2xl">
                            Completar Perfil Agora
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    {/* Resumo visual dos dados */}
                    <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                                <UserIcon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Confirmar interesse como:</p>
                                <p className="font-bold text-gray-800">{profile?.displayName}</p>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
                        <div className="text-center md:text-left">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Contato:</p>
                            <p className="font-medium text-gray-600">{maskPhone(profile?.phone || '')}</p>
                        </div>

                        <Link to="/perfil" className="text-xs text-brand-green font-bold hover:underline">
                            Alterar
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Área de Interesse</label>
                            <select
                                {...register('area')}
                                className={`w-full p-4 bg-gray-50 border-2 rounded-2xl outline-none appearance-none transition-all ${errors.area ? 'border-red-400' : 'border-gray-100 focus:border-brand-acqua'}`}
                            >
                                <option value="">Selecione uma área...</option>
                                <option value="limpeza">Limpeza e Manutenção</option>
                                <option value="eventos">Eventos e Feiras</option>
                                <option value="passeios">Passeios e Socialização</option>
                                <option value="outros">Outros (Design, Redes Sociais, etc)</option>
                            </select>
                            {errors.area && <span className="text-xs text-red-500 ml-2 mt-1 block">{errors.area.message}</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Mensagem (Opcional)</label>
                            <textarea
                                {...register('message')}
                                placeholder="Quer adicionar algum detalhe ou restrição de horário?"
                                rows={2}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-acqua transition-all resize-none"
                            ></textarea>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full py-5 text-lg shadow-lg shadow-brand-green/20 rounded-2xl"
                            isLoading={isSubmitting}
                            onClick={handleSubmit(onSubmit)}
                        >
                            Confirmar Interesse
                            <Send size={18} className="ml-2" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};
