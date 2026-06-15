import React, { useState } from 'react';
import { Calendar, Download } from 'lucide-react';

export const Stats: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');

  // Dummy comparison data
  const comparisons = [
    { salle: 'Gaming Zone - Ydé', occupancy: '84%', sessions: 1420, revenue: 2450000, color: 'var(--primary-500)' },
    { salle: 'Arena Games - DLA', occupancy: '76%', sessions: 1150, revenue: 1980000, color: 'var(--accent-500)' },
    { salle: 'Play Safe - Garoua', occupancy: '62%', sessions: 780, revenue: 1250000, color: 'var(--info-500)' },
    { salle: 'Nexus Gaming - Baf', occupancy: '45%', sessions: 540, revenue: 1100000, color: 'var(--warning-500)' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Rapports & Statistiques Comparatives
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Comparez les indicateurs de performance clés (KPI) de toutes les salles de jeux affiliées.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" style={{ gap: 'var(--space-2)' }}>
            <Download size={16} /> Exporter en PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Calendar size={18} style={{ color: 'var(--neutral-400)' }} />
          <select 
            className="select-field" 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ width: '160px', padding: 'var(--space-2)' }}
          >
            <option value="week">7 Derniers Jours</option>
            <option value="month">Ce mois (30j)</option>
            <option value="year">Cette Année (12m)</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)' }}>Dernière synchro cloud : Il y a 5 min</span>
        </div>
      </div>

      {/* Graphs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }} className="stats-grid">
        {/* Bar chart comparison */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-6)' }}>
            Comparaison des Revenus Mensuels (FCFA)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
            {comparisons.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '140px', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.salle}
                </span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, height: '24px', backgroundColor: 'var(--neutral-100)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(item.revenue / 2500000) * 100}%`, 
                      height: '100%', 
                      background: item.color,
                      borderRadius: 'var(--radius-sm)',
                      transition: 'width 1s ease-in-out'
                    }} />
                  </div>
                  <span style={{ width: '110px', fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--neutral-800)', textAlign: 'right' }}>
                    {item.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Occupancy and sessions statistics */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>
            Sessions & Taux d'Occupation
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {comparisons.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--neutral-50)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${item.color}`
              }}>
                <div>
                  <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--neutral-800)' }}>{item.salle}</h4>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)' }}>{item.sessions} sessions de jeu</span>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--neutral-800)' }}>{item.occupancy}</span>
                  <span style={{ fontSize: '9px', color: 'var(--neutral-400)', display: 'block' }}>Taux d'occupation moyen</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
