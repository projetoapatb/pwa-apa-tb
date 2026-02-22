import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Pet } from '../types';
import { PetCard } from '../components/PetCard';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';
import { Filter } from 'lucide-react';

const AdoptionPage: React.FC = () => {
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSize, setFilterSize] = useState<string | 'TODOS'>('TODOS');
    const [filterSpecies, setFilterSpecies] = useState<string | 'TODOS'>('TODOS');
    const [filterAge, setFilterAge] = useState<string | 'TODOS'>('TODOS');

    useEffect(() => {
        setLoading(true);
        // Query base: apenas pets disponíveis e aprovados, ordenados por data
        const petsRef = collection(db, 'pets');
        let q = query(
            petsRef,
            where('status', '==', 'disponível'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const petsData = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Pet[];

            // Ordenação local: sortOrder (asc) > createdAt (desc)
            petsData.sort((a, b) => {
                const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;

                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;
                return dateB - dateA;
            });

            setPets(petsData);
            setLoading(false);
        }, (error) => {

            console.error("Erro ao buscar animais:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredPets = pets.filter(pet => {
        const matchesSize = filterSize === 'TODOS' || pet.size === filterSize;
        const matchesSpecies = filterSpecies === 'TODOS' || pet.species === filterSpecies;

        // Filtro de Idade Simples (Filhote < 2, Sênior > 8)
        let matchesAge = true;
        if (filterAge !== 'TODOS') {
            const ageNum = typeof pet.age === 'number' ? pet.age : parseInt(pet.age as string) || 0;
            if (filterAge === 'FILHOTE') matchesAge = ageNum < 2;
            else if (filterAge === 'ADULTO') matchesAge = ageNum >= 2 && ageNum <= 8;
            else if (filterAge === 'SENIOR') matchesAge = ageNum > 8;
        }

        return matchesSize && matchesSpecies && matchesAge;
    });

    const sizes = ['TODOS', 'P', 'M', 'G'];

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <SEO
                title="Conheça Nossos Animais | APA Telêmaco Borba"
                description="Temos muitos amigos esperando por um lar amoroso. Filtre por porte e encontre seu novo companheiro."
            />
            {/* Header / Search Area */}
            <div className="bg-brand-green text-white pt-21 pb-34 px-8">
                <div className="container mx-auto text-center max-w-3xl">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-merriweather mb-8 leading-tight">Encontre seu novo amigo</h1>
                    <p className="text-green-50 mb-13 text-xl font-light opacity-90 leading-relaxed">
                        Temos muitos cães e gatos esperando por um lar cheio de amor. Use os filtros para encontrar o companheiro ideal.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-6 -mt-12">
                {/* Filters Row */}
                <div className="bg-white p-4 rounded-3xl shadow-lg mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Espécie:</span>
                            <div className="flex gap-1.5">
                                {['TODOS', 'Cachorro', 'Gato'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterSpecies(s)}
                                        className={`px-3 py-1.5 rounded-xl border-2 transition-all font-bold text-xs whitespace-nowrap ${filterSpecies === s
                                            ? 'bg-brand-orange border-brand-orange text-white shadow-sm'
                                            : 'border-gray-50 text-gray-400 hover:border-brand-orange/30'
                                            }`}
                                    >
                                        {s === 'TODOS' ? 'Todos' : s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-8 bg-gray-100 hidden md:block"></div>

                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Porte:</span>
                            <div className="flex gap-1.5">
                                {sizes.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterSize(s)}
                                        className={`px-3 py-1.5 rounded-xl border-2 transition-all font-bold text-xs whitespace-nowrap ${filterSize === s
                                            ? 'bg-brand-green border-brand-green text-white shadow-sm'
                                            : 'border-gray-50 text-gray-400 hover:border-brand-green/30'
                                            }`}
                                    >
                                        {s === 'TODOS' ? 'Todos' : s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-8 bg-gray-100 hidden md:block"></div>

                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Idade:</span>
                            <div className="flex gap-1.5">
                                {['TODOS', 'FILHOTE', 'ADULTO', 'SENIOR'].map((age) => (
                                    <button
                                        key={age}
                                        onClick={() => setFilterAge(age)}
                                        className={`px-3 py-1.5 rounded-xl border-2 transition-all font-bold text-xs whitespace-nowrap ${filterAge === age
                                            ? 'bg-brand-orange border-brand-orange text-white shadow-sm'
                                            : 'border-gray-50 text-gray-400 hover:border-brand-orange/30'
                                            }`}
                                    >
                                        {age === 'TODOS' ? 'Todas' : age.charAt(0) + age.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-400 font-medium">
                        Mostrando <span className="text-brand-green font-bold">{filteredPets.length}</span> amiguinhos
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-3xl h-[450px] animate-pulse border border-gray-100">
                                <div className="h-2/3 bg-gray-100 rounded-t-3xl mb-4"></div>
                                <div className="px-6 space-y-3">
                                    <div className="h-4 bg-gray-100 w-1/2 rounded"></div>
                                    <div className="h-4 bg-gray-100 w-full rounded"></div>
                                    <div className="h-10 bg-gray-100 w-full rounded-xl mt-6"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredPets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredPets.map(pet => (
                            <PetCard key={pet.id} pet={pet} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Filter size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">Nenhum animal encontrado</h3>
                        <p className="text-gray-500 mt-2">Tente mudar os filtros.</p>
                        <Button
                            variant="outline"
                            className="mt-6"
                            onClick={() => { setFilterSize('TODOS'); setFilterSpecies('TODOS'); setFilterAge('TODOS'); }}
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                )}
            </div>
        </main >
    );
};

export default AdoptionPage;
