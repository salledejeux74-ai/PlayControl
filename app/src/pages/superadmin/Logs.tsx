import React, { useState } from 'react';
import { Search, ShieldCheck, User, Gamepad2, ShieldAlert } from 'lucide-react';

interface LogEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  salle: string;
  ip: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export const Logs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const logs: LogEntry[] = [
    { id: '1', actor: 'Alexandre (SA)', role: 'Super Admin', action: 'Génération de clé de licence (PLAY-KZ8Y-98X1)', salle: 'SuperAdmin System', ip: '192.168.1.100', timestamp: '2026-06-15 17:45:12', severity: 'info' },
    { id: '2', actor: 'Marc Kemajou', role: 'Admin Salle', action: 'Création du compte caissier (Sophie)', salle: 'Gaming Zone - Yaoundé', ip: '192.168.1.105', timestamp: '2026-06-15 16:20:00', severity: 'info' },
    { id: '3', actor: 'Sophie (Caisse)', role: 'Caissier', action: 'Suppression forcée de session (Poste 4)', salle: 'Gaming Zone - Yaoundé', ip: '192.168.1.112', timestamp: '2026-06-15 15:10:45', severity: 'warning' },
    { id: '4', actor: 'Alexandre (SA)', role: 'Super Admin', action: 'Suspension de la salle (Nexus Gaming)', salle: 'Nexus Gaming - Bafoussam', ip: '192.168.1.100', timestamp: '2026-06-15 14:00:32', severity: 'critical' },
    { id: '5', actor: 'System Autopack', role: 'Auto Task', action: 'Restauration de base de données locale réussie', salle: 'Arena Games - Douala', ip: '127.0.0.1', timestamp: '2026-06-15 03:00:00', severity: 'info' },
    { id: '6', actor: 'Marc Kemajou', role: 'Admin Salle', action: 'Modification de la grille tarifaire standard', salle: 'Gaming Zone - Yaoundé', ip: '192.168.1.105', timestamp: '2026-06-14 18:32:11', severity: 'warning' },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.salle.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Journaux d'Activité Système
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Tracez les actions critiques effectuées par les administrateurs et employés de toutes les salles.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', width: '100%', maxWidth: '600px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Rechercher par action, utilisateur, salle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <select 
            className="select-field" 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="all">Tous les Niveaux</option>
            <option value="info">Info (Standard)</option>
            <option value="warning">Avertissement</option>
            <option value="critical">Critique (Sensible)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date / Heure</th>
              <th>Acteur</th>
              <th>Salle d'origine</th>
              <th>Action réalisée</th>
              <th>Adresse IP</th>
              <th>Gravité</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)', whiteSpace: 'nowrap' }}>
                    {log.timestamp}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: 'var(--neutral-800)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} style={{ color: 'var(--neutral-400)' }} /> {log.actor}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-400)' }}>{log.role}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gamepad2 size={12} style={{ color: 'var(--neutral-400)' }} /> {log.salle}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-800)', fontWeight: 500 }}>
                    {log.action}
                  </td>
                  <td style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-400)', fontFamily: 'monospace' }}>
                    {log.ip}
                  </td>
                  <td>
                    <span className={`badge ${
                      log.severity === 'critical' ? 'badge-danger' : 
                      log.severity === 'warning' ? 'badge-warning' : 'badge-success'
                    }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {log.severity === 'critical' && <ShieldAlert size={10} />}
                      {log.severity === 'warning' && <ShieldAlert size={10} />}
                      {log.severity === 'info' && <ShieldCheck size={10} />}
                      {log.severity === 'critical' ? 'Critique' : log.severity === 'warning' ? 'Attention' : 'Info'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--neutral-400)' }}>
                  Aucun journal trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
