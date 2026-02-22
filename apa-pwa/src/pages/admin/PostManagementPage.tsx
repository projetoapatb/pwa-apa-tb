import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import type { Post } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Calendar,
    Newspaper,
    Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PostManagementPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'posts'), orderBy('publishDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];
            setPosts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Excluir a postagem "${title}"?`)) {
            try {
                await deleteDoc(doc(db, 'posts', id));
            } catch (error) {
                console.error(error);
            }
        }
    };

    const toggleStatus = async (post: Post) => {
        try {
            await updateDoc(doc(db, 'posts', post.id), {
                isActive: !post.isActive
            });
        } catch (error) {
            console.error(error);
        }
    };

    const toggleHighlight = async (post: Post) => {
        try {
            await updateDoc(doc(db, 'posts', post.id), {
                isHighlighted: !post.isHighlighted
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Carregando notícias...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Comunicação</p>
                    <h2 className="text-2xl font-bold text-gray-800">Notícias e Resultados</h2>
                </div>
                <Link to="/admin/noticias/nova">
                    <Button className="gap-2">
                        <Plus size={20} /> Nova Postagem
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {posts.map((p) => (
                    <Card key={p.id} className={`p-4 border-2 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center ${p.isActive ? 'border-transparent shadow-sm' : 'border-dashed border-gray-200 opacity-60 bg-gray-50/50'}`}>
                        <div className="w-full md:w-32 h-32 md:h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-grow space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="info" className="text-[9px] uppercase">{p.category}</Badge>
                                {!p.isActive && <Badge variant="warning" className="text-[9px] uppercase">Rascunho</Badge>}
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg leading-tight">{p.title}</h3>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {p.publishDate?.toDate?.()?.toLocaleDateString('pt-BR') || '---'}</span>
                                <span className="flex items-center gap-1"><Newspaper size={12} /> {p.author}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                className={`p-2 rounded-xl transition-all ${p.isHighlighted ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'text-gray-400'}`}
                                onClick={() => toggleHighlight(p)}
                                title={p.isHighlighted ? "Remover destaque" : "Destacar na Home"}
                            >
                                <Star size={16} className={p.isHighlighted ? "fill-yellow-500" : ""} />
                            </Button>
                            <Link to={`/admin/noticias/editar/${p.id}`}>
                                <Button variant="outline" size="sm" className="p-2 rounded-xl">
                                    <Edit2 size={16} />
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                className="p-2 rounded-xl"
                                onClick={() => toggleStatus(p)}
                            >
                                {p.isActive ? <Eye size={16} /> : <EyeOff size={16} className="text-red-400" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="p-2 rounded-xl hover:bg-red-50 hover:border-red-200"
                                onClick={() => handleDelete(p.id, p.title)}
                            >
                                <Trash2 size={16} className="text-red-400" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {posts.length === 0 && (
                <div className="text-center p-20 border-2 border-dashed border-gray-100 rounded-3xl">
                    <p className="text-gray-400">Nenhuma postagem cadastrada ainda.</p>
                </div>
            )}
        </div>
    );
};

export default PostManagementPage;
