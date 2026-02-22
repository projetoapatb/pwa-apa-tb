import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import type { Pet, LeadAdoption } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import SEO from '../components/SEO';
import { ArrowLeft, Send, CheckCircle2, ChevronRight, Share2, Info, Users, Heart, Clock, User as UserIcon, Phone } from 'lucide-react';
import { maskPhone } from '../utils/masks';



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

        if (!profile.displayName || !profile.phone) {
            alert("Por favor, complete seu nome e telefone no seu perfil antes de manifestar interesse.");
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
        } catch (error: any) {
            console.error("Erro ao enviar interesse:", error);
            alert(`Erro ao manifestar interesse: ${error.message || 'Tente novamente.'}`);
        } finally {
            setIsCreating(false);
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
                <Link to="/adocao" className="mt-4 text-brand-green font-bold flex items-center">
                    <ArrowLeft size={20} className="mr-2" /> Voltar para adoção
                </Link>
            </div>
        );
    }

    const isProfileComplete = !!(profile?.displayName && profile?.phone);

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
                                    src={mainPhoto || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974&auto=format&fit=crop'}
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

                        {/* Bloco de Interesse (1-Clique) */}
                        <Card className={`p-8 transition-all duration-500 overflow-hidden relative ${submitted ? 'bg-brand-green text-white shadow-2xl scale-105 z-10' : 'bg-white'}`}>
                            {submitted ? (
                                <div className="text-center py-10 animate-bounce-in">
                                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={48} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Manifestação Enviada!</h2>
                                    <p className="text-green-50 mb-8 px-4">
                                        Ficamos felizes com seu interesse! Nossa equipe analisará seu perfil e entrará em contato em breve para conversar sobre a adoção da {pet.name}.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setSubmitted(false);
                                        }}
                                        variant="outline"
                                        className="border-white text-white hover:bg-white/10"
                                    >
                                        Ok, entendi!
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-bold text-gray-800 font-merriweather">Interesse em Adotar</h2>
                                        <Share2 className="text-gray-300 hover:text-brand-green cursor-pointer transition-colors" size={20} />
                                    </div>

                                    {!user ? (
                                        <div className="text-center space-y-6 py-6 border-2 border-dashed border-gray-100 rounded-[2rem]">
                                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                                <Users className="text-gray-300" size={32} />
                                            </div>
                                            <div className="px-6">
                                                <p className="text-gray-600 mb-6 antialiased">Você precisa estar logado para manifestar interesse em adotar a {pet.name}.</p>
                                                <Link to="/login">
                                                    <Button variant="primary" className="w-full py-6 text-lg rounded-2xl shadow-xl shadow-teal-900/10">
                                                        Entrar agora
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (loadingLead || isCreating) ? (
                                        <div className="py-10 text-center animate-pulse text-gray-400">Verificando interesse anterior...</div>
                                    ) : indexError ? (
                                        <div className="p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] text-center">
                                            <Info size={32} className="text-red-400 mx-auto mb-4" />
                                            <p className="text-sm text-red-700 font-bold mb-2">Configuração Pendente</p>
                                            <p className="text-[10px] text-red-600 mb-4">
                                                O sistema precisa de um índice no Firestore para verificar seu status. Verifique o console ou o guia de índices.
                                            </p>
                                            <Link to="/perfil" className="text-[10px] font-bold text-red-800 underline">Abrir Painel</Link>
                                        </div>
                                    ) : currentLead && currentLead.status !== 'rejected' ? (
                                        <div className={`p-8 rounded-[2rem] text-center border-2 transition-all ${currentLead.status === 'approved' ? 'bg-brand-green/5 border-brand-green/20' : 'bg-brand-orange/5 border-brand-orange/20'}`}>
                                            <div className={`${currentLead.status === 'approved' ? 'bg-brand-green shadow-green-900/20' : 'bg-brand-orange shadow-orange-900/20'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                                                {currentLead.status === 'approved' ? <Heart size={32} className="text-white fill-current" /> : <Clock size={32} className="text-white" />}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2 font-merriweather">
                                                {currentLead.status === 'approved' ? 'Interesse Aprovado!' : 'Interesse em Análise'}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                                {currentLead.status === 'approved'
                                                    ? `Seu interesse em adotar a ${pet.name} foi aprovado! Nossa equipe entrará em contato para agendar o encontro (${maskPhone(currentLead.phone)}).`
                                                    : `Já recebemos sua manifestação de interesse pela ${pet.name}. Nossa equipe está avaliando seu perfil!`}
                                            </p>

                                            <Badge variant={currentLead.status === 'approved' ? 'success' : 'warning'} className="px-6 py-2 uppercase tracking-widest text-[10px] font-black">
                                                {currentLead.status === 'approved' ? 'Parabéns!' : 'Aguarde o contato'}
                                            </Badge>
                                        </div>
                                    ) : !isProfileComplete ? (
                                        <div className="text-center space-y-6 py-8 px-6 bg-brand-orange/5 border-2 border-brand-orange/20 rounded-[2rem]">
                                            <div className="bg-brand-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                                <Info className="text-brand-orange" size={32} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 mb-2">Complete seu Perfil</p>
                                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                                    Para adotar, precisamos de alguns dados básicos como seu telefone e nome completo.
                                                </p>
                                                <Link to="/perfil">
                                                    <Button variant="outline" className="w-full border-brand-orange text-brand-orange hover:bg-brand-orange/5 rounded-2xl">
                                                        Ir para Perfil
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {currentLead?.status === 'rejected' && (
                                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 mb-4 italic">
                                                    Sua tentativa anterior não foi aprovada: "{currentLead.rejectionReason}"
                                                </div>
                                            )}

                                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-6">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Seus dados de contato:</p>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-gray-700">
                                                        <UserIcon size={16} className="text-brand-acqua" />
                                                        <span className="font-medium">{profile?.displayName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-700">
                                                        <Phone size={16} className="text-brand-acqua" />
                                                        <span className="font-medium">{maskPhone(profile?.phone || '')}</span>
                                                    </div>

                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-6 leading-tight italic">
                                                    * Ao clicar abaixo, esses dados serão enviados para que possamos entrar em contato.
                                                </p>
                                            </div>

                                            <Button
                                                onClick={handleManifestInterest}
                                                variant="primary"
                                                className="w-full py-6 text-lg rounded-[1.5rem] shadow-xl shadow-brand-acqua/20 group relative overflow-hidden"
                                                isLoading={loadingLead}
                                            >
                                                <span className="relative z-10 flex items-center gap-2">
                                                    Manifestar Interesse <Send size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                                </span>
                                            </Button>

                                            <p className="text-center text-[10px] text-gray-400 font-medium">
                                                Nossa equipe entrará em contato em até 48h úteis.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PetDetailPage;
