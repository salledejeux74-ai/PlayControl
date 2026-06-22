import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export type UserRole = 'superadmin' | 'admin' | 'caissier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  salleId?: string; // Pour les admins et caissiers
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('playcontrol_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, password: string): Promise<UserRole> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message === 'Invalid login credentials' 
        ? 'Identifiants invalides ou mot de passe incorrect.' 
        : authError.message);
    }

    if (!authData.user) {
      throw new Error('Impossible de récupérer l\'utilisateur.');
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, role, salle_id')
      .eq('id', authData.user.id)
      .single();

    let role: UserRole = 'caissier';
    let name = authData.user.email || 'Utilisateur';
    let salleId: string | undefined = undefined;

    if (profileError || !profile) {
      // Repli vers les métadonnées si profil non trouvé
      const meta = authData.user.user_metadata || {};
      role = (meta.role || 'caissier') as UserRole;
      name = (meta.name && meta.name !== 'Utilisateur') ? meta.name : (authData.user.email || 'Utilisateur');
      salleId = meta.salle_id || undefined;
    } else {
      role = profile.role as UserRole;
      name = (profile.name && profile.name !== 'Utilisateur') ? profile.name : (authData.user.email || 'Utilisateur');
      salleId = profile.salle_id || undefined;
    }

    const loggedUser: User = {
      id: authData.user.id,
      name,
      email: authData.user.email || email,
      role,
      salleId,
    };

    setUser(loggedUser);
    localStorage.setItem('playcontrol_user', JSON.stringify(loggedUser));
    return role;
  };

  const logout = () => {
    supabase.auth.signOut().catch(() => {});
    setUser(null);
    localStorage.removeItem('playcontrol_user');
  };

  // Inactivity timeout (déconnexion automatique après inactivité)
  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      // Déconnexion après 15 minutes d'inactivité
      timeoutId = setTimeout(() => {
        logout();
        alert('Votre session a expiré pour cause d\'inactivité.');
      }, 15 * 60 * 1000); 
    };

    // Events that reset the inactivity timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleEvent = () => resetTimeout();
    
    events.forEach(event => document.addEventListener(event, handleEvent));

    // Initial set
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, handleEvent));
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
