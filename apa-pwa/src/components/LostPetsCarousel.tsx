import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { LostPet } from '../types';
import { getOptimizedCloudinaryUrl } from '../lib/cloudinary';

const FALLBACK = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop';

const getImage = (photoUrl?: string) =>
    photoUrl ? getOptimizedCloudinaryUrl(photoUrl) : FALLBACK;

interface LostPetsCarouselProps {
    pets: LostPet[];
}

export const LostPetsCarousel: React.FC<LostPetsCarouselProps> = ({ pets }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(true);
    const pauseRef = useRef(false);

    const updateControls = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;

        const maxScroll = el.scrollWidth - el.clientWidth;
        setCanPrev(el.scrollLeft > 8);
        setCanNext(el.scrollLeft < maxScroll - 8);

        const cards = Array.from(el.children) as HTMLElement[];
        if (cards.length === 0) return;

        const center = el.scrollLeft + el.clientWidth / 2;
        let closest = 0;
        let best = Number.POSITIVE_INFINITY;
        cards.forEach((card, i) => {
            const mid = card.offsetLeft + card.offsetWidth / 2;
            const dist = Math.abs(mid - center);
            if (dist < best) {
                best = dist;
                closest = i;
            }
        });
        setActiveIndex(closest);
    }, []);

    const scrollByCard = (direction: -1 | 1) => {
        const el = trackRef.current;
        if (!el) return;
        const card = el.querySelector('[data-carousel-card]') as HTMLElement | null;
        const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
        el.scrollBy({ left: direction * amount, behavior: 'smooth' });
    };

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        updateControls();
        el.addEventListener('scroll', updateControls, { passive: true });
        window.addEventListener('resize', updateControls);
        return () => {
            el.removeEventListener('scroll', updateControls);
            window.removeEventListener('resize', updateControls);
        };
    }, [pets, updateControls]);

    useEffect(() => {
        if (pets.length <= 1) return;
        const timer = window.setInterval(() => {
            if (pauseRef.current) return;
            const el = trackRef.current;
            if (!el) return;
            const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 12;
            if (atEnd) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollByCard(1);
            }
        }, 4500);
        return () => window.clearInterval(timer);
    }, [pets.length]);

    if (pets.length === 0) return null;

    return (
        <div
            className="relative"
            onMouseEnter={() => { pauseRef.current = true; }}
            onMouseLeave={() => { pauseRef.current = false; }}
            onTouchStart={() => { pauseRef.current = true; }}
        >
            <div
                ref={trackRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-2 px-2 scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {pets.map((pet) => (
                    <Link
                        key={pet.id}
                        to="/perdidos"
                        data-carousel-card
                        className="group relative h-80 w-[78vw] sm:w-[320px] md:w-[340px] flex-shrink-0 snap-start rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
                    >
                        <img
                            src={getImage(pet.photoUrl)}
                            alt={pet.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                            <span
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                                    pet.status === 'perdido' ? 'bg-red-500' : 'bg-green-500'
                                }`}
                            >
                                {pet.status}
                            </span>
                            {pet.hasReward && (
                                <span className="bg-brand-orange text-white px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                                    Recompensa
                                </span>
                            )}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <h3 className="text-xl font-bold text-white mb-2 font-merriweather">{pet.name}</h3>
                            <div className="flex items-center gap-2 text-white/80 text-xs">
                                <MapPin size={14} className="text-brand-orange flex-shrink-0" />
                                <span className="truncate">{pet.lastSeenLocation}</span>
                            </div>
                            <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver no mural <ArrowRight size={12} />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {pets.length > 1 && (
                <>
                    <button
                        type="button"
                        aria-label="Anterior"
                        disabled={!canPrev}
                        onClick={() => scrollByCard(-1)}
                        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-11 h-11 items-center justify-center rounded-full bg-white text-brand-green shadow-lg border border-gray-100 disabled:opacity-30 disabled:pointer-events-none hover:scale-105 transition-all"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <button
                        type="button"
                        aria-label="Próximo"
                        disabled={!canNext}
                        onClick={() => scrollByCard(1)}
                        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-11 h-11 items-center justify-center rounded-full bg-white text-brand-green shadow-lg border border-gray-100 disabled:opacity-30 disabled:pointer-events-none hover:scale-105 transition-all"
                    >
                        <ChevronRight size={22} />
                    </button>

                    <div className="flex justify-center gap-2 mt-2">
                        {pets.map((pet, i) => (
                            <button
                                key={pet.id}
                                type="button"
                                aria-label={`Ir para ${pet.name}`}
                                onClick={() => {
                                    const el = trackRef.current;
                                    const card = el?.children[i] as HTMLElement | undefined;
                                    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                }}
                                className={`h-2 rounded-full transition-all ${
                                    i === activeIndex ? 'w-6 bg-brand-green' : 'w-2 bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
