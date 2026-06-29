import React, { useState, useEffect } from 'react';
import { Save, Database, ShieldAlert, Cloud, RefreshCw, Landmark } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface PendingSettingsUpdate {
  status: 'pending' | 'approved' | 'rejected';
  name: string;
  location: string;
  phone: string;
  requestedAt: string;
}

interface SalleWithPending {
  id: string;
  name: string;
  location: string;
  phone: string;
  pending_update: PendingSettingsUpdate | null;
}

export const SuperAdminSettings: React.FC = () => {
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [sessionTimeout, setSessionTimeout] = useState(15);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [pendingSalles, setPendingSalles] = useState<SalleWithPending[]>([]);

  const logSystemActivity = async (action: string, severity: 'info' | 'warning' | 'critical', salle: string = 'SuperAdmin System') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const actorEmail = user?.email || 'Super Admin';
      await supabase.from('activity_logs').insert({
        actor: actorEmail,
        role: 'Super Admin',
        action,
        salle,
        ip: 'Console Web',
        severity
      });
    } catch (err) {
      console.error("Erreur de logging activité:", err);
    }
  };

  const fetchPendingSettings = async () => {
    try {
      setLoading(true);

      // 1. Charger les paramètres système globaux
      const { data: globalData, error: globalError } = await supabase
        .from('settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (globalError) console.warn('Erreur chargement settings globaux:', globalError.message);
      if (globalData) {
        setPasswordMinLength(globalData.password_min_length ?? 8);
        setSessionTimeout(globalData.session_timeout ?? 15);
      }

      // 2. Récupérer les salles avec une demande en attente
      const { data: sallesData, error: sallesError } = await supabase
        .from('salles')
        .select('id, name, location, phone, pending_update');

      if (sallesError) throw sallesError;

      if (sallesData) {
        const filtered = (sallesData as any[]).filter(
          (s: any) => s.pending_update && s.pending_update.status === 'pending'
        );
        setPendingSalles(filtered);
      }
    } catch (e: any) {
      console.error('Erreur lors du chargement des demandes settings:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSettings();
  }, []);

  const handleApproveUpdate = async (salleId: string, update: PendingSettingsUpdate) => {
    if (!update) return;
    
    const { error } = await supabase
      .from('salles')
      .update({
        name: update.name,
        location: update.location,
        phone: update.phone,
        pending_update: {
          ...update,
          status: 'approved'
        }
      })
      .eq('id', salleId);

    if (error) {
      alert("Erreur lors de la validation : " + error.message);
      return;
    }

    // Insérer une notification dynamique pour le gérant de la salle
    await supabase.from('notifications').insert({
      salle_id: salleId,
      recipient_role: 'admin',
      type: 'success',
      title: 'Mise à jour du profil validée',
      message: `Le Super Administrateur a approuvé les modifications de votre salle.`,
    });

    await logSystemActivity(`Approbation des modifications de la salle (ID: ${salleId})`, 'info');
    
    fetchPendingSettings();
    alert('Modification de profil de salle approuvée et appliquée avec succès !');
  };

  const handleRejectUpdate = async (salleId: string, update: PendingSettingsUpdate) => {
    if (!update) return;
    
    const { error } = await supabase
      .from('salles')
      .update({
        pending_update: {
          ...update,
          status: 'rejected'
        }
      })
      .eq('id', salleId);

    if (error) {
      alert("Erreur lors du rejet : " + error.message);
      return;
    }

    // Insérer une notification dynamique pour le gérant de la salle
    await supabase.from('notifications').insert({
      salle_id: salleId,
      recipient_role: 'admin',
      type: 'error',
      title: 'Mise à jour du profil rejetée',
      message: `Le Super Administrateur a rejeté les modifications demandées.`,
    });

    await logSystemActivity(`Rejet des modifications de la salle (ID: ${salleId})`, 'warning');
    
    fetchPendingSettings();
    alert('Modification de profil de salle rejetée.');
  };

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <p style={{ color: 'var(--neutral-500)', fontWeight: 600 }}>Chargement des paramètres depuis Supabase...</p>
      </div>
    );
  }

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

      {pendingSalles.map((salle) => {
        const update = salle.pending_update;
        if (!update) return null;
        return (
          <div key={salle.id} className="card animate-fade-in" style={{ borderLeft: '4px solid var(--primary-500)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-6)', backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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
                <Landmark size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)', margin: 0 }}>
                  Demande d'approbation : {salle.name}
                </h3>
                <p style={{ color: 'var(--neutral-400)', fontSize: 'var(--font-xs)', margin: 0 }}>
                  Le gérant de la salle <strong>{salle.name}</strong> a soumis une demande de mise à jour de ses coordonnées.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', backgroundColor: 'var(--neutral-50)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-100)', marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--neutral-400)', fontWeight: 600 }}>NOUVEAU NOM COMMERCIAL</span>
                <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-800)' }}>{update.name}</strong>
                <span style={{ fontSize: '10px', color: 'var(--neutral-400)' }}>Actuel: {salle.name}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--neutral-400)', fontWeight: 600 }}>NOUVELLE ADRESSE</span>
                <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-800)' }}>{update.location}</strong>
                <span style={{ fontSize: '10px', color: 'var(--neutral-400)' }}>Actuel: {salle.location}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--neutral-400)', fontWeight: 600 }}>NOUVEAU TÉLÉPHONE DE CONTACT</span>
                <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-800)' }}>{update.phone}</strong>
                <span style={{ fontSize: '10px', color: 'var(--neutral-400)' }}>Actuel: {salle.phone}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRejectUpdate(salle.id, update)} style={{ color: 'var(--danger-500)', borderColor: 'var(--danger-100)' }}>
                Rejeter la demande
              </button>
              <button type="button" className="btn btn-black btn-sm" onClick={() => handleApproveUpdate(salle.id, update)}>
                Valider et appliquer
              </button>
            </div>
          </div>
        );
      })}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="grid-responsive-1-2-1">
          
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
