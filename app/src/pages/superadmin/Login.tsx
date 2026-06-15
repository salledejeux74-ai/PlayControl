import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, ArrowRight, ShieldAlert, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import logoImg from '../../assets/logo.jpeg';

export const SuperAdminLogin: React.FC = () => {
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
      
      // Séparation des portails
      if (resolvedRole !== 'superadmin') {
        setError("Accès refusé. Cette console est réservée aux administrateurs globaux. Veuillez vous connecter via le portail de votre salle.");
      } else {
        navigate('/superadmin');
      }
    } catch (err: any) {
      setError(err.message || 'Identifiants système incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setEmail('superadmin@playcontrol.com');
    setPassword('password');
  };

  return (
    <div className="login-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--neutral-100)',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Visual background accents */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'var(--gradient-subtle)',
        top: '-50px',
        left: '-50px',
        zIndex: 0
      }} />

      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: 'var(--space-10)',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-xl)',
        zIndex: 1,
        border: '1.5px solid var(--neutral-300)',
        backgroundColor: 'var(--neutral-0)'
      }}>
        {/* Header console */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <img src={logoImg} alt="PlayControl Logo" style={{
            width: '88px',
            height: '88px',
            borderRadius: 'var(--radius-lg)',
            objectFit: 'cover',
            marginBottom: 'var(--space-4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            display: 'inline-block'
          }} />
          <h1 className="gradient-text" style={{
            fontSize: 'var(--font-xl)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            marginBottom: 'var(--space-1)'
          }}>
            PlayControl Super Admin
          </h1>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-50)',
            border: '1px solid var(--danger-100)',
            color: 'var(--danger-600)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-xs)',
            fontWeight: 500,
            marginBottom: 'var(--space-5)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)'
          }}>
            <ShieldAlert size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Email */}
          <div className="input-group">
            <label className="input-label" htmlFor="sys-email">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--neutral-400)'
              }} />
              <input
                id="sys-email"
                type="text"
                className="input-field"
                placeholder="admin.global@playcontrol.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label" htmlFor="sys-password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--neutral-400)'
              }} />
              <input
                id="sys-password"
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
            {isLoading ? 'Connexion à la console...' : (
              <>
                Se connecter <ArrowRight size={16} style={{ marginLeft: 'var(--space-2)' }} />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Section */}
        <div style={{
          marginTop: 'var(--space-8)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px dashed var(--neutral-300)'
        }}>
          <button
            onClick={handleQuickLogin}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center', gap: 'var(--space-2)' }}
          >
            <ShieldCheck size={14} /> Connexion Rapide Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};
