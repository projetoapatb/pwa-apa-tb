import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User, Phone, Mail, Save, CheckCircle2, Home, MapPin, Users, Heart, Info, Dog } from 'lucide-react';
import SEO from '../components/SEO';
import { maskPhone, validatePhone } from '../utils/masks';


const ProfilePage: React.FC = () => {
    const { profile, updateProfile, loading, user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        phone: '',
        address: '',
        dwellingType: 'casa',
        hasOtherPets: 'nao',
        petDetails: '',
        householdCount: '',
        spaceDescription: '',
        availability: ''
    });

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const maskedValue = maskPhone(e.target.value);
        setFormData({ ...formData, phone: maskedValue });
    };


    useEffect(() => {
        if (profile) {
            setFormData({
                displayName: profile.displayName || '',
                phone: maskPhone(profile.phone || ''),

                address: profile.address || '',
                dwellingType: profile.dwellingType || 'casa',
                hasOtherPets: profile.hasOtherPets || 'nao',
                petDetails: profile.petDetails || '',
                householdCount: profile.householdCount || '',
                spaceDescription: profile.spaceDescription || '',
                availability: profile.availability || ''
            });
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePhone(formData.phone)) {
            alert("Por favor, insira um telefone válido com DDD (11 dígitos). Ex: (42) 99999-9999");
            return;
        }


        setIsSaving(true);
        try {
            await updateProfile(formData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alert("Erro ao salvar alterações. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-brand-green font-bold">Carregando perfil...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
            <SEO
                title="Meu Perfil | APA Telêmaco Borba"
                description="Gerencie suas informações de contato e residência."
            />

            <div className="bg-brand-green text-white py-20 pb-40">
                <div className="container mx-auto px-6">
                    <h1 className="text-4xl font-bold font-merriweather mb-4">Meu Perfil</h1>
                    <p className="text-green-100 max-w-xl opacity-80 leading-relaxed">
                        Mantenha seus dados atualizados para facilitar o contato e agilizar seus pedidos de Lar Temporário.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-24">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-8 md:p-12 border-none shadow-2xl rounded-[3rem] bg-white relative overflow-hidden">
                        {success && (
                            <div className="absolute inset-0 bg-brand-green/95 z-20 flex flex-col items-center justify-center text-white animate-fade-in text-center p-8">
                                <CheckCircle2 size={80} className="mb-6 animate-bounce-in" />
                                <h2 className="text-3xl font-bold">Perfil Atualizado!</h2>
                                <p className="mt-4 text-green-50 text-xl font-medium">Suas alterações foram salvas com sucesso em nossa base de dados.</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-12">
                            {/* SEÇÃO 1: DADOS DE CONTA */}
                            <section className="space-y-8">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="bg-brand-orange/10 p-2 rounded-xl text-brand-orange">
                                        <Mail size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 font-merriweather">Dados de Contato</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">E-mail da Conta</label>
                                        <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 opacity-70">
                                            <Mail size={20} />
                                            <span className="font-bold">{user?.email}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">Nome Completo</label>
                                        <div className="relative group">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-green transition-colors" size={20} />
                                            <input
                                                type="text"
                                                value={formData.displayName}
                                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                                className="w-full pl-15 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-green focus:shadow-lg focus:shadow-green-900/5 transition-all font-bold text-gray-700"
                                                placeholder="Seu nome"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">WhatsApp / Telefone</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-green transition-colors" size={20} />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handlePhoneChange}
                                                className="w-full pl-15 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-green focus:shadow-lg focus:shadow-green-900/5 transition-all font-bold text-gray-700"
                                                placeholder="(42) 99999-9999"
                                                maxLength={15}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SEÇÃO 2: DADOS RESIDENCIAIS (LT) */}
                            <section className="space-y-8">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="bg-brand-green/10 p-2 rounded-xl text-brand-green">
                                        <Home size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 font-merriweather">Informações para Lar Temporário (Opcional)</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">Endereço Residencial</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-green transition-colors" size={20} />
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full pl-15 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-green focus:shadow-lg focus:shadow-green-900/5 transition-all font-bold text-gray-700"
                                                placeholder="Rua, Número, Bairro, Cidade"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">Tipo de Residência</label>
                                        <select
                                            value={formData.dwellingType}
                                            onChange={(e) => setFormData({ ...formData, dwellingType: e.target.value })}
                                            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:border-brand-green transition-all appearance-none"
                                        >
                                            <option value="casa">Casa</option>
                                            <option value="apartamento">Apartamento</option>
                                            <option value="sitio">Sítio/Chácara</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">Pessoas na Casa</label>
                                        <div className="relative group">
                                            <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-green transition-colors" size={20} />
                                            <input
                                                type="text"
                                                value={formData.householdCount}
                                                onChange={(e) => setFormData({ ...formData, householdCount: e.target.value })}
                                                className="w-full pl-15 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-green focus:shadow-lg focus:shadow-green-900/5 transition-all font-bold text-gray-700"
                                                placeholder="Ex: 3 pessoas"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">Possui outros animais?</label>
                                        <select
                                            value={formData.hasOtherPets}
                                            onChange={(e) => setFormData({ ...formData, hasOtherPets: e.target.value })}
                                            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:border-brand-green transition-all appearance-none"
                                        >
                                            <option value="nao">Não possui</option>
                                            <option value="sim">Sim, possuo</option>
                                        </select>
                                    </div>

                                    {formData.hasOtherPets === 'sim' && (
                                        <div className="animate-fade-in">
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">Quais animais?</label>
                                            <div className="relative group">
                                                <Dog className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-green transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    value={formData.petDetails}
                                                    onChange={(e) => setFormData({ ...formData, petDetails: e.target.value })}
                                                    className="w-full pl-15 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-green focus:shadow-lg focus:shadow-green-900/5 transition-all font-bold text-gray-700"
                                                    placeholder="Ex: 2 cães dóceis"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">Sua Disponibilidade</label>
                                        <div className="relative group">
                                            <Heart className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-green transition-colors" size={20} />
                                            <input
                                                type="text"
                                                value={formData.availability}
                                                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                                className="w-full pl-15 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-green focus:shadow-lg focus:shadow-green-900/5 transition-all font-bold text-gray-700"
                                                placeholder="Ex: Período curto ou longo?"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-2 tracking-widest">Descrição do Espaço</label>
                                        <textarea
                                            value={formData.spaceDescription}
                                            onChange={(e) => setFormData({ ...formData, spaceDescription: e.target.value })}
                                            rows={3}
                                            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:border-brand-green transition-all resize-none"
                                            placeholder="Ex: Quintal grande e murado, casa segura, sacada telada..."
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="bg-brand-orange/5 p-6 rounded-3xl border border-brand-orange/20 flex items-start gap-4">
                                <Info size={24} className="text-brand-orange flex-shrink-0" />
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    <strong>Nota:</strong> Preencher os dados residenciais acima facilitará o processo quando você se candidatar a um **Lar Temporário**. Você não precisará preencher tudo novamente!
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-6 rounded-[2rem] shadow-2xl shadow-green-900/20 text-xl gap-3"
                                isLoading={isSaving}
                            >
                                <Save size={24} />
                                Salvar Alterações
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
