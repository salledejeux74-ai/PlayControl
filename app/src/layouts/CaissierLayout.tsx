import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { 
  MonitorPlay, Users, Wallet, LogOut, Bell, Wifi, WifiOff, ShieldAlert
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';
import { supabase } from '../lib/supabaseClient';



export const CaissierLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [restrictionModal, setRestrictionModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [isShiftActive, setIsShiftActive] = useState<boolean>(false);
  const [initialCashInput, setInitialCashInput] = useState<string>('50000');
  const [loadingShift, setLoadingShift] = useState<boolean>(true);

  // License checking states
  const [checkingLicense, setCheckingLicense] = useState(true);
  const [isLicenseValid, setIsLicenseValid] = useState(false);
  const [salleName, setSalleName] = useState('');

  const checkLicense = async () => {
    if (!user || !user.salleId) {
      setCheckingLicense(false);
      return;
    }
    try {
      // 1. Fetch salle details
      const { data: salleData } = await supabase
        .from('salles')
        .select('name')
        .eq('id', user.salleId)
        .maybeSingle();
      if (salleData) {
        setSalleName(salleData.name);
      }

      // 2. Fetch latest license
      const { data: licData } = await supabase
        .from('licences')
        .select('*')
        .eq('salle_id', user.salleId)
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (licData) {
        const expiresAt = new Date(licData.expires_at);
        const now = new Date();
        if (expiresAt > now && licData.status !== 'expired') {
          setIsLicenseValid(true);
        } else {
          setIsLicenseValid(false);
        }
      } else {
        setIsLicenseValid(false);
      }
    } catch (err) {
      console.error('Error checking license:', err);
    } finally {
      setCheckingLicense(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'caissier') {
      checkLicense();
    } else {
      setCheckingLicense(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const checkOpenShift = async () => {
      try {
        const { data } = await supabase
          .from('shifts')
          .select('id, initial_cash')
          .eq('cashier_id', user.id)
          .eq('status', 'open')
          .maybeSingle();

        if (data) {
          setIsShiftActive(true);
          localStorage.setItem('playcontrol_shift_active', 'true');
          localStorage.setItem('playcontrol_shift_initial_cash', String(data.initial_cash));
        } else {
          setIsShiftActive(false);
          localStorage.setItem('playcontrol_shift_active', 'false');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingShift(false);
      }
    };
    checkOpenShift();
  }, [user?.id]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const val = Number(initialCashInput);
    if (isNaN(val) || val < 0) return;

    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          cashier_id: user.id,
          initial_cash: val,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setIsShiftActive(true);
        localStorage.setItem('playcontrol_shift_active', 'true');
        localStorage.setItem('playcontrol_shift_initial_cash', String(val));
      }
    } catch (err: any) {
      alert("Erreur lors de l'ouverture du shift : " + err.message);
    }
  };

  // Route protection
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'caissier') {
      if (user.role === 'superadmin') navigate('/superadmin');
      else navigate('/admin');
    }
  }, [user, navigate]);

  const handleForceLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || user.role !== 'caissier' || checkingLicense) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--primary-100)', borderTopColor: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-500)', fontWeight: 600 }}>
          Vérification de la licence de la salle...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isLicenseValid) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--neutral-50)',
        padding: 'var(--space-6)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif'
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
          maxWidth: '440px',
          width: '100%',
          backgroundColor: 'var(--neutral-0)',
          border: '1px solid var(--neutral-100)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-6)',
          textAlign: 'center',
          zIndex: 1
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--danger-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--danger-500)',
            border: '1px solid var(--danger-100)'
          }}>
            <ShieldAlert size={36} />
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--neutral-800)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              Accès Caisse Bloqué
            </h2>
            <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              La licence logicielle de la salle <strong style={{ color: 'var(--neutral-800)' }}>{salleName || '...'}</strong> est expirée ou inactive.
            </p>
            <div style={{
              backgroundColor: 'var(--danger-50)',
              border: '1px solid var(--danger-100)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: 'var(--danger-700)',
              fontSize: 'var(--font-xs)',
              textAlign: 'left',
              lineHeight: 1.4
            }}>
              Veuillez contacter le gérant de la salle pour qu'il active une nouvelle licence depuis son interface d'administration.
            </div>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid var(--neutral-100)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleForceLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--neutral-500)',
                fontSize: 'var(--font-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-500)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--neutral-500)'}
            >
              <LogOut size={14} /> Se déconnecter de la session
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const { data: openShift } = await supabase
        .from('shifts')
        .select('id')
        .eq('cashier_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

      const { data: activePostes } = await supabase
        .from('postes')
        .select('id')
        .eq('status', 'occupe');

      const activeShift = !!openShift;
      const hasActiveConsole = activePostes && activePostes.length > 0;

      if (activeShift || hasActiveConsole) {
        const reasons: string[] = [];
        if (activeShift) {
          reasons.push("votre caisse/shift est actif");
        }
        if (hasActiveConsole) {
          reasons.push("au moins une console tourne");
        }
        setRestrictionModal({
          isOpen: true,
          title: "Déconnexion impossible",
          message: `Vous ne pouvez pas vous déconnecter car ${reasons.join(' et ')}. Veuillez clôturer les sessions de jeu et fermer la caisse avant de vous déconnecter.`
        });
        return;
      }

      logout();
      navigate('/login');
    } catch (err: any) {
      console.error(err);
    }
  };

  const navLinks = [
    { to: '/caissier', icon: <MonitorPlay size={18} />, label: 'Postes & Sessions' },
    { to: '/caissier/clients', icon: <Users size={18} />, label: 'Clients & Abonnements' },
    { to: '/caissier/encaissements', icon: <Wallet size={18} />, label: 'Caisse & Paiements' },
  ];

  const mockNotifications = [
    { id: 1, text: "La session de Gamer_99 sur le Poste 3 se termine dans 5 min !", time: "À l'instant", type: "urgent" },
    { id: 2, text: "Abonnement expiré pour le client Jean_Dupont.", time: "Il y a 10 min", type: "warning" },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--neutral-50)' }}>
      {/* Header / Navbar */}
      <header style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--neutral-0)',
        borderBottom: '1px solid var(--neutral-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-xs)'
      }}>
        {/* Brand & Cashier Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <img src={logoImg} alt="Logo" style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            objectFit: 'cover',
            flexShrink: 0
          }} />
          <div>
            <span className="gradient-text" style={{ fontWeight: 800, fontSize: 'var(--font-base)', display: 'block', lineHeight: 1.2 }}>
              PlayControl
            </span>
            <span style={{ fontSize: '10px', color: 'var(--neutral-500)', fontWeight: 600 }}>
              TERMINAL CAISSIER
            </span>
          </div>
        </div>

        {/* Center Navigation Links (Tabs style for cashier ease of use) */}
        {isShiftActive && (
          <nav style={{ display: 'flex', gap: 'var(--space-2)' }} className="cashier-nav">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/caissier'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--primary-500)' : 'var(--neutral-600)',
                  backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                  fontWeight: 600,
                  fontSize: 'var(--font-sm)',
                  transition: 'all var(--transition-fast)',
                  border: `1px solid ${isActive ? 'var(--primary-100)' : 'transparent'}`
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {/* Offline local status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isOnline ? 'var(--success-50)' : 'var(--primary-50)',
            color: isOnline ? 'var(--success-700)' : 'var(--primary-700)',
            fontSize: 'var(--font-xs)',
            fontWeight: 600,
            border: `1px solid ${isOnline ? 'var(--success-100)' : 'var(--primary-100)'}`
          }}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="status-label">{isOnline ? 'Mode Cloud Connecté' : 'Mode Hors-ligne / Réseau Local'}</span>
          </div>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-secondary btn-icon" 
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <Bell size={18} />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: 'var(--danger-500)',
                color: 'var(--neutral-0)',
                fontSize: '9px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px var(--neutral-0)'
              }}>
                2
              </span>
            </button>

            {showNotifications && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '320px',
                backgroundColor: 'var(--neutral-0)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--neutral-200)',
                padding: 'var(--space-4)',
                zIndex: 20
              }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--neutral-100)' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>Alertes caisse</span>
                  <button style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)', fontWeight: 600 }}>Effacer</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {mockNotifications.map(n => (
                    <div key={n.id} style={{
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: n.type === 'urgent' ? 'var(--danger-50)' : 'var(--warning-50)',
                      fontSize: 'var(--font-xs)',
                      borderLeft: `3px solid ${n.type === 'urgent' ? 'var(--danger-500)' : 'var(--warning-500)'}`
                    }}>
                      <p style={{ color: 'var(--neutral-800)', fontWeight: 600, marginBottom: '2px' }}>{n.text}</p>
                      <span style={{ color: 'var(--neutral-400)', fontSize: '9px' }}>{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--neutral-200)' }} />

          {/* User info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="cashier-user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-800)', lineHeight: 1.2 }}>
                {user.name}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--success-600)' }}>
                Session active
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-icon"
              style={{ borderRadius: 'var(--radius-full)', color: 'var(--danger-500)', borderColor: 'var(--danger-100)', backgroundColor: 'var(--danger-50)' }}
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Pane */}
      <main style={{ flex: 1, padding: 'var(--space-6) var(--space-6) var(--space-12)', display: 'flex', flexDirection: 'column' }}>
        {loadingShift ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--neutral-500)', fontWeight: 600 }}>Chargement de l'état de caisse...</p>
          </div>
        ) : isShiftActive ? (
          <Outlet />
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6) 0'
          }}>
            <div className="card animate-fade-in" style={{
              width: '100%',
              maxWidth: '460px',
              padding: 'var(--space-8)',
              borderTop: '5px solid var(--primary-500)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-6)'
            }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-2)'
                }}>
                  <Wallet size={28} />
                </div>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--neutral-800)', margin: 0 }}>
                  Ouverture de la Caisse
                </h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-500)', margin: 0, lineHeight: 1.5 }}>
                  Veuillez vérifier et saisir le montant du fonds de caisse initial présent physiquement dans le tiroir-caisse pour démarrer votre shift.
                </p>
              </div>

              <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label className="input-label" style={{ fontWeight: 700 }}>
                    Fonds de Caisse Initial (FCFA)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={initialCashInput}
                    onChange={(e) => setInitialCashInput(e.target.value)}
                    placeholder="50000"
                    min={0}
                    required
                    style={{
                      height: '46px',
                      fontSize: 'var(--font-lg)',
                      fontWeight: 700,
                      textAlign: 'center',
                      letterSpacing: '1px'
                    }}
                  />
                  <span className="input-hint" style={{ textAlign: 'center' }}>
                    Ce montant servira de référence pour le calcul des écarts lors de la clôture.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-black"
                  style={{
                    height: '46px',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--font-base)',
                    fontWeight: 700
                  }}
                >
                  Démarrer la caisse et le shift
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 992px) {
          .status-label {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          header {
            padding: 0 var(--space-4) !important;
            flex-wrap: wrap;
            height: auto !important;
            padding-top: var(--space-2) !important;
            padding-bottom: var(--space-2) !important;
            gap: var(--space-3);
          }
          .cashier-nav {
            order: 3;
            width: 100%;
            justify-content: space-between;
          }
          .cashier-user-info {
            display: none !important;
          }
          main {
            padding: var(--space-4) !important;
          }
        }
      `}</style>
      {restrictionModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 'var(--space-4)'
        }}>
          <div className="card animate-fade-in" style={{
            width: '100%',
            maxWidth: '440px',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-xl)',
            borderTop: '5px solid var(--danger-500)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--neutral-0)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--danger-50)',
                color: 'var(--danger-600)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldAlert size={20} />
              </div>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--neutral-800)', margin: 0 }}>
                {restrictionModal.title}
              </h3>
            </div>
            
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)', margin: 0, lineHeight: 1.5 }}>
              {restrictionModal.message}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button 
                onClick={() => setRestrictionModal({ ...restrictionModal, isOpen: false })}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: 'var(--font-sm)' }}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
