import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { Post } from '../types';
import { PostCard } from '../components/PostCard';
import { Newspaper, History, Award, Info } from 'lucide-react';
import SEO from '../components/SEO';

const NewsPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('todos');

    useEffect(() => {
        // Query apenas para posts ativos
        let q = query(
            collection(db, 'posts'),
            where('isActive', '==', true),
            orderBy('publishDate', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];
            setPosts(data);
            setLoading(false);
        }, (error) => {
            console.error("Erro na consulta de posts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const categories = [
        { id: 'todos', label: 'Tudo', icon: Info },
        { id: 'notícia', label: 'Notícias', icon: Newspaper },
        { id: 'resultado', label: 'Resultados', icon: Award },
        { id: 'história', label: 'Histórias', icon: History },
    ];

    const filteredPosts = activeCategory === 'todos'
        ? posts
        : posts.filter(p => p.category === activeCategory);

    return (
        <div className="pb-20 bg-gray-50 min-h-screen">
            <SEO
                title="Histórias e Notícias | APA Telêmaco Borba"
                description="Acompanhe as notícias, resultados de eventos e histórias de sucesso da APA Telêmaco Borba."
            />

            {/* Header */}
            <div className="bg-brand-green text-white pt-21 pb-34 px-8 text-center">
                <div className="container mx-auto max-w-3xl">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-merriweather mb-8 leading-tight">Vozes da Causa Animal</h1>
                    <p className="text-green-50 text-xl font-light opacity-90 leading-relaxed">
                        Acompanhe nossas conquistas, resultados de eventos e as histórias emocionantes dos animais que passaram por aqui.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-13">
                {/* Filtros */}
                <div className="flex flex-wrap justify-center gap-3 mb-13">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${activeCategory === cat.id ? 'bg-brand-orange text-white shadow-brand-orange/20' : 'bg-white text-gray-400 hover:text-brand-green'}`}
                        >
                            <cat.icon size={16} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13">
                        {filteredPosts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-34 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 max-w-2xl mx-auto">
                        <Newspaper size={55} className="text-gray-100 mx-auto mb-8" />
                        <p className="text-gray-400 font-medium text-lg">Ainda não temos postagens nesta categoria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsPage;
