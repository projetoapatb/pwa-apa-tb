import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface FeatureFlags {
    adoption: boolean;
    donations: boolean;
    lostPets: boolean;
    partners: boolean;
    stories: boolean;
    volunteers: boolean;
}

interface FeatureFlagContextType {
    flags: FeatureFlags;
    loading: boolean;
}

const defaultFlags: FeatureFlags = {
    adoption: true,
    donations: true,
    lostPets: false,
    partners: true,
    stories: true,
    volunteers: true
};

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Escuta em tempo real a coleção /flags, documento 'global'
        const unsubscribe = onSnapshot(doc(db, 'flags', 'global'), (docSnap) => {
            if (docSnap.exists()) {
                setFlags(docSnap.data() as FeatureFlags);
            }
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar Feature Flags:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <FeatureFlagContext.Provider value={{ flags, loading }}>
            {children}
        </FeatureFlagContext.Provider>
    );
};

export const useFlags = () => {
    const context = useContext(FeatureFlagContext);
    if (context === undefined) {
        throw new Error('useFlags must be used within a FeatureFlagProvider');
    }
    return context;
};
