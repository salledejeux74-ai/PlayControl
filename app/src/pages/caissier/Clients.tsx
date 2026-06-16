import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Trash2, ShieldAlert, CreditCard, Award, UserMinus, UserCheck, Edit2 } from 'lucide-react';

interface MemberClient {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  balance: number;
  abonnementType: 'Aucun' | 'Journalier' | 'Hebdomadaire' | 'Mensuel' | 'VIP';
  abonnementExpiration: string | null;
  status: 'active' | 'suspended';
}

export const CaissierClients: React.FC = () => {
  const [clients, setClients] = useState<MemberClient[]>([
    { id: '1', username: 'Gamer_Pro', fullName: 'Arthur Mbe', phone: '+237 699 99 99 99', balance: 5400, abonnementType: 'VIP', abonnementExpiration: '2026-07-15', status: 'active' },
    { id: '2', username: 'Marc_K', fullName: 'Marc Kemajou', phone: '+237 677 77 77 77', balance: 12500, abonnementType: 'Aucun', abonnementExpiration: null, status: 'active' },
    { id: '3', username: 'Alain_T', fullName: 'Alain Tchakounté', phone: '+237 655 55 55 55', balance: 750, abonnementType: 'Aucun', abonnementExpiration: null, status: 'active' },
    { id: '4', username: 'Serge_F', fullName: 'Serge Fotso', phone: '+237 688 88 88 88', balance: 3200, abonnementType: 'Hebdomadaire', abonnementExpiration: '2026-06-22', status: 'active' },
    { id: '5', username: 'Amadou_B', fullName: 'Amadou Bello', phone: '+234 80 31 23 45 67', balance: 0, abonnementType: 'Aucun', abonnementExpiration: null, status: 'suspended' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState<MemberClient | null>(null);
  const [showAbonnementModal, setShowAbonnementModal] = useState<MemberClient | null>(null);

  // Form states (Add)
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+237');
  const [rawPhoneNum, setRawPhoneNum] = useState('');

  // Form states (Edit)
  const [showEditModal, setShowEditModal] = useState<MemberClient | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState('+237');
  const [editRawPhoneNum, setEditRawPhoneNum] = useState('');

  // Recharge state
  const [rechargeAmount, setRechargeAmount] = useState<number>(2000);
  const [customRecharge, setCustomRecharge] = useState<string>('');

  // Abonnement selection state
  const [selectedAbonnement, setSelectedAbonnement] = useState<'Journalier' | 'Hebdomadaire' | 'Mensuel' | 'VIP'>('Journalier');

  // Country selection for validation
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

  const handlePhoneInputChange = (val: string) => {
    const numbersOnly = val.replace(/\D/g, '');
    if (numbersOnly.length <= activeCountry.length) {
      setRawPhoneNum(numbersOnly);
    }
  };

  const generateUsername = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s_-]/g, "")   // keep alpha-numeric, space, underscore, hyphen
      .trim()
      .replace(/[\s-]+/g, "_");        // replace spaces/hyphens with underscore
  };

  const handleEditPhoneInputChange = (val: string) => {
    const activeCountry = countries.find(c => c.code === editPhoneCountryCode) || countries[0];
    const numbersOnly = val.replace(/\D/g, '');
    if (numbersOnly.length <= activeCountry.length) {
      setEditRawPhoneNum(numbersOnly);
    }
  };

  const handleStartEditClient = (client: MemberClient) => {
    setShowEditModal(client);
    setEditFullName(client.fullName);
    setEditUsername(client.username);
    
    const phoneParts = client.phone.split(' ');
    const code = phoneParts[0];
    const rawNum = phoneParts.slice(1).join('').replace(/\D/g, '');
    
    setEditPhoneCountryCode(code);
    setEditRawPhoneNum(rawNum);
  };

  const handleSaveEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!editFullName || !editUsername) return;

    if (clients.some(c => c.id !== showEditModal.id && c.username.toLowerCase() === editUsername.toLowerCase())) {
      showToastMsg(`L'identifiant @${editUsername} est déjà utilisé par un autre client.`, 'error');
      return;
    }

    const activeCountry = countries.find(c => c.code === editPhoneCountryCode) || countries[0];
    if (editRawPhoneNum.length !== activeCountry.length) {
      showToastMsg(`Le numéro de téléphone pour le ${activeCountry.name} doit contenir exactement ${activeCountry.length} chiffres.`, 'error');
      return;
    }

    let formattedPhoneNum = editRawPhoneNum;
    if (editRawPhoneNum.length === 9) {
      formattedPhoneNum = `${editRawPhoneNum.slice(0, 3)} ${editRawPhoneNum.slice(3, 5)} ${editRawPhoneNum.slice(5, 7)} ${editRawPhoneNum.slice(7, 9)}`;
    } else if (editRawPhoneNum.length === 10) {
      formattedPhoneNum = `${editRawPhoneNum.slice(0, 2)} ${editRawPhoneNum.slice(2, 4)} ${editRawPhoneNum.slice(4, 6)} ${editRawPhoneNum.slice(6, 8)} ${editRawPhoneNum.slice(8, 10)}`;
    } else if (editRawPhoneNum.length === 8) {
      formattedPhoneNum = `${editRawPhoneNum.slice(0, 2)} ${editRawPhoneNum.slice(2, 4)} ${editRawPhoneNum.slice(4, 6)} ${editRawPhoneNum.slice(6, 8)}`;
    }

    const fullPhone = `${editPhoneCountryCode} ${formattedPhoneNum}`;

    setClients(clients.map(c => {
      if (c.id === showEditModal.id) {
        return {
          ...c,
          fullName: editFullName,
          username: editUsername,
          phone: fullPhone
        };
      }
      return c;
    }));

    setShowEditModal(null);
    showToastMsg(`Les informations du client @${editUsername} ont été mises à jour.`);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername) return;

    if (rawPhoneNum.length !== activeCountry.length) {
      showToastMsg(`Le numéro de téléphone pour le ${activeCountry.name} doit contenir exactement ${activeCountry.length} chiffres.`, 'error');
      return;
    }

    if (clients.some(c => c.username.toLowerCase() === newUsername.toLowerCase())) {
      showToastMsg(`L'identifiant "@${newUsername}" est déjà utilisé.`, 'error');
      return;
    }

    const finalPhone = `${phoneCountryCode} ${rawPhoneNum.trim()}`;

    const newClient: MemberClient = {
      id: String(clients.length + 1),
      username: newUsername.replace(/\s/g, ''),
      fullName: newName,
      phone: finalPhone,
      balance: 0,
      abonnementType: 'Aucun',
      abonnementExpiration: null,
      status: 'active'
    };

    setClients([...clients, newClient]);
    setShowAddModal(false);
    setNewName('');
    setNewUsername('');
    setRawPhoneNum('');
    showToastMsg(`Le compte membre de "${newName}" (@${newUsername}) a été créé.`);
  };

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRechargeModal) return;

    const amount = customRecharge ? Number(customRecharge) : rechargeAmount;
    if (amount <= 0) {
      showToastMsg("Veuillez saisir un montant de recharge valide.", 'error');
      return;
    }

    setClients(clients.map(c => {
      if (c.id === showRechargeModal.id) {
        return { ...c, balance: c.balance + amount };
      }
      return c;
    }));

    setShowRechargeModal(null);
    setCustomRecharge('');
    showToastMsg(`Le compte de @${showRechargeModal.username} a été crédité de ${amount.toLocaleString()} FCFA.`);
  };

  const handleAbonnementAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAbonnementModal) return;

    const prices = {
      Journalier: 1500,
      Hebdomadaire: 5000,
      Mensuel: 15000,
      VIP: 25000
    };

    const cost = prices[selectedAbonnement];

    if (showAbonnementModal.balance < cost) {
      showToastMsg(`Solde insuffisant. Forfait : ${cost} FCFA. Solde actuel : ${showAbonnementModal.balance} FCFA.`, 'error');
      return;
    }

    const today = new Date();
    if (selectedAbonnement === 'Journalier') today.setDate(today.getDate() + 1);
    else if (selectedAbonnement === 'Hebdomadaire') today.setDate(today.getDate() + 7);
    else if (selectedAbonnement === 'Mensuel') today.setMonth(today.getMonth() + 1);
    else if (selectedAbonnement === 'VIP') today.setMonth(today.getMonth() + 1);

    const expStr = today.toISOString().split('T')[0];

    setClients(clients.map(c => {
      if (c.id === showAbonnementModal.id) {
        return {
          ...c,
          balance: c.balance - cost,
          abonnementType: selectedAbonnement,
          abonnementExpiration: expStr
        };
      }
      return c;
    }));

    setShowAbonnementModal(null);
    showToastMsg(`Le pass "${selectedAbonnement}" a été attribué avec succès à @${showAbonnementModal.username}.`);
  };

  const handleToggleStatus = (id: string, username: string, currentStatus: 'active' | 'suspended') => {
    const isSuspended = currentStatus === 'active';
    openConfirm(
      isSuspended ? "Suspendre le client" : "Activer le client",
      isSuspended 
        ? `Voulez-vous suspendre temporairement le compte de @${username} ?`
        : `Voulez-vous réactiver le compte de @${username} ?`,
      () => {
        setClients(clients.map(c => {
          if (c.id === id) {
            return { ...c, status: isSuspended ? 'suspended' : 'active' };
          }
          return c;
        }));
        showToastMsg(`Le compte de @${username} est désormais ${isSuspended ? 'suspendu' : 'actif'}.`);
      },
      isSuspended ? 'warning' : 'info'
    );
  };

  const handleDeleteClient = (id: string, username: string) => {
    openConfirm(
      "Supprimer le membre client",
      `Êtes-vous sûr de vouloir supprimer définitivement le membre @${username} ?`,
      () => {
        setClients(clients.filter(c => c.id !== id));
        showToastMsg(`Le compte de @${username} a été supprimé.`);
      },
      'danger'
    );
  };

  const filteredClients = clients.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Comptes Clients & Abonnements
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Enregistrez les joueurs, gérez leurs recharges et attribuez les pass de crédit-temps à la caisse.
          </p>
        </div>
        <button className="btn btn-black" onClick={() => setShowAddModal(true)} style={{ gap: 'var(--space-2)' }}>
          <Plus size={18} /> Enregistrer un Client
        </button>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Rechercher par identifiant, nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', fontWeight: 600 }}>
          Membres enregistrés : {clients.length}
        </div>
      </div>

      {/* Clients Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Identifiant Client</th>
              <th>Nom complet</th>
              <th>Téléphone</th>
              <th>Solde de Compte</th>
              <th>Abonnement Actif</th>
              <th>Expiration Forfait</th>
              <th>Statut</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(c => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>@{c.username}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>{c.fullName}</td>
                  <td style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>{c.phone}</td>
                  <td style={{ fontWeight: 700, color: c.balance > 1000 ? 'var(--success-700)' : 'var(--danger-600)' }}>
                    {c.balance.toLocaleString()} FCFA
                  </td>
                  <td>
                    <span className={`badge ${
                      c.abonnementType === 'Aucun' ? 'badge-neutral' : 
                      c.abonnementType === 'VIP' ? 'badge-success' : 'badge-info'
                    }`}>
                      {c.abonnementType}
                    </span>
                  </td>
                  <td style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)' }}>
                    {c.abonnementExpiration || '—'}
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {c.status === 'active' ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                      <button 
                        onClick={() => setShowRechargeModal(c)} 
                        className="btn btn-secondary btn-sm" 
                        title="Recharger le compte"
                        style={{ color: 'var(--success-700)', borderColor: 'var(--success-100)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CreditCard size={14} /> Recharge
                      </button>
                      <button 
                        onClick={() => setShowAbonnementModal(c)} 
                        className="btn btn-secondary btn-sm" 
                        title="Attribuer un pass"
                        style={{ color: 'var(--accent-600)', borderColor: 'var(--accent-100)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Award size={14} /> Pass
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(c.id, c.username, c.status)} 
                        className="btn btn-secondary btn-icon" 
                        style={{ color: c.status === 'active' ? 'var(--warning-600)' : 'var(--success-600)' }}
                        title={c.status === 'active' ? "Suspendre" : "Réactiver"}
                      >
                        {c.status === 'active' ? <UserMinus size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button 
                        onClick={() => handleStartEditClient(c)} 
                        className="btn btn-secondary btn-icon" 
                        title="Modifier les informations"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(c.id, c.username)} 
                        className="btn btn-secondary btn-icon" 
                        style={{ borderColor: 'var(--danger-100)', color: 'var(--danger-500)' }} 
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--neutral-400)' }}>
                  Aucun membre trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Client Modal */}
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
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Enregistrer un nouveau Client</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom complet</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Arthur Mbe" 
                  value={newName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewName(val);
                    setNewUsername(generateUsername(val));
                  }}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Identifiant Unique (Username)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', fontWeight: 700 }}>@</span>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="gamer_pro" 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    style={{ paddingLeft: '28px' }}
                    required 
                  />
                </div>
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
                      setRawPhoneNum('');
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
                    onChange={(e) => handlePhoneInputChange(e.target.value)}
                    required 
                  />
                </div>
                {rawPhoneNum && rawPhoneNum.length < activeCountry.length && (
                  <span className="input-error-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <ShieldAlert size={12} /> Le numéro pour le {activeCountry.name} doit comporter exactement {activeCountry.length} chiffres.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-black">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
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
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Modifier les informations du Client</h3>
              <button className="btn btn-ghost" onClick={() => setShowEditModal(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditClient} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom complet</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Arthur Mbe" 
                  value={editFullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditFullName(val);
                    setEditUsername(generateUsername(val));
                  }}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Identifiant Unique (Username)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', fontWeight: 700 }}>@</span>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="gamer_pro" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    style={{ paddingLeft: '28px' }}
                    required 
                  />
                </div>
              </div>

              {/* Telephone Input with flag validation */}
              <div className="input-group">
                <label className="input-label">Numéro de Téléphone</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <select 
                    className="select-field"
                    value={editPhoneCountryCode}
                    onChange={(e) => {
                      setEditPhoneCountryCode(e.target.value);
                      setEditRawPhoneNum('');
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
                    className={`input-field ${editRawPhoneNum && editRawPhoneNum.length < (countries.find(c => c.code === editPhoneCountryCode) || countries[0]).length ? 'input-error' : ''}`}
                    placeholder={(countries.find(c => c.code === editPhoneCountryCode) || countries[0]).placeholder}
                    value={editRawPhoneNum}
                    onChange={(e) => handleEditPhoneInputChange(e.target.value)}
                    required 
                  />
                </div>
                {editRawPhoneNum && editRawPhoneNum.length < (countries.find(c => c.code === editPhoneCountryCode) || countries[0]).length && (
                  <span className="input-error-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <ShieldAlert size={12} /> Le numéro pour {(countries.find(c => c.code === editPhoneCountryCode) || countries[0]).name} doit comporter exactement {(countries.find(c => c.code === editPhoneCountryCode) || countries[0]).length} chiffres.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recharge Modal */}
      {showRechargeModal && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Créditer le Compte
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowRechargeModal(null)}>✕</button>
            </div>

            <form onSubmit={handleRecharge} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)' }}>
                Membre : <strong>{showRechargeModal.fullName}</strong> (@{showRechargeModal.username}). Solde actuel : <strong>{showRechargeModal.balance.toLocaleString()} FCFA</strong>.
              </p>

              <div className="input-group">
                <label className="input-label">Montant de la recharge</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                  <button 
                    type="button" 
                    className={`btn ${rechargeAmount === 1000 && !customRecharge ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setRechargeAmount(1000); setCustomRecharge(''); }}
                  >
                    1 000 FCFA
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${rechargeAmount === 2000 && !customRecharge ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setRechargeAmount(2000); setCustomRecharge(''); }}
                  >
                    2 000 FCFA
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${rechargeAmount === 5000 && !customRecharge ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setRechargeAmount(5000); setCustomRecharge(''); }}
                  >
                    5 000 FCFA
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Ou saisir un montant personnalisé (FCFA)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Ex: 3000" 
                  value={customRecharge}
                  onChange={(e) => setCustomRecharge(e.target.value)}
                  min={100}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRechargeModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black">Encaisser et Créditer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Abonnement Modal */}
      {showAbonnementModal && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Attribuer un Abonnement
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowAbonnementModal(null)}>✕</button>
            </div>

            <form onSubmit={handleAbonnementAssign} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)' }}>
                Membre : <strong>{showAbonnementModal.fullName}</strong>. Solde disponible : <strong>{showAbonnementModal.balance.toLocaleString()} FCFA</strong>.
              </p>

              <div className="input-group">
                <label className="input-label">Choisir la formule</label>
                <select 
                  className="select-field"
                  value={selectedAbonnement}
                  onChange={(e: any) => setSelectedAbonnement(e.target.value)}
                >
                  <option value="Journalier">Pass Journalier (1 500 FCFA — 2h incl.)</option>
                  <option value="Hebdomadaire">Pass Hebdomadaire (5 000 FCFA — 8h incl.)</option>
                  <option value="Mensuel">Pass Mensuel (15 000 FCFA — 25h incl.)</option>
                  <option value="VIP">Pass VIP Gold (25 000 FCFA — 50h incl.)</option>
                </select>
              </div>

              {(() => {
                const prices = { Journalier: 1500, Hebdomadaire: 5000, Mensuel: 15000, VIP: 25000 };
                const cost = prices[selectedAbonnement];
                const rest = showAbonnementModal.balance - cost;
                
                return (
                  <div style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-xs)',
                    backgroundColor: rest >= 0 ? 'var(--primary-50)' : 'var(--danger-50)',
                    color: rest >= 0 ? 'var(--primary-700)' : 'var(--danger-700)',
                    border: `1px solid ${rest >= 0 ? 'var(--primary-100)' : 'var(--danger-100)'}`
                  }}>
                    {rest >= 0 ? (
                      <span>✓ Solde suffisant. Nouveau solde après achat : <strong>{rest.toLocaleString()} FCFA</strong>.</span>
                    ) : (
                      <span>✕ Solde insuffisant. Manque <strong>{Math.abs(rest).toLocaleString()} FCFA</strong>.</span>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAbonnementModal(null)}>Annuler</button>
                <button 
                  type="submit" 
                  className="btn btn-black"
                  disabled={showAbonnementModal.balance < (selectedAbonnement === 'Journalier' ? 1500 : selectedAbonnement === 'Hebdomadaire' ? 5000 : selectedAbonnement === 'Mensuel' ? 15000 : 25000)}
                >
                  Confirmer la vente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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
