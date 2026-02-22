import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';

interface PostCardProps {
    post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    return (
        <Card className="flex flex-col h-full group rounded-[2.5rem] overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white">
            <Link to={`/noticias/${post.id}`} className="flex flex-col h-full">
                {/* Imagem de Capa */}
                <div className="relative aspect-video overflow-hidden">
                    <img
                        src={post.image || 'https://images.unsplash.com/photo-1444212477490-ca407925329e?q=80&w=2128&auto=format&fit=crop'}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-5 left-5">
                        <Badge variant="info" className="rounded-lg px-3 py-1 text-[10px] uppercase font-black bg-white/90 backdrop-blur-sm text-brand-green border-none shadow-sm capitalize">
                            {post.category}
                        </Badge>
                    </div>
                </div>

                {/* Conteúdo */}
                <CardContent className="flex-grow p-8 flex flex-col">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-brand-orange" />
                            {post.publishDate?.toDate ? post.publishDate.toDate().toLocaleDateString('pt-BR') : new Date(post.publishDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <User size={12} className="text-brand-orange" />
                            {post.author}
                        </span>
                    </div>

                    <h3 className="text-2xl font-black text-gray-800 font-merriweather mb-4 leading-tight group-hover:text-brand-green transition-colors line-clamp-2">
                        {post.title}
                    </h3>

                    <p className="text-gray-500 text-sm line-clamp-3 mb-8 flex-grow leading-relaxed font-light">
                        {post.excerpt}
                    </p>

                    <div className="pt-6 border-t border-gray-50 flex items-center text-brand-green font-bold text-xs uppercase tracking-widest group/link">
                        <span>Ler História Completa</span>
                        <ArrowRight size={16} className="ml-2 transition-transform group-hover/link:translate-x-2" />
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
};
