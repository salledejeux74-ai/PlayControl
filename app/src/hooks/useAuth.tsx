import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Simulation d'appel API avec résolution automatique du rôle
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let role: UserRole | null = null;
        let name = '';

        const lowerEmail = email.toLowerCase();
        if (lowerEmail === 'superadmin@playcontrol.com' || lowerEmail.includes('superadmin')) {
          role = 'superadmin';
          name = 'Alexandre - Propriétaire';
        } else if (lowerEmail === 'salle.admin@playcontrol.com' || lowerEmail.includes('admin')) {
          role = 'admin';
          name = 'Marc - Gérant';
        } else if (lowerEmail === 'sophie.caisse@playcontrol.com' || lowerEmail.includes('caisse') || lowerEmail.includes('caissier') || lowerEmail.includes('employe')) {
          role = 'caissier';
          name = 'Sophie - Caissière';
        }

        // Pour la démo, accepte n'importe quel mot de passe
        if (role && password) {
          const loggedUser: User = {
            id: `${role}_1`,
            name,
            email,
            role,
            salleId: role !== 'superadmin' ? 'salle_gaming_zone' : undefined
          };
          setUser(loggedUser);
          localStorage.setItem('playcontrol_user', JSON.stringify(loggedUser));
          resolve(role);
        } else {
          reject(new Error('Utilisateur non reconnu ou mot de passe incorrect'));
        }
      }, 500);
    });
  };

  const logout = () => {
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
