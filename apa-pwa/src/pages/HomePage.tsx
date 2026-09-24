import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Heart, ShieldCheck, Users, Star, TrendingUp, Home } from 'lucide-react';
import { Card } from '../components/ui/Card';
import SEO from '../components/SEO';
import { db } from '../lib/firebase';
import { collection, query, where, limit, onSnapshot, orderBy } from 'firebase/firestore';
import type { Pet, MonthlyResult, Partner, LostPet, Post } from '../types';
import { PetCard } from '../components/PetCard';
import { useNavigate, Link } from 'react-router-dom';
import { useFlags } from '../contexts/FeatureFlagContext';
import { ArrowRight } from 'lucide-react';
import { LostPetsCarousel } from '../components/LostPetsCarousel';
import { PartnersCarousel } from '../components/PartnersCarousel';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { flags } = useFlags();
    const [highlightPets, setHighlightPets] = useState<Pet[]>([]);
    const [lostPets, setLostPets] = useState<LostPet[]>([]);
    const [latestResult, setLatestResult] = useState<MonthlyResult | null>(null);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [highlightStories, setHighlightStories] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Buscar Pets em Destaque (Disponíveis, limit 6)
        const petsQuery = query(
            collection(db, 'pets'),
            where('status', '==', 'disponível'),
            limit(6)
        );

        const unsubPets = onSnapshot(petsQuery, (snap) => {
            const petsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pet[];

            // Ordenação local: sortOrder (asc) > createdAt (desc)
            petsData.sort((a, b) => {
                const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;

                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;
                return dateB - dateA;
            });

            setHighlightPets(petsData);
        });


        // Buscar Animais Perdidos (Aprovados) para o carrossel
        const lostQuery = query(
            collection(db, 'lost_pets'),
            where('moderationStatus', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            limit(12)
        );

        const unsubLost = onSnapshot(lostQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LostPet[];
            setLostPets(data);
        });

        // Buscar Último Resultado Mensal
        const resultsQuery = query(
            collection(db, 'results'),
            orderBy('id', 'desc'),
            limit(1)
        );

        const unsubResults = onSnapshot(resultsQuery, (snap) => {
            if (!snap.empty) {
                setLatestResult({ id: snap.docs[0].id, ...snap.docs[0].data() } as MonthlyResult);
            }
        });

        // Buscar Parceiros Ativos
        const partnersQuery = query(
            collection(db, 'partners'),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        );

        const unsubPartners = onSnapshot(partnersQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Partner[];
            setPartners(data);
        });

        // Buscar Histórias em Destaque
        const storiesQuery = query(
            collection(db, 'posts'),
            where('category', '==', 'história'),
            where('isHighlighted', '==', true),
            limit(3)
        );

        const unsubStories = onSnapshot(storiesQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
            setHighlightStories(data);
            setLoading(false);
        });

        return () => {
            unsubPets();
            unsubLost();
            unsubResults();
            unsubPartners();
            unsubStories();
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="APA Telêmaco Borba - Adoção e Proteção Animal"
                description="Resgatamos, cuidamos e encontramos lares para cães e gatos em Telêmaco Borba. Junte-se à nossa causa!"
            />
            {/* Hero Section — preenche a tela */}
            <section className="relative min-h-[calc(100dvh-4.5rem)] md:min-h-[calc(100dvh-6.5rem)] flex items-center overflow-hidden bg-brand-green">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2069&auto=format&fit=crop"
                        alt=""
                        className="h-full w-full object-cover object-center scale-105"
                        fetchPriority="high"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-green/95 via-brand-green/75 to-brand-green/35" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-green/80 via-transparent to-brand-green/20" />

                <div className="container mx-auto px-6 relative z-10 py-16 md:py-20">
                    <div className="max-w-2xl text-white">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-orange text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 animate-fade-in shadow-lg shadow-orange-900/20">
                            <img src="/logo.png" alt="" className="h-3 w-auto invert brightness-0" />
                            APA Telêmaco Borba
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold leading-tight font-merriweather mb-6">
                            Cada latido conta uma <span className="text-brand-acqua italic">nova história</span>.
                        </h1>
                        <p className="text-base md:text-lg text-green-50/90 mb-10 leading-relaxed font-light">
                            Resgate, cuidado e adoção responsável em Telêmaco Borba. Encontre um amigo ou ajude quem já está sob nossos cuidados.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" variant="orange" className="group" onClick={() => navigate('/adocao')}>
                                Quero Adotar
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </Button>
                            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate('/doacoes')}>
                                Apoiar ONG
                            </Button>
                        </div>
                    </div>
                </div>

                {latestResult && (
                    <div className="absolute bottom-8 right-6 md:bottom-10 md:right-10 hidden lg:block animate-bounce-in">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[1.5rem] text-white">
                            <div className="flex items-center gap-4">
                                <div className="bg-brand-orange p-2.5 rounded-xl">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-200">Impacto este mês</p>
                                    <h3 className="text-2xl font-black">+{latestResult.helpedCount}</h3>
                                    <p className="text-[10px] font-medium text-green-100">animais ajudados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 text-white/70">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Role para explorar</span>
                    <div className="w-px h-8 bg-white/40 animate-pulse" />
                </div>
            </section>

            {/* Missão e Valores (Fibonacci Optimized) */}
            <section className="py-34 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-13">
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-21 h-21 bg-brand-green/10 rounded-[1.5rem] flex items-center justify-center text-brand-green mb-8 group-hover:scale-110 transition-transform shadow-sm">
                                <Heart size={34} />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-5 font-merriweather">Adoção de Coração</h3>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                                Unimos cães resgatados a famílias que buscam um novo melhor amigo.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-21 h-21 bg-brand-acqua/10 rounded-[1.5rem] flex items-center justify-center text-brand-acqua mb-8 group-hover:scale-110 transition-transform shadow-sm">
                                <ShieldCheck size={34} />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-5 font-merriweather">Proteção & Cuidado</h3>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                                Garantimos saúde, castração e segurança para todos os nossos protegidos.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-21 h-21 bg-brand-orange/10 rounded-[1.5rem] flex items-center justify-center text-brand-orange mb-8 group-hover:scale-110 transition-transform shadow-sm">
                                <Users size={34} />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-5 font-merriweather">Comunidade Ativa</h3>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                                Promovemos conscientização sobre maus-tratos e posse responsável.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Animais Perdidos em Destaque */}
            {lostPets.length > 0 && (
                <section className="py-21 bg-gray-50 overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10">
                            <div>
                                <span className="text-red-500 font-black tracking-[0.2em] uppercase text-[9px]">Urgente: Perdidos & Encontrados</span>
                                <h2 className="text-3xl md:text-4xl font-black text-gray-800 font-merriweather mt-3">Ajude a Reencontrar</h2>
                            </div>
                            <Link to="/perdidos" className="flex items-center text-brand-green font-bold hover:gap-3 transition-all self-start sm:self-auto">
                                Ver Mural Completo <ArrowRight size={20} className="ml-3" />
                            </Link>
                        </div>

                        <LostPetsCarousel pets={lostPets} />
                    </div>
                </section>
            )}

            {/* Pets em Destaque (RF-001) - Fibonacci Optimized */}
            <section className="py-34 bg-white">
                <div className="container mx-auto px-6">
                        <div className="flex justify-between items-end mb-13 gap-4">
                            <div>
                                <span className="text-brand-orange font-black tracking-[0.2em] uppercase text-[10px]">Nossos Protegidos</span>
                                <h2 className="text-4xl md:text-5xl font-black text-gray-800 font-merriweather mt-3">Destaques para Adoção</h2>
                            </div>
                            <Link to="/adocao" className="flex items-center text-brand-green font-bold hover:gap-3 transition-all text-sm md:text-base whitespace-nowrap">
                                Ver todos <ArrowRight size={20} className="ml-2 md:ml-3" />
                            </Link>
                        </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white h-[450px] rounded-[3rem] animate-pulse shadow-sm"></div>
                            ))}
                        </div>
                    ) : highlightPets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13">
                            {highlightPets.map(pet => (
                                <PetCard key={pet.id} pet={pet} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-34 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <Star size={55} className="text-gray-100 mx-auto mb-8" />
                            <p className="text-gray-400 font-medium text-lg">No momento não temos animais em destaque.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Histórias que Inspiram (Happy Endings) */}
            {highlightStories.length > 0 && (
                <section className="py-21 bg-brand-green/5 overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-21">
                            <span className="text-brand-green font-black tracking-[0.2em] uppercase text-[10px]">Histórias que Inspiram</span>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-800 font-merriweather mt-3">Finais Felizes</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {highlightStories.map((story) => (
                                <Card key={story.id} className="group overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white hover:scale-[1.02] transition-all duration-500">
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={story.image}
                                            alt={story.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                                        <div className="absolute bottom-4 left-6">
                                            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
                                                <Heart size={20} className="text-pink-500 fill-pink-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 pt-4">
                                        <h3 className="text-xl font-black text-gray-800 mb-4 leading-tight group-hover:text-brand-green transition-colors">{story.title}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-3 mb-6 font-light">{story.excerpt}</p>
                                        <Link
                                            to={`/noticias/${story.id}`}
                                            className="inline-flex items-center gap-2 text-brand-green font-black uppercase text-[10px] tracking-widest hover:gap-4 transition-all"
                                        >
                                            Ler história completa <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section (Refined: Centered & Compact) */}
            <section className="py-21 bg-white">
                <div className="container mx-auto px-6">
                    <Card className="bg-brand-acqua text-white overflow-hidden p-8 md:p-13 lg:p-21 border-none rounded-[3.5rem] shadow-3xl shadow-brand-acqua/30 ring-1 ring-white/20 max-w-4xl mx-auto text-center">
                        <div className="flex flex-col items-center">
                            <h2 className="text-3xl md:text-5xl font-black font-merriweather mb-8 leading-tight">
                                Não pode adotar agora? <br />
                                <span className="text-white/60 italic font-light">Você ainda pode ajudar!</span>
                            </h2>
                            <p className="text-teal-50 mb-13 text-lg leading-relaxed max-w-2xl opacity-90 font-light">
                                Doações de qualquer valor e o seu tempo como voluntário fazem toda a diferença na vida dos nossos animais.
                            </p>
                            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-5 w-full">
                                <Button
                                    variant="primary"
                                    className="bg-white text-brand-acqua hover:scale-105 transition-transform py-6 px-13 rounded-2xl shadow-xl shadow-black/10 font-bold"
                                    onClick={() => navigate('/doacoes')}
                                >
                                    Fazer uma Doação
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-white/40 text-white hover:bg-white/10 py-6 px-13 rounded-2xl font-bold"
                                    onClick={() => navigate('/voluntariado')}
                                >
                                    Ser Voluntário
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-white hover:bg-white/10 py-5 px-8 flex items-center justify-center gap-3 border border-dashed border-white/30 rounded-2xl w-full sm:w-auto"
                                    onClick={() => navigate('/lar-temporario')}
                                >
                                    <Home size={18} />
                                    <span>Ser Lar Temporário</span>
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>
            {/* Parceiros (RF-007) */}
            {flags.partners && partners.length > 0 && (
                <section className="py-16 md:py-20 bg-gray-50 border-t border-gray-100">
                    <div className="container mx-auto px-6 mb-10">
                        <p className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                            Empresas Amigas dos Animais
                        </p>
                    </div>
                    <PartnersCarousel partners={partners} />
                </section>
            )}
        </div>
    );
};

export default HomePage;
