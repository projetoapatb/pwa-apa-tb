import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Post } from '../types';
import { ArrowLeft, Calendar, User, Share2, Facebook, MessageCircle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import SEO from '../components/SEO';

const PostDetailPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchPost = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'posts', id));
                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() } as Post);
                } else {
                    navigate('/noticias');
                }
            } catch (error) {
                console.error("Erro ao buscar post:", error);
                navigate('/noticias');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id, navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
        </div>
    );

    if (!post) return null;

    const formattedDate = post.publishDate?.toDate
        ? post.publishDate.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date(post.publishDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const shareUrl = window.location.href;
    const shareText = `Confira esta história da APA: ${post.title}`;

    return (
        <div className="bg-white min-h-screen pb-20">
            <SEO
                title={`${post.title} | APA Telêmaco Borba`}
                description={post.excerpt}
                image={post.image}
            />

            {/* Cabeçalho de Navegação */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/noticias')}
                        className="flex items-center gap-2 text-gray-500 hover:text-brand-green font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        <ArrowLeft size={16} /> Voltar para Histórias
                    </button>
                    <div className="flex items-center gap-4">
                        <Share2 size={16} className="text-gray-400" />
                        <div className="flex gap-2">
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-gray-50 rounded-full transition-colors text-blue-600"><Facebook size={18} /></a>
                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-gray-50 rounded-full transition-colors text-green-600"><MessageCircle size={18} /></a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Imagem de Capa Larga (Hero) */}
            <div className="relative w-full aspect-[21/9] md:aspect-[21/7] overflow-hidden bg-gray-100">
                <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-white">
                    <div className="container mx-auto">
                        <Badge className="mb-4 bg-brand-orange border-none text-[10px] uppercase font-black px-4 py-1.5 shadow-lg">
                            {post.category}
                        </Badge>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black font-merriweather leading-tight max-w-4xl">
                            {post.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="container mx-auto px-6 mt-12 lg:mt-20">
                <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">

                    {/* Infos e Compartilhamento (Lateral Desktop) */}
                    <aside className="lg:w-1/4 space-y-8">
                        <div className="space-y-6 pb-8 border-b border-gray-100">
                            <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Publicado em</p>
                                <div className="flex items-center gap-3 text-gray-600 font-bold text-sm">
                                    <Calendar size={18} className="text-brand-orange" />
                                    {formattedDate}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Escrito por</p>
                                <div className="flex items-center gap-3 text-gray-600 font-bold text-sm">
                                    <User size={18} className="text-brand-orange" />
                                    {post.author}
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Compartilhe</p>
                            <div className="flex gap-4">
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl transition-all"><Facebook size={20} /></a>
                                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-2xl transition-all"><MessageCircle size={20} /></a>
                            </div>
                        </div>
                    </aside>

                    {/* Texto da Notícia */}
                    <article className="lg:w-3/4">
                        <div className="prose prose-lg max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-xl prose-p:font-light prose-headings:font-merriweather prose-headings:font-black prose-headings:text-gray-800">
                            {post.content.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-6">
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        {/* CTA Final */}
                        <div className="mt-20 p-8 md:p-12 bg-gray-50 rounded-[3rem] border border-gray-100 text-center space-y-6">
                            <h3 className="text-2xl font-black text-gray-800 font-merriweather">Gostou dessa história?</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Você pode fazer parte da vida de outros animais como este sendo um voluntário ou fazendo uma doação.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Link to="/doacoes" className="bg-brand-green text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">Quero Ajudar</Link>
                                <Link to="/adocao" className="bg-white text-brand-green border-2 border-brand-green px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-green hover:text-white transition-all">Ver Pets para Adoção</Link>
                            </div>
                        </div>
                    </article>

                </div>
            </div>
        </div>
    );
};

export default PostDetailPage;
