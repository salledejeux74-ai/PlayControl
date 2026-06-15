import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { 
  MonitorPlay, Users, Wallet, LogOut, Bell, Wifi, WifiOff 
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export const CaissierLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  // Route protection
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'caissier') {
      if (user.role === 'superadmin') navigate('/superadmin');
      else navigate('/admin');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'caissier') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Chargement...
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      <main style={{ flex: 1, padding: 'var(--space-6) var(--space-6) var(--space-12)' }}>
        <Outlet />
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
    </div>
  );
};
