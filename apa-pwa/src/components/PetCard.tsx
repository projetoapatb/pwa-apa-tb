import React from 'react';
import type { Pet } from '../types';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ArrowRight, Calendar, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toWhatsAppLink } from '../utils/masks';
import { getOptimizedCloudinaryUrl } from '../lib/cloudinary';

interface PetCardProps {
    pet: Pet;
}

export const PetCard: React.FC<PetCardProps> = ({ pet }) => {
    const whatsappUrl = pet.contactPhone
        ? toWhatsAppLink(
            pet.contactPhone,
            `Olá! Vi o anúncio da ${pet.name} no site da APA Telêmaco Borba e tenho interesse em adotar.`
        )
        : null;

    const photoSrc = pet.photos[0]
        ? getOptimizedCloudinaryUrl(pet.photos[0])
        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974&auto=format&fit=crop';

    return (
        <Card className="flex flex-col h-full group rounded-[2.5rem] overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500">
            <Link to={`/adocao/${pet.id}`} className="relative aspect-[4/3] overflow-hidden block">
                <img
                    src={photoSrc}
                    alt={pet.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </Link>

            <CardContent className="flex-grow p-8 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800 font-merriweather">{pet.name}</h3>
                    <div className="flex items-center text-xs text-brand-green font-bold bg-brand-green/5 px-2 py-1 rounded-lg">
                        <Calendar size={12} className="mr-1" />
                        {typeof pet.age === 'number' ? `${pet.age} anos` : pet.age}
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                    <Badge variant="warning" className="text-[9px] uppercase font-black">{pet.size}</Badge>
                    <Badge variant="info" className="text-[9px] uppercase font-black">{pet.gender || 'Sexo N/A'}</Badge>
                    <Badge variant="success" className="text-[9px] uppercase font-black">{pet.species}</Badge>
                </div>

                <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow leading-relaxed">
                    {pet.description}
                </p>

                <div className="space-y-3">
                    <Link to={`/adocao/${pet.id}`} className="w-full block">
                        <Button variant="outline" className="w-full group/btn">
                            Conhecer {pet.name}
                            <ArrowRight size={16} className="ml-2 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                    </Link>

                    {whatsappUrl && (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                type="button"
                                variant="secondary"
                                className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white border-none shadow-md shadow-green-900/10"
                            >
                                <MessageCircle size={16} className="mr-2" />
                                WhatsApp do anunciante
                            </Button>
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
