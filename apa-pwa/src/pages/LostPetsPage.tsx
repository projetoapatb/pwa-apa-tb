import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPin, Phone, Calendar, Plus, LogIn, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { LostPetForm } from '../components/LostPetForm';
import type { LostPet } from '../types';
import { maskPhone } from '../utils/masks';


const LostPetsPage: React.FC = () => {
    const { user } = useAuth();
    const [pets, setPets] = useState<LostPet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedPet, setSelectedPet] = useState<LostPet | null>(null);

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
                        onSuccess={() => setShowForm(false)}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            )}

            {loading ? (
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
                                    src={pet.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop'}
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
                                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                    <a
                                        href={`tel:${pet.contactPhone}`}
                                        className="flex items-center gap-2 text-brand-green font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                                    >
                                        <Phone size={16} />
                                        Ligar Agora
                                    </a>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden">
                    <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl relative animate-scale-in scrollbar-hide">
                        <button
                            onClick={() => setSelectedPet(null)}
                            className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white md:text-gray-400 md:hover:text-gray-600 md:bg-gray-50 rounded-full transition-all"
                        >
                            <Plus size={24} className="rotate-45" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="h-64 md:h-[500px] sticky top-0 md:relative">
                                <img
                                    src={selectedPet.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop'}
                                    className="w-full h-full object-cover"
                                    alt={selectedPet.name}
                                />
                                <div className={`absolute top-6 left-6 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${selectedPet.status === 'perdido' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                    }`}>
                                    {selectedPet.status}
                                </div>
                            </div>

                            <div className="p-6 md:p-10 space-y-6 bg-white">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-800 font-merriweather mb-2">{selectedPet.name}</h2>
                                    <div className="flex items-center gap-2 text-brand-green font-bold">
                                        <MapPin size={18} />
                                        <span>{selectedPet.lastSeenLocation}</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl">
                                        <Calendar className="text-brand-green mt-1" size={20} />
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Data do ocorrido</p>
                                            <p className="text-gray-700 font-bold">{selectedPet.lastSeenDate?.toDate().toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none ml-2">Descrição Completa</p>
                                        <div className="bg-brand-green/5 p-6 rounded-3xl border border-brand-green/10">
                                            <p className="text-gray-600 leading-relaxed italic">
                                                "{selectedPet.description}"
                                            </p>
                                        </div>
                                    </div>

                                    {selectedPet.hasReward && (
                                        <div className="p-6 bg-brand-orange/10 border-2 border-brand-orange/20 rounded-3xl flex items-center gap-4 animate-bounce-in">
                                            <div className="bg-brand-orange p-3 rounded-2xl text-white">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest leading-none mb-1">Há uma Recompensa!</p>
                                                <p className="text-gray-800 font-black text-xl">{selectedPet.rewardValue}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 font-bold text-center mb-6">TEM INFORMAÇÕES? ENTRE EM CONTATO AGORA:</p>
                                    <a
                                        href={`tel:${selectedPet.contactPhone}`}
                                        className="flex items-center justify-center gap-3 w-full bg-brand-green text-white py-4 rounded-2xl text-base font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-900/10"
                                    >
                                        <Phone size={20} />
                                        Ligar: {maskPhone(selectedPet.contactPhone)}
                                    </a>

                                    <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-6">
                                        Ajude a divulgar este caso compartilhando com amigos.
                                    </p>
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
