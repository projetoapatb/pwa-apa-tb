import React, { useState, useEffect } from 'react';
import { Heart, Landmark, Check, Package, Mail, Info } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { GlobalSettings } from '../types';
import SEO from '../components/SEO';

const DONATION_EMAIL = 'projeto.apa.tb@gmail.com';

const ACCEPTED_ITEMS = [
    'Ração (adulto e filhote)',
    'Sachês',
    'Cobertas',
    'Roupinhas',
    'Caminhas',
    'Casinhas',
    'Coleiras e guias',
    'Potes',
    'Produtos de limpeza',
    'Medicamentos veterinários (dentro da validade)',
];

const DONATION_NOTICES = [
    'Antes de doar medicamentos, confirme com a equipe se eles podem ser recebidos.',
    'Itens usados devem estar limpos e em bom estado.',
    'Rações e medicamentos precisam estar dentro da validade.',
    'A retirada de doações depende da disponibilidade da equipe.',
];

const DonationPage: React.FC = () => {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
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
                setLoadError(true);
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

    const contactMailto = `mailto:${DONATION_EMAIL}?subject=${encodeURIComponent('Doação de itens - APA Telêmaco Borba')}`;

    if (loading) return <div className="p-20 text-center animate-pulse text-brand-green font-bold">Carregando formas de ajudar...</div>;

    return (
        <main className="container mx-auto p-12 mt-10 animate-fade-in">
            <SEO
                title="Como Nos Ajudar | APA Telêmaco Borba"
                description="Sua doação salva vidas. Contribua via PIX ou doe itens como ração, cobertas e produtos de limpeza."
            />
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-16">
                    <span className="text-brand-orange font-bold tracking-widest uppercase text-sm">Sua Ajuda é Vital</span>
                    <h1 className="text-4xl md:text-5xl font-bold text-brand-green mt-4">Como nos ajudar</h1>
                    <p className="text-gray-600 mt-6 text-lg max-w-2xl mx-auto italic">
                        "O amor pelos animais é o que nos move, o seu apoio é o que nos sustenta."
                    </p>
                </header>

                {loadError && (
                    <p className="text-center text-sm text-gray-500 mb-8 bg-orange-50 border border-orange-100 rounded-2xl p-4">
                        Algumas informações de doação não puderam ser carregadas. Tente recarregar a página ou entre em contato com a APA.
                    </p>
                )}

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

                    {/* Doação de itens */}
                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="bg-brand-orange/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
                                <Package className="text-brand-orange" size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Doação de itens</h2>
                            <p className="text-gray-500 mt-4 leading-relaxed">
                                A APA também recebe doações de itens físicos para o cuidado dos animais.
                            </p>
                        </div>

                        {settings?.donationItems && settings.donationItems.length > 0 && (
                            <div className="mb-6 p-4 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl">
                                <p className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-3">Mais necessários no momento</p>
                                <ul className="space-y-2">
                                    {settings.donationItems.map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                                            <div className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Itens que podemos receber</p>
                        <ul className="text-left space-y-2.5 flex-grow">
                            {ACCEPTED_ITEMS.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-brand-orange mt-1.5 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Como entregar */}
                <section className="mt-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-green/10 p-3 rounded-2xl text-brand-green">
                            <Heart size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Como entregar sua doação?</h2>
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-6">
                        Para doar itens físicos, entre em contato com a APA para combinar a melhor forma de entrega ou verificar a possibilidade de retirada. Assim, a equipe consegue orientar sobre os itens mais necessários no momento.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <a
                            href={contactMailto}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-green text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-900/10 hover:bg-green-700 transition-all active:scale-95"
                        >
                            <Mail size={18} />
                            Entrar em contato para doar itens
                        </a>
                        <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                            ou escreva para{' '}
                            <a href={contactMailto} className="text-brand-green font-bold hover:underline ml-1">
                                {DONATION_EMAIL}
                            </a>
                        </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <Info size={14} className="text-brand-orange" />
                            Antes de doar, lembre-se
                        </div>
                        <ul className="space-y-2">
                            {DONATION_NOTICES.map((notice) => (
                                <li key={notice} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                                    <span className="text-brand-orange mt-1">•</span>
                                    {notice}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default DonationPage;
