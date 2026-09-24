import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import type { Pet, LeadAdoption } from '../types';
import { Button } from '../components/ui/Button';
import { PrivacyConsentCheckbox } from '../components/PrivacyConsentCheckbox';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import SEO from '../components/SEO';
import { ArrowLeft, Send, CheckCircle2, ChevronRight, Share2, Info, Users, Heart, Clock, User as UserIcon, Phone, MessageCircle, ChevronDown } from 'lucide-react';
import { maskPhone, toWhatsAppLink } from '../utils/masks';
import { getOptimizedCloudinaryUrl } from '../lib/cloudinary';



const PetDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [pet, setPet] = useState<Pet | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [mainPhoto, setMainPhoto] = useState<string>('');
    const [currentLead, setCurrentLead] = useState<LeadAdoption | null>(null);
    const [loadingLead, setLoadingLead] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [indexError, setIndexError] = useState(false);
    const [privacyConsent, setPrivacyConsent] = useState(false);
    const [consentError, setConsentError] = useState('');
    const [showApaPath, setShowApaPath] = useState(false);
    const [shareFeedback, setShareFeedback] = useState('');

    const { profile, user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!id || authLoading) {
            setLoading(true); // Keep loading state true while auth is loading
            setLoadingLead(true); // Keep loading lead state true while auth is loading
            return;
        }

        setLoadingLead(true); // Set loading lead to true when starting to fetch/monitor

        const fetchPet = async () => {
            try {
                const docRef = doc(db, 'pets', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Pet;
                    setPet(data);
                    setMainPhoto(data.photos[0] || '');
                }
            } catch (error) {
                console.error("Erro ao carregar detalhes do animal:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPet();

        // Monitorar interesse do usuário logado em tempo real
        if (user && id) {
            const q = query(
                collection(db, 'leads_adoption'),
                where('petId', '==', id),
                where('userId', '==', user.uid),
                limit(1)
            );

            const unsubscribe = onSnapshot(q, (snap) => {
                if (!snap.empty) {
                    setCurrentLead({ id: snap.docs[0].id, ...snap.docs[0].data() } as LeadAdoption);
                } else {
                    setCurrentLead(null);
                }
                setLoadingLead(false);
                setIndexError(false);
            }, (error: any) => {
                console.error("Erro ao monitorar lead:", error.code, error.message);
                setLoadingLead(false);
                if (error.code === 'failed-precondition' || error.message?.includes('index')) {
                    setIndexError(true);
                }
            });

            return () => unsubscribe();
        } else {
            setLoadingLead(false);
        }
    }, [id, user, authLoading]);

    const handleManifestInterest = async () => {
        if (!pet || !user || !profile) return;

        if (!privacyConsent) {
            setConsentError('É necessário aceitar a Política de Privacidade para continuar.');
            return;
        }
        setConsentError('');

        if (!profile.displayName || !profile.phone) {
            alert('Complete seu nome e telefone no perfil antes de manifestar interesse.');
            return;
        }

        try {
            setIsCreating(true);
            await addDoc(collection(db, 'leads_adoption'), {
                petId: pet.id,
                petName: pet.name,
                userId: user.uid,
                name: profile.displayName,
                email: user.email,
                phone: profile.phone,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            // Atualização otimista para evitar o "piscar" ao clicar em OK
            setCurrentLead({
                petId: pet.id,
                petName: pet.name,
                userId: user.uid,
                name: profile.displayName,
                email: user.email,
                phone: profile.phone,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as any);

            setSubmitted(true);
            setLoadingLead(false);
        } catch (error: unknown) {
            console.error("Erro ao enviar interesse:", error);
            alert('Não foi possível registrar seu interesse. Verifique sua conexão e tente novamente.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleShare = async () => {
        if (!pet) return;
        const shareUrl = window.location.href;
        const shareData = {
            title: `Adote ${pet.name} | APA Telêmaco Borba`,
            text: `Conheça ${pet.name} e ajude a encontrar um lar!`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
            setShareFeedback('Link copiado!');
            setTimeout(() => setShareFeedback(''), 2500);
        } catch {
            // Usuário cancelou o share nativo — sem feedback de erro.
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Animal não encontrado</h2>
                <p className="text-gray-500 mt-2">Este anúncio pode ter sido removido ou o link está incorreto.</p>
                <Link to="/adocao" className="mt-4 text-brand-green font-bold flex items-center">
                    <ArrowLeft size={20} className="mr-2" /> Voltar para adoção
                </Link>
            </div>
        );
    }

    const isProfileComplete = !!(profile?.displayName && profile?.phone);
    const whatsappUrl = pet.contactPhone
        ? toWhatsAppLink(
            pet.contactPhone,
            `Olá! Vi o anúncio da ${pet.name} no site da APA Telêmaco Borba e tenho interesse em adotar.`
        )
        : null;
    const hasActiveLead = !!(currentLead && currentLead.status !== 'rejected');
    const apaPathOpen = showApaPath || !whatsappUrl || hasActiveLead || submitted;

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <SEO
                title={`Adote a ${pet.name} | APA Telêmaco Borba`}
                description={`Conheça a história da ${pet.name}, um(a) ${pet.species.toLowerCase()} ${pet.size} que busca uma família em Telêmaco Borba. Veja fotos e manifeste seu interesse!`}
                image={pet.photos[0]}
                url={`https://apa-telemaco-borba.web.app/adocao/${pet.id}`}
            />
            {/* Header Mobile - Floating Back Button */}
            <div className="md:hidden fixed top-6 left-6 z-50">
                <Link to="/adocao">
                    <div className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-gray-100">
                        <ArrowLeft size={20} className="text-gray-800" />
                    </div>
                </Link>
            </div>

            <div className="container mx-auto px-4 md:px-6 pt-6 md:pt-12">
                <div className="grid lg:grid-cols-12 gap-10">

                    {/* Galeria de Fotos - Coluna Esquerda */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="bg-white p-2 rounded-[2.5rem] shadow-xl overflow-hidden border border-white">
                            <div className="aspect-[4/5] md:aspect-video rounded-[2rem] overflow-hidden group">
                                <img
                                    src={mainPhoto
                                        ? getOptimizedCloudinaryUrl(mainPhoto, 'f_auto,q_auto,w_1200')
                                        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974&auto=format&fit=crop'}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    alt={pet.name}
                                />
                            </div>
                        </div>

                        {/* Nome e Tags Mobile/Base */}
                        <div className="px-2 pt-2">
                            <h1 className="text-4xl md:text-5xl font-black font-merriweather text-gray-800 mb-2">
                                {pet.name}
                                <span className="text-xl font-medium text-brand-orange ml-3">({pet.species})</span>
                            </h1>
                            <div className="flex gap-2 mb-6">
                                <Badge variant="success">{pet.status}</Badge>
                                <Badge variant="warning">{pet.size}</Badge>
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {pet.photos.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 px-2 scrollbar-hide">
                                {pet.photos.map((photo, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setMainPhoto(photo)}
                                        className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all ${mainPhoto === photo ? 'border-brand-acqua scale-95 shadow-lg' : 'border-white shadow-sm hover:border-brand-acqua/30'}`}
                                    >
                                        <img src={photo} className="w-full h-full object-cover" alt="Pet thumbnail" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Detalhes Técnicos */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10">
                            {[
                                { label: 'Espécie', value: pet.species, icon: <Info size={16} />, color: 'acqua' },
                                { label: 'Gênero', value: pet.gender || 'N/A', icon: <Users size={16} />, color: 'acqua' },
                                { label: 'Porte', value: pet.size, icon: <Info size={16} />, color: 'orange' },
                                { label: 'Idade', value: typeof pet.age === 'number' ? `${pet.age} anos` : pet.age, icon: <ChevronRight size={16} />, color: 'green' }
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{item.label}</span>
                                    <span className="text-base md:text-xl font-bold text-gray-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lado Direito - História e Formulário */}
                    <div className="lg:col-span-5 space-y-8">

                        {/* Status Badges - Mobile Only */}
                        <div className="lg:hidden flex gap-2">
                            <Badge variant="info">{pet.species}</Badge>
                            <Badge variant="warning">{pet.size}</Badge>
                            <Badge variant="success">{pet.status}</Badge>
                        </div>

                        {/* História */}
                        <Card className="p-8">
                            <h2 className="text-2xl font-bold font-merriweather text-brand-green mb-6 flex items-center">
                                <span className="bg-brand-green/10 p-2 rounded-lg mr-3">🐾</span>
                                Minha História
                            </h2>
                            <p className="text-gray-600 leading-relaxed text-lg italic bg-gray-50/50 p-6 rounded-2xl border-l-4 border-brand-acqua">
                                "{pet.description}"
                            </p>

                            <div className="mt-8">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                    <CheckCircle2 size={18} className="text-brand-green mr-2" />
                                    Temperamento & Saúde
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {pet.tags.map(tag => (
                                        <Badge key={tag} className="px-4 py-1">#{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Como adotar — contato unificado */}
                        <Card className={`p-8 transition-all duration-500 overflow-hidden relative ${submitted ? 'bg-brand-green text-white shadow-2xl scale-105 z-10' : 'bg-white'}`}>
                            {submitted ? (
                                <div className="text-center py-10 animate-bounce-in">
                                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={48} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Pedido enviado!</h2>
                                    <p className="text-green-50 mb-8 px-4">
                                        Registramos seu interesse em adotar a {pet.name}. A equipe da APA vai analisar e entrar em contato em breve.
                                    </p>
                                    <Button
                                        onClick={() => setSubmitted(false)}
                                        variant="outline"
                                        className="border-white text-white hover:bg-white/10"
                                    >
                                        Ok, entendi!
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800 font-merriweather">
                                                Quer adotar a {pet.name}?
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                                O interesse é sempre no animal. Escolha como prefere seguir:
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleShare}
                                            className="flex-shrink-0 p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-brand-green hover:bg-brand-green/5 transition-colors relative"
                                            title="Compartilhar anúncio"
                                            aria-label="Compartilhar anúncio"
                                        >
                                            <Share2 size={20} />
                                            {shareFeedback && (
                                                <span className="absolute -bottom-8 right-0 text-[10px] font-bold text-brand-green whitespace-nowrap">
                                                    {shareFeedback}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Caminho 1: WhatsApp direto (preferencial quando existe) */}
                                    {whatsappUrl && (
                                        <div className="rounded-[1.75rem] border-2 border-[#25D366]/25 bg-[#25D366]/5 p-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#128C7E] bg-white px-3 py-1 rounded-full">
                                                    Mais rápido
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">Falar com quem anunciou</h3>
                                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                    Conversa direta no WhatsApp sobre a adoção da {pet.name}.
                                                </p>
                                            </div>
                                            <a
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1ebe57] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-green-900/10"
                                            >
                                                <MessageCircle size={20} />
                                                Abrir WhatsApp
                                            </a>
                                            {pet.contactPhone && (
                                                <p className="text-center text-xs text-gray-400">
                                                    {maskPhone(pet.contactPhone)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Caminho 2: Mediação da APA */}
                                    <div className={`rounded-[1.75rem] border-2 p-6 ${whatsappUrl ? 'border-gray-100 bg-gray-50/80' : 'border-brand-acqua/20 bg-brand-acqua/5'}`}>
                                        {whatsappUrl ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowApaPath((v) => !v)}
                                                className="w-full flex items-center justify-between gap-3 text-left"
                                            >
                                                <div>
                                                    <h3 className="font-bold text-gray-800">Prefere que a APA intermedeie?</h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Envie seu interesse e a equipe entra em contato com você.
                                                    </p>
                                                </div>
                                                <ChevronDown
                                                    size={20}
                                                    className={`text-gray-400 flex-shrink-0 transition-transform ${apaPathOpen ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        ) : (
                                            <div className="mb-6">
                                                <h3 className="font-bold text-gray-800 text-lg">Manifestar interesse em adotar</h3>
                                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                    Envie seus dados para a APA. Nossa equipe analisa e retorna sobre a {pet.name}.
                                                </p>
                                            </div>
                                        )}

                                        {apaPathOpen && (
                                            <div className={`space-y-5 ${whatsappUrl ? 'mt-6 pt-6 border-t border-gray-200' : ''}`}>
                                                {!user ? (
                                                    <div className="text-center space-y-4 py-4">
                                                        <p className="text-sm text-gray-600">
                                                            Faça login para enviar o interesse em adotar a {pet.name} pela APA.
                                                        </p>
                                                        <Link
                                                            to="/login"
                                                            state={{ from: { pathname: `/adocao/${pet.id}` } }}
                                                        >
                                                            <Button variant="primary" className="w-full py-5 rounded-2xl">
                                                                Entrar para continuar
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ) : (loadingLead || isCreating) ? (
                                                    <div className="py-8 text-center animate-pulse text-gray-400 text-sm">Carregando...</div>
                                                ) : indexError ? (
                                                    <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl text-center">
                                                        <p className="text-sm text-gray-700 font-bold mb-2">Não foi possível verificar seu interesse</p>
                                                        <p className="text-xs text-gray-500 mb-3">Recarregue a página ou tente pelo perfil.</p>
                                                        <Link to="/perfil" className="text-xs font-bold text-brand-green underline">Ir para o perfil</Link>
                                                    </div>
                                                ) : currentLead && currentLead.status !== 'rejected' ? (
                                                    <div className={`p-6 rounded-2xl text-center border-2 ${currentLead.status === 'approved' ? 'bg-brand-green/5 border-brand-green/20' : 'bg-brand-orange/5 border-brand-orange/20'}`}>
                                                        <div className={`${currentLead.status === 'approved' ? 'bg-brand-green' : 'bg-brand-orange'} w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4`}>
                                                            {currentLead.status === 'approved'
                                                                ? <Heart size={28} className="text-white fill-current" />
                                                                : <Clock size={28} className="text-white" />}
                                                        </div>
                                                        <h4 className="font-bold text-gray-800 mb-2">
                                                            {currentLead.status === 'approved'
                                                                ? 'Interesse aprovado!'
                                                                : 'Interesse em análise'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {currentLead.status === 'approved'
                                                                ? `A APA vai entrar em contato sobre a adoção da ${pet.name} (${maskPhone(currentLead.phone)}).`
                                                                : `Já recebemos seu interesse na ${pet.name}. Aguarde o retorno da equipe.`}
                                                        </p>
                                                    </div>
                                                ) : !isProfileComplete ? (
                                                    <div className="text-center space-y-4 py-2">
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            Complete nome e telefone no perfil para enviar o interesse na {pet.name}.
                                                        </p>
                                                        <Link to="/perfil">
                                                            <Button variant="outline" className="w-full border-brand-orange text-brand-orange rounded-2xl">
                                                                Completar perfil
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-5">
                                                        {currentLead?.status === 'rejected' && (
                                                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 italic">
                                                                Tentativa anterior não aprovada: "{currentLead.rejectionReason}"
                                                            </div>
                                                        )}

                                                        <div className="bg-white p-5 rounded-2xl border border-gray-100">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                                                                Dados que a APA receberá
                                                            </p>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3 text-gray-700 text-sm">
                                                                    <UserIcon size={16} className="text-brand-acqua" />
                                                                    <span className="font-medium">{profile?.displayName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-gray-700 text-sm">
                                                                    <Phone size={16} className="text-brand-acqua" />
                                                                    <span className="font-medium">{maskPhone(profile?.phone || '')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <PrivacyConsentCheckbox
                                                            checked={privacyConsent}
                                                            onChange={(checked) => {
                                                                setPrivacyConsent(checked);
                                                                if (checked) setConsentError('');
                                                            }}
                                                            id="adoptionPrivacyConsent"
                                                            error={consentError}
                                                        />

                                                        <Button
                                                            onClick={handleManifestInterest}
                                                            variant="primary"
                                                            className="w-full py-5 text-base rounded-2xl"
                                                            isLoading={isCreating}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                Quero adotar a {pet.name} <Send size={18} />
                                                            </span>
                                                        </Button>

                                                        <p className="text-center text-[10px] text-gray-400">
                                                            Retorno em até 48h úteis.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PetDetailPage;
