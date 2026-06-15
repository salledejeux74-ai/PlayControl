import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Gamepad2, Monitor, HelpCircle, Search, Play, Ban, 
  ArrowRightLeft, Clock
} from 'lucide-react';

interface GameStation {
  id: string;
  name: string;
  type: 'console' | 'pc' | 'vr';
  characteristics: string;
  smartPlugIp: string;
  status: 'libre' | 'occupe' | 'hors-service';
  clientName?: string;
  minutesRemaining?: number;
  totalDuration?: number; // In minutes
}

interface MockClient {
  id: string;
  username: string;
  fullName: string;
  balance: number;
  hasAbonnement: boolean;
  abonnementType?: string;
  abonnementRemainingTime?: number; // In minutes
}

export const CaissierDashboard: React.FC = () => {
  const [postes, setPostes] = useState<GameStation[]>([
    { id: '1', name: 'PS5 - VIP #1', type: 'console', characteristics: 'Écran 4K 120Hz, Manette DualSense Edge', smartPlugIp: '192.168.1.101', status: 'occupe', clientName: 'Gamer_Pro', minutesRemaining: 45, totalDuration: 120 },
    { id: '2', name: 'PS5 - Standard #2', type: 'console', characteristics: 'Écran 1080p, Manette standard', smartPlugIp: '192.168.1.102', status: 'libre' },
    { id: '3', name: 'PS5 - Standard #3', type: 'console', characteristics: 'Écran 1080p, Manette standard', smartPlugIp: '192.168.1.103', status: 'hors-service' },
    { id: '4', name: 'PC Gamer RTX #1', type: 'pc', characteristics: 'RTX 4080, Core i7, 32GB RAM, 240Hz', smartPlugIp: '192.168.1.201', status: 'occupe', clientName: 'Marc_K', minutesRemaining: 120, totalDuration: 180 },
    { id: '5', name: 'PC Gamer RTX #2', type: 'pc', characteristics: 'RTX 4070, Core i5, 16GB RAM, 144Hz', smartPlugIp: '192.168.1.202', status: 'libre' },
    { id: '6', name: 'PC Gamer RTX #3', type: 'pc', characteristics: 'RTX 4070, Core i5, 16GB RAM, 144Hz', smartPlugIp: '192.168.1.203', status: 'libre' },
    { id: '7', name: 'VR HTC Vive #1', type: 'vr', characteristics: 'HTC Vive Pro 2, Espace de jeu 3x3m', smartPlugIp: '192.168.1.301', status: 'occupe', clientName: 'Alain_T', minutesRemaining: 15, totalDuration: 60 },
    { id: '8', name: 'VR Meta Quest #2', type: 'vr', characteristics: 'Meta Quest 3, Liaison PC sans-fil', smartPlugIp: '192.168.1.302', status: 'libre' },
  ]);

  const mockClients: MockClient[] = [
    { id: '1', username: 'Gamer_Pro', fullName: 'Arthur Mbe', balance: 5400, hasAbonnement: true, abonnementType: 'VIP', abonnementRemainingTime: 240 },
    { id: '2', username: 'Marc_K', fullName: 'Marc Kemajou', balance: 12500, hasAbonnement: false },
    { id: '3', username: 'Alain_T', fullName: 'Alain Tchakounté', balance: 750, hasAbonnement: false },
    { id: '4', username: 'Serge_F', fullName: 'Serge Fotso', balance: 3200, hasAbonnement: true, abonnementType: 'Hebdomadaire', abonnementRemainingTime: 90 },
    { id: '5', username: 'Amadou_B', fullName: 'Amadou Bello', balance: 0, hasAbonnement: false },
  ];

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'console' | 'pc' | 'vr'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'libre' | 'occupe' | 'hors-service'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showLaunchModal, setShowLaunchModal] = useState<GameStation | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<GameStation | null>(null);
  const [showExtendModal, setShowExtendModal] = useState<GameStation | null>(null);

  // Session Launch states
  const [isGuest, setIsGuest] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [selectedClient, setSelectedClient] = useState(mockClients[1].username); // Default to Marc_K
  const [launchMode, setLaunchMode] = useState<'time' | 'abonnement'>('time');
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // 60 minutes
  const [customDuration, setCustomDuration] = useState<string>('');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Custom confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);

  const openConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  // Live Timer Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPostes(prevPostes => 
        prevPostes.map(post => {
          if (post.status === 'occupe' && post.minutesRemaining !== undefined) {
            if (post.minutesRemaining <= 1) {
              showToastMsg(`La session sur "${post.name}" pour "${post.clientName}" est terminée.`);
              return { ...post, status: 'libre', clientName: undefined, minutesRemaining: undefined, totalDuration: undefined };
            }
            return { ...post, minutesRemaining: post.minutesRemaining - 1 };
          }
          return post;
        })
      );
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Out of Service Toggle
  const handleToggleOutOfService = (id: string, name: string, currentStatus: 'libre' | 'occupe' | 'hors-service') => {
    const isHS = currentStatus === 'hors-service';
    openConfirm(
      isHS ? "Remettre en service" : "Mettre hors service",
      isHS ? `Voulez-vous remettre en service le poste "${name}" ?` : `Voulez-vous suspendre temporairement le poste "${name}" pour maintenance ou panne ?`,
      () => {
        setPostes(postes.map(p => {
          if (p.id === id) {
            return { ...p, status: isHS ? 'libre' : 'hors-service', clientName: undefined, minutesRemaining: undefined };
          }
          return p;
        }));
        showToastMsg(`Le poste "${name}" est désormais ${isHS ? 'Libre' : 'Hors Service'}.`);
      },
      isHS ? 'info' : 'warning'
    );
  };

  // Launch Session
  const handleLaunchSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLaunchModal) return;

    let finalClientName = '';
    let finalDuration = 0;

    const duration = customDuration ? Number(customDuration) : selectedDuration;

    if (isGuest) {
      if (!guestName.trim()) {
        showToastMsg("Veuillez saisir le nom du joueur invité.", "error");
        return;
      }
      finalClientName = guestName.trim();
      finalDuration = duration;
    } else {
      const targetClient = mockClients.find(c => c.username === selectedClient);
      if (!targetClient) return;

      const ratePerHour = showLaunchModal.type === 'console' ? 1200 : showLaunchModal.type === 'pc' ? 800 : 2500;
      const cost = Math.ceil((ratePerHour / 60) * duration);

      if (launchMode === 'time' && targetClient.balance < cost) {
        showToastMsg(`Solde insuffisant pour ${targetClient.fullName}. Requis : ${cost} FCFA. Solde : ${targetClient.balance} FCFA.`, 'error');
        return;
      }

      if (launchMode === 'abonnement' && (!targetClient.hasAbonnement || (targetClient.abonnementRemainingTime || 0) <= 0)) {
        showToastMsg(`Le client ${targetClient.fullName} ne dispose pas d'un abonnement actif.`, 'error');
        return;
      }

      finalClientName = targetClient.username;
      finalDuration = launchMode === 'time' ? duration : (targetClient.abonnementRemainingTime || 60);
    }

    setPostes(postes.map(p => {
      if (p.id === showLaunchModal.id) {
        return {
          ...p,
          status: 'occupe',
          clientName: finalClientName,
          minutesRemaining: finalDuration,
          totalDuration: finalDuration
        };
      }
      return p;
    }));

    setShowLaunchModal(null);
    setCustomDuration('');
    setGuestName('');
    setIsGuest(true);
    showToastMsg(`Session lancée sur "${showLaunchModal.name}" pour "${finalClientName}".`);
  };

  // Terminate Session early
  const handleEndSession = (id: string, name: string, clientName: string) => {
    openConfirm(
      "Terminer la session",
      `Êtes-vous sûr de vouloir forcer la fin de la session de "${clientName}" sur le poste "${name}" ?`,
      () => {
        setPostes(postes.map(p => {
          if (p.id === id) {
            return { ...p, status: 'libre', clientName: undefined, minutesRemaining: undefined, totalDuration: undefined };
          }
          return p;
        }));
        showToastMsg(`La session sur "${name}" a été arrêtée.`);
      },
      'danger'
    );
  };

  // Extend Session
  const handleExtendSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showExtendModal || showExtendModal.minutesRemaining === undefined) return;

    const extMinutes = customDuration ? Number(customDuration) : selectedDuration;

    setPostes(postes.map(p => {
      if (p.id === showExtendModal.id) {
        return {
          ...p,
          minutesRemaining: (p.minutesRemaining || 0) + extMinutes,
          totalDuration: (p.totalDuration || 0) + extMinutes
        };
      }
      return p;
    }));

    setShowExtendModal(null);
    setCustomDuration('');
    showToastMsg(`Session sur "${showExtendModal.name}" prolongée de ${extMinutes} minutes.`);
  };

  // Transfer Session
  const [selectedTransferPosteId, setSelectedTransferPosteId] = useState('');
  const handleTransferSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal || !selectedTransferPosteId) return;

    const targetPoste = postes.find(p => p.id === selectedTransferPosteId);
    if (!targetPoste) return;

    setPostes(postes.map(p => {
      if (p.id === showTransferModal.id) {
        return { ...p, status: 'libre', clientName: undefined, minutesRemaining: undefined, totalDuration: undefined };
      }
      if (p.id === selectedTransferPosteId) {
        return {
          ...p,
          status: 'occupe',
          clientName: showTransferModal.clientName,
          minutesRemaining: showTransferModal.minutesRemaining,
          totalDuration: showTransferModal.totalDuration
        };
      }
      return p;
    }));

    setShowTransferModal(null);
    setSelectedTransferPosteId('');
    showToastMsg(`Session de "${showTransferModal.clientName}" transférée de "${showTransferModal.name}" vers "${targetPoste.name}".`);
  };

  // Filters application
  const filteredPostes = postes.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.characteristics.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Terminal Caisse – Gestion des Sessions
          </h2>
          <p style={{ color: 'var(--neutral-50)', fontSize: 'var(--font-sm)', background: 'var(--gradient-primary)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
            Zone Gaming Center — Session active
          </p>
        </div>
      </div>

      {/* Filter and stats bar */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Rechercher poste ou joueur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: 'var(--font-sm)' }}
            />
          </div>

          <select 
            className="select-field" 
            value={filterType} 
            onChange={(e: any) => setFilterType(e.target.value)}
            style={{ width: '140px', height: '38px', padding: '0 var(--space-3)', fontSize: 'var(--font-sm)' }}
          >
            <option value="all">Tous les types</option>
            <option value="console">Consoles PS5</option>
            <option value="pc">PC Gamer</option>
            <option value="vr">VR Room</option>
          </select>

          <select 
            className="select-field" 
            value={filterStatus} 
            onChange={(e: any) => setFilterStatus(e.target.value)}
            style={{ width: '140px', height: '38px', padding: '0 var(--space-3)', fontSize: 'var(--font-sm)' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="libre">Libre</option>
            <option value="occupe">Occupé</option>
            <option value="hors-service">Hors service</option>
          </select>
        </div>

        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', fontWeight: 600, display: 'flex', gap: 'var(--space-3)' }}>
          <span>Postes Libres: <strong style={{ color: 'var(--success-600)' }}>{postes.filter(p => p.status === 'libre').length}</strong></span>
          <span>Occupés: <strong style={{ color: 'var(--primary-500)' }}>{postes.filter(p => p.status === 'occupe').length}</strong></span>
          <span>HS: <strong style={{ color: 'var(--danger-500)' }}>{postes.filter(p => p.status === 'hors-service').length}</strong></span>
        </div>
      </div>

      {/* Grid Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {filteredPostes.map(post => {
          const percentRemaining = post.minutesRemaining !== undefined && post.totalDuration 
            ? (post.minutesRemaining / post.totalDuration) * 100 
            : 0;

          return (
            <div key={post.id} className="card animate-fade-in" style={{
              padding: 'var(--space-5)',
              border: `1.5px solid ${
                post.status === 'occupe' ? 'rgba(10, 66, 158, 0.15)' : 
                post.status === 'hors-service' ? 'var(--neutral-200)' : 
                'rgba(16, 185, 129, 0.15)'
              }`,
              boxShadow: post.status === 'occupe' ? 'var(--shadow-glow-primary)' : 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              opacity: post.status === 'hors-service' ? 0.75 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                    {post.name}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    {post.type === 'pc' && <Monitor size={10} />}
                    {post.type === 'console' && <Gamepad2 size={10} />}
                    {post.type === 'vr' && <HelpCircle size={10} />}
                    {post.type}
                  </span>
                </div>
                <span className={`badge ${
                  post.status === 'libre' ? 'badge-success' : 
                  post.status === 'occupe' ? 'badge-info' : 'badge-danger'
                }`}>
                  {post.status === 'libre' ? 'Libre' : 
                   post.status === 'occupe' ? 'Actif' : 'En panne'}
                </span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {post.status === 'occupe' ? (
                  <div style={{
                    backgroundColor: 'var(--primary-50)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--primary-100)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '4px' }}>
                      <span>Joueur: <strong style={{ color: 'var(--neutral-800)' }}>{post.clientName}</strong></span>
                      <span style={{ color: 'var(--primary-700)', fontWeight: 700 }}>{post.minutesRemaining} min</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--neutral-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${percentRemaining}%`, height: '100%', backgroundColor: 'var(--primary-500)', transition: 'width 0.3s ease-out' }} />
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', lineHeight: 1.4 }}>
                    {post.characteristics}
                  </p>
                )}
                <span style={{ fontSize: '9px', color: 'var(--neutral-400)', fontWeight: 600 }}>
                  Smart Plug IP: {post.smartPlugIp}
                </span>
              </div>

              {/* Cashier Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--neutral-100)', paddingTop: 'var(--space-3)' }}>
                {post.status === 'libre' && (
                  <>
                    <button 
                      onClick={() => setShowLaunchModal(post)} 
                      className="btn btn-secondary btn-sm" 
                      style={{ color: 'var(--success-700)', borderColor: 'var(--success-100)', backgroundColor: 'var(--success-50)', gap: '4px' }}
                      title="Lancer une session"
                    >
                      <Play size={12} /> Lancer Session
                    </button>
                    <button 
                      onClick={() => handleToggleOutOfService(post.id, post.name, post.status)} 
                      className="btn btn-secondary btn-icon btn-sm" 
                      title="Mettre hors-service"
                    >
                      <Ban size={12} />
                    </button>
                  </>
                )}

                {post.status === 'occupe' && (
                  <>
                    <button 
                      onClick={() => setShowExtendModal(post)} 
                      className="btn btn-secondary btn-sm" 
                      title="Prolonger"
                    >
                      <Clock size={12} /> Prolonger
                    </button>
                    <button 
                      onClick={() => setShowTransferModal(post)} 
                      className="btn btn-secondary btn-sm" 
                      title="Transférer de poste"
                    >
                      <ArrowRightLeft size={12} /> Transférer
                    </button>
                    <button 
                      onClick={() => handleEndSession(post.id, post.name, post.clientName || '')} 
                      className="btn btn-secondary btn-sm" 
                      style={{ color: 'var(--danger-500)', borderColor: 'var(--danger-100)' }}
                      title="Terminer la session"
                    >
                      Arrêter
                    </button>
                  </>
                )}

                {post.status === 'hors-service' && (
                  <button 
                    onClick={() => handleToggleOutOfService(post.id, post.name, post.status)} 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: 'var(--primary-600)', borderColor: 'var(--primary-100)' }}
                  >
                    Remettre En Service
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Launch Session Modal */}
      {showLaunchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Lancer Session - {showLaunchModal.name}
              </h3>
              <button className="btn btn-ghost" onClick={() => { setShowLaunchModal(null); setIsGuest(true); setGuestName(''); }}>✕</button>
            </div>

            <form onSubmit={handleLaunchSession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input 
                  id="is-guest-checkbox"
                  type="checkbox" 
                  checked={isGuest}
                  onChange={(e) => {
                    setIsGuest(e.target.checked);
                    if (e.target.checked) setLaunchMode('time');
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is-guest-checkbox" style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-700)', cursor: 'pointer' }}>
                  Joueur temporaire / non enregistré (Invité)
                </label>
              </div>

              {isGuest ? (
                <div className="input-group">
                  <label className="input-label">Nom du joueur temporaire</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ex: Invité_1"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="input-group">
                  <label className="input-label">Sélectionner le membre client</label>
                  <select 
                    className="select-field"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    {mockClients.map(c => (
                      <option key={c.id} value={c.username}>
                        {c.fullName} (@{c.username}) — Solde: {c.balance} FCFA {c.hasAbonnement ? `(Pass ${c.abonnementType})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isGuest && (
                <div style={{ display: 'flex', gap: 'var(--space-4)', margin: 'var(--space-1) 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                    <input 
                      type="radio" 
                      name="launchMode" 
                      checked={launchMode === 'time'} 
                      onChange={() => setLaunchMode('time')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Temps Libre (FCFA)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                    <input 
                      type="radio" 
                      name="launchMode" 
                      checked={launchMode === 'abonnement'} 
                      onChange={() => setLaunchMode('abonnement')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Déduire de l'abonnement
                  </label>
                </div>
              )}

              {launchMode === 'time' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <label className="input-label">Durée de jeu</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                    <button 
                      type="button" 
                      className={`btn ${selectedDuration === 30 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                      onClick={() => { setSelectedDuration(30); setCustomDuration(''); }}
                    >
                      30 min
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${selectedDuration === 60 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                      onClick={() => { setSelectedDuration(60); setCustomDuration(''); }}
                    >
                      1 heure
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${selectedDuration === 120 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                      onClick={() => { setSelectedDuration(120); setCustomDuration(''); }}
                    >
                      2 heures
                    </button>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Ou saisir une durée personnalisée (minutes)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="Ex: 90" 
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
              )}

              {launchMode === 'abonnement' && (
                <div style={{
                  backgroundColor: 'var(--primary-50)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--primary-700)',
                  fontSize: 'var(--font-xs)',
                  lineHeight: 1.5
                }}>
                  {(() => {
                    const client = mockClients.find(c => c.username === selectedClient);
                    if (client && client.hasAbonnement) {
                      return `✓ Abonnement "${client.abonnementType}" détecté. Temps disponible : ${client.abonnementRemainingTime} minutes.`;
                    }
                    return `⚠️ Ce client ne dispose pas d'un abonnement actif.`;
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowLaunchModal(null); setIsGuest(true); setGuestName(''); }}>Annuler</button>
                <button type="submit" className="btn btn-black">Activer le poste</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Session Modal */}
      {showExtendModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Prolonger : {showExtendModal.name}
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowExtendModal(null)}>✕</button>
            </div>

            <form onSubmit={handleExtendSession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)' }}>
                Joueur : <strong>{showExtendModal.clientName}</strong> (Temps restant : {showExtendModal.minutesRemaining} min).
              </p>

              <div className="input-group">
                <label className="input-label">Durée supplémentaire</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                  <button 
                    type="button" 
                    className={`btn ${selectedDuration === 30 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setSelectedDuration(30); setCustomDuration(''); }}
                  >
                    +30 min
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${selectedDuration === 60 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setSelectedDuration(60); setCustomDuration(''); }}
                  >
                    +1 heure
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${selectedDuration === 120 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setSelectedDuration(120); setCustomDuration(''); }}
                  >
                    +2 heures
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Durée personnalisée (minutes)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Ex: 15" 
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  min={1}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExtendModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black">Prolonger</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Session Modal */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Transférer la Session
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowTransferModal(null)}>✕</button>
            </div>

            <form onSubmit={handleTransferSession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)' }}>
                Déplacer <strong>{showTransferModal.clientName}</strong> ({showTransferModal.minutesRemaining} min restantes) depuis <strong>{showTransferModal.name}</strong>.
              </p>

              <div className="input-group">
                <label className="input-label">Sélectionner le poste libre de destination</label>
                <select 
                  className="select-field"
                  value={selectedTransferPosteId}
                  onChange={(e) => setSelectedTransferPosteId(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un poste libre --</option>
                  {postes
                    .filter(p => p.status === 'libre' && p.type === showTransferModal.type)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.characteristics})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black" disabled={!selectedTransferPosteId}>
                  Confirmer le transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)' }}>
            <h3 style={{ 
              fontSize: 'var(--font-lg)', 
              fontWeight: 700, 
              color: confirmModal.type === 'danger' ? 'var(--danger-600)' : 'var(--neutral-800)',
              marginBottom: 'var(--space-3)'
            }}>
              {confirmModal.title}
            </h3>
            <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmModal(null)}>Annuler</button>
              <button 
                type="button" 
                className={`btn ${confirmModal.type === 'danger' ? 'btn-danger' : 'btn-black'}`} 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && createPortal(
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#ffffff',
          color: 'var(--neutral-800)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          borderLeft: `4px solid ${toast.type === 'error' ? 'var(--danger-500)' : '#10b981'}`,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          fontSize: 'var(--font-sm)',
          animation: 'fade-in 0.3s ease-out'
        }}>
          {toast.type === 'error' ? (
            <span style={{ color: 'var(--danger-500)', backgroundColor: 'var(--danger-50)', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✕</span>
          ) : (
            <span style={{ color: '#10b981', backgroundColor: '#ecfdf5', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</span>
          )}
          <span>{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
};
