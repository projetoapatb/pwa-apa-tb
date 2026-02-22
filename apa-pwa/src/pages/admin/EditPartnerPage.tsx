import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react';

const partnerSchema = z.object({
    name: z.string().min(2, 'Nome é obrigatório'),
    logo: z.string().min(5, 'URL do logo é obrigatória'),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    description: z.string().optional(),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

const EditPartnerPage: React.FC = () => {
    const { id } = useParams();
    const isNew = !id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
        resolver: zodResolver(partnerSchema),
        defaultValues: {
            isActive: true,
            order: 0,
            website: '',
            description: ''
        }
    });

    const currentLogo = watch('logo');

    useEffect(() => {
        if (!isNew && id) {
            const fetchPartner = async () => {
                const docSnap = await getDoc(doc(db, 'partners', id));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    (Object.keys(partnerSchema.shape) as Array<keyof PartnerFormData>).forEach(key => {
                        setValue(key, data[key] as any);
                    });
                }
                setLoading(false);
            };
            fetchPartner();
        }
    }, [id, isNew, setValue]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setUploading(true);
            try {
                const file = e.target.files[0];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'apa_uploads');

                const response = await fetch(`https://api.cloudinary.com/v1_1/dpxv3wmks/image/upload`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                setValue('logo', data.secure_url);
            } catch (error) {
                console.error(error);
                alert("Erro no upload");
            } finally {
                setUploading(false);
            }
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                website: data.website || '',
                description: data.description || '',
                updatedAt: serverTimestamp(),
            };

            if (isNew) {
                await addDoc(collection(db, 'partners'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });
            } else {
                await updateDoc(doc(db, 'partners', id), payload);
            }
            navigate('/admin/parceiros');
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center">Carregando formulário...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button onClick={() => navigate('/admin/parceiros')} className="flex items-center text-sm text-gray-500 hover:text-brand-green">
                <ArrowLeft size={16} className="mr-2" /> Voltar
            </button>

            <h2 className="text-2xl font-bold text-gray-800">{isNew ? 'Novo Parceiro' : 'Editar Parceiro'}</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="p-8 space-y-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-32 h-32 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                            {currentLogo ? (
                                <img src={currentLogo} className="w-full h-full object-contain p-2" alt="Logo preview" />
                            ) : (
                                <ImageIcon size={40} className="text-gray-300" />
                            )}
                            <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload size={20} />
                                <span className="text-[10px] font-bold mt-1">Trocar Logo</span>
                                <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                            </label>
                            {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="animate-spin h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full" /></div>}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Resolução recomendada: PNG Transparente</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Empresa</label>
                            <input {...register('name')} className="form-input-premium w-full" placeholder="Ex: PetShop Sorriso" />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{(errors.name.message as string)}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Website (Opcional)</label>
                            <input {...register('website')} className="form-input-premium w-full" placeholder="https://..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ordem de Exibição</label>
                                <input {...register('order', { valueAsNumber: true })} type="number" className="form-input-premium w-full" />
                            </div>
                            <div className="flex flex-col justify-end">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                                    <input type="checkbox" {...register('isActive')} className="w-5 h-5 accent-brand-green" />
                                    <span className="text-xs font-bold text-gray-600 uppercase">Parceiro Ativo</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Pequena Descrição (Opcional)</label>
                            <textarea {...register('description')} rows={3} className="form-input-premium w-full resize-none" />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full py-4 gap-2" isLoading={saving}>
                            <Save size={20} /> Salvar Parceiro
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};

export default EditPartnerPage;
