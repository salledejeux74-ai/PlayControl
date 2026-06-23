import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Trash2, KeyRound, UserMinus, UserCheck, ShieldAlert, Edit2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended';
  lastLogin: string;
}
export const AdminEmployes: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Employee | null>(null);

  // Form states (Add)
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+237');
  const [rawPhoneNum, setRawPhoneNum] = useState('');

  // Form states (Edit)
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState('+237');
  const [editRawPhoneNum, setEditRawPhoneNum] = useState('');

  // Country list for validation
  const countries = [
    { code: '+237', flag: '🇨🇲', name: 'Cameroun', length: 9, placeholder: '699 99 99 99' },
    { code: '+241', flag: '🇬🇦', name: 'Gabon', length: 9, placeholder: '66 12 34 56' },
    { code: '+242', flag: '🇨🇬', name: 'Congo', length: 9, placeholder: '06 123 45 67' },
    { code: '+243', flag: '🇨🇩', name: 'RDC', length: 9, placeholder: '81 234 56 78' },
    { code: '+236', flag: '🇨🇫', name: 'RCA', length: 8, placeholder: '75 12 34 56' },
    { code: '+235', flag: '🇹🇩', name: 'Tchad', length: 8, placeholder: '66 12 34 56' },
    { code: '+225', flag: '🇨🇮', name: 'Côte d\'Ivoire', length: 10, placeholder: '07 12 34 56 78' },
    { code: '+221', flag: '🇸🇳', name: 'Sénégal', length: 9, placeholder: '77 123 45 67' },
    { code: '+234', flag: '🇳🇬', name: 'Nigeria', length: 10, placeholder: '80 31 23 45 67' },
    { code: '+33',  flag: '🇫🇷', name: 'France', length: 9, placeholder: '6 12 34 56 78' },
  ];

  const activeCountry = countries.find(c => c.code === phoneCountryCode) || countries[0];
  const activeEditCountry = countries.find(c => c.code === editPhoneCountryCode) || countries[0];

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

  const handlePhoneInputChange = (val: string, isEdit: boolean) => {
    const numbersOnly = val.replace(/\D/g, '');
    const limit = isEdit ? activeEditCountry.length : activeCountry.length;
    if (numbersOnly.length <= limit) {
      if (isEdit) setEditRawPhoneNum(numbersOnly);
      else setRawPhoneNum(numbersOnly);
    }
  };

  const fetchEmployees = async () => {
    if (!user || !user.salleId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'caissier')
        .eq('salle_id', user.salleId)
        .order('name', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map(p => ({
        id: p.id,
        name: p.name || '',
        email: p.email,
        phone: p.phone || '',
        status: (p.status || 'active') as 'active' | 'suspended',
        lastLogin: p.temp_password ? `M.P. temporaire: ${p.temp_password}` : 'Déjà connecté'
      }));
      setEmployees(mapped);
    } catch (err: any) {
      showToastMsg(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    if (!user || !user.salleId) return;

    if (rawPhoneNum.length !== activeCountry.length) {
      showToastMsg(`Le numéro de téléphone pour le ${activeCountry.name} doit contenir exactement ${activeCountry.length} chiffres.`, 'error');
      return;
    }

    const finalPhone = `${phoneCountryCode} ${rawPhoneNum.trim()}`;
    const tempPassword = Math.random().toString(36).slice(-8);

    try {
      // 1. Create in auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: newName,
          role: 'caissier',
          salle_id: user.salleId,
          temp_password: tempPassword,
          phone: finalPhone,
          status: 'active'
        }
      });

      if (error) throw error;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: finalPhone,
          status: 'active',
          temp_password: tempPassword
        })
        .eq('id', data.user.id);

      if (profileError) throw profileError;

      showToastMsg(`Le compte caissier de "${newName}" a été créé avec le mot de passe temporaire : ${tempPassword}`);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setRawPhoneNum('');
      fetchEmployees();
    } catch (err: any) {
      showToastMsg(err.message, 'error');
    }
  };

  const handleEditClick = (emp: Employee) => {
    setShowEditModal(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    
    // Parse phone
    const matchedCountry = countries.find(c => emp.phone.startsWith(c.code));
    if (matchedCountry) {
      setEditPhoneCountryCode(matchedCountry.code);
      setEditRawPhoneNum(emp.phone.replace(matchedCountry.code, '').replace(/\s/g, ''));
    } else {
      setEditPhoneCountryCode('+237');
      setEditRawPhoneNum('');
    }
  };

  const handleSaveEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal || !editName || !editEmail) return;

    if (editRawPhoneNum.length !== activeEditCountry.length) {
      showToastMsg(`Le numéro de téléphone pour le ${activeEditCountry.name} doit contenir exactement ${activeEditCountry.length} chiffres.`, 'error');
      return;
    }

    const finalPhone = `${editPhoneCountryCode} ${editRawPhoneNum.trim()}`;

    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: editName,
          email: editEmail,
          phone: finalPhone
        })
        .eq('id', showEditModal.id);

      if (profileError) throw profileError;

      // 2. Update auth
      await supabase.auth.admin.updateUserById(showEditModal.id, {
        email: editEmail,
        user_metadata: { name: editName, phone: finalPhone }
      });

      showToastMsg(`Les informations de "${editName}" ont été mises à jour.`);
      setShowEditModal(null);
      fetchEmployees();
    } catch (err: any) {
      showToastMsg(err.message, 'error');
    }
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: 'active' | 'suspended') => {
    const isSuspended = currentStatus === 'active';
    openConfirm(
      isSuspended ? "Suspendre l'employé" : "Réactiver l'employé",
      isSuspended 
        ? `Êtes-vous sûr de vouloir suspendre le compte de "${name}" ? Cet employé ne pourra plus se connecter à la caisse.` 
        : `Voulez-vous réactiver le compte de "${name}" ?`,
      async () => {
        try {
          // 1. Update profiles table
          const { error } = await supabase
            .from('profiles')
            .update({ status: isSuspended ? 'suspended' : 'active' })
            .eq('id', id);

          if (error) throw error;

          // 2. Update auth user_metadata
          await supabase.auth.admin.updateUserById(id, {
            user_metadata: { status: isSuspended ? 'suspended' : 'active' }
          });

          showToastMsg(`Le compte de "${name}" est désormais ${isSuspended ? 'suspendu' : 'actif'}.`);
          fetchEmployees();
        } catch (err: any) {
          showToastMsg(err.message, 'error');
        }
      },
      isSuspended ? 'warning' : 'info'
    );
  };

  const handleResetPassword = (id: string, name: string) => {
    const tempPassword = Math.random().toString(36).slice(-8);
    openConfirm(
      "Réinitialiser le mot de passe",
      `Êtes-vous sûr de vouloir réinitialiser le mot de passe de "${name}" ? Un mot de passe temporaire unique sera généré automatiquement.`,
      async () => {
        try {
          // 1. Update auth password
          const { error } = await supabase.auth.admin.updateUserById(id, {
            password: tempPassword,
            user_metadata: { temp_password: tempPassword }
          });

          if (error) throw error;

          // 2. Save in profiles
          await supabase
            .from('profiles')
            .update({ temp_password: tempPassword })
            .eq('id', id);

          showToastMsg(`Le mot de passe temporaire pour "${name}" a été réinitialisé : ${tempPassword}`);
          fetchEmployees();
        } catch (err: any) {
          showToastMsg(err.message, 'error');
        }
      },
      'info'
    );
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    openConfirm(
      "Supprimer l'employé",
      `Êtes-vous sûr de vouloir supprimer définitivement le compte de "${name}" ? Cette action est irréversible.`,
      async () => {
        try {
          const { error } = await supabase.auth.admin.deleteUser(id);
          if (error) throw error;

          showToastMsg(`Le compte de "${name}" a été supprimé.`);
          fetchEmployees();
        } catch (err: any) {
          showToastMsg(err.message, 'error');
        }
      },
      'danger'
    );
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phone.includes(searchTerm)
  );

  if (loading) {
    return <LoadingSkeleton type="table" />;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Gestion des Employés
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Créez et configurez les comptes des caissiers de votre salle de jeux.
          </p>
        </div>
        <button className="btn btn-black" onClick={() => setShowAddModal(true)} style={{ gap: 'var(--space-2)' }}>
          <Plus size={18} /> Créer un Caissier
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Rechercher par nom, e-mail ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', fontWeight: 600 }}>
          Employés actifs : {employees.filter(e => e.status === 'active').length} / {employees.length}
        </div>
      </div>

      {/* Employees Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nom du Caissier</th>
              <th>Adresse Email</th>
              <th>Numéro de Téléphone</th>
              <th>Dernière connexion</th>
              <th>Statut</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-50)',
                        color: 'var(--primary-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>{emp.email}</td>
                  <td style={{ color: 'var(--neutral-700)', fontWeight: 500 }}>{emp.phone}</td>
                  <td style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)' }}>{emp.lastLogin}</td>
                  <td>
                    <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status === 'active' ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                      <button 
                        onClick={() => handleEditClick(emp)} 
                        className="btn btn-secondary btn-icon" 
                        title="Modifier les informations"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleResetPassword(emp.id, emp.name)} 
                        className="btn btn-secondary btn-icon" 
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(emp.id, emp.name, emp.status)} 
                        className="btn btn-secondary btn-icon" 
                        style={{ color: emp.status === 'active' ? 'var(--warning-600)' : 'var(--success-600)' }}
                        title={emp.status === 'active' ? "Suspendre le compte" : "Réactiver le compte"}
                      >
                        {emp.status === 'active' ? <UserMinus size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)} 
                        className="btn btn-secondary btn-icon" 
                        style={{ borderColor: 'var(--danger-100)', color: 'var(--danger-500)' }} 
                        title="Supprimer définitivement"
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
                  Aucun caissier trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
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
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Créer un compte Caissier</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom complet</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Sophie Caisse" 
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
                  placeholder="Ex: sophie.caisse@playcontrol.com" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required 
                />
              </div>

              {/* Telephone Input with flag validation */}
              <div className="input-group">
                <label className="input-label">Numéro de Téléphone</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <select 
                    className="select-field"
                    value={phoneCountryCode}
                    onChange={(e) => {
                      setPhoneCountryCode(e.target.value);
                      setRawPhoneNum(''); // Reset on country change
                    }}
                    style={{ width: '130px', flexShrink: 0 }}
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    className={`input-field ${rawPhoneNum && rawPhoneNum.length < activeCountry.length ? 'input-error' : ''}`}
                    placeholder={activeCountry.placeholder}
                    value={rawPhoneNum}
                    onChange={(e) => handlePhoneInputChange(e.target.value, false)}
                    required 
                  />
                </div>
                {rawPhoneNum && rawPhoneNum.length < activeCountry.length && (
                  <span className="input-error-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <ShieldAlert size={12} /> Le numéro pour le {activeCountry.name} doit comporter exactement {activeCountry.length} chiffres.
                  </span>
                )}
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
                <CheckCircle size={14} /> Un mot de passe temporaire sera généré automatiquement.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-black">Créer le caissier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
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
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Modifier l'employé</h3>
              <button className="btn btn-ghost" onClick={() => setShowEditModal(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom complet</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Adresse Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required 
                />
              </div>

              {/* Telephone Input */}
              <div className="input-group">
                <label className="input-label">Numéro de Téléphone</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <select 
                    className="select-field"
                    value={editPhoneCountryCode}
                    onChange={(e) => {
                      setEditPhoneCountryCode(e.target.value);
                      setEditRawPhoneNum(''); // Reset
                    }}
                    style={{ width: '130px', flexShrink: 0 }}
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    className={`input-field ${editRawPhoneNum && editRawPhoneNum.length < activeEditCountry.length ? 'input-error' : ''}`}
                    placeholder={activeEditCountry.placeholder}
                    value={editRawPhoneNum}
                    onChange={(e) => handlePhoneInputChange(e.target.value, true)}
                    required 
                  />
                </div>
                {editRawPhoneNum && editRawPhoneNum.length < activeEditCountry.length && (
                  <span className="input-error-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <ShieldAlert size={12} /> Le numéro pour le {activeEditCountry.name} doit comporter exactement {activeEditCountry.length} chiffres.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black">Enregistrer les modifications</button>
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
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmModal(null)}>Annuler</button>
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
          borderLeft: `4px solid ${toast.type === 'error' ? 'var(--danger-500)' : '#10b981'}`,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          fontSize: 'var(--font-sm)',
          animation: 'fade-in 0.3s ease-out'
        }}>
          {toast.type === 'error' ? (
            <span style={{ color: 'var(--danger-500)', backgroundColor: 'var(--danger-50)', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✕</span>
          ) : (
            <span style={{ color: '#10b981', backgroundColor: '#ecfdf5', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</span>
          )}
          <span>{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
};
