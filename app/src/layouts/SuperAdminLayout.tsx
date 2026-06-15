import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { 
  LayoutDashboard, Gamepad2, Users, FileKey, 
  BarChart3, FileSpreadsheet, Settings, LogOut, 
  Bell, Wifi, WifiOff, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Protection de route : redirige si pas connecté ou pas le bon rôle
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'superadmin') {
      // Rediriger vers son propre layout
      if (user.role === 'admin') navigate('/admin');
      else navigate('/caissier');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'superadmin') {
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
    { to: '/superadmin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/superadmin/salles', icon: <Gamepad2 size={20} />, label: 'Gestion des Salles' },
    { to: '/superadmin/admins', icon: <Users size={20} />, label: 'Gestion des Propriétaires' },
    { to: '/superadmin/licences', icon: <FileKey size={20} />, label: 'Gestion des Licences' },
    { to: '/superadmin/stats', icon: <BarChart3 size={20} />, label: 'Statistiques' },
    { to: '/superadmin/logs', icon: <FileSpreadsheet size={20} />, label: 'Journaux d\'activité' },
    { to: '/superadmin/settings', icon: <Settings size={20} />, label: 'Paramètres Système' },
  ];

  const mockNotifications = [
    { id: 1, text: "La licence de la salle 'Zone Gaming' expire dans 3 jours.", time: "Il y a 10 min", type: "warning" },
    { id: 2, text: "Nouvel administrateur créé pour la salle 'Play Arena'.", time: "Il y a 1 heure", type: "info" },
    { id: 3, text: "Sauvegarde automatique réussie.", time: "Il y a 3 heures", type: "success" },
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
        {/* Sidebar Header */}
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
          
          {!isSidebarCollapsed && (
            <button 
              onClick={() => setIsSidebarCollapsed(true)} 
              className="btn-ghost" 
              style={{ padding: '4px', borderRadius: 'var(--radius-sm)' }}
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav style={{ flex: 1, padding: 'var(--space-4) var(--space-3)', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/superadmin'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--primary-500)' : 'var(--neutral-600)',
                backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
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

        {/* Sidebar Footer */}
        <div style={{ padding: 'var(--space-4) var(--space-3)', borderTop: '1px solid var(--neutral-100)' }}>
          {isSidebarCollapsed ? (
            <button 
              onClick={() => setIsSidebarCollapsed(false)}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-500)', gap: 'var(--space-4)' }}
            >
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          )}
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
          {/* Mobile menu trigger */}
          <button 
            className="btn btn-ghost mobile-menu-btn" 
            style={{ display: 'none', padding: 'var(--space-2)' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-500)' }}>
              Super Administration Panel
            </span>
          </div>

          {/* TopBar Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* Online Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isOnline ? 'var(--success-50)' : 'var(--danger-50)',
              color: isOnline ? 'var(--success-700)' : 'var(--danger-600)',
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              border: `1px solid ${isOnline ? 'var(--success-100)' : 'var(--danger-100)'}`
            }}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
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
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>Notifications</span>
                    <button style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)', fontWeight: 600 }}>Tout marquer lu</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {mockNotifications.map(n => (
                      <div key={n.id} style={{
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: n.type === 'warning' ? 'var(--warning-50)' : 'var(--neutral-50)',
                        fontSize: 'var(--font-xs)',
                        borderLeft: `3px solid ${n.type === 'warning' ? 'var(--warning-500)' : 'var(--primary-400)'}`
                      }}>
                        <p style={{ color: 'var(--neutral-800)', fontWeight: 500, marginBottom: '2px' }}>{n.text}</p>
                        <span style={{ color: 'var(--neutral-400)', fontSize: '9px' }}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--neutral-200)' }} />

            {/* Profile Menu */}
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
                SA
              </div>
              <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-800)', lineHeight: 1.2 }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--primary-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Super Admin
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

      {/* Mobile Drawer Menu (Alternative layout for mobile viewports) */}
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

      {/* Inline styles for media query responsive support */}
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
