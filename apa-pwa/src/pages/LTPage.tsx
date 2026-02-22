import React from 'react';
import { LTForm } from '../components/LTForm';
import SEO from '../components/SEO';
import { Heart, ShieldCheck, Clock, Home, CheckCircle2 } from 'lucide-react';

const LTPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <SEO
                title="Ser Lar Temporário | APA Telêmaco Borba"
                description="Seja um Lar Temporário e ajude a salvar vidas. Ofereça um teto amigo para animais que aguardam adoção."
            />

            {/* Hero Section */}
            <div className="bg-brand-green text-white py-24 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <img
                        src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1600&auto=format&fit=crop"
                        alt="Cat Ado"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest mb-6">Acolhimento Amigo</span>
                    <h1 className="text-5xl md:text-7xl font-bold font-merriweather mb-6">Ser Lar <span className="text-brand-acqua italic">Temporário</span></h1>
                    <p className="text-xl text-green-100 max-w-2xl mx-auto font-light leading-relaxed">
                        Muitos animais precisam de um teto e carinho enquanto aguardam sua família definitiva. Você pode ser a ponte para um novo começo.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-21 relative z-20">
                {/* Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-13 mb-34">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center hover:scale-105 transition-all duration-500 border-none">
                        <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Heart size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3 font-merriweather">Amor sem Limites</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Ofereça carinho e socialização para animais que sofreram traumas ou abandono.
                        </p>
                    </div>
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center hover:scale-105 transition-all duration-500 border-none">
                        <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3 font-merriweather">Apoio da ONG</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Nós fornecemos orientação e suporte para garantir o bem-estar do animal e da sua família.
                        </p>
                    </div>
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center hover:scale-105 transition-all duration-500 border-none">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3 font-merriweather">Tempo Flexível</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Você define por quanto tempo pode hospedar. Cada dia de teto seguro é uma vitória.
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-24 lg:px-12">
                    <div className="relative">
                        <img
                            src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop"
                            className="rounded-[3rem] shadow-2xl w-full h-[500px] object-cover"
                            alt="Cão em casa"
                        />
                        <div className="absolute -bottom-6 -right-6 bg-brand-orange text-white p-8 rounded-[2rem] shadow-xl hidden md:block max-w-[240px]">
                            <p className="text-sm font-bold leading-tight">
                                "Ser LT foi a melhor experiência da minha vida. Ver a evolução do Thor não tem preço."
                            </p>
                            <p className="text-xs mt-4 opacity-70 font-black uppercase tracking-widest">— Maria Silva</p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold text-brand-green mb-6 font-merriweather leading-tight">O que é ser um Lar Temporário?</h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Ser um Lar Temporário (LT) é acolher um animal da ONG em sua casa até que ele seja adotado. É a chance dele viver em um ambiente familiar e receber carinho, o que facilita muito a adoção definitiva.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {[
                                'Ter um espaço seguro e cercado',
                                'Dedicar tempo para cuidados básicos e carinho',
                                'Enviar fotos e vídeos para ajudar na divulgação',
                                'Seguir as orientações de saúde da nossa equipe',
                                'O coração transbordando de gratidão'
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-gray-700 font-medium">
                                    <CheckCircle2 className="text-brand-acqua shrink-0" size={20} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div id="cadastro-lt" className="max-w-5xl mx-auto pt-20 border-t border-gray-100">
                    <div className="text-center mb-16">
                        <Home className="text-brand-green mx-auto mb-4" size={32} />
                        <h2 className="text-4xl font-bold text-gray-800 font-merriweather mb-4">Abra sua casa para um amigo</h2>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Candidate-se para ser um LT e nossa equipe entrará em contato.
                        </p>
                    </div>
                    <LTForm />
                </div>
            </div>
        </div>
    );
};

export default LTPage;
