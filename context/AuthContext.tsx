import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    googleAccessToken: string | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setGoogleAccessToken(null);
                sessionStorage.removeItem('googleAccessToken');
            } else {
                // Restore token from session storage if available
                const savedToken = sessionStorage.getItem('googleAccessToken');
                if (savedToken) setGoogleAccessToken(savedToken);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            if (token) {
                setGoogleAccessToken(token);
                sessionStorage.setItem('googleAccessToken', token);
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setGoogleAccessToken(null);
            sessionStorage.removeItem('googleAccessToken');
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, googleAccessToken, signInWithGoogle, signOut }}>
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
