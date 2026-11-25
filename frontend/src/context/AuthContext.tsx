import { useState, createContext, useContext, useEffect, type ReactNode } from 'react';
import api from '../api';

export type UserRole = 'researcher' | 'vice_dean' | 'publication_officer' | 'supervisor';

export interface UserProfile {
    id: number;
    accountId: number;
    fullName: string;
    email: string;
    phone?: string;
    collegeId: number;
    collegeName: string;
    department?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    roles: UserRole[];
    activeRole: UserRole | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    switchRole: (newRole: UserRole) => Promise<void>;
    loading: boolean;
    refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [activeRole, setActiveRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshMe = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setRoles([]);
            setActiveRole(null);
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
            setRoles(res.data.roles);
            setActiveRole(res.data.activeRole);
        } catch (err) {
            localStorage.removeItem('token');
            setUser(null);
            setRoles([]);
            setActiveRole(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshMe();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        setRoles(res.data.roles);
        setActiveRole(res.data.activeRole);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // ignore network errors on logout
        }
        localStorage.removeItem('token');
        setUser(null);
        setRoles([]);
        setActiveRole(null);
    };

    const switchRole = async (newRole: UserRole) => {
        const res = await api.post('/auth/switch-role', { role: newRole });
        localStorage.setItem('token', res.data.token);
        setRoles(res.data.roles);
        setActiveRole(res.data.activeRole);
    };

    return (
        <AuthContext.Provider value={{ user, roles, activeRole, login, logout, switchRole, loading, refreshMe }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
