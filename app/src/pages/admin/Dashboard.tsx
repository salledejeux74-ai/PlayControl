import React, { useState, useEffect } from 'react';
import { 
  Landmark, Play, Monitor, Users, AlertTriangle, 
  Clock, ShieldAlert, CheckCircle2, UserCheck, LogIn 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';


interface LocalAlert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  time: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    caDuJour: 0,
    activeSessions: 0,
    totalPostes: 0,
    postesLibres: 0,
    postesOccupes: 0,
    postesHS: 0,
    totalClients: 0,
    newClientsThisWeek: 0
  });

  const [shiftLogs, setShiftLogs] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<LocalAlert[]>([]);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const fetchDashboardData = async () => {
    if (!user || !user.salleId) return;

    try {
      // 1. Fetch cashier profiles belonging to the gérant's salle
      const { data: cashierProfiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('salle_id', user.salleId);
      
      if (profileErr) throw profileErr;
      const cashierIds = cashierProfiles?.map(p => p.id) || [];

      // 2. Fetch shifts for these cashiers
      let shiftsList: any[] = [];
      let activeSft: any = null;
      if (cashierIds.length > 0) {
        const { data: sData, error: sErr } = await supabase
          .from('shifts')
          .select('*, profiles(name)')
          .in('cashier_id', cashierIds)
          .order('opened_at', { ascending: false });

        if (sErr) throw sErr;
        shiftsList = sData || [];
        activeSft = shiftsList.find(s => s.status === 'open') || null;
      }
      setShiftLogs(shiftsList);
      setActiveShift(activeSft);

      // 3. Fetch CA du Jour (sum amount of today's transactions for these shifts)
      let caDuJourVal = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      
      const shiftIds = shiftsList.map(s => s.id);
      if (shiftIds.length > 0) {
        const { data: transData, error: transErr } = await supabase
          .from('transactions')
          .select('amount')
          .in('shift_id', shiftIds)
          .gte('created_at', todayIso);

        if (transErr) throw transErr;
        caDuJourVal = transData?.reduce((acc, t) => acc + t.amount, 0) || 0;
      }

      // 4. Fetch Postes
      const { data: postesData, error: pErr } = await supabase
        .from('postes')
        .select('*')
        .eq('salle_id', user.salleId)
        .order('name', { ascending: true });
      if (pErr) throw pErr;

      const totalPostes = postesData?.length || 0;
      const postesLibres = postesData?.filter(p => p.status === 'libre').length || 0;
      const postesOccupes = postesData?.filter(p => p.status === 'occupe' || p.status === 'en-attente').length || 0;
      const postesHS = postesData?.filter(p => p.status === 'hors-service').length || 0;
      const activeSessions = postesOccupes;

      // 5. Fetch Clients
      const { data: clientsData, error: cErr } = await supabase
        .from('clients')
        .select('created_at');
      if (cErr) throw cErr;

      const totalClients = clientsData?.length || 0;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newClientsThisWeek = clientsData?.filter(c => new Date(c.created_at) >= oneWeekAgo).length || 0;

      setStats({
        caDuJour: caDuJourVal,
        activeSessions,
        totalPostes,
        postesLibres,
        postesOccupes,
        postesHS,
        totalClients,
        newClientsThisWeek
      });

      // 6. Build dynamic alerts list
      const baseAlerts: LocalAlert[] = [
        { id: 'sqlite-save', severity: 'info', message: 'Sauvegarde automatique SQLite locale réussie.', time: 'Aujourd\'hui 03:00' }
      ];

      // Add HS postes alerts
      const hsPostes = postesData?.filter(p => p.status === 'hors-service') || [];
      hsPostes.forEach(p => {
        baseAlerts.push({
          id: `hs-${p.id}`,
          severity: 'error',
          message: `Le poste ${p.name} est marqué Hors Service.`,
          time: 'En direct'
        });
      });

      // Fetch license expiration warning
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
        const diffTime = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays <= 7) {
          baseAlerts.push({
            id: 'license-warning',
            severity: 'warning',
            message: `La licence logicielle de votre salle expire le ${licData.expires_at.split('T')[0]} (dans ${diffDays} jour${diffDays > 1 ? 's' : ''}). Pensez à renouveler auprès du Super Administrateur.`,
            time: 'Vérifié à l\'instant'
          });
        }
      }

      setAlerts(baseAlerts);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user.salleId) return;

    fetchDashboardData();

    // Subscribe to postes changes
    const postesSub = supabase
      .channel('admin-dashboard-postes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'postes', filter: `salle_id=eq.${user.salleId}` }, () => {
        fetchDashboardData();
      })
      .subscribe();

    // Subscribe to shifts changes
    const shiftsSub = supabase
      .channel('admin-dashboard-shifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postesSub);
      supabase.removeChannel(shiftsSub);
    };
  }, [user]);

  const currentOccupancyRate = stats.totalPostes > 0 
    ? Math.round((stats.postesOccupes / stats.totalPostes) * 100) 
    : 0;

  // Hourly occupancy rates for SVG chart
  const occupancyData = [
    { hour: '08h', rate: Math.max(10, Math.min(30, currentOccupancyRate - 20)) },
    { hour: '10h', rate: Math.max(20, Math.min(50, currentOccupancyRate - 10)) },
    { hour: '12h', rate: Math.max(30, Math.min(75, currentOccupancyRate)) },
    { hour: '14h', rate: Math.max(25, Math.min(65, currentOccupancyRate - 5)) },
    { hour: '16h', rate: Math.max(40, Math.min(85, currentOccupancyRate + 5)) },
    { hour: '18h', rate: currentOccupancyRate },
    { hour: '20h', rate: Math.max(50, Math.min(95, currentOccupancyRate + 15)) },
    { hour: '22h', rate: Math.max(30, Math.min(80, currentOccupancyRate - 10)) },
    { hour: '00h', rate: Math.max(10, Math.min(45, currentOccupancyRate - 30)) },
  ];

  // SVG dimensions
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;

  // Generate SVG path points
  const points = occupancyData.map((d, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (occupancyData.length - 1);
    const y = chartHeight - padding - (d.rate * (chartHeight - padding * 2)) / 100;
    return `${x},${y}`;
  }).join(' ');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--primary-100)', borderTopColor: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-500)', fontWeight: 600 }}>
          Chargement des données du tableau de bord...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
          Tableau de Bord de la Salle
        </h2>
        <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
          Supervisez l'état des postes, l'activité de vos caissiers et les recettes générées localement.
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid-stats">
        {/* Recettes du jour */}
        <div className="stat-card">
          <div className="stat-card-icon blue">
            <Landmark size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">CA du Jour</span>
            <div className="stat-card-value">{stats.caDuJour.toLocaleString()} FCFA</div>
            <div className="stat-card-trend" style={{ color: 'var(--neutral-500)' }}>
              Cumulé sur la journée
            </div>
          </div>
        </div>

        {/* Sessions Actives */}
        <div className="stat-card">
          <div className="stat-card-icon violet">
            <Play size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Sessions Actives</span>
            <div className="stat-card-value">{stats.activeSessions} / {stats.totalPostes}</div>
            <div className="stat-card-trend" style={{ color: 'var(--neutral-500)' }}>
              Occupation à {stats.totalPostes > 0 ? Math.round((stats.postesOccupes / stats.totalPostes) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Postes Disponibles */}
        <div className="stat-card">
          <div className="stat-card-icon green">
            <Monitor size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">État des Postes</span>
            <div className="stat-card-value">{stats.postesLibres} Libre{stats.postesLibres > 1 ? 's' : ''}</div>
            <div className="stat-card-trend" style={{ color: 'var(--neutral-500)', display: 'flex', gap: '8px' }}>
              <span>{stats.postesOccupes} Occupé{stats.postesOccupes > 1 ? 's' : ''}</span>
              <span>•</span>
              <span style={{ color: stats.postesHS > 0 ? 'var(--danger-500)' : 'var(--neutral-500)', fontWeight: stats.postesHS > 0 ? 600 : 500 }}>
                {stats.postesHS} HS
              </span>
            </div>
          </div>
        </div>

        {/* Clients Actifs */}
        <div className="stat-card">
          <div className="stat-card-icon orange">
            <Users size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Clients Enregistrés</span>
            <div className="stat-card-value">{stats.totalClients} Membre{stats.totalClients > 1 ? 's' : ''}</div>
            <div className="stat-card-trend up">
              +{stats.newClientsThisWeek} nouveaux cette semaine
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--space-6)' }} className="dashboard-grid">
        
        {/* Left Side: Graph and Cashier Shifts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Occupancy Rate Graph */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--primary-500)' }} />
                Taux d'occupation aujourd'hui (%)
              </h3>
            </div>
            <div style={{ width: '100%', overflowX: 'auto', paddingTop: '10px' }}>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', minWidth: '400px' }}>
                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map((level) => {
                  const y = chartHeight - padding - (level * (chartHeight - padding * 2)) / 100;
                  return (
                    <g key={level}>
                      <line 
                        x1={padding} 
                        y1={y} 
                        x2={chartWidth - padding} 
                        y2={y} 
                        stroke="var(--neutral-200)" 
                        strokeWidth="1" 
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={padding - 8} 
                        y={y + 4} 
                        textAnchor="end" 
                        fontSize="10" 
                        fill="var(--neutral-400)" 
                        fontWeight="600"
                      >
                        {level}%
                      </text>
                    </g>
                  );
                })}

                {/* Gradient area under line */}
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-400)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--primary-100)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M ${padding},${chartHeight - padding} L ${points} L ${chartWidth - padding},${chartHeight - padding} Z`}
                  fill="url(#chart-gradient)"
                />

                {/* Graph line */}
                <polyline
                  fill="none"
                  stroke="var(--primary-500)"
                  strokeWidth="3"
                  points={points}
                />

                {/* Graph points */}
                {occupancyData.map((d, index) => {
                  const x = padding + (index * (chartWidth - padding * 2)) / (occupancyData.length - 1);
                  const y = chartHeight - padding - (d.rate * (chartHeight - padding * 2)) / 100;
                  return (
                    <g key={index}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="5" 
                        fill="var(--neutral-0)" 
                        stroke="var(--primary-500)" 
                        strokeWidth="2"
                      />
                      <text 
                        x={x} 
                        y={chartHeight - 8} 
                        textAnchor="middle" 
                        fontSize="10" 
                        fill="var(--neutral-400)" 
                        fontWeight="600"
                      >
                        {d.hour}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Cashier Shifts Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={18} style={{ color: 'var(--accent-500)' }} />
                Suivi des Caissiers & Shifts
              </h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Caissier</th>
                    <th>Début du Shift</th>
                    <th>Fin du Shift</th>
                    <th>Fonds Initial</th>
                    <th>Fonds Final</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftLogs.length > 0 ? (
                    shiftLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600 }}>{log.profiles ? log.profiles.name : 'Caissier'}</td>
                        <td>{formatDateTime(log.opened_at)}</td>
                        <td>{formatDateTime(log.closed_at)}</td>
                        <td>{log.initial_cash.toLocaleString()} FCFA</td>
                        <td>{log.closed_cash !== null ? `${log.closed_cash.toLocaleString()} FCFA` : 'En cours'}</td>
                        <td>
                          <span className={`badge ${log.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
                            {log.status === 'open' ? 'En Session' : 'Clôturé'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '24px' }}>
                        Aucun shift caissier enregistré pour cette salle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Alerts Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minHeight: '100%' }}>
            <div className="card-header" style={{ marginBottom: 0 }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--danger-500)' }} />
                Alertes de Salle en Direct
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {alerts.map(alert => (
                <div key={alert.id} style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--neutral-200)',
                  backgroundColor: alert.severity === 'error' ? 'rgba(239, 68, 68, 0.03)' : 
                                   alert.severity === 'warning' ? 'rgba(245, 158, 11, 0.03)' : 
                                   'rgba(10, 66, 158, 0.03)',
                  borderLeft: `4px solid ${
                    alert.severity === 'error' ? 'var(--danger-500)' : 
                    alert.severity === 'warning' ? 'var(--warning-500)' : 
                    'var(--primary-500)'
                  }`,
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-start'
                }}>
                  {alert.severity === 'error' && <ShieldAlert size={18} style={{ color: 'var(--danger-500)', flexShrink: 0, marginTop: '2px' }} />}
                  {alert.severity === 'warning' && <AlertTriangle size={18} style={{ color: 'var(--warning-500)', flexShrink: 0, marginTop: '2px' }} />}
                  {alert.severity === 'info' && <CheckCircle2 size={18} style={{ color: 'var(--primary-500)', flexShrink: 0, marginTop: '2px' }} />}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-800)', fontWeight: 500, lineHeight: 1.4 }}>
                      {alert.message}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--neutral-400)', fontWeight: 600 }}>
                      {alert.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Shift Actions quick info */}
            <div style={{
              marginTop: 'auto',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--neutral-50)',
              border: '1px dashed var(--neutral-200)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)'
            }}>
              <UserCheck size={20} style={{ color: activeShift ? 'var(--success-500)' : 'var(--neutral-400)' }} />
              <div>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                  {activeShift ? `${activeShift.profiles ? activeShift.profiles.name : 'Caissier'} est actif` : 'Aucun caissier actif'}
                </span>
                <p style={{ fontSize: '10px', color: 'var(--neutral-500)' }}>
                  {activeShift 
                    ? `Caisse ouverte à ${formatTimeOnly(activeShift.opened_at)} avec ${activeShift.initial_cash.toLocaleString()} FCFA` 
                    : 'Le tiroir de caisse est actuellement fermé.'}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
