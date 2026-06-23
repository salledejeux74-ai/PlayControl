import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Trash2, KeyRound, Check, Edit2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  salleName: string;
  status: 'active' | 'inactive';
  createdAt: string;
  tempPassword?: string;
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

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newEmail, setNewEmail] = useState('');
  const [selectedSalle, setSelectedSalle] = useState('');

  // Password verification and creation states
  const [createAdminConfirmPassword, setCreateAdminConfirmPassword] = useState('');
  const [createAdminError, setCreateAdminError] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [showAddSuccessModal, setShowAddSuccessModal] = useState<{ name: string; email: string; pass: string } | null>(null);

  // Password verification and reveal states
  const [verifyingAdminForUser, setVerifyingAdminForUser] = useState<AdminUser | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

  // Direct password reset states
  const [resettingPasswordForUser, setResettingPasswordForUser] = useState<AdminUser | null>(null);
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState<{ name: string; email: string; pass: string } | null>(null);

  // Editing admin states
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editSelectedSalle, setEditSelectedSalle] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const handleOpenAddModal = () => {
    setCreateAdminConfirmPassword('');
    setCreateAdminError('');
    setShowAddModal(true);
  };

  const handleRequestReveal = (adminUser: AdminUser) => {
    setVerifyingAdminForUser(adminUser);
    setAdminPassword('');
    setVerificationError('');
  };

  const handleConfirmReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingAdminForUser || !adminPassword) return;

    try {
      setIsVerifyingPassword(true);
      setVerificationError('');

      // Get current logged-in superadmin email
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || !currentUser.email) {
        throw new Error("Impossible de récupérer votre session active.");
      }

      // Create a temporary isolated client to verify the password without affecting the main session
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
        import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      // Verify superadmin password by trying to sign in on the temporary client
      const { error } = await tempSupabase.auth.signInWithPassword({
        email: currentUser.email,
        password: adminPassword
      });

      if (error) {
        throw new Error("Mot de passe administrateur incorrect.");
      }

      // Password correct! Reveal the manager's password
      const gérantPassword = verifyingAdminForUser.tempPassword || "Aucun (Créé avant cette mise à jour)";
      setRevealedPasswords(prev => ({
        ...prev,
        [verifyingAdminForUser.id]: gérantPassword
      }));

      setVerifyingAdminForUser(null);
      showToastMsg("Mot de passe révélé avec succès.");
      logSystemActivity(
        `Visualisation du mot de passe du gérant ${verifyingAdminForUser.name}`,
        'warning',
        verifyingAdminForUser.salleName
      );
    } catch (err: any) {
      setVerificationError(err.message);
    } finally {
      setIsVerifyingPassword(false);
    }
  };

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
            createdAt: p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            tempPassword: p.temp_password || undefined
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
    if (!newEmail || !selectedSalle || !createAdminConfirmPassword) return;

    const salleObj = salles.find(s => s.id === selectedSalle);
    const resolvedName = salleObj ? salleObj.owner : 'Gérant';

    try {
      setIsCreatingAdmin(true);
      setCreateAdminError('');

      // 1. Verify superadmin password
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || !currentUser.email) {
        throw new Error("Impossible de récupérer votre session active.");
      }

      // Create a temporary isolated client to verify the password without affecting the main session
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
        import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      const { error: authVerifyError } = await tempSupabase.auth.signInWithPassword({
        email: currentUser.email,
        password: createAdminConfirmPassword
      });

      if (authVerifyError) {
        throw new Error("Mot de passe administrateur incorrect.");
      }

      // Generate random password AFTER verification
      const randPass = Math.random().toString(36).substring(2, 10);

      // 2. Create the user in Supabase Auth using admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: randPass,
        email_confirm: true,
        user_metadata: {
          name: resolvedName,
          role: 'admin',
          salle_id: selectedSalle,
          temp_password: randPass
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
          createdAt: new Date().toISOString().split('T')[0],
          tempPassword: randPass
        };

        setAdmins([newAdmin, ...admins]);
        setShowAddModal(false);
        setNewEmail('');
        setCreateAdminConfirmPassword('');
        
        // Show success modal with the generated password
        setShowAddSuccessModal({
          name: resolvedName,
          email: newEmail,
          pass: randPass
        });
        logSystemActivity(
          `Création du compte gérant pour ${resolvedName} (${newEmail})`,
          'info',
          salleObj ? salleObj.name : 'Non assignée'
        );
      }
    } catch (err: any) {
      setCreateAdminError(err.message);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleEditAdmin = (adminUser: AdminUser) => {
    setEditingAdmin(adminUser);
    setEditEmail(adminUser.email);
    const salleObj = salles.find(s => s.name === adminUser.salleName);
    setEditSelectedSalle(salleObj ? salleObj.id : '');
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !editEmail) return;

    const salleObj = salles.find(s => s.id === editSelectedSalle);
    const resolvedName = salleObj ? salleObj.owner : 'Gérant';

    try {
      setIsSavingEdit(true);
      setEditError('');

      // 1. Update the email and metadata in Supabase Auth using admin API
      const { error: authError } = await supabase.auth.admin.updateUserById(
        editingAdmin.id,
        {
          email: editEmail,
          user_metadata: {
            name: resolvedName,
            salle_id: editSelectedSalle
          }
        }
      );

      if (authError) throw authError;

      // 2. Update the public profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: editEmail,
          name: resolvedName,
          salle_id: editSelectedSalle
        })
        .eq('id', editingAdmin.id);

      if (profileError) throw profileError;

      // 3. Update local state
      setAdmins(admins.map(a => {
        if (a.id === editingAdmin.id) {
          return {
            ...a,
            email: editEmail,
            name: resolvedName,
            salleName: salleObj ? salleObj.name : 'Non assignée'
          };
        }
        return a;
      }));

      setEditingAdmin(null);
      showToastMsg("Compte gérant modifié avec succès.");
      logSystemActivity(
        `Modification du compte gérant pour ${resolvedName} (${editEmail})`,
        'info',
        salleObj ? salleObj.name : 'Non assignée'
      );
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetPassword = (adminUser: AdminUser) => {
    setResettingPasswordForUser(adminUser);
    setConfirmAdminPassword('');
    setResetError('');
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordForUser || !confirmAdminPassword) return;

    try {
      setIsResetting(true);
      setResetError('');

      // 1. Verify superadmin password
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || !currentUser.email) {
        throw new Error("Impossible de récupérer votre session active.");
      }

      // Create a temporary isolated client to verify the password without affecting the main session
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
        import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      const { error: authVerifyError } = await tempSupabase.auth.signInWithPassword({
        email: currentUser.email,
        password: confirmAdminPassword
      });

      if (authVerifyError) {
        throw new Error("Mot de passe administrateur incorrect.");
      }

      // Generate random password AFTER verification
      const randPass = Math.random().toString(36).substring(2, 10);

      // 2. Update the user password in Supabase Auth using admin API
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        resettingPasswordForUser.id,
        {
          password: randPass,
          user_metadata: {
            temp_password: randPass
          }
        }
      );

      if (updateAuthError) throw updateAuthError;

      // 3. Update the user password in the public profiles table
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ temp_password: randPass })
        .eq('id', resettingPasswordForUser.id);

      if (updateProfileError) throw updateProfileError;

      // 4. Update state
      setAdmins(admins.map(a => {
        if (a.id === resettingPasswordForUser.id) {
          return { ...a, tempPassword: randPass };
        }
        return a;
      }));

      // Update revealed map if it was already revealed
      if (revealedPasswords[resettingPasswordForUser.id]) {
        setRevealedPasswords(prev => ({
          ...prev,
          [resettingPasswordForUser.id]: randPass
        }));
      }

      // Open the success dialog with the generated password details
      setShowResetSuccessModal({
        name: resettingPasswordForUser.name,
        email: resettingPasswordForUser.email,
        pass: randPass
      });

      setResettingPasswordForUser(null);
      logSystemActivity(
        `Réinitialisation du mot de passe du gérant ${resettingPasswordForUser.name}`,
        'warning',
        resettingPasswordForUser.salleName
      );
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setIsResetting(false);
    }
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

          const targetAdmin = admins.find(a => a.id === id);
          setAdmins(admins.filter(a => a.id !== id));
          showToastMsg(`Le compte de ${name} a été supprimé avec succès.`);
          logSystemActivity(
            `Suppression du compte gérant de ${name}`,
            'critical',
            targetAdmin?.salleName || 'Non assignée'
          );
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
        <button className="btn btn-black" onClick={handleOpenAddModal} style={{ gap: 'var(--space-2)' }}>
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
              <th>Mot de passe</th>
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
                    {revealedPasswords[admin.id] ? (
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--font-xs)', color: 'var(--neutral-700)', backgroundColor: 'var(--neutral-100)', padding: '2px 6px', borderRadius: '4px' }}>
                        {revealedPasswords[admin.id]}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequestReveal(admin)}
                        className="btn btn-ghost"
                        style={{ padding: '2px 8px', fontSize: '11px', minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', height: 'auto', border: '1px solid var(--neutral-200)' }}
                      >
                        👁️ Afficher
                      </button>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                      <button 
                        onClick={() => handleEditAdmin(admin)} 
                        className="btn btn-secondary btn-icon" 
                        title="Modifier le gérant"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleResetPassword(admin)} 
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

              <div className="input-group">
                <label className="input-label">Votre mot de passe Super Admin (pour confirmation)</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Saisissez votre mot de passe pour confirmer"
                  value={createAdminConfirmPassword}
                  onChange={(e) => setCreateAdminConfirmPassword(e.target.value)}
                  required 
                />
              </div>

              {createAdminError && (
                <div style={{ color: 'var(--danger-600)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                  ⚠️ {createAdminError}
                </div>
              )}

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
                <Check size={14} /> Le mot de passe du gérant sera généré automatiquement de manière sécurisée après validation.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                  disabled={isCreatingAdmin}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-black"
                  disabled={isCreatingAdmin}
                >
                  {isCreatingAdmin ? 'Création...' : 'Créer le compte'}
                </button>
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

      {/* Direct Reset Password Modal */}
      {resettingPasswordForUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 1060,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)' }}>
            <h3 style={{ 
              fontSize: 'var(--font-lg)', 
              fontWeight: 700, 
              color: 'var(--neutral-800)',
              marginBottom: 'var(--space-3)'
            }}>
              Réinitialiser le mot de passe
            </h3>
            <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
              Pour réinitialiser et générer un nouveau mot de passe pour <strong>{resettingPasswordForUser.name}</strong>, veuillez saisir votre mot de passe administrateur :
            </p>
            
            <form onSubmit={handleConfirmReset} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Votre mot de passe Super Admin</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Votre mot de passe" 
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  required 
                  autoFocus
                />
              </div>

              {resetError && (
                <div style={{ color: 'var(--danger-600)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                  ⚠️ {resetError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setResettingPasswordForUser(null)}
                  disabled={isResetting}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-black" 
                  disabled={isResetting}
                >
                  {isResetting ? 'Génération...' : 'Confirmer & Générer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Success Modal */}
      {showResetSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 1060,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success-700)', marginBottom: 'var(--space-3)' }}>
              <div style={{ backgroundColor: 'var(--success-50)', padding: '6px', borderRadius: '50%', color: 'var(--success-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0 }}>Réinitialisation Réussie</h3>
            </div>
            
            <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
              Le mot de passe pour le compte gérant de <strong>{showResetSuccessModal.name}</strong> ({showResetSuccessModal.email}) a été modifié. 
              Veuillez copier le nouveau mot de passe généré :
            </p>

            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={showResetSuccessModal.pass}
                  readOnly
                  style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 'var(--font-base)', textAlign: 'center', backgroundColor: 'var(--neutral-50)', color: 'var(--neutral-800)' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(showResetSuccessModal.pass);
                    showToastMsg("Mot de passe copié !");
                  }}
                  style={{ padding: '0 16px' }}
                >
                  Copier
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-black" 
                onClick={() => setShowResetSuccessModal(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Success Modal */}
      {showAddSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 1060,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success-700)', marginBottom: 'var(--space-3)' }}>
              <div style={{ backgroundColor: 'var(--success-50)', padding: '6px', borderRadius: '50%', color: 'var(--success-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0 }}>Création Réussie</h3>
            </div>
            
            <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
              Le compte gérant pour <strong>{showAddSuccessModal.name}</strong> ({showAddSuccessModal.email}) a été créé avec succès. 
              Veuillez copier le mot de passe temporaire généré :
            </p>

            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={showAddSuccessModal.pass}
                  readOnly
                  style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 'var(--font-base)', textAlign: 'center', backgroundColor: 'var(--neutral-50)', color: 'var(--neutral-800)' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(showAddSuccessModal.pass);
                    showToastMsg("Mot de passe copié !");
                  }}
                  style={{ padding: '0 16px' }}
                >
                  Copier
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-black" 
                onClick={() => setShowAddSuccessModal(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
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
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Modifier le Gérant</h3>
              <button className="btn btn-ghost" onClick={() => setEditingAdmin(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Associer à une salle de jeux</label>
                <select 
                  className="select-field"
                  value={editSelectedSalle}
                  onChange={(e) => setEditSelectedSalle(e.target.value)}
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
                  const salleObj = salles.find(s => s.id === editSelectedSalle);
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
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required 
                />
              </div>

              {editError && (
                <div style={{ color: 'var(--danger-600)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                  ⚠️ {editError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingAdmin(null)}
                  disabled={isSavingEdit}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-black"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Admin Password Modal */}
      {verifyingAdminForUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)',
          zIndex: 1060,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)' }}>
            <h3 style={{ 
              fontSize: 'var(--font-lg)', 
              fontWeight: 700, 
              color: 'var(--neutral-800)',
              marginBottom: 'var(--space-3)'
            }}>
              Confirmation d'identité
            </h3>
            <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
              Pour afficher le mot de passe de <strong>{verifyingAdminForUser.name}</strong>, veuillez saisir votre mot de passe administrateur :
            </p>
            
            <form onSubmit={handleConfirmReveal} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Votre mot de passe Super Admin" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required 
                  autoFocus
                />
              </div>

              {verificationError && (
                <div style={{ color: 'var(--danger-600)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                  ⚠️ {verificationError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setVerifyingAdminForUser(null)}
                  disabled={isVerifyingPassword}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-black" 
                  disabled={isVerifyingPassword}
                >
                  {isVerifyingPassword ? 'Vérification...' : 'Confirmer'}
                </button>
              </div>
            </form>
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
