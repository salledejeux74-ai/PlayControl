import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Trash2, KeyRound, Check } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  salleName: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export const Admins: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([
    { id: '1', name: 'Marc Kemajou', email: 'marc.k@gamingzone.com', salleName: 'Gaming Zone - Yaoundé', status: 'active', createdAt: '2026-01-10' },
    { id: '2', name: 'Alain Tchakounté', email: 'alain.t@arenagames.com', salleName: 'Arena Games - Douala', status: 'active', createdAt: '2026-02-14' },
    { id: '3', name: 'Amadou Bello', email: 'amadou.b@playsafe.com', salleName: 'Play Safe - Garoua', status: 'active', createdAt: '2026-03-05' },
    { id: '4', name: 'Serge Fotso', email: 'serge.f@nexusgaming.com', salleName: 'Nexus Gaming - Bafoussam', status: 'inactive', createdAt: '2026-04-22' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedSalle, setSelectedSalle] = useState('Gaming Zone - Yaoundé');

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
  
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newAdmin: AdminUser = {
      id: String(admins.length + 1),
      name: newName,
      email: newEmail,
      salleName: selectedSalle,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAdmins([...admins, newAdmin]);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    showToastMsg(`Le compte propriétaire de ${newName} a été créé avec succès.`);
  };

  const handleResetPassword = (name: string) => {
    openConfirm(
      "Réinitialiser le mot de passe",
      `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${name} ? Un e-mail contenant les instructions de réinitialisation lui sera envoyé automatiquement.`,
      () => {
        showToastMsg(`Le lien de réinitialisation a été envoyé à l'adresse e-mail de ${name}.`);
      },
      'info'
    );
  };

  const handleDeleteAdmin = (id: string, name: string) => {
    openConfirm(
      "Supprimer le propriétaire",
      `Êtes-vous sûr de vouloir supprimer le compte propriétaire de ${name} ? Sa salle de jeux n'aura plus d'accès de gestion sur la plateforme. Cette action est irréversible.`,
      () => {
        setAdmins(admins.filter(a => a.id !== id));
        showToastMsg(`Le compte de ${name} a été supprimé avec succès.`);
      },
      'danger'
    );
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.salleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Gestion des Propriétaires de Salles
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Gérez les comptes des propriétaires de salle et contrôlez leurs accès de connexion.
          </p>
        </div>
        <button className="btn btn-black" onClick={() => setShowAddModal(true)} style={{ gap: 'var(--space-2)' }}>
          <Plus size={18} /> Créer un Propriétaire
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
              <th>Nom du Propriétaire</th>
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
                        onClick={() => handleResetPassword(admin.name)} 
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
                  Aucun propriétaire trouvé
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
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Créer un Propriétaire</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom complet</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Jean Dupont" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required 
                />
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

              <div className="input-group">
                <label className="input-label">Associer à une salle de jeux</label>
                <select 
                  className="select-field"
                  value={selectedSalle}
                  onChange={(e) => setSelectedSalle(e.target.value)}
                >
                  <option value="Gaming Zone - Yaoundé">Gaming Zone - Yaoundé</option>
                  <option value="Arena Games - Douala">Arena Games - Douala</option>
                  <option value="Play Safe - Garoua">Play Safe - Garoua</option>
                  <option value="Nexus Gaming - Bafoussam">Nexus Gaming - Bafoussam</option>
                </select>
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
