import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAdminStatus = async (firebaseUser: User | null) => {
        if (!firebaseUser) {
            setIsAdmin(false);
            setProfile(null);
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfile;
                setProfile(userData);
                setIsAdmin(userData.role === 'admin');
            } else {
                // Se o usuário não existe no Firestore, criamos um perfil básico (não-admin por padrão)
                const newProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || '',
                    role: 'user',
                    createdAt: new Date().toISOString()
                };
                await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
                setProfile(newProfile);
                setIsAdmin(false);
            }
        } catch (error) {
            console.error("Erro ao verificar status de admin:", error);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        console.log("AuthContext: Iniciando monitoramento...");
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("onAuthStateChanged: User =", firebaseUser?.email);
            setUser(firebaseUser);
            if (firebaseUser) {
                await checkAdminStatus(firebaseUser);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
            await checkAdminStatus(result.user);
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setProfile(null);
        setIsAdmin(false);
    };

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        // Atualiza o estado local
        setProfile(prev => prev ? { ...prev, ...data } : null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, isAdmin, loading, signIn, signInWithGoogle, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
