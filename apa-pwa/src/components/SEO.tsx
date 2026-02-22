import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}

const SEO: React.FC<SEOProps> = ({
    title = 'APA Telêmaco Borba - Adoção e Proteção Animal',
    description = 'Ajude a transformar vidas. Conheça nossos animais disponíveis para adoção, faça uma doação ou torne-se um voluntário na ONG de Telêmaco Borba.',
    image = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=512&auto=format&fit=crop', // Usando uma imagem de cachorro genérica de alta qualidade como fallback
    url = 'https://apa-telemaco-borba.web.app'
}) => {
    const siteTitle = title.includes('APA') ? title : `${title} | APA Telêmaco Borba`;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{siteTitle}</title>
            <meta name='description' content={description} />

            {/* Facebook / Open Graph tags */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />

            {/* Twitter tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Theme Color */}
            <meta name="theme-color" content="#2E7D32" />
        </Helmet>
    );
};

export default SEO;
