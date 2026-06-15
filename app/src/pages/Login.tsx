import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const resolvedRole = await login(email, password);
      
      if (resolvedRole === 'superadmin') {
        navigate('/superadmin');
      } else if (resolvedRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/caissier');
      }
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  // Raccourci de développement pour tester les rôles de salle facilement
  const handleQuickLogin = (selectedRole: UserRole) => {
    let mockEmail = '';
    
    if (selectedRole === 'superadmin') {
      mockEmail = 'superadmin@playcontrol.com';
    } else if (selectedRole === 'admin') {
      mockEmail = 'salle.admin@playcontrol.com';
    } else {
      mockEmail = 'sophie.caisse@playcontrol.com';
    }

    setEmail(mockEmail);
    setPassword('password');
  };

  return (
    <div className="login-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--neutral-50)',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background blobs for premium depth */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,109,224,0.06) 0%, rgba(124,58,237,0.02) 100%)',
        top: '-100px',
        left: '-100px',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, rgba(26,109,224,0.02) 100%)',
        bottom: '-150px',
        right: '-150px',
        zIndex: 0
      }} />

      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: 'var(--space-10)',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-xl)',
        zIndex: 1,
        border: '1px solid var(--neutral-100)'
      }}>
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <img src={logoImg} alt="PlayControl Logo" style={{
            width: '100px',
            height: '100px',
            borderRadius: 'var(--radius-lg)',
            objectFit: 'cover',
            marginBottom: 'var(--space-4)',
            // boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            display: 'inline-block'
          }} />
          <h1 className="gradient-text" style={{
            fontSize: 'var(--font-xl)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            marginBottom: 'var(--space-1)'
          }}>
            PolyControl Portail  
          </h1>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-50)',
            border: '1px solid var(--danger-100)',
            color: 'var(--danger-600)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-sm)',
            fontWeight: 500,
            marginBottom: 'var(--space-5)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)'
          }}>
            <span style={{ marginTop: '2px' }}>⚠️</span> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Email Input */}
          <div className="input-group">
            <label className="input-label" htmlFor="email">Identifiant / Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--neutral-400)'
              }} />
              <input
                id="email"
                type="text"
                className="input-field"
                placeholder="nom@salle.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="input-group">
            <label className="input-label" htmlFor="password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--neutral-400)'
              }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--neutral-400)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-black"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={isLoading}
          >
            {isLoading ? 'Connexion en cours...' : (
              <>
                Se connecter <ArrowRight size={16} style={{ marginLeft: 'var(--space-2)' }} />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Section (Developer / Reviewer utility) */}
        <div style={{
          marginTop: 'var(--space-8)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px dashed var(--neutral-200)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--neutral-500)',
            fontSize: 'var(--font-xs)',
            fontWeight: 600,
            marginBottom: 'var(--space-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <ShieldCheck size={14} /> Connexion rapide Salle
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
            <button
              onClick={() => handleQuickLogin('superadmin')}
              className="btn btn-secondary btn-sm"
              style={{ textAlign: 'center', fontSize: '11px', padding: 'var(--space-2) var(--space-1)' }}
            >
              Super Admin
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="btn btn-secondary btn-sm"
              style={{ textAlign: 'center', fontSize: '11px', padding: 'var(--space-2) var(--space-1)' }}
            >
              Gérant Salle
            </button>
            <button
              onClick={() => handleQuickLogin('caissier')}
              className="btn btn-secondary btn-sm"
              style={{ textAlign: 'center', fontSize: '11px', padding: 'var(--space-2) var(--space-1)' }}
            >
              Caissier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
