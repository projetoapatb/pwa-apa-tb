import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFlags } from '../contexts/FeatureFlagContext';

interface FlaggedRouteProps {
    children: React.ReactNode;
    flag: keyof ReturnType<typeof useFlags>['flags'];
}

const FlaggedRoute: React.FC<FlaggedRouteProps> = ({ children, flag }) => {
    const { flags, loading } = useFlags();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    if (!flags[flag]) {
        // Redireciona para home se a flag estiver desativada
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default FlaggedRoute;
