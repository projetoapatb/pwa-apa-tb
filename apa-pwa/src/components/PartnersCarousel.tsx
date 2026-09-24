import React, { useMemo, useRef, useState } from 'react';
import type { Partner } from '../types';

interface PartnersCarouselProps {
    partners: Partner[];
}

export const PartnersCarousel: React.FC<PartnersCarouselProps> = ({ partners }) => {
    const [paused, setPaused] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    // Duplica a lista para o loop infinito (translateX -50%)
    const loop = useMemo(() => {
        if (partners.length === 0) return [];
        // Com poucos logos, repete dentro de cada metade para preencher a faixa
        const base = partners.length < 5
            ? [...partners, ...partners, ...partners]
            : partners;
        return [...base, ...base];
    }, [partners]);

    if (partners.length === 0) return null;

    // Movimento lento: ~10s por logo na base original
    const durationSec = Math.max(32, partners.length * 10);

    return (
        <div
            className="relative overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        >
            {/* Fade nas bordas */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 z-10 bg-gradient-to-r from-gray-50 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 z-10 bg-gradient-to-l from-gray-50 to-transparent" />

            <div
                ref={trackRef}
                className="partners-marquee-track flex w-max items-center gap-12 md:gap-16 py-2"
                style={{
                    animationDuration: `${durationSec}s`,
                    animationPlayState: paused ? 'paused' : 'running',
                }}
            >
                {loop.map((partner, index) => (
                    <a
                        key={`${partner.id}-${index}`}
                        href={partner.website || undefined}
                        target={partner.website ? '_blank' : undefined}
                        rel={partner.website ? 'noopener noreferrer' : undefined}
                        title={partner.name}
                        className="flex-shrink-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 ease-out"
                        onClick={(e) => {
                            if (!partner.website) e.preventDefault();
                        }}
                    >
                        <img
                            src={partner.logo}
                            alt={partner.name}
                            className="h-10 sm:h-12 md:h-14 w-auto max-w-[140px] md:max-w-[180px] object-contain"
                            loading="lazy"
                            draggable={false}
                        />
                    </a>
                ))}
            </div>
        </div>
    );
};
