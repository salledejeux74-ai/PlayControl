import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { 
  LayoutDashboard, Gamepad2, Users, FileKey, 
  BarChart3, FileSpreadsheet, Settings, LogOut, 
  Bell, Wifi, WifiOff, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

interface AppNotification {
  id: string;
  salle_id: string | null;
  recipient_role: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ── Notifications dynamiques ───────────────────────────────────────────────
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .in('recipient_role', ['superadmin', 'all'])
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) { console.warn('[Notifications SA] fetch error:', error.message); return; }
    if (data) setNotifications(data as AppNotification[]);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel('notif-superadmin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as AppNotification & { recipient_role?: string };
          if (n.recipient_role === 'superadmin' || n.recipient_role === 'all') {
            setNotifications(prev => [n, ...prev].slice(0, 30));
          }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const updated = payload.new as AppNotification;
          setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('recipient_role', ['superadmin', 'all'])
      .eq('is_read', false);
    if (error) { console.warn('[Notifications SA] mark-read error:', error.message); fetchNotifications(); }
  };

  const formatNotifTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return new Date(iso).toLocaleDateString('fr-FR');
  };

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
    { to: '/superadmin/admins', icon: <Users size={20} />, label: 'Gestion des Gérants' },
    { to: '/superadmin/licences', icon: <FileKey size={20} />, label: 'Gestion des Licences' },
    { to: '/superadmin/stats', icon: <BarChart3 size={20} />, label: 'Statistiques' },
    { to: '/superadmin/logs', icon: <FileSpreadsheet size={20} />, label: 'Journaux d\'activité' },
    { to: '/superadmin/settings', icon: <Settings size={20} />, label: 'Paramètres Système' },
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

        {/* Sidebar Footer */}
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
      <div 
        className="main-content-wrapper"
        style={{
          flex: 1,
          marginLeft: isSidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          transition: 'margin-left var(--transition-base)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
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
            <span className="topbar-title" style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-500)' }}>
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
              <span className="status-label">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </div>

            {/* Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn btn-secondary btn-icon"
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    backgroundColor: 'var(--danger-500)', color: 'var(--neutral-0)',
                    fontSize: '9px', fontWeight: 700, width: '16px', height: '16px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 2px var(--neutral-0)'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute', right: 0, top: '46px', width: '340px',
                  backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)', border: '1px solid var(--neutral-200)',
                  zIndex: 20, overflow: 'hidden',
                }} className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--neutral-100)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--danger-500)', color: '#fff', borderRadius: '20px', padding: '1px 7px' }}>
                          {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead}
                        style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '360px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--neutral-400)', fontSize: 'var(--font-xs)', fontWeight: 500 }}>
                        Aucune notification pour le moment
                      </div>
                    ) : (
                      notifications.map(n => {
                        const borderColor = n.type === 'error' ? 'var(--danger-500)' : n.type === 'success' ? 'var(--success-500)' : n.type === 'warning' ? '#f59e0b' : 'var(--primary-400)';
                        const bgColor = n.is_read ? 'var(--neutral-0)' : n.type === 'error' ? 'var(--danger-50)' : n.type === 'success' ? '#f0fdf4' : n.type === 'warning' ? '#fffbeb' : 'var(--primary-50)';
                        return (
                          <div key={n.id} style={{
                            padding: 'var(--space-3) var(--space-4)', backgroundColor: bgColor,
                            borderLeft: `3px solid ${borderColor}`, borderBottom: '1px solid var(--neutral-100)',
                          }}>
                            <p style={{ color: 'var(--neutral-800)', fontWeight: n.is_read ? 500 : 700, marginBottom: '2px', fontSize: 'var(--font-xs)', lineHeight: 1.4 }}>{n.title}</p>
                            <p style={{ color: 'var(--neutral-500)', fontSize: '11px', marginBottom: '3px', lineHeight: 1.3 }}>{n.message}</p>
                            <span style={{ color: 'var(--neutral-400)', fontSize: '10px', fontWeight: 500 }}>{formatNotifTime(n.created_at)}</span>
                          </div>
                        );
                      })
                    )}
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
        @media (max-width: 992px) {
          .status-label {
            display: none !important;
          }
        }
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
          .main-content-wrapper {
            margin-left: 0 !important;
          }
        }
        @media (max-width: 576px) {
          .topbar-title {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
