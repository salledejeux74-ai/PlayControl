import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { 
  LayoutDashboard, Gamepad2, Users2, UserSquare2,
  Receipt, Landmark, Settings, LogOut, Bell, Wifi, WifiOff, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Route protection
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      if (user.role === 'superadmin') navigate('/superadmin');
      else navigate('/caissier');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
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

  const menuItems = [
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard Salle' },
    { to: '/admin/postes', icon: <Gamepad2 size={20} />, label: 'Gestion des Postes' },
    { to: '/admin/employes', icon: <Users2 size={20} />, label: 'Gestion Employés' },
    { to: '/admin/clients', icon: <UserSquare2 size={20} />, label: 'Gestion Clients' },
    { to: '/admin/tarifs', icon: <Receipt size={20} />, label: 'Tarifs & Abonnements' },
    { to: '/admin/revenus', icon: <Landmark size={20} />, label: 'Revenus & Rapports' },
    { to: '/admin/settings', icon: <Settings size={20} />, label: 'Paramètres Salle' },
  ];

  const mockNotifications = [
    { id: 1, text: "Le poste 'Console PS5 - VIP' est hors service.", time: "Il y a 5 min", type: "error" },
    { id: 2, text: "Abonnement VIP attribué au client 'Gamer_Pro'.", time: "Il y a 20 min", type: "success" },
    { id: 3, text: "Lancement de session caissier par Sophie.", time: "Il y a 1 heure", type: "info" },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--neutral-50)' }}>
      {/* Sidebar - Desktop */}
      <aside style={{
        width: isSidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--neutral-0)',
        borderRight: '1px solid var(--neutral-200)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-base)',
        position: 'fixed',
        height: '100vh',
        zIndex: 10,
        left: 0,
        top: 0
      }} className="desktop-sidebar">
        {/* Toggle Button on border */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="btn btn-secondary btn-icon"
          style={{
            position: 'absolute',
            right: '-14px',
            top: '24px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--neutral-200)',
            backgroundColor: 'var(--neutral-0)',
            cursor: 'pointer',
            zIndex: 100,
            transition: 'all 0.2s'
          }}
          title={isSidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          padding: '0 var(--space-5)',
          borderBottom: '1px solid var(--neutral-100)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src={logoImg} alt="Logo" style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              objectFit: 'cover',
              flexShrink: 0
            }} />
            {!isSidebarCollapsed && (
              <span className="gradient-text" style={{ fontWeight: 800, fontSize: 'var(--font-lg)', letterSpacing: '-0.5px' }}>
                PlayControl
              </span>
            )}
          </div>
        </div>

        <nav style={{ flex: 1, padding: 'var(--space-4) var(--space-3)', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--primary-50)' : 'var(--neutral-600)',
                backgroundColor: isActive ? 'var(--primary-500)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: 'var(--font-sm)',
                transition: 'all var(--transition-fast)',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              })}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 'var(--space-4) var(--space-3)', borderTop: '1px solid var(--neutral-100)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ 
              width: '100%', 
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', 
              color: 'var(--danger-500)', 
              gap: 'var(--space-4)',
              padding: isSidebarCollapsed ? 'var(--space-3) 0' : undefined 
            }}
            title="Déconnexion"
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        marginLeft: isSidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        transition: 'margin-left var(--transition-base)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* TopBar */}
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
          zIndex: 9
        }}>
          <button 
            className="btn btn-ghost mobile-menu-btn" 
            style={{ display: 'none', padding: 'var(--space-2)' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--neutral-700)' }}>
              Salle : <span style={{ color: 'var(--primary-500)' }}>Zone Gaming Center</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* Online/Offline LAN-friendly Status */}
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
              <span>{isOnline ? 'Serveur Cloud Connecté' : 'Mode Local-First Actif'}</span>
            </div>

            {/* Notifications */}
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
                  3
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
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>Alertes locales</span>
                    <button style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)', fontWeight: 600 }}>Effacer</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {mockNotifications.map(n => (
                      <div key={n.id} style={{
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: n.type === 'error' ? 'var(--danger-50)' : 'var(--neutral-50)',
                        fontSize: 'var(--font-xs)',
                        borderLeft: `3px solid ${n.type === 'error' ? 'var(--danger-500)' : 'var(--primary-400)'}`
                      }}>
                        <p style={{ color: 'var(--neutral-800)', fontWeight: 500, marginBottom: '2px' }}>{n.text}</p>
                        <span style={{ color: 'var(--neutral-400)', fontSize: '9px' }}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--neutral-200)' }} />

            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--gradient-primary)',
                color: 'var(--neutral-0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 'var(--font-base)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                AS
              </div>
              <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-800)', lineHeight: 1.2 }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-500)', textTransform: 'uppercase' }}>
                  Admin de Salle
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: 'var(--space-8) var(--space-8) var(--space-12)' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 100,
          display: 'flex'
        }}>
          <div style={{
            width: '280px',
            backgroundColor: 'var(--neutral-0)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--space-6)'
          }} className="animate-slide-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <img src={logoImg} alt="Logo" style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                <span className="gradient-text" style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>PlayControl</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="btn btn-ghost"><X size={20} /></button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--primary-500)' : 'var(--neutral-600)',
                    backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                  })}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-500)', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}
              >
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </nav>
          </div>
          <div style={{ flex: 1 }} onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          header {
            padding: 0 var(--space-4) !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .profile-info {
            display: none !important;
          }
          main {
            padding: var(--space-4) !important;
            margin-left: 0 !important;
          }
          div[style*="marginLeft"] {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
