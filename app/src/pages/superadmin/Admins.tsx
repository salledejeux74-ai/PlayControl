import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Trash2, KeyRound, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  salleName: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface DB_Salle {
  id: string;
  name: string;
  owner: string;
}

export const Admins: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [salles, setSalles] = useState<DB_Salle[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newEmail, setNewEmail] = useState('');
  const [selectedSalle, setSelectedSalle] = useState('');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: sallesData, error: sallesError } = await supabase
        .from('salles')
        .select('id, name, owner')
        .order('name');
      
      if (sallesError) throw sallesError;
      
      setSalles(sallesData || []);
      if (sallesData && sallesData.length > 0) {
        setSelectedSalle(sallesData[0].id);
      }
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });
        
      if (profilesError) throw profilesError;
      
      if (profilesData) {
        const formatted = profilesData.map((p: any) => {
          const salle = (sallesData || []).find((s: any) => s.id === p.salle_id || s.name === p.salle_id);
          return {
            id: p.id,
            name: p.name || 'Utilisateur',
            email: p.email,
            salleName: salle ? salle.name : 'Non assignée',
            status: 'active' as const,
            createdAt: p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
          };
        });
        setAdmins(formatted);
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
  
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !selectedSalle) return;

    const salleObj = salles.find(s => s.id === selectedSalle);
    const resolvedName = salleObj ? salleObj.owner : 'Gérant';

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: 'password', // Default temporary password
        email_confirm: true,
        user_metadata: {
          name: resolvedName,
          role: 'admin',
          salle_id: selectedSalle // Storing room UUID
        }
      });

      if (error) throw error;

      if (data && data.user) {
        const newAdmin: AdminUser = {
          id: data.user.id,
          name: resolvedName,
          email: newEmail,
          salleName: salleObj ? salleObj.name : 'Non assignée',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0]
        };

        setAdmins([newAdmin, ...admins]);
        setShowAddModal(false);
        setNewEmail('');
        showToastMsg(`Le compte gérant de ${resolvedName} a été créé avec succès.`);
      }
    } catch (err: any) {
      showToastMsg("Erreur lors de la création: " + err.message, "error");
    }
  };

  const handleResetPassword = (name: string, email: string) => {
    openConfirm(
      "Réinitialiser le mot de passe",
      `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${name} ? Un e-mail contenant les instructions de réinitialisation lui sera envoyé automatiquement.`,
      async () => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
          showToastMsg(`Le lien de réinitialisation a été envoyé à l'adresse e-mail de ${name}.`);
        } catch (err: any) {
          showToastMsg("Erreur réinitialisation: " + err.message, "error");
        }
      },
      'info'
    );
  };

  const handleDeleteAdmin = (id: string, name: string) => {
    openConfirm(
      "Supprimer le gérant",
      `Êtes-vous sûr de vouloir supprimer le compte gérant de ${name} ? Sa salle de jeux n'aura plus d'accès de gestion sur la plateforme. Cette action est irréversible.`,
      async () => {
        try {
          // Cascade references mean profiles might delete automatically or we delete manually
          const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
          if (profileError) throw profileError;

          const { error: authError } = await supabase.auth.admin.deleteUser(id);
          if (authError) throw authError;

          setAdmins(admins.filter(a => a.id !== id));
          showToastMsg(`Le compte de ${name} a été supprimé avec succès.`);
        } catch (err: any) {
          showToastMsg("Erreur suppression: " + err.message, "error");
        }
      },
      'danger'
    );
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.salleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-500)', fontWeight: 600 }}>Chargement des gérants...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Gestion des Gérants de Salles
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Gérez les comptes des gérants de salle et contrôlez leurs accès de connexion.
          </p>
        </div>
        <button className="btn btn-black" onClick={() => setShowAddModal(true)} style={{ gap: 'var(--space-2)' }}>
          <Plus size={18} /> Créer un Gérant
        </button>
      </div>

      {/* Filter and stats */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Rechercher par nom, email ou salle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', fontWeight: 600 }}>
          Comptes actifs : {admins.filter(a => a.status === 'active').length} / {admins.length}
        </div>
      </div>

      {/* Admins Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nom du Gérant</th>
              <th>Adresse Email</th>
              <th>Salle Associée</th>
              <th>Date de création</th>
              <th>Statut</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map(admin => (
                <tr key={admin.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-50)',
                        color: 'var(--accent-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        {admin.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>{admin.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>{admin.email}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--primary-600)', fontSize: 'var(--font-sm)' }}>{admin.salleName}</span>
                  </td>
                  <td style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)' }}>{admin.createdAt}</td>
                  <td>
                    <span className={`badge ${admin.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {admin.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                      <button 
                        onClick={() => handleResetPassword(admin.name, admin.email)} 
                        className="btn btn-secondary btn-icon" 
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)} 
                        className="btn btn-secondary btn-icon" 
                        style={{ borderColor: 'var(--danger-100)', color: 'var(--danger-500)' }} 
                        title="Supprimer le gérant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--neutral-400)' }}>
                  Aucun gérant trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Créer un Gérant</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Associer à une salle de jeux</label>
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
                <label className="input-label">Nom complet (Récupéré de la salle)</label>
                {(() => {
                  const salleObj = salles.find(s => s.id === selectedSalle);
                  const resolvedName = salleObj ? salleObj.owner : 'Aucun gérant défini';
                  return (
                    <input 
                      type="text" 
                      className="input-field" 
                      value={resolvedName}
                      disabled
                      style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-600)', cursor: 'not-allowed' }}
                    />
                  );
                })()}
              </div>

              <div className="input-group">
                <label className="input-label">Adresse Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="Ex: jean.dupont@playcontrol.com" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required 
                />
              </div>

              <div style={{
                backgroundColor: 'var(--primary-50)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--primary-700)',
                fontSize: 'var(--font-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <Check size={14} /> Un mot de passe temporaire sera généré et envoyé à l'adresse e-mail saisie.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-black">Créer le compte</button>
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
