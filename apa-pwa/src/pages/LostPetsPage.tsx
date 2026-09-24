import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPin, Phone, Calendar, Plus, LogIn, TrendingUp, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { LostPetForm } from '../components/LostPetForm';
import type { LostPet } from '../types';
import { maskPhone, toWhatsAppLink } from '../utils/masks';
import { getOptimizedCloudinaryUrl } from '../lib/cloudinary';

const LOST_PET_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop';

const getLostPetImageSrc = (photoUrl?: string) => {
    if (!photoUrl) return LOST_PET_FALLBACK_IMAGE;
    return getOptimizedCloudinaryUrl(photoUrl);
};


const LostPetsPage: React.FC = () => {
    const { user } = useAuth();
    const [pets, setPets] = useState<LostPet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedPet, setSelectedPet] = useState<LostPet | null>(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (!selectedPet) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [selectedPet]);

    useEffect(() => {
        // Apenas anúncios aprovados no site público
        const q = query(
            collection(db, 'lost_pets'),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const petList = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter((p: any) => p.moderationStatus === 'approved') as LostPet[];
            setPets(petList);
            setLoadError(false);
            setLoading(false);
        }, (error) => {
            console.error('Erro ao carregar mural de perdidos:', error);
            setLoadError(true);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);


    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <SEO
                title="Mural de Perdidos | APA Telêmaco Borba"
                description="Ajude-nos a encontrar animais desaparecidos em nossa região ou anuncie um animal que você perdeu ou encontrou."
            />

            <div className="bg-brand-green text-white py-21">
                <div className="container mx-auto px-6">
                    <h1 className="text-3xl md:text-4xl font-bold font-merriweather mb-6">Mural de Perdidos</h1>
                    <p className="text-lg text-green-100 max-w-2xl font-light leading-relaxed">
                        Um espaço de utilidade pública para ajudar a reunir famílias e seus melhores amigos.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-13 flex flex-col md:flex-row gap-6 mb-13 items-center justify-between">
                <div className="hidden md:block">
                    {/* Espaçador para manter o botão alinhado à direita agora que a busca sumiu */}
                </div>

                <div className="w-full md:w-auto">
                    {user ? (
                        <Button
                            variant="orange"
                            className="w-full md:w-auto px-13 py-5 rounded-3xl shadow-2xl shadow-orange-900/20 whitespace-nowrap"
                            onClick={() => setShowForm(!showForm)}
                        >
                            <Plus size={20} className={`mr-2 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
                            {showForm ? 'Fechar Formulário' : 'Anunciar no Mural'}
                        </Button>
                    ) : (
                        <Link
                            to="/login"
                            className="w-full md:w-auto px-13 py-5 bg-brand-orange text-white rounded-3xl shadow-2xl shadow-orange-900/20 whitespace-nowrap flex items-center justify-center font-bold text-sm uppercase tracking-widest gap-3 hover:scale-105 transition-transform"
                        >
                            <LogIn size={20} />
                            Faça Login para Anunciar
                        </Link>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="mb-12 animate-fade-in">
                    <LostPetForm
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            )}

            {loadError ? (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 font-merriweather">Não foi possível carregar o mural</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Verifique sua conexão com a internet e tente novamente.</p>
                    <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
                        Recarregar página
                    </Button>
                </div>
            ) : loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
                </div>
            ) : pets.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plus className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 font-merriweather">Nenhum anúncio ativo</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Seja o primeiro a ajudar! Anuncie um animal perdido ou encontrado no botão acima.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pets.map((pet) => (
                        <Card key={pet.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none rounded-[2.25rem] bg-white">
                            <div
                                className="relative aspect-[4/3] overflow-hidden cursor-pointer"
                                onClick={() => setSelectedPet(pet)}
                            >
                                <img
                                    src={getLostPetImageSrc(pet.photoUrl)}
                                    alt={pet.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${pet.status === 'perdido' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                    }`}>
                                    {pet.status}
                                </div>
                                {pet.hasReward && (
                                    <div className="absolute top-4 right-4 bg-brand-orange text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                                        Recompensa: {pet.rewardValue}
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3 font-merriweather group-hover:text-brand-green transition-colors">{pet.name}</h3>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-start gap-3 text-gray-500 text-sm">
                                        <MapPin size={18} className="text-brand-green flex-shrink-0" />
                                        <span>Visto pela última vez em: <br /><strong className="text-gray-700">{pet.lastSeenLocation}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                                        <Calendar size={18} className="text-brand-green flex-shrink-0" />
                                        <span>Data: <strong className="text-gray-700">{pet.lastSeenDate?.toDate().toLocaleDateString('pt-BR')}</strong></span>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm mb-6 line-clamp-3 italic leading-relaxed">
                                    "{pet.description}"
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-100 gap-3">
                                    {(() => {
                                        const wa = toWhatsAppLink(
                                            pet.contactPhone,
                                            `Olá! Vi o anúncio de ${pet.name} no mural de perdidos da APA Telêmaco Borba.`
                                        );
                                        return wa ? (
                                            <a
                                                href={wa}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-[#128C7E] font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MessageCircle size={16} />
                                                WhatsApp
                                            </a>
                                        ) : (
                                            <a
                                                href={`tel:${pet.contactPhone}`}
                                                className="flex items-center gap-2 text-brand-green font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Phone size={16} />
                                                Ligar
                                            </a>
                                        );
                                    })()}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border-gray-100 text-gray-400 hover:text-brand-green hover:border-brand-green"
                                        onClick={() => setSelectedPet(pet)}
                                    >
                                        Ver Detalhes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Detalhes */}
            {selectedPet && (
                <div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setSelectedPet(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="lost-pet-modal-title"
                >
                    <Card
                        hoverable={false}
                        className="w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border-none shadow-2xl relative animate-scale-in flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedPet(null)}
                            className="absolute top-4 right-4 z-20 p-2.5 bg-white/90 hover:bg-white text-gray-600 rounded-full shadow-md transition-all"
                            aria-label="Fechar"
                        >
                            <Plus size={22} className="rotate-45" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 min-h-0 flex-1 overflow-hidden">
                            {/* Foto */}
                            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px] md:h-full bg-gray-100">
                                <img
                                    src={getLostPetImageSrc(selectedPet.photoUrl)}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    alt={selectedPet.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:hidden" />
                                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                    <span
                                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                            selectedPet.status === 'perdido' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                        }`}
                                    >
                                        {selectedPet.status}
                                    </span>
                                    {selectedPet.species && (
                                        <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/95 text-gray-700 shadow-lg">
                                            {selectedPet.species}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Conteúdo */}
                            <div className="flex flex-col min-h-0 bg-white overflow-y-auto scrollbar-hide">
                                <div className="p-6 sm:p-8 space-y-5 flex-1">
                                    <header className="pr-10 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">
                                            Mural de Perdidos
                                        </p>
                                        <h2
                                            id="lost-pet-modal-title"
                                            className="text-2xl sm:text-3xl font-black text-gray-800 font-merriweather leading-tight"
                                        >
                                            {selectedPet.name}
                                        </h2>
                                    </header>

                                    {/* Info cards em grade */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Local</p>
                                                <p className="text-sm font-bold text-gray-800 leading-snug break-words">
                                                    {selectedPet.lastSeenLocation}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Data</p>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {selectedPet.lastSeenDate?.toDate
                                                        ? selectedPet.lastSeenDate.toDate().toLocaleDateString('pt-BR')
                                                        : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedPet.hasReward && (
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-orange/10 border border-brand-orange/20">
                                            <div className="w-11 h-11 rounded-xl bg-brand-orange text-white flex items-center justify-center flex-shrink-0">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest mb-0.5">
                                                    Recompensa
                                                </p>
                                                <p className="text-lg font-black text-gray-800">{selectedPet.rewardValue}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                            Descrição
                                        </p>
                                        <div className="p-4 rounded-2xl bg-brand-green/5 border border-brand-green/10">
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {selectedPet.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CTAs fixos no rodapé do painel */}
                                <div className="p-6 sm:p-8 pt-4 border-t border-gray-100 bg-white space-y-3 sticky bottom-0">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">
                                        Tem informações? Fale agora
                                    </p>
                                    {(() => {
                                        const wa = toWhatsAppLink(
                                            selectedPet.contactPhone,
                                            `Olá! Vi o anúncio de ${selectedPet.name} no mural de perdidos da APA Telêmaco Borba.`
                                        );
                                        return wa ? (
                                            <a
                                                href={wa}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1ebe57] text-white py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-green-900/10"
                                            >
                                                <MessageCircle size={18} />
                                                WhatsApp · {maskPhone(selectedPet.contactPhone)}
                                            </a>
                                        ) : null;
                                    })()}
                                    <div className="grid grid-cols-2 gap-3">
                                        <a
                                            href={`tel:${selectedPet.contactPhone}`}
                                            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-green text-white text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                                        >
                                            <Phone size={16} />
                                            Ligar
                                        </a>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const shareUrl = `${window.location.origin}/perdidos`;
                                                const text = `Ajude a encontrar ${selectedPet.name}! Visto em ${selectedPet.lastSeenLocation}.`;
                                                try {
                                                    if (navigator.share) {
                                                        await navigator.share({ title: selectedPet.name, text, url: shareUrl });
                                                    } else {
                                                        await navigator.clipboard.writeText(`${text} ${shareUrl}`);
                                                        alert('Link copiado para compartilhar!');
                                                    }
                                                } catch {
                                                    // cancelado
                                                }
                                            }}
                                            className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-500 hover:border-brand-green hover:text-brand-green transition-all"
                                        >
                                            Compartilhar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default LostPetsPage;
