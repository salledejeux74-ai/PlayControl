import React, { useState, useEffect } from 'react';
import { Gamepad2, Clock, Star, Play, LogOut, ArrowRight, KeyRound, ChevronRight } from 'lucide-react';
import logoImg from '../../assets/logo.jpeg';
import { supabase } from '../../lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberClient {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  balance: number;
  abonnementType: 'Aucun' | 'Journalier' | 'Hebdomadaire' | 'Mensuel' | 'VIP';
  abonnementExpiration: string | null;
  status: 'active' | 'suspended';
  abonnementRemainingTime?: number;
}

interface GameStation {
  id: string;
  name: string;
  type: string;
  characteristics: string;
  smartPlugIp: string;
  status: 'libre' | 'en-attente' | 'occupe' | 'hors-service';
  clientName?: string;
  sessionCode?: string;
  minutesRemaining?: number;
  totalDuration?: number;
  updatedAt?: string;
}

interface MaterialType {
  id: string;
  type: string;
  label: string;
  price: number;
  durationMinutes: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (minutes: number): string => {
  if (minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m} min`;
};

const mapPosteFromDb = (p: any): GameStation => ({
  id: p.id,
  name: p.name,
  type: p.type,
  characteristics: p.characteristics || '',
  smartPlugIp: p.smart_plug_ip || '',
  status: p.status,
  clientName: p.client_name || undefined,
  sessionCode: p.session_code || undefined,
  minutesRemaining: p.minutes_remaining !== null ? p.minutes_remaining : undefined,
  totalDuration: p.total_duration !== null ? p.total_duration : undefined,
  updatedAt: p.updated_at
});

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; type: 'success' | 'error' }> = ({ message, type }) => (
  <div style={{
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#ffffff',
    color: 'var(--neutral-800)',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-xl)',
    borderLeft: `4px solid ${type === 'error' ? 'var(--danger-500)' : 'var(--success-500)'}`,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: 600,
    fontSize: 'var(--font-sm)',
    animation: 'fadeIn var(--transition-base) ease-out',
    maxWidth: '360px',
  }}>
    <span style={{
      color: type === 'error' ? 'var(--danger-500)' : 'var(--success-500)',
      backgroundColor: type === 'error' ? 'var(--danger-50)' : 'var(--success-50)',
      width: '22px', height: '22px', borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
      flexShrink: 0,
    }}>
      {type === 'error' ? '✕' : '✓'}
    </span>
    <span>{message}</span>
  </div>
);


// ─── Écran Login (design system de l'app) ────────────────────────────────────

const LoginScreen: React.FC<{
  onSubmitCode: (code: string) => Promise<{ success: boolean; error?: string }>;
}> = ({ onSubmitCode }) => {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const shake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = sessionCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Le code doit contenir exactement 6 caractères.');
      shake(); return;
    }
    setIsLoading(true);
    try {
      const res = await onSubmitCode(code);
      if (!res.success) {
        setError(res.error || 'Code invalide ou déjà utilisé.');
        shake();
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--neutral-50)',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,109,224,0.06) 0%, rgba(124,58,237,0.02) 100%)',
        top: '-100px', left: '-100px', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, rgba(26,109,224,0.02) 100%)',
        bottom: '-150px', right: '-150px', zIndex: 0,
      }} />

      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'var(--space-10)',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 'var(--radius-xl)',
          zIndex: 1,
          border: '1px solid var(--neutral-100)',
          animation: isShaking ? 'shake 0.4s ease' : undefined,
        }}
      >
        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
          <img src={logoImg} alt="PlayControl Logo" style={{
            width: '80px', height: '80px',
            borderRadius: 'var(--radius-lg)',
            objectFit: 'cover',
            marginBottom: 'var(--space-4)',
            display: 'inline-block',
          }} />
          <h1 className="gradient-text" style={{
            fontSize: 'var(--font-xl)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            marginBottom: 'var(--space-1)',
          }}>
            Espace Joueur
          </h1>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-2)' }}>
            Saisissez votre code de session pour vous connecter
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div style={{
            background: 'var(--danger-50)', border: '1px solid var(--danger-100)',
            color: 'var(--danger-600)', padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', fontWeight: 500,
            marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
          }}>
            <span style={{ marginTop: '2px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div>
            <div className="input-group">
              <label className="input-label" htmlFor="session-code">Code de session</label>
              <input
                id="session-code"
                type="text"
                className={`input-field${error ? ' input-error' : ''}`}
                placeholder="Ex : 4UDTDC"
                value={sessionCode}
                onChange={e => setSessionCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
                required
                style={{
                  textAlign: 'center',
                  fontSize: '28px',
                  fontWeight: 900,
                  letterSpacing: '8px',
                  fontFamily: 'monospace',
                  padding: 'var(--space-4)',
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-black"
            style={{ width: '100%' }}
            disabled={sessionCode.length < 6 || isLoading}
          >
            {isLoading ? 'Connexion...' : 'Lancer la session maintenant →'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

// ─── Écran Activation Code ────────────────────────────────────────────────────

const CodeActivationScreen: React.FC<{
  client: MemberClient;
  postes: GameStation[];
  onActivated: () => void;
  onBack: () => void;
}> = ({ client, postes, onActivated, onBack }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const normalized = code.trim().toUpperCase();

    // Find a poste 'en-attente' with matching code AND client name
    const matchedPoste = postes.find(
      p => p.status === 'en-attente' &&
           p.sessionCode === normalized &&
           p.clientName === client.username
    );

    if (!matchedPoste) {
      // Also check if code exists but belongs to another client
      const codeExists = postes.find(p => p.sessionCode === normalized);
      if (codeExists && codeExists.clientName !== client.username) {
        setError(`Ce code appartient à une session pour "${codeExists.clientName}". Vérifiez votre code.`);
      } else {
        setError('Code invalide ou déjà utilisé. Vérifiez auprès du caissier.');
      }
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Activate in database: set status to 'occupe', remove sessionCode
    const { error: updateErr } = await supabase
      .from('postes')
      .update({
        status: 'occupe',
        session_code: null
      })
      .eq('id', matchedPoste.id);

    if (updateErr) {
      setError(updateErr.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onActivated();
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--neutral-50)',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,109,224,0.06) 0%, rgba(124,58,237,0.02) 100%)',
        top: '-100px', left: '-100px', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, rgba(26,109,224,0.02) 100%)',
        bottom: '-150px', right: '-150px', zIndex: 0,
      }} />

      <div
        className="card animate-fade-in"
        style={{
          width: '100%', maxWidth: '440px',
          padding: 'var(--space-10)',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 'var(--radius-xl)',
          zIndex: 1,
          border: '1px solid var(--neutral-100)',
          animation: isShaking ? 'shake 0.4s ease' : undefined,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
            background: success ? 'var(--success-50)' : 'var(--primary-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            border: `1px solid ${success ? 'var(--success-100)' : 'var(--primary-100)'}`,
          }}>
            {success
              ? <span style={{ fontSize: '28px' }}>✅</span>
              : <KeyRound size={28} color="var(--primary-500)" />
            }
          </div>
          <h1 className="gradient-text" style={{ fontSize: 'var(--font-xl)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 'var(--space-1)' }}>
            {success ? 'Session activée !' : 'Activer ma session'}
          </h1>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            {success
              ? 'Le timer démarre maintenant. Bonne session ! 🎮'
              : `Bonjour ${client.fullName.split(' ')[0]}. Saisissez le code fourni par le caissier.`
            }
          </p>
        </div>

        {!success && (
          <>
            {error && (
              <div style={{
                background: 'var(--danger-50)', border: '1px solid var(--danger-100)',
                color: 'var(--danger-600)', padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', fontWeight: 500,
                marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
              }}>
                <span style={{ marginTop: '2px' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="session-code">
                  Code de session (6 caractères)
                </label>
                <input
                  id="session-code"
                  type="text"
                  className={`input-field${error ? ' input-error' : ''}`}
                  placeholder="Ex: GX9P2M"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  autoFocus
                  required
                  style={{
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: 900,
                    letterSpacing: '8px',
                    fontFamily: 'monospace',
                    padding: 'var(--space-4)',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-black"
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
                disabled={code.length < 6}
              >
                <Play size={16} /> Démarrer la session
              </button>
            </form>

            <button
              onClick={onBack}
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: 'var(--space-3)', color: 'var(--neutral-500)' }}
            >
              ← Retour au tableau de bord
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

// ─── Dashboard Joueur ─────────────────────────────────────────────────────────

const PlayerDashboard: React.FC<{
  client: MemberClient;
  postes: GameStation[];
  materialTypes: MaterialType[];
  onLogout: () => void;
  onActivateSession: () => void;
}> = ({ client, postes, materialTypes, onLogout, onActivateSession }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const myActivePoste = postes.find(
    p => (p.status === 'occupe' || p.status === 'en-attente') && p.clientName === client.username
  );
  const freePostes = postes.filter(p => p.status === 'libre');
  const getMTypeLabel = (type: string) => materialTypes.find(t => t.type === type)?.label || type;
  const getMTypePrice = (type: string) => {
    const mt = materialTypes.find(t => t.type === type);
    return mt ? `${mt.price} FCFA / ${mt.durationMinutes} min` : '';
  };

  const percentRemaining = myActivePoste?.minutesRemaining && myActivePoste?.totalDuration
    ? (myActivePoste.minutesRemaining / myActivePoste.totalDuration) * 100
    : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--neutral-50)',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,109,224,0.05) 0%, rgba(124,58,237,0.02) 100%)',
        top: '-100px', left: '-100px', zIndex: 0, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, rgba(26,109,224,0.02) 100%)',
        bottom: '-150px', right: '-150px', zIndex: 0, pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <img src={logoImg} alt="PlayControl" style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
            <div>
              <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)', margin: 0 }}>Espace Joueur</p>
              <h1 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--neutral-800)', margin: 0 }}>
                Bonjour, {client.fullName.split(' ')[0]} 👋
              </h1>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--danger-600)', borderColor: 'var(--danger-100)' }}
          >
            <LogOut size={13} /> Déconnexion
          </button>
        </div>

        {/* Profile cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
          {/* Balance */}
          <div className="card" style={{ background: 'var(--gradient-subtle)', border: '1px solid var(--primary-100)' }}>
            <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 var(--space-2)' }}>
              💰 Solde disponible
            </p>
            <p style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--primary-600)', margin: 0 }}>
              {client.balance.toLocaleString()} <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-500)' }}>FCFA</span>
            </p>
          </div>

          {/* Abonnement */}
          <div className="card" style={{
            background: client.abonnementType !== 'Aucun' ? 'var(--warning-50)' : 'var(--neutral-0)',
            border: `1px solid ${client.abonnementType !== 'Aucun' ? 'var(--warning-100)' : 'var(--neutral-200)'}`,
          }}>
            <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 var(--space-2)' }}>
              ⭐ Abonnement
            </p>
            {client.abonnementType !== 'Aucun' ? (
              <>
                <p style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--warning-600)', margin: '0 0 4px' }}>
                  Pass {client.abonnementType}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neutral-600)', fontSize: 'var(--font-xs)' }}>
                  <Clock size={12} />
                  <span>{formatTime(client.abonnementRemainingTime || 0)} restants</span>
                </div>
                {client.abonnementExpiration && (
                  <p style={{ color: 'var(--neutral-400)', fontSize: '11px', margin: '4px 0 0' }}>
                    Expire le {client.abonnementExpiration}
                  </p>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--neutral-400)', fontSize: 'var(--font-sm)', margin: 0 }}>
                Aucun abonnement actif
              </p>
            )}
          </div>
        </div>

        {/* Session en cours ou CTA */}
        {myActivePoste ? (
          <div className="card animate-fade-in" style={{
            borderLeft: `5px solid ${myActivePoste.status === 'occupe' ? 'var(--primary-500)' : 'var(--warning-500)'}`,
            background: myActivePoste.status === 'occupe' ? 'var(--primary-50)' : 'var(--warning-50)',
            border: `1px solid ${myActivePoste.status === 'occupe' ? 'var(--primary-100)' : 'var(--warning-100)'}`,
            borderLeftWidth: '5px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: myActivePoste.status === 'occupe' ? 'var(--success-500)' : 'var(--warning-500)',
                boxShadow: `0 0 0 3px ${myActivePoste.status === 'occupe' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                animation: 'pulse-glow 1.5s infinite',
                flexShrink: 0,
              }} />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 'var(--font-base)', margin: 0, color: myActivePoste.status === 'occupe' ? 'var(--primary-700)' : 'var(--warning-600)' }}>
                  {myActivePoste.status === 'occupe' ? 'Session en cours' : 'Session en attente d\'activation'}
                </h3>
                <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)', margin: 0 }}>
                  {getMTypeLabel(myActivePoste.type)} — {myActivePoste.name}
                </p>
              </div>
            </div>

            {myActivePoste.status === 'occupe' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-600)', fontWeight: 600 }}>Temps restant</span>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--primary-700)' }}>
                    {formatTime(myActivePoste.minutesRemaining || 0)} / {formatTime(myActivePoste.totalDuration || 0)}
                  </span>
                </div>
                <div style={{ height: '10px', background: 'var(--neutral-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${percentRemaining}%`,
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
                <p style={{ color: 'var(--warning-600)', fontSize: 'var(--font-sm)', margin: 0, textAlign: 'center' }}>
                  Le caissier vous a attribué un code de session. Saisissez-le pour démarrer le timer.
                </p>
                <button
                  onClick={onActivateSession}
                  className="btn btn-black"
                  style={{ gap: 'var(--space-2)' }}
                >
                  <KeyRound size={14} /> Saisir mon code de session
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: 'var(--radius-xl)',
              background: 'var(--primary-50)', border: '1px solid var(--primary-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-5)',
              color: 'var(--primary-500)',
            }}>
              <Gamepad2 size={30} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--font-lg)', color: 'var(--neutral-800)', margin: '0 0 var(--space-2)' }}>
              Prêt à jouer ?
            </h3>
            <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)', margin: '0 0 var(--space-6)' }}>
              Demandez au caissier de lancer une session, puis entrez votre code pour démarrer.
            </p>
            <button
              onClick={onActivateSession}
              className="btn btn-black"
              style={{ display: 'inline-flex', gap: 'var(--space-2)' }}
            >
              <KeyRound size={15} /> J'ai un code de session <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Postes libres */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div className="stat-card-icon blue" style={{ width: '36px', height: '36px' }}>
              <Star size={16} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--font-base)', color: 'var(--neutral-800)', margin: 0 }}>
              Postes disponibles
              <span className="badge badge-success" style={{ marginLeft: 'var(--space-3)', fontSize: '10px' }}>
                {freePostes.length} libre{freePostes.length !== 1 ? 's' : ''}
              </span>
            </h3>
          </div>

          {freePostes.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <p className="empty-state-text" style={{ textAlign: 'center' }}>
                Tous les postes sont occupés en ce moment. 😅
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {freePostes.slice(0, 5).map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--neutral-100)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="status-dot libre" />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--neutral-800)', margin: 0 }}>
                        {p.name}
                      </p>
                      <p style={{ color: 'var(--neutral-400)', fontSize: '11px', margin: 0 }}>
                        {getMTypeLabel(p.type)}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '11px' }}>
                    {getMTypePrice(p.type)}
                  </span>
                </div>
              ))}
              {freePostes.length > 5 && (
                <p style={{ color: 'var(--neutral-400)', fontSize: 'var(--font-xs)', textAlign: 'center', margin: 0 }}>
                  + {freePostes.length - 5} autre(s) poste(s) libre(s)
                </p>
              )}
            </div>
          )}
        </div>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

// ─── Portail Principal ────────────────────────────────────────────────────────

export const JoueurPortal: React.FC = () => {
  const [loggedClient, setLoggedClient] = useState<MemberClient | null>(() => {
    try {
      const saved = sessionStorage.getItem('playcontrol_logged_client');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [screen, setScreen] = useState<'dashboard' | 'activate-code' | 'guest-success'>('dashboard');
  const [guestPoste, setGuestPoste] = useState<string>(''); // nom du poste activé pour l'invité
  const [postes, setPostes] = useState<GameStation[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: mtData } = await supabase
        .from('material_types')
        .select('*');
      if (mtData) {
        setMaterialTypes(mtData.map(r => ({
          id: r.id,
          type: r.type,
          label: r.label,
          price: r.price,
          durationMinutes: r.duration_minutes
        })));
      }

      const { data: ptData } = await supabase
        .from('postes')
        .select('*')
        .order('name', { ascending: true });
      if (ptData) {
        setPostes(ptData.map(mapPosteFromDb));
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des données :", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to postes changes
    const channel = supabase
      .channel('realtime-postes-player')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'postes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPost = mapPosteFromDb(payload.new);
            setPostes(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;
              return [...prev, newPost].sort((a, b) => a.name.localeCompare(b.name));
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapPosteFromDb(payload.new);
            setPostes(prev => prev.map(p => p.id === updated.id ? updated : p));
          } else if (payload.eventType === 'DELETE') {
            setPostes(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to changes of the logged-in client profile
  useEffect(() => {
    if (!loggedClient) return;

    const clientChannel = supabase
      .channel(`realtime-client-portal-${loggedClient.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${loggedClient.id}` },
        (payload) => {
          const updated = payload.new;
          const mapped: MemberClient = {
            id: updated.id,
            username: updated.username,
            fullName: updated.full_name,
            phone: updated.phone || '',
            balance: updated.balance,
            abonnementType: updated.abonnement_type,
            abonnementExpiration: updated.abonnement_expiration ? updated.abonnement_expiration.split('T')[0] : null,
            status: updated.status,
            abonnementRemainingTime: updated.abonnement_remaining_time
          };
          setLoggedClient(mapped);
          sessionStorage.setItem('playcontrol_logged_client', JSON.stringify(mapped));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(clientChannel);
    };
  }, [loggedClient?.id]);

  // Soumission d'un code de session depuis l'écran de connexion
  const handleSubmitCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    const normalized = code.trim().toUpperCase();
    
    // Rechercher le poste 'en-attente' correspondant en base
    const { data: posteData, error: posteError } = await supabase
      .from('postes')
      .select('*')
      .eq('session_code', normalized)
      .eq('status', 'en-attente')
      .maybeSingle();

    if (posteError || !posteData) {
      return { success: false, error: 'Code invalide ou déjà utilisé. Vérifiez auprès du caissier.' };
    }

    const poste = mapPosteFromDb(posteData);

    // Chercher si le client est un abonné/membre enregistré
    if (poste.clientName && !poste.clientName.startsWith('Invité-')) {
      const { data: clData, error: clError } = await supabase
        .from('clients')
        .select('*')
        .eq('username', poste.clientName)
        .maybeSingle();

      if (clError || !clData) {
        return { success: false, error: 'Client introuvable pour cette session.' };
      }

      if (clData.status === 'suspended') {
        return { success: false, error: 'Compte membre suspendu. Contactez le caissier.' };
      }

      // Activer le poste en base
      const { error: updateError } = await supabase
        .from('postes')
        .update({
          status: 'occupe',
          session_code: null
        })
        .eq('id', poste.id);

      if (updateError) {
        return { success: false, error: `Erreur d'activation : ${updateError.message}` };
      }

      const member: MemberClient = {
        id: clData.id,
        username: clData.username,
        fullName: clData.full_name,
        phone: clData.phone || '',
        balance: clData.balance,
        abonnementType: clData.abonnement_type,
        abonnementExpiration: clData.abonnement_expiration ? clData.abonnement_expiration.split('T')[0] : null,
        status: clData.status,
        abonnementRemainingTime: clData.abonnement_remaining_time
      };

      setLoggedClient(member);
      sessionStorage.setItem('playcontrol_logged_client', JSON.stringify(member));
      setScreen('dashboard');
      return { success: true };
    } else {
      // Activer le poste invité en base
      const { error: updateError } = await supabase
        .from('postes')
        .update({
          status: 'occupe',
          session_code: null
        })
        .eq('id', poste.id);

      if (updateError) {
        return { success: false, error: `Erreur d'activation : ${updateError.message}` };
      }

      setGuestPoste(poste.name);
      setScreen('guest-success');
      return { success: true };
    }
  };

  const handleLogout = () => {
    setLoggedClient(null);
    sessionStorage.removeItem('playcontrol_logged_client');
  };

  const handleActivated = async () => {
    setScreen('dashboard');
    if (loggedClient) {
      const { data: clData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', loggedClient.id)
        .maybeSingle();

      if (clData) {
        const updated: MemberClient = {
          id: clData.id,
          username: clData.username,
          fullName: clData.full_name,
          phone: clData.phone || '',
          balance: clData.balance,
          abonnementType: clData.abonnement_type,
          abonnementExpiration: clData.abonnement_expiration ? clData.abonnement_expiration.split('T')[0] : null,
          status: clData.status,
          abonnementRemainingTime: clData.abonnement_remaining_time
        };
        setLoggedClient(updated);
        sessionStorage.setItem('playcontrol_logged_client', JSON.stringify(updated));
      }
    }
  };

  // Écran de chargement initial
  if (loading && postes.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--neutral-50)' }}>
        <p style={{ color: 'var(--neutral-500)', fontWeight: 600 }}>Chargement du portail...</p>
      </div>
    );
  }

  // Écran succès pour invité
  if (screen === 'guest-success') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--neutral-50)', padding: 'var(--space-6)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,109,224,0.06) 0%, rgba(124,58,237,0.02) 100%)',
          top: '-100px', left: '-100px',
        }} />
        <div className="card animate-fade-in" style={{
          width: '100%', maxWidth: '440px', padding: 'var(--space-10)',
          boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--radius-xl)',
          zIndex: 1, border: '1px solid var(--neutral-100)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '56px', marginBottom: 'var(--space-4)' }}>🎮</div>
          <h1 className="gradient-text" style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
            Session lancée !
          </h1>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
            Votre session sur <strong>{guestPoste}</strong> est maintenant active. Bonne session ! 🕹️
          </p>
          <div style={{
            background: 'var(--success-50)', border: '1px solid var(--success-100)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
            color: 'var(--success-700)', fontSize: 'var(--font-sm)', fontWeight: 500,
          }}>
            ✅ Le timer démarre maintenant. Profitez bien !
          </div>
          <button
            onClick={() => setScreen('dashboard')}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 'var(--space-4)' }}
          >
            Aller à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!loggedClient) {
    return <LoginScreen onSubmitCode={handleSubmitCode} />;
  }

  if (screen === 'activate-code') {
    return (
      <CodeActivationScreen
        client={loggedClient}
        postes={postes}
        onActivated={handleActivated}
        onBack={() => setScreen('dashboard')}
      />
    );
  }

  return (
    <PlayerDashboard
      client={loggedClient}
      postes={postes}
      materialTypes={materialTypes}
      onLogout={handleLogout}
      onActivateSession={() => setScreen('activate-code')}
    />
  );
};
