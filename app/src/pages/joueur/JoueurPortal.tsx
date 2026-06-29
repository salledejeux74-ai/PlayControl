import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Clock, Play, LogOut, KeyRound, ChevronRight } from 'lucide-react';
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
  salleId?: string;
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
  salleId?: string;
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
  updatedAt: p.updated_at,
  salleId: p.salle_id
});




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
        className="card portal-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
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

    // Find a poste 'en-attente' or 'occupe' with matching code AND client name
    const matchedPoste = postes.find(
      p => (p.status === 'en-attente' || p.status === 'occupe') &&
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

    // Activate in database: set status to 'occupe', keep session_code
    const { error: updateErr } = await supabase
      .from('postes')
      .update({
        status: 'occupe'
      })
      .eq('id', matchedPoste.id);

    if (updateErr) {
      setError(updateErr.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    localStorage.setItem('playcontrol_session_code', normalized);
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
        className="card portal-card animate-fade-in"
        style={{
          width: '100%', maxWidth: '440px',
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




  const myActivePoste = postes.find(
    p => (p.status === 'occupe' || p.status === 'en-attente') && p.clientName === client.username
  );
  const getMTypeLabel = (type: string) => materialTypes.find(t => t.type === type)?.label || type;

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
                Bonjour, {client.id === 'guest' ? 'Joueur' : client.fullName.split(' ')[0]} 👋
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
        {client.id !== 'guest' && (
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
        )}

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



      </div>


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
  const [screen, setScreen] = useState<'dashboard' | 'activate-code'>('dashboard');
  const [postes, setPostes] = useState<GameStation[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams(window.location.search);
      const urlSalleId = queryParams.get('salle_id');
      if (urlSalleId) {
        localStorage.setItem('playcontrol_portal_salle_id', urlSalleId);
      }
      const portalSalleId = urlSalleId || localStorage.getItem('playcontrol_portal_salle_id') || null;

      let mtQuery = supabase.from('material_types').select('*');
      if (portalSalleId) {
        mtQuery = mtQuery.eq('salle_id', portalSalleId);
      }
      const { data: mtData } = await mtQuery;

      if (mtData) {
        setMaterialTypes(mtData.map(r => ({
          id: r.id,
          type: r.type,
          label: r.label,
          price: r.price,
          durationMinutes: r.duration_minutes
        })));
      }

      let ptQuery = supabase.from('postes').select('*');
      if (portalSalleId) {
        ptQuery = ptQuery.eq('salle_id', portalSalleId);
      }
      const { data: ptData } = await ptQuery.order('name', { ascending: true });
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
          const portalSalleId = new URLSearchParams(window.location.search).get('salle_id') || localStorage.getItem('playcontrol_portal_salle_id');
          
          if (payload.eventType === 'INSERT') {
            const newPost = mapPosteFromDb(payload.new);
            if (portalSalleId && newPost.salleId !== portalSalleId) return;
            setPostes(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;
              return [...prev, newPost].sort((a, b) => a.name.localeCompare(b.name));
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapPosteFromDb(payload.new);
            if (portalSalleId && updated.salleId !== portalSalleId) return;
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
            abonnementRemainingTime: updated.abonnement_remaining_time,
            salleId: updated.salle_id
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
    
    // Rechercher le poste correspondant en base (qu'il soit en-attente ou déjà occupe pour reconnexion)
    const { data: posteData, error: posteError } = await supabase
      .from('postes')
      .select('*')
      .eq('session_code', normalized)
      .in('status', ['en-attente', 'occupe'])
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

      // Activer le poste en base (ou laisser tel quel s'il est déjà occupé)
      const { error: updateError } = await supabase
        .from('postes')
        .update({
          status: 'occupe'
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
        abonnementRemainingTime: clData.abonnement_remaining_time,
        salleId: clData.salle_id
      };

      setLoggedClient(member);
      sessionStorage.setItem('playcontrol_logged_client', JSON.stringify(member));
      localStorage.setItem('playcontrol_session_code', normalized);
      setScreen('dashboard');
      return { success: true };
    } else {
      // Activer le poste invité en base (ou laisser tel quel s'il est déjà occupé)
      const { error: updateError } = await supabase
        .from('postes')
        .update({
          status: 'occupe'
        })
        .eq('id', poste.id);

      if (updateError) {
        return { success: false, error: `Erreur d'activation : ${updateError.message}` };
      }

      const guest: MemberClient = {
        id: 'guest',
        username: poste.clientName || 'guest',
        fullName: poste.clientName || 'Joueur Invité',
        phone: '',
        balance: 0,
        abonnementType: 'Aucun',
        abonnementExpiration: null,
        status: 'active'
      };

      setLoggedClient(guest);
      sessionStorage.setItem('playcontrol_logged_client', JSON.stringify(guest));
      localStorage.setItem('playcontrol_session_code', normalized);
      setScreen('dashboard');
      return { success: true };
    }
  };

  const handleLogout = () => {
    setLoggedClient(null);
    sessionStorage.removeItem('playcontrol_logged_client');
    localStorage.removeItem('playcontrol_session_code');
  };

  const handleCancelLeave = () => {
    setShowLeaveModal(false);
    window.history.pushState('active-session', '', window.location.href);
  };

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
    handleLogout();
  };

  // Auto-login avec le code stocké localement si la session est toujours active
  useEffect(() => {
    const autoLogin = async () => {
      const savedCode = localStorage.getItem('playcontrol_session_code');
      if (savedCode && !loggedClient) {
        try {
          const res = await handleSubmitCode(savedCode);
          if (!res.success) {
            // Le code n'est plus valide/actif, on nettoie le localStorage
            localStorage.removeItem('playcontrol_session_code');
          }
        } catch (e) {
          console.error("Erreur de reconnexion automatique :", e);
        }
      }
    };
    if (postes.length > 0) {
      autoLogin();
    }
  }, [postes.length]);

  // Déconnexion automatique pour les invités si la session se termine
  useEffect(() => {
    if (loggedClient && postes.length > 0) {
      const myActivePoste = postes.find(
        p => (p.status === 'occupe' || p.status === 'en-attente') && p.clientName === loggedClient.username
      );
      if (!myActivePoste && loggedClient.id === 'guest') {
        handleLogout();
      }
    }
  }, [postes, loggedClient]);

  // Avertir l'utilisateur s'il essaie de quitter la page avec une session active
  const hasActiveSession = postes.some(
    p => p.status === 'occupe' && loggedClient && p.clientName === loggedClient.username
  );

  const hasActiveSessionRef = useRef(hasActiveSession);

  useEffect(() => {
    hasActiveSessionRef.current = hasActiveSession;

    // Si la session devient active, on pousse un état dans l'historique une seule fois
    if (hasActiveSession) {
      if (window.history.state !== 'active-session') {
        window.history.pushState('active-session', '', window.location.href);
      }
    }
  }, [hasActiveSession]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasActiveSessionRef.current) {
        e.preventDefault();
        e.returnValue = 'Votre session de jeu est en cours. Si vous quittez la page, vous perdrez le suivi du minuteur.';
        return e.returnValue;
      }
    };

    const handlePopState = () => {
      if (hasActiveSessionRef.current) {
        // Bloquer le retour arrière et afficher le modal React personnalisé
        setShowLeaveModal(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
          abonnementRemainingTime: clData.abonnement_remaining_time,
          salleId: clData.salle_id
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
    <>
      <PlayerDashboard
        client={loggedClient}
        postes={postes}
        materialTypes={materialTypes}
        onLogout={handleLogout}
        onActivateSession={() => setScreen('activate-code')}
      />

      {showLeaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 'var(--space-4)',
        }}>
          <div style={{
            background: 'var(--neutral-0)',
            width: '100%',
            maxWidth: '400px',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--neutral-100)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--danger-50)',
              color: 'var(--danger-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto'
            }}>
              ⚠️
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--neutral-800)', margin: '0 0 var(--space-2)' }}>
                Session en cours !
              </h3>
              <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)', lineHeight: 1.5, margin: 0 }}>
                Votre session de jeu est toujours active. Si vous quittez cette page, vous ne pourrez plus suivre votre minuteur.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button
                onClick={handleCancelLeave}
                className="btn btn-black"
                style={{ width: '100%' }}
              >
                Rester sur la session
              </button>
              <button
                onClick={handleConfirmLeave}
                className="btn btn-secondary"
                style={{ width: '100%', color: 'var(--danger-600)', borderColor: 'var(--danger-100)' }}
              >
                Quitter quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
