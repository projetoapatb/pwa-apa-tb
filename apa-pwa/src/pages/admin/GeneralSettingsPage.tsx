import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
    Save,
    Smartphone,
    Mail,
    MapPin,
    Instagram,
    Facebook,
    Plus,
    Trash2,
    Key,
    Info
} from 'lucide-react';
import { maskPhone, validatePhone } from '../../utils/masks';


const settingsSchema = z.object({
    pixKey: z.string().min(5, 'Chave PIX muito curta'),
    contactPhone: z.string().refine(validatePhone, 'Telefone deve ter 11 dígitos com DDD'),
    contactEmail: z.string().email('Email inválido'),
    address: z.string().min(10, 'Endereço muito curto'),
    socialInstagram: z.string().optional(),
    socialFacebook: z.string().optional(),
    donationItems: z.array(z.string()).min(1, 'Adicione pelo menos um item'),
});


type SettingsFormData = z.infer<typeof settingsSchema>;

const GeneralSettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newItem, setNewItem] = useState('');

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            donationItems: []
        }
    });

    const donationItems = watch('donationItems') || [];

    useEffect(() => {
        const fetchSettings = async () => {
            const docSnap = await getDoc(doc(db, 'config', 'general'));
            if (docSnap.exists()) {
                const data = docSnap.data();
                Object.keys(settingsSchema.shape).forEach(key => {
                    let value = data[key];
                    if (key === 'contactPhone') value = maskPhone(value || '');
                    setValue(key as keyof SettingsFormData, value);
                });
            }
            setLoading(false);
        };

        fetchSettings();
    }, [setValue]);

    const addItem = () => {
        if (newItem.trim()) {
            setValue('donationItems', [...donationItems, newItem.trim()]);
            setNewItem('');
        }
    };

    const removeItem = (index: number) => {
        setValue('donationItems', donationItems.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: SettingsFormData) => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'config', 'general'), {
                ...data,
                updatedAt: serverTimestamp(),
            });
            alert("Configurações salvas com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar configurações");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Carregando configurações...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-gray-800">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black font-merriweather text-gray-800">Configurações Gerais</h2>
                    <p className="text-sm text-gray-400 font-medium">Dados de contato, redes sociais e doações.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Contatos e Pix */}
                    <div className="space-y-8">
                        <Card className="p-8 border-none shadow-sm space-y-6">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Key size={18} className="text-brand-orange" /> Dados de Recebimento
                            </h3>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chave PIX da ONG</label>
                                <div className="relative">
                                    <input {...register('pixKey')} className="form-input-premium w-full pl-4" placeholder="financeiro@ong.org.br" />
                                </div>
                                {errors.pixKey && <p className="text-xs text-red-500 mt-1">{errors.pixKey.message}</p>}
                            </div>
                        </Card>

                        <Card className="p-8 border-none shadow-sm space-y-6">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Info size={18} className="text-brand-green" /> Informações da ONG
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Telefone de Contato</label>
                                    <div className="flex items-center gap-3">
                                        <Smartphone size={18} className="text-gray-300" />
                                        <input
                                            {...register('contactPhone')}
                                            className="form-input-premium w-full"
                                            placeholder="(42) 99999-9999"
                                            onChange={(e) => {
                                                const masked = maskPhone(e.target.value);
                                                setValue('contactPhone', masked, { shouldValidate: true });
                                            }}
                                        />
                                    </div>
                                    {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone.message}</p>}

                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">E-mail Público</label>
                                    <div className="flex items-center gap-3">
                                        <Mail size={18} className="text-gray-300" />
                                        <input {...register('contactEmail')} className="form-input-premium w-full" placeholder="contato@ong.org.br" />
                                    </div>
                                    {errors.contactEmail && <p className="text-xs text-red-500 mt-1">{errors.contactEmail.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Endereço / Sede</label>
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-gray-300 mt-3" />
                                        <textarea {...register('address')} rows={2} className="form-input-premium w-full resize-none" placeholder="Rua exemplo, 123 - Telêmaco Borba" />
                                    </div>
                                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 border-none shadow-sm space-y-6">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Instagram size={18} className="text-pink-600" /> Redes Sociais
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Instagram size={18} className="text-gray-300" />
                                    <input {...register('socialInstagram')} className="form-input-premium w-full" placeholder="@apatb" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Facebook size={18} className="text-gray-300" />
                                    <input {...register('socialFacebook')} className="form-input-premium w-full" placeholder="apa.telemacoborba" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Itens de Doação */}
                    <Card className="p-8 border-none shadow-sm flex flex-col h-fit">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                            <Plus size={18} className="text-brand-orange" /> Itens Prioritários (Doações)
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">Estes itens aparecerão na página de doações como necessidades urgentes.</p>

                        <div className="flex gap-2 mb-6">
                            <input
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                className="form-input-premium w-full"
                                placeholder="Ex: Ração filhote"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                            />
                            <Button type="button" onClick={addItem} size="sm" className="bg-brand-green">
                                <Plus size={20} />
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                            {donationItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:border-brand-green/30 transition-colors">
                                    <span className="text-sm font-medium text-gray-700">{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {donationItems.length === 0 && (
                                <div className="text-center py-10 text-gray-300 italic text-sm border-2 border-dashed border-gray-50 rounded-2xl">
                                    Adicione itens de necessidade básica.
                                </div>
                            )}
                        </div>
                        {errors.donationItems && <p className="text-xs text-red-500 mt-2">{errors.donationItems.message}</p>}

                        <div className="mt-12 pt-8 border-t border-gray-50">
                            <Button type="submit" isLoading={saving} className="w-full py-4 gap-2 shadow-lg shadow-brand-green/20">
                                <Save size={20} /> Salvar Tudo
                            </Button>
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default GeneralSettingsPage;
