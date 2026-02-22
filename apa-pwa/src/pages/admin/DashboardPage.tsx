import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import type { Pet } from '../../types';
import { Card } from '../../components/ui/Card';
import {
    Heart,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Dog,
    Cat,
    Filter,
    Home
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        available: 0,
        adopted: 0,
        dogs: 0,
        cats: 0,
        leads: 0,
        lostPending: 0,
        volunteersPending: 0,
        ltPending: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // Monitorar Pets
        const qPets = query(collection(db, 'pets'));
        const unsubscribePets = onSnapshot(qPets, (snap) => {
            if (!isMounted) return;
            const petsData = snap.docs.map(doc => doc.data() as Pet);

            setStats(prev => ({
                ...prev,
                total: petsData.length,
                pending: petsData.filter(p => p.status === 'pendente').length,
                available: petsData.filter(p => p.status === 'disponível').length,
                adopted: petsData.filter(p => p.status === 'adotado').length,
                dogs: petsData.filter(p => p.species === 'Cachorro').length,
                cats: petsData.filter(p => p.species === 'Gato').length,
            }));
            setLoading(false);
        });

        // Monitorar Leads (Interessados)
        const qLeads = query(collection(db, 'leads_adoption'));
        const unsubscribeLeads = onSnapshot(qLeads, (snapLeads) => {
            if (!isMounted) return;
            const leadsCount = snapLeads.docs.filter(d => d.data().status !== 'contacted').length;
            setStats(prev => ({ ...prev, leads: leadsCount }));
        });

        // Monitorar Perdidos Pendentes
        const qLost = query(collection(db, 'lost_pets'));
        const unsubscribeLost = onSnapshot(qLost, (snapLost) => {
            if (!isMounted) return;
            const lostCount = snapLost.docs.filter(d => d.data().moderationStatus === 'pending').length;
            setStats(prev => ({ ...prev, lostPending: lostCount }));
        });

        // Leads de Voluntariado
        const unsubVolunteers = onSnapshot(collection(db, 'leads_volunteer'), (snap) => {
            if (!isMounted) return;
            setStats(prev => ({
                ...prev,
                volunteersPending: snap.docs.filter(d => d.data().status === 'pending').length
            }));
        });

        // Leads de Lar Temporário
        const unsubLT = onSnapshot(collection(db, 'leads_lt'), (snap) => {
            if (!isMounted) return;
            setStats(prev => ({
                ...prev,
                ltPending: snap.docs.filter(d => d.data().status === 'pending').length
            }));
        });

        return () => {
            isMounted = false;
            unsubscribePets();
            unsubscribeLeads();
            unsubscribeLost();
            unsubVolunteers();
            unsubLT();
        };
    }, []);

    const cards = [
        { title: 'Novos Interessados', value: stats.leads, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', link: '/admin/leads', highlight: stats.leads > 0 },
        { title: 'Perdidos p/ Análise', value: stats.lostPending, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', link: '/admin/perdidos', highlight: stats.lostPending > 0 },
        { title: 'Voluntários', value: stats.volunteersPending, icon: Heart, color: 'text-brand-orange', bg: 'bg-brand-orange/10', link: '/admin/voluntarios', highlight: stats.volunteersPending > 0 },
        { title: 'Lares Temporários', value: stats.ltPending, icon: Home, color: 'text-brand-orange', bg: 'bg-brand-orange/10', link: '/admin/lt', highlight: stats.ltPending > 0 },
        { title: 'Itens de Doação', value: 'Gestão', icon: Heart, color: 'text-brand-green', bg: 'bg-brand-green/10', link: '/admin/geral' },
        { title: 'Pets Pendentes', value: stats.pending, icon: Clock, color: 'text-brand-orange', bg: 'bg-brand-orange/10', link: '/admin/moderacao' },
        { title: 'Animais Disponíveis', value: stats.available, icon: CheckCircle2, color: 'text-brand-acqua', bg: 'bg-brand-acqua/10', link: '/admin/caes' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Boas vindas */}
            <div className="bg-brand-green rounded-3xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold font-merriweather mb-2">Olá, Administrador! 🐾</h2>
                    <p className="text-sm text-green-100 max-w-md opacity-90">
                        O painel está atualizado. Temos {stats.pending} novos pedidos aguardando sua revisão hoje.
                    </p>
                    <div className="mt-6 flex gap-3">
                        <Link to="/admin/moderacao">
                            <button className="bg-white text-brand-green px-5 py-2 rounded-full text-xs font-bold hover:bg-green-50 transition">
                                Ver Moderação
                            </button>
                        </Link>
                        <Link to="/admin/caes">
                            <button className="bg-brand-orange text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-orange-500 transition shadow-lg shadow-orange-900/20">
                                Gerenciar Pets
                            </button>
                        </Link>
                    </div>
                </div>
                {/* Decorativo */}
                <TrendingUp size={140} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
            </div>

            {/* Grid de Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((c, i) => (
                    <Link to={c.link || '#'} key={i}>
                        <Card className={`p-6 border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden ${c.highlight ? 'ring-2 ring-brand-orange/20 bg-gradient-to-br from-white to-orange-50/30' : ''}`}>
                            {c.highlight && (
                                <span className="absolute top-4 right-4 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-orange"></span>
                                </span>
                            )}
                            <div className="flex items-center gap-4">
                                <div className={`${c.bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                                    <c.icon className={c.color} size={20} />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{c.title}</p>
                                    <h3 className="text-2xl font-black text-gray-800 mt-0.5">{c.value}</h3>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Detalhamento por Espécie e Links Rápidos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Card Espécie */}
                <Card className="lg:col-span-1 p-8">
                    <h4 className="font-bold text-gray-800 mb-6 flex items-center">
                        <Filter size={18} className="mr-2 text-brand-orange" /> Por Espécie
                    </h4>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg"><Dog size={20} className="text-gray-500" /></div>
                                <span className="font-bold text-gray-700">Cachorros</span>
                            </div>
                            <span className="text-xl font-black text-brand-green">{stats.dogs}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-brand-green h-full rounded-full transition-all duration-1000"
                                style={{ width: `${(stats.dogs / stats.total) * 100}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg"><Cat size={20} className="text-gray-500" /></div>
                                <span className="font-bold text-gray-700">Gatos</span>
                            </div>
                            <span className="text-xl font-black text-brand-acqua">{stats.cats}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-brand-acqua h-full rounded-full transition-all duration-1000"
                                style={{ width: `${(stats.cats / stats.total) * 100}%` }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Card do Mural de Perdidos (Atalho rápido) */}
                <Card className="lg:col-span-2 p-8 flex flex-col justify-center bg-white border-none shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="bg-red-50 p-5 rounded-[1.5rem] text-red-500">
                            <AlertCircle size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-gray-800 font-merriweather">Mural de Perdidos</h4>
                            <p className="text-sm text-gray-500 mb-4 leading-relaxed">Gerencie os anúncios de animais perdidos e encontrados que aguardam aprovação.</p>
                            <Link to="/admin/perdidos">
                                <button className="bg-brand-orange text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-orange-900/20 hover:scale-105 transition-transform">
                                    Ver Pendentes ({stats.lostPending})
                                </button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
