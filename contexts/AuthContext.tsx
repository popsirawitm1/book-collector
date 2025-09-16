// contexts/AuthContext.tsx
import {createContext, useContext, useEffect, useState} from "react";
import {onAuthStateChanged, User, signOut as fbSignOut} from "firebase/auth";
import {auth} from "@/configs/firebase";

type AuthCtx = {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
    user: null,
    loading: true,
    signOut: async () => {
    },
});

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsub;
    }, []);

    const signOut = async () => {
        await fbSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{user, loading, signOut}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
