import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Heart, Send } from 'lucide-react';

interface StorySuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (storyData: { title: string; content: string }) => void;
    petName: string;
}

const StorySuccessModal: React.FC<StorySuccessModalProps> = ({ isOpen, onClose, onSave, petName }) => {
    const [title, setTitle] = useState(`Final Feliz para ${petName}!`);
    const [content, setContent] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, content });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-lg p-8 relative animate-in fade-in zoom-in duration-300 rounded-[2.5rem] border-none shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center">
                        <Heart className="text-pink-500 fill-pink-500 animate-pulse" size={40} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">História de Final Feliz</h2>
                        <p className="text-gray-500 text-sm">
                            Que notícia maravilhosa! Vamos compartilhar essa alegria com a comunidade criando uma história de sucesso?
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <div className="space-y-1 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Título da História</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-green outline-none transition-all font-bold text-gray-700"
                                required
                            />
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Conteúdo (O que aconteceu?)</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                                placeholder="Conte um pouco sobre como o animal foi encontrado..."
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-green outline-none transition-all text-gray-700 resize-none"
                                required
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Pular Agora
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2"
                            >
                                <Send size={16} /> Publicar História
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default StorySuccessModal;
