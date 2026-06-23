import React, { useState, useEffect } from 'react';
import { 
  Landmark, Play, Monitor, Users, AlertTriangle, 
  Clock, ShieldAlert, CheckCircle2, UserCheck, LogIn 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';

interface ShiftLog {
  id: string;
  cashierName: string;
  loginTime: string;
  logoutTime: string | null;
  cashIn: number;
  cashOut: number | null;
  status: 'active' | 'completed';
}

interface LocalAlert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  time: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [shiftLogs] = useState<ShiftLog[]>([
    { id: '1', cashierName: 'Sophie Caisse', loginTime: '2026-06-15 08:00', logoutTime: null, cashIn: 50000, cashOut: null, status: 'active' },
    { id: '2', cashierName: 'Jean Bernard', loginTime: '2026-06-14 14:00', logoutTime: '2026-06-14 22:30', cashIn: 45000, cashOut: 135000, status: 'completed' },
    { id: '3', cashierName: 'Sophie Caisse', loginTime: '2026-06-14 08:00', logoutTime: '2026-06-14 14:00', cashIn: 30000, cashOut: 98000, status: 'completed' },
  ]);

  const [alerts, setAlerts] = useState<LocalAlert[]>([
    { id: '1', severity: 'error', message: 'Le poste Console PS5 #3 est marqué Hors Service (Manette Défectueuse).', time: 'Il y a 10 min' },
    { id: '3', severity: 'info', message: 'Sauvegarde automatique SQLite locale réussie.', time: 'Aujourd\'hui 03:00' },
  ]);

  useEffect(() => {
    if (!user || !user.salleId) return;

    const checkLicenseExpiration = async () => {
      try {
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
            setAlerts(prev => {
              // Avoid duplicates if effect runs twice
              if (prev.some(a => a.id === 'license-warning')) return prev;
              return [
                ...prev,
                {
                  id: 'license-warning',
                  severity: 'warning',
                  message: `La licence logicielle de votre salle expire le ${licData.expires_at.split('T')[0]} (dans ${diffDays} jour${diffDays > 1 ? 's' : ''}). Pensez à renouveler auprès du Super Administrateur.`,
                  time: 'Vérifié à l\'instant'
                }
              ];
            });
          }
        }
      } catch (err) {
        console.error('Error checking license for alerts:', err);
      }
    };

    checkLicenseExpiration();
  }, [user]);

  // Hourly occupancy rates for SVG chart
  const occupancyData = [
    { hour: '08h', rate: 20 },
    { hour: '10h', rate: 35 },
    { hour: '12h', rate: 60 },
    { hour: '14h', rate: 50 },
    { hour: '16h', rate: 75 },
    { hour: '18h', rate: 90 },
    { hour: '20h', rate: 95 },
    { hour: '22h', rate: 65 },
    { hour: '00h', rate: 30 },
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
            <div className="stat-card-value">145 000 FCFA</div>
            <div className="stat-card-trend up">
              +12% par rapport à hier
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
            <div className="stat-card-value">8 / 20</div>
            <div className="stat-card-trend" style={{ color: 'var(--neutral-500)' }}>
              Occupation à 40%
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
            <div className="stat-card-value">11 Libres</div>
            <div className="stat-card-trend" style={{ color: 'var(--neutral-500)', display: 'flex', gap: '8px' }}>
              <span>8 Occupés</span>
              <span>•</span>
              <span style={{ color: 'var(--danger-500)', fontWeight: 600 }}>1 HS</span>
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
            <div className="stat-card-value">42 Membres</div>
            <div className="stat-card-trend up">
              +3 nouveaux cette semaine
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
                  {shiftLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.cashierName}</td>
                      <td>{log.loginTime}</td>
                      <td>{log.logoutTime || '—'}</td>
                      <td>{log.cashIn.toLocaleString()} FCFA</td>
                      <td>{log.cashOut ? `${log.cashOut.toLocaleString()} FCFA` : 'En cours'}</td>
                      <td>
                        <span className={`badge ${log.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                          {log.status === 'active' ? 'En Session' : 'Clôturé'}
                        </span>
                      </td>
                    </tr>
                  ))}
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
              <UserCheck size={20} style={{ color: 'var(--success-500)' }} />
              <div>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--neutral-800)' }}>Sophie Caisse est active</span>
                <p style={{ fontSize: '10px', color: 'var(--neutral-500)' }}>Caisse ouverte à 08:00 avec 50 000 FCFA</p>
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
