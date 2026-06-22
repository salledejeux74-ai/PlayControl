import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, DollarSign, PlayCircle, Users, 
  AlertTriangle, RefreshCw, CheckCircle, TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const SuperAdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sallesCount, setSallesCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salleRevenues, setSalleRevenues] = useState<{ name: string; revenue: number; percentage: number; activePostes: string }[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<{ id: number; message: string; time: string; type: string }[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Salles
      const { data: sallesData } = await supabase.from('salles').select('*');
      setSallesCount(sallesData?.length || 0);

      // 2. Clients
      const { data: clientsData } = await supabase.from('clients').select('id');
      setClientsCount(clientsData?.length || 0);

      // 3. Postes (active sessions)
      const { data: postesData } = await supabase.from('postes').select('id, status');
      setActiveSessions(postesData?.filter((p: any) => p.status === 'occupe').length || 0);

      // 4. Transactions, Shifts, Profiles
      const { data: txData } = await supabase.from('transactions').select('amount, shift_id');
      const { data: shiftsData } = await supabase.from('shifts').select('id, cashier_id');
      const { data: profilesData } = await supabase.from('profiles').select('id, salle_id');

      const sumRevenue = txData ? txData.reduce((sum, tx) => sum + tx.amount, 0) : 0;
      setTotalRevenue(sumRevenue);

      // Compute revenues per Salle
      const revenueBySalle: Record<string, number> = {};
      txData?.forEach(tx => {
        const shift = shiftsData?.find(s => s.id === tx.shift_id);
        const profile = shift ? profilesData?.find(p => p.id === shift.cashier_id) : null;
        const salleId = profile?.salle_id;
        if (salleId) {
          revenueBySalle[salleId] = (revenueBySalle[salleId] || 0) + tx.amount;
        }
      });

      // Format top salles
      if (sallesData) {
        let maxRev = 1;
        const mappedSalles = sallesData.map(s => {
          const rev = revenueBySalle[s.id] || s.monthly_revenue || 0;
          if (rev > maxRev) maxRev = rev;
          return {
            name: s.name,
            revenue: rev,
            activePostes: `${postesData?.filter((p: any) => p.status === 'occupe').length || 0}/${s.postes_count}`,
            rawRevenue: rev
          };
        });

        const formattedSalles = mappedSalles
          .map(s => ({
            name: s.name,
            revenue: s.revenue,
            percentage: Math.round((s.rawRevenue / maxRev) * 100),
            activePostes: s.activePostes
          }))
          .sort((a, b) => b.revenue - a.revenue);

        setSalleRevenues(formattedSalles);
      }

      // 5. Compute Alerts
      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('severity', 'critical')
        .limit(3);

      const alertsList: typeof activeAlerts = [];
      if (logsData) {
        logsData.forEach((l: any, idx: number) => {
          alertsList.push({
            id: idx + 1,
            message: `${l.action} (${l.salle})`,
            time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Tout de suite',
            type: 'error'
          });
        });
      }

      const { data: licencesData } = await supabase
        .from('licences')
        .select('*, salles(name)')
        .eq('status', 'warning')
        .limit(2);

      if (licencesData) {
        licencesData.forEach((lic: any, idx: number) => {
          alertsList.push({
            id: alertsList.length + 1,
            message: `Licence expirante (Salle : ${lic.salles?.name || 'Inconnue'})`,
            time: 'Avertissement',
            type: 'warning'
          });
        });
      }

      if (alertsList.length === 0) {
        alertsList.push(
          { id: 1, message: "Aucune alerte critique signalée", time: "Actuel", type: "info" }
        );
      }

      setActiveAlerts(alertsList);

    } catch (err: any) {
      console.error("Error loading dashboard data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpis = [
    { label: 'Salles Partenaires', value: String(sallesCount), change: 'Actif', icon: <Gamepad2 size={22} />, color: 'var(--primary-500)', bg: 'var(--primary-50)' },
    { label: 'Revenus Globaux (Cumulé)', value: `${totalRevenue.toLocaleString()} FCFA`, change: 'Total', icon: <DollarSign size={22} />, color: 'var(--success-700)', bg: 'var(--success-50)' },
    { label: 'Sessions Actives', value: String(activeSessions), change: 'Temps réel', icon: <PlayCircle size={22} />, color: 'var(--accent-500)', bg: 'var(--accent-50)' },
    { label: 'Clients Actifs', value: String(clientsCount), change: 'Membres', icon: <Users size={22} />, color: 'var(--info-500)', bg: 'var(--info-100)' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-500)', fontWeight: 600 }}>Chargement du tableau de bord...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Tableau de Bord Supervision
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Supervision globale des licences et performances de vos salles de jeux.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData} style={{ gap: 'var(--space-2)' }}>
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-500)' }}>{kpi.label}</span>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: kpi.bg,
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {kpi.icon}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)' }}>{kpi.value}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: '2px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: kpi.change.startsWith('+1') || kpi.change.startsWith('+2') || kpi.change.startsWith('+8') || kpi.change.startsWith('+45') ? 'var(--success-700)' : 'var(--primary-600)' 
                }}>
                  {kpi.change}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--neutral-400)' }}>depuis le mois dernier</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }} className="dashboard-grid">
        {/* Left Column: Svg Revenue Chart & Salles occupancy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Revenue Chart Card */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>Courbe des Revenus</h3>
                <p style={{ color: 'var(--neutral-400)', fontSize: 'var(--font-xs)' }}>Évolution du chiffre d'affaires cumulé sur les 6 derniers mois</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)' }}>
                <TrendingUp size={14} style={{ color: 'var(--primary-500)' }} /> Cumulative
              </div>
            </div>
            
            {/* Custom SVG Chart */}
            <div style={{ position: 'relative', height: '200px', width: '100%', marginTop: 'var(--space-4)' }}>
              <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-400)" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="var(--accent-400)" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="var(--neutral-100)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="var(--neutral-100)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="var(--neutral-100)" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Area path */}
                <path d="M 0 140 Q 80 120 100 110 T 200 70 T 300 80 T 400 40 T 500 25 L 500 150 L 0 150 Z" fill="url(#chart-grad)" />
                
                {/* Line path */}
                <path d="M 0 140 Q 80 120 100 110 T 200 70 T 300 80 T 400 40 T 500 25" fill="none" stroke="var(--gradient-primary)" strokeWidth="3" />
                
                {/* Markers */}
                <circle cx="100" cy="110" r="4" fill="var(--primary-500)" stroke="white" strokeWidth="2" />
                <circle cx="200" cy="70" r="4" fill="var(--primary-500)" stroke="white" strokeWidth="2" />
                <circle cx="300" cy="80" r="4" fill="var(--accent-500)" stroke="white" strokeWidth="2" />
                <circle cx="400" cy="40" r="4" fill="var(--accent-500)" stroke="white" strokeWidth="2" />
                <circle cx="500" cy="25" r="5" fill="var(--accent-600)" stroke="white" strokeWidth="2" />
              </svg>
              {/* X axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)', fontSize: 'var(--font-xs)', color: 'var(--neutral-400)', fontWeight: 500 }}>
                <span>Jan</span>
                <span>Fév</span>
                <span>Mar</span>
                <span>Avr</span>
                <span>Mai</span>
                <span>Juin</span>
              </div>
            </div>
          </div>

          {/* Salles list comparative */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>
              Top Salles Performantes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {salleRevenues.map((salle, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--neutral-700)' }}>{salle.name}</span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-400)', marginLeft: 'var(--space-3)' }}>Postes actifs : {salle.activePostes}</span>
                    </div>
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--neutral-800)' }}>{salle.revenue.toLocaleString()} FCFA</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--neutral-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${salle.percentage}%`, 
                      height: '100%', 
                      background: idx === 0 ? 'var(--gradient-primary)' : 'var(--primary-400)',
                      borderRadius: 'var(--radius-full)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts and quick logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Alerts Card */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>Supervision Alertes</h3>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                backgroundColor: 'var(--danger-50)', 
                color: 'var(--danger-600)', 
                padding: '2px 8px', 
                borderRadius: 'var(--radius-full)' 
              }}>
                Action Requise
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {activeAlerts.map(alert => (
                <div key={alert.id} style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--neutral-50)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${alert.type === 'error' ? 'var(--danger-500)' : alert.type === 'warning' ? 'var(--warning-500)' : 'var(--info-500)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {alert.type === 'error' && <AlertTriangle size={14} style={{ color: 'var(--danger-500)' }} />}
                    {alert.type === 'warning' && <AlertTriangle size={14} style={{ color: 'var(--warning-500)' }} />}
                    {alert.type === 'info' && <CheckCircle size={14} style={{ color: 'var(--info-500)' }} />}
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--neutral-700)' }}>
                      {alert.type === 'error' ? 'Urgent' : alert.type === 'warning' ? 'Attention' : 'Sécurité'}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-600)', fontWeight: 500 }}>{alert.message}</p>
                  <span style={{ fontSize: '9px', color: 'var(--neutral-400)', alignSelf: 'flex-end' }}>{alert.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick license summary */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>
              Licences Logicielles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)' }}>
                <span style={{ color: 'var(--neutral-500)', fontWeight: 600 }}>Licences Actives</span>
                <span style={{ color: 'var(--success-700)', fontWeight: 700, backgroundColor: 'var(--success-50)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>12 Salles</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)' }}>
                <span style={{ color: 'var(--neutral-500)', fontWeight: 600 }}>Proches Expiration</span>
                <span style={{ color: 'var(--warning-600)', fontWeight: 700, backgroundColor: 'var(--warning-50)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>2 Salles</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)' }}>
                <span style={{ color: 'var(--neutral-500)', fontWeight: 600 }}>Suspendues</span>
                <span style={{ color: 'var(--neutral-400)', fontWeight: 700, backgroundColor: 'var(--neutral-100)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>0 Salle</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .stat-card {
          background-color: var(--neutral-0);
          border-radius: var(--radius-lg);
          padding: var(--space-5) var(--space-6);
          border: 1px solid var(--neutral-200);
          box-shadow: var(--shadow-sm);
        }
        @media (max-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
