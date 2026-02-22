import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, Save, Upload, Image as ImageIcon, Calendar } from 'lucide-react';

const postSchema = z.object({
    title: z.string().min(5, 'Título muito curto'),
    content: z.string().min(20, 'Conteúdo muito curto'),
    excerpt: z.string().min(10, 'Resumo muito curto'),
    image: z.string().min(5, 'URL da imagem é obrigatória'),
    category: z.enum(['notícia', 'resultado', 'evento', 'história']),
    author: z.string().min(2, 'Autor é obrigatório'),
    isActive: z.boolean().default(true),
    publishDate: z.any().optional(),
});

const EditPostPage: React.FC = () => {
    const { id } = useParams();
    const isNew = !id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            isActive: true,
            category: 'notícia',
            publishDate: new Date().toISOString().split('T')[0]
        }
    });

    const currentImage = watch('image');

    useEffect(() => {
        if (!isNew && id) {
            const fetchPost = async () => {
                const docSnap = await getDoc(doc(db, 'posts', id));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    (Object.keys(postSchema.shape) as Array<string>).forEach(key => {
                        let val = data[key];
                        if (key === 'publishDate' && val?.toDate) {
                            val = val.toDate().toISOString().split('T')[0];
                        }
                        setValue(key, val);
                    });
                }
                setLoading(false);
            };
            fetchPost();
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
                setValue('image', data.secure_url);
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
                publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
                updatedAt: serverTimestamp(),
            };

            if (isNew) {
                await addDoc(collection(db, 'posts'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });
            } else {
                await updateDoc(doc(db, 'posts', id), payload);
            }
            navigate('/admin/noticias');
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center">Carregando formulário...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => navigate('/admin/noticias')} className="flex items-center text-sm text-gray-500 hover:text-brand-green">
                <ArrowLeft size={16} className="mr-2" /> Voltar
            </button>

            <h2 className="text-2xl font-bold text-gray-800">{isNew ? 'Nova Postagem' : 'Editar Postagem'}</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título da Postagem</label>
                            <input {...register('title')} className="form-input-premium w-full text-lg font-bold" placeholder="Ex: Grande Mutirão de Adoção" />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{(errors.title.message as string)}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Resumo Chamativo (Excerpt)</label>
                            <textarea {...register('excerpt')} rows={2} className="form-input-premium w-full resize-none" placeholder="Uma frase curta que aparece na lista..." />
                            {errors.excerpt && <p className="text-xs text-red-500 mt-1">{(errors.excerpt.message as string)}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Conteúdo Completo</label>
                            <textarea {...register('content')} rows={12} className="form-input-premium w-full resize-none" placeholder="Escreva aqui todo o detalhamento da notícia..." />
                            {errors.content && <p className="text-xs text-red-500 mt-1">{(errors.content.message as string)}</p>}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Imagem de Capa</label>
                            <div className="aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                                {currentImage ? (
                                    <img src={currentImage} className="w-full h-full object-cover" alt="Cover preview" />
                                ) : (
                                    <ImageIcon size={32} className="text-gray-300" />
                                )}
                                <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload size={20} />
                                    <span className="text-[10px] font-bold mt-1">Trocar Capa</span>
                                    <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                                </label>
                                {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="animate-spin h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full" /></div>}
                            </div>
                            {errors.image && <p className="text-[10px] text-red-400 mt-2 font-bold uppercase whitespace-nowrap overflow-hidden text-ellipsis">⚠️ {(errors.image.message as string)}</p>}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Categoria</label>
                                <select {...register('category')} className="form-input-premium w-full appearance-none">
                                    <option value="notícia">Notícia</option>
                                    <option value="resultado">Resultado de Evento</option>
                                    <option value="evento">Próximo Evento</option>
                                    <option value="história">História de Sucesso</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Data de Publicação</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="date" {...register('publishDate')} className="form-input-premium w-full pl-12" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Autor</label>
                                <input {...register('author')} className="form-input-premium w-full" placeholder="Ex: Equipe APA" />
                                {errors.author && <p className="text-[10px] text-red-500 mt-1 font-bold">{(errors.author.message as string)}</p>}
                            </div>

                            <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                                <input type="checkbox" {...register('isActive')} className="w-5 h-5 accent-brand-green" />
                                <span className="text-xs font-bold text-gray-600 uppercase">Publicar agora</span>
                            </label>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button type="submit" className="w-full py-4 gap-2" isLoading={saving}>
                                <Save size={20} /> Salvar Postagem
                            </Button>
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default EditPostPage;
