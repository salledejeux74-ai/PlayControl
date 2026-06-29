import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileKey, Plus, Search, RefreshCw, Clipboard, Check, Calendar, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Licence {
  id: string;
  key: string;
  salleName: string;
  activatedAt: string;
  expiresAt: string;
  status: 'active' | 'warning' | 'expired';
}

interface DB_Salle {
  id: string;
  name: string;
}

export const Licences: React.FC = () => {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [salles, setSalles] = useState<DB_Salle[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const [selectedSalle, setSelectedSalle] = useState('');
  const [validityMonths, setValidityMonths] = useState(12);
  const [generatedKey, setGeneratedKey] = useState('');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: sallesData, error: sallesError } = await supabase
        .from('salles')
        .select('id, name')
        .order('name');
        
      if (sallesError) throw sallesError;
      setSalles(sallesData || []);
      if (sallesData && sallesData.length > 0) {
        setSelectedSalle(sallesData[0].id);
      }

      const { data: licencesData, error: licencesError } = await supabase
        .from('licences')
        .select('*, salles(name)')
        .order('expires_at', { ascending: true });
        
      if (licencesError) throw licencesError;
      
      if (licencesData) {
        const formatted = licencesData.map((l: any) => ({
          id: l.id,
          key: l.key,
          salleName: l.salles ? l.salles.name : 'Non assignée',
          activatedAt: l.activated_at?.split('T')[0] || '',
          expiresAt: l.expires_at?.split('T')[0] || '',
          status: l.status as 'active' | 'warning' | 'expired'
        }));
        setLicences(formatted);
      }
    } catch (err: any) {
      console.error(err);
      showToastMsg("Erreur de chargement: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const key = `PLAY-${segment()}-${segment()}-${segment()}`;
    setGeneratedKey(key);
  };

  const handleCreateLicence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedKey || !selectedSalle) return;

    const activatedAt = new Date().toISOString();
    const expires = new Date();
    expires.setMonth(expires.getMonth() + Number(validityMonths));
    const expiresAt = expires.toISOString();

    try {
      const { data, error } = await supabase
        .from('licences')
        .insert({
          key: generatedKey,
          salle_id: selectedSalle,
          activated_at: activatedAt,
          expires_at: expiresAt,
          status: 'active'
        })
        .select('*, salles(name)')
        .single();

      if (error) throw error;

      if (data) {
        const newLicence: Licence = {
          id: data.id,
          key: data.key,
          salleName: data.salles ? data.salles.name : 'Non assignée',
          activatedAt: data.activated_at?.split('T')[0] || '',
          expiresAt: data.expires_at?.split('T')[0] || '',
          status: data.status as 'active' | 'warning' | 'expired'
        };

        setLicences([newLicence, ...licences]);
        setShowAddModal(false);
        setGeneratedKey('');
        showToastMsg(`La licence pour la salle "${newLicence.salleName}" a été générée et activée.`);
        logSystemActivity(
          `Génération de la licence ${newLicence.key} (${validityMonths} mois)`,
          'info',
          newLicence.salleName
        );
      }
    } catch (err: any) {
      showToastMsg("Erreur lors de la création de la licence: " + err.message, "error");
    }
  };

  const handleRenewLicense = (id: string, salleName: string) => {
    const lic = licences.find(l => l.id === id);
    if (!lic) return;

    openConfirm(
      "Renouveler la licence",
      `Êtes-vous sûr de vouloir prolonger de 12 mois supplémentaires la validité de la licence logicielle associée à la salle "${salleName}" ?`,
      async () => {
        try {
          const currentExpiry = new Date(lic.expiresAt);
          currentExpiry.setMonth(currentExpiry.getMonth() + 12);
          const newExpiresAt = currentExpiry.toISOString();

          const { error } = await supabase
            .from('licences')
            .update({
              expires_at: newExpiresAt,
              status: 'active'
            })
            .eq('id', id);

          if (error) throw error;

          setLicences(licences.map(l => {
            if (l.id === id) {
              return {
                ...l,
                expiresAt: newExpiresAt.split('T')[0],
                status: 'active'
              };
            }
            return l;
          }));
          showToastMsg(`La licence de la salle "${salleName}" a été prolongée d'un an avec succès.`);
          logSystemActivity(
            `Renouvellement de la licence ${lic.key} (prolongée de 12 mois)`,
            'info',
            salleName
          );
        } catch (err: any) {
          showToastMsg("Erreur de renouvellement: " + err.message, "error");
        }
      },
      'info'
    );
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const filteredLicences = licences.filter(licence =>
    licence.salleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    licence.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-500)', fontWeight: 600 }}>Chargement des licences...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Gestion des Licences Logiciel
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Générez des clés d'activation, configurez la validité et suspendez les abonnements de salle.
          </p>
        </div>
        <button 
          className="btn btn-black" 
          onClick={() => {
            generateLicenseKey();
            setShowAddModal(true);
          }} 
          style={{ gap: 'var(--space-2)' }}
        >
          <Plus size={18} /> Générer une Licence
        </button>
      </div>

      {/* Alert info banner */}
      <div className="card" style={{
        backgroundColor: 'var(--primary-50)',
        border: '1px solid var(--primary-100)',
        color: 'var(--primary-700)',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <HelpCircle size={22} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
        <div style={{ fontSize: 'var(--font-xs)', fontWeight: 500, lineHeight: 1.5 }}>
          <strong>Fonctionnement Local-First :</strong> Les serveurs locaux vérifient la licence en ligne. Si internet est absent, un <strong>délai de grâce de 7 jours</strong> est activé en cache local pour éviter toute interruption de jeu en salle.
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Rechercher par clé ou par salle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span className="badge" style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', fontWeight: 700 }}>Actives: {licences.filter(l => l.status === 'active').length}</span>
          <span className="badge" style={{ backgroundColor: 'var(--warning-50)', color: 'var(--warning-600)', fontWeight: 700 }}>Critiques: {licences.filter(l => l.status === 'warning').length}</span>
          <span className="badge" style={{ backgroundColor: 'var(--danger-50)', color: 'var(--danger-600)', fontWeight: 700 }}>Expirées: {licences.filter(l => l.status === 'expired').length}</span>
        </div>
      </div>

      {/* License table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Clé de Licence</th>
              <th>Salle associée</th>
              <th>Date d'activation</th>
              <th>Date d'expiration</th>
              <th>Statut</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLicences.length > 0 ? (
              filteredLicences.map(licence => (
                <tr key={licence.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--neutral-100)',
                        color: 'var(--neutral-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileKey size={16} />
                      </div>
                      <code style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                        {licence.key}
                      </code>
                      <button 
                        onClick={() => handleCopyKey(licence.key, licence.id)}
                        className="btn btn-ghost" 
                        style={{ padding: '2px', borderRadius: '4px' }}
                        title="Copier la clé"
                      >
                        {copiedKeyId === licence.id ? <Check size={14} style={{ color: 'var(--success-700)' }} /> : <Clipboard size={14} />}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--neutral-700)', fontSize: 'var(--font-sm)' }}>
                      {licence.salleName}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neutral-500)', fontSize: 'var(--font-xs)' }}>
                      <Calendar size={12} />
                      <span>{licence.activatedAt}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neutral-600)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                      <Calendar size={12} />
                      <span style={{
                        color: licence.status === 'expired' ? 'var(--danger-600)' : licence.status === 'warning' ? 'var(--warning-600)' : 'inherit'
                      }}>
                        {licence.expiresAt}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      licence.status === 'active' ? 'badge-success' : 
                      licence.status === 'warning' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {licence.status === 'active' ? 'Active' : 
                       licence.status === 'warning' ? 'Bientôt Expirée' : 'Expirée'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                      <button 
                        onClick={() => handleRenewLicense(licence.id, licence.salleName)}
                        className="btn btn-secondary btn-sm" 
                        style={{ gap: 'var(--space-1)' }}
                      >
                        <RefreshCw size={12} /> Renouveler
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--neutral-400)' }}>
                  Aucune licence trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Générer une Licence</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateLicence} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Clé générée</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <code style={{
                    flex: 1,
                    backgroundColor: 'var(--neutral-100)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--neutral-200)',
                    fontSize: 'var(--font-base)',
                    fontWeight: 700,
                    textAlign: 'center',
                    color: 'var(--primary-600)',
                    display: 'block'
                  }}>
                    {generatedKey}
                  </code>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-icon" 
                    onClick={generateLicenseKey}
                    title="Régénérer"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Attribuer à la salle</label>
                <select 
                  className="select-field"
                  value={selectedSalle}
                  onChange={(e) => setSelectedSalle(e.target.value)}
                  required
                >
                  {salles.length > 0 ? (
                    salles.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  ) : (
                    <option value="">Aucune salle disponible</option>
                  )}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Durée de validité</label>
                <select 
                  className="select-field"
                  value={validityMonths}
                  onChange={(e) => setValidityMonths(Number(e.target.value))}
                >
                  <option value={1}>1 Mois</option>
                  <option value={3}>3 Mois</option>
                  <option value={6}>6 Mois</option>
                  <option value={12}>1 An (12 Mois)</option>
                  <option value={24}>2 Ans (24 Mois)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-black">Activer & Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
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
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setConfirmModal(null)}
              >
                Annuler
              </button>
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
          borderLeft: '4px solid #10b981', // Success green border
          zIndex: 9999, // Render above everything, including modals
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          fontSize: 'var(--font-sm)',
          animation: 'fade-in 0.3s ease-out'
        }}>
          <span style={{ 
            color: '#10b981', 
            backgroundColor: '#ecfdf5', 
            width: '20px',
            height: '20px',
            borderRadius: '50%', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            ✓
          </span>
          <span>{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
};
