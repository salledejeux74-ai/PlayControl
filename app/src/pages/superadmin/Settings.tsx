import React, { useState } from 'react';
import { Save, Database, ShieldAlert, Cloud, RefreshCw } from 'lucide-react';

export const SuperAdminSettings: React.FC = () => {
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [sessionTimeout, setSessionTimeout] = useState(15);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Paramètres enregistrés avec succès !');
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Synchronisation globale cloud terminée avec succès !');
    }, 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Paramètres Système Globaux
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Configurez la politique de sécurité, les sauvegardes globales et les règles de synchronisation cloud.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }} className="settings-grid">
          
          {/* Left Column: Security and backup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Security Settings Card */}
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-50)',
                  color: 'var(--danger-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldAlert size={18} />
                </div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                  Sécurité & Authentification
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Longueur minimale du mot de passe</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={passwordMinLength} 
                    onChange={(e) => setPasswordMinLength(Number(e.target.value))}
                    min={6}
                    max={20}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Déconnexion automatique après inactivité (minutes)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={sessionTimeout} 
                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                    min={5}
                    max={60}
                  />
                </div>
              </div>
            </div>

            {/* Backup Settings Card */}
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Database size={18} />
                </div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                  Sauvegardes et Base de données
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <input 
                    id="auto-backup"
                    type="checkbox" 
                    checked={autoBackupEnabled}
                    onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="auto-backup" style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-700)', cursor: 'pointer' }}>
                    Activer les sauvegardes automatiques hebdomadaires
                  </label>
                </div>

                {autoBackupEnabled && (
                  <div className="input-group">
                    <label className="input-label">Fréquence de la sauvegarde</label>
                    <select 
                      className="select-field"
                      value={backupSchedule}
                      onChange={(e) => setBackupSchedule(e.target.value)}
                    >
                      <option value="daily">Chaque jour à 3:00</option>
                      <option value="weekly">Chaque dimanche à 3:00</option>
                      <option value="monthly">Chaque 1er du mois à 3:00</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Cloud and actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Cloud Sync Settings */}
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-50)',
                  color: 'var(--accent-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cloud size={18} />
                </div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                  Synchronisation Supabase Cloud
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', lineHeight: 1.5 }}>
                  Les serveurs de salle se synchronisent avec notre instance Supabase Cloud dès qu'une connexion Internet est disponible.
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)', borderTop: '1px solid var(--neutral-100)', paddingTop: 'var(--space-3)' }}>
                  <span style={{ color: 'var(--neutral-500)', fontWeight: 600 }}>Dernière Synchro Globale :</span>
                  <span style={{ color: 'var(--neutral-700)', fontWeight: 700 }}>2026-06-15 18:00</span>
                </div>

                <button 
                  type="button" 
                  onClick={handleTriggerSync}
                  className="btn btn-secondary" 
                  style={{ gap: 'var(--space-2)', width: '100%', justifyContent: 'center' }}
                  disabled={isSyncing}
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
                </button>
              </div>
            </div>

            {/* Help / Updates */}
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-3)' }}>
                Mises à jour système
              </h3>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', marginBottom: 'var(--space-4)' }}>
                Version actuelle : <strong>v1.4.0 (Stable)</strong>
              </p>
              <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => alert('Le système est à jour.')}>
                Rechercher des mises à jour
              </button>
            </div>

          </div>
        </div>

        {/* Save button footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-200)', paddingTop: 'var(--space-4)' }}>
          <button type="submit" className="btn btn-black" style={{ gap: 'var(--space-2)', width: '180px' }}>
            <Save size={18} /> Enregistrer
          </button>
        </div>
      </form>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 992px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
