import React, { useState, useEffect } from 'react';
import { Heart, Landmark, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { GlobalSettings } from '../types';
import SEO from '../components/SEO';

const DonationPage: React.FC = () => {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'config', 'general'));
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as GlobalSettings);
                }
            } catch (error) {
                console.error("Erro ao carregar doações:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleCopyPix = () => {
        if (settings?.pixKey) {
            navigator.clipboard.writeText(settings.pixKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-brand-green font-bold">Carregando formas de ajudar...</div>;

    return (
        <main className="container mx-auto p-12 mt-10 animate-fade-in">
            <SEO
                title="Como Nos Ajudar | APA Telêmaco Borba"
                description="Sua doação salva vidas. Veja como contribuir via PIX ou doando itens prioritários de limpeza e alimentação."
            />
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-16">
                    <span className="text-brand-orange font-bold tracking-widest uppercase text-sm">Sua Ajuda é Vital</span>
                    <h1 className="text-4xl md:text-5xl font-bold text-brand-green mt-4">Como nos ajudar</h1>
                    <p className="text-gray-600 mt-6 text-lg max-w-2xl mx-auto italic">
                        "O amor pelos animais é o que nos move, o seu apoio é o que nos sustenta."
                    </p>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Opção PIX */}
                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                        <div className="bg-brand-green/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-8">
                            <Landmark className="text-brand-green" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Doação via PIX</h2>
                        <p className="text-gray-500 mt-4 leading-relaxed">
                            Forma mais rápida de nos ajudar a pagar contas de clínicas e comprar comida.
                        </p>
                        <div
                            onClick={handleCopyPix}
                            className="mt-8 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 w-full group cursor-pointer hover:border-brand-green transition-all relative overflow-hidden"
                        >
                            <span className="text-xs uppercase font-bold text-gray-400 block mb-2">Chave PIX (Clique para copiar)</span>
                            <code className="text-brand-green font-bold text-lg break-all">
                                {settings?.pixKey || 'financeiro@patas.org.br'}
                            </code>
                            {copied && (
                                <div className="absolute inset-0 bg-brand-green text-white flex items-center justify-center font-bold gap-2 animate-fade-in">
                                    <Check size={20} /> Copiado!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Itens Prioritários */}
                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                        <div className="bg-brand-orange/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-8">
                            <Heart className="text-brand-orange" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Itens Prioritários</h2>
                        <p className="text-gray-500 mt-4 leading-relaxed">
                            Também aceitamos doações de ração (adulto e filhote) e produtos de limpeza.
                        </p>
                        <ul className="mt-8 text-left space-y-3 w-full">
                            {(settings?.donationItems || ['Ração para adultos', 'Ração para filhotes', 'Produtos de limpeza']).map((item, i) => (
                                <li key={i} className="flex items-center space-x-3 text-gray-700">
                                    <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default DonationPage;
