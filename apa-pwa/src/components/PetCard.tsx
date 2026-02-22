import React from 'react';
import type { Pet } from '../types';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PetCardProps {
    pet: Pet;
}

export const PetCard: React.FC<PetCardProps> = ({ pet }) => {

    return (
        <Card className="flex flex-col h-full group rounded-[2.5rem] overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500">
            {/* Imagem do Cão */}
            <Link to={`/adocao/${pet.id}`} className="relative aspect-[4/3] overflow-hidden block">
                <img
                    src={pet.photos[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974&auto=format&fit=crop'}
                    alt={pet.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </Link>

            {/* Conteúdo */}
            <CardContent className="flex-grow p-8 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800 font-merriweather">{pet.name}</h3>
                    <div className="flex items-center text-xs text-brand-green font-bold bg-brand-green/5 px-2 py-1 rounded-lg">
                        <Calendar size={12} className="mr-1" />
                        {typeof pet.age === 'number' ? `${pet.age} anos` : pet.age}
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                    <Badge variant="success" className="text-[9px] uppercase font-black">{pet.status}</Badge>
                    <Badge variant="warning" className="text-[9px] uppercase font-black">{pet.size}</Badge>
                    <Badge variant="info" className="text-[9px] uppercase font-black">{pet.gender || 'Sexo N/A'}</Badge>
                </div>

                <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow leading-relaxed">
                    {pet.description}
                </p>

                <Link to={`/adocao/${pet.id}`} className="w-full">
                    <Button variant="outline" className="w-full group/btn">
                        Conhecer {pet.name}
                        <ArrowRight size={16} className="ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
};
