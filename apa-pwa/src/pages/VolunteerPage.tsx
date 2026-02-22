import React from 'react';
import { Users, Heart, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';
import { VolunteerForm } from '../components/VolunteerForm';

const VolunteerPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <SEO
                title="Seja Voluntário | APA Telêmaco Borba"
                description="Doe seu tempo e ajude a transformar a vida de centenas de animais. Conheça nossas áreas de atuação e junte-se à nossa equipe."
            />

            {/* Hero Section */}
            <div className="relative bg-brand-green text-white py-24 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <img
                        src="https://images.unsplash.com/photo-1559839734-2b71f1e3c7e0?q=80&w=1600&auto=format&fit=crop"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest mb-6">Ajuda Humanitária</span>
                    <h1 className="text-5xl md:text-7xl font-bold font-merriweather mb-6">Mãos que <span className="text-brand-acqua italic">Protegem</span></h1>
                    <p className="text-xl text-green-100 max-w-2xl mx-auto font-light leading-relaxed">
                        O trabalho voluntário é o coração da nossa ONG. Cada hora doada é um passo a mais rumo à dignidade animal.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-21 relative z-20">
                {/* Impact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-13 mb-34">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-none hover:-translate-y-2 transition-transform duration-500">
                        <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center mb-6">
                            <Heart size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4 font-merriweather">Amor em Ação</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Desde passeios matinais até o carinho individual, você leva alegria para animais que esperam um lar.
                        </p>
                    </div>
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-none hover:-translate-y-2 transition-transform duration-500">
                        <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center mb-6">
                            <Star size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4 font-merriweather">Faça a Diferença</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Sua presença reduz o estresse do confinamento e ajuda na socialização dos animais resgatados.
                        </p>
                    </div>
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-none hover:-translate-y-2 transition-transform duration-500">
                        <div className="w-16 h-16 bg-brand-acqua/10 text-brand-acqua rounded-2xl flex items-center justify-center mb-6">
                            <Users size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4 font-merriweather">Comunidade Viva</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Trabalhe ao lado de pessoas que compartilham o mesmo propósito e amor incondicional.
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-24 px-4">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold text-brand-green mb-6 font-merriweather leading-tight">Como você pode nos ajudar?</h2>
                            <p className="text-gray-600 text-lg leading-relaxed italic">
                                "Não é preciso ser especialista em animais, basta ter disposição e um coração aberto."
                            </p>
                        </div>
                        <div className="space-y-4">
                            {[
                                'Auxílio na limpeza e organização das baias',
                                'Passeios recreativos e banhos nos doguinhos',
                                'Apoio em feiras de adoção e eventos da ONG',
                                'Social mídia, fotos e divulgação dos animais',
                                'Manutenção geral da sede (pintura, pequenos reparos)'
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-gray-700 font-medium">
                                    <CheckCircle2 className="text-brand-green shrink-0" size={20} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <img
                            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop"
                            className="rounded-3xl shadow-lg h-64 w-full object-cover mt-8"
                            alt="Voluntariado"
                        />
                        <img
                            src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=800&auto=format&fit=crop"
                            className="rounded-3xl shadow-lg h-64 w-full object-cover"
                            alt="Adoção"
                        />
                    </div>
                </div>

                {/* Form Section */}
                <div className="max-w-4xl mx-auto pt-20 border-t border-gray-100">
                    <div className="text-center mb-12">
                        <Sparkles className="text-brand-orange mx-auto mb-4" size={32} />
                        <h2 className="text-4xl font-bold text-gray-800 font-merriweather mb-4">Pronto para começar?</h2>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Preencha o formulário abaixo e entraremos em contato para agendar uma visita.
                        </p>
                    </div>
                    <VolunteerForm />
                </div>
            </div>
        </div>
    );
};

export default VolunteerPage;
