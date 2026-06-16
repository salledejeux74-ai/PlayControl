import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, Receipt, Award, Edit2, Plus, Trash2 } from 'lucide-react';

interface HourlyRate {
  id: string;
  type: string;
  label: string;
  price: number;
  durationMinutes: number;
}

interface AbonnementPackage {
  id: string;
  name: string;
  price: number;
  durationHours: number;
  validityDays: number;
  description: string;
}

const DEFAULT_MATERIAL_TYPES: HourlyRate[] = [
  { id: '1', type: 'ps5_vip', label: 'Console PS5 (Zone VIP)', price: 1500, durationMinutes: 60 },
  { id: '2', type: 'ps5_standard', label: 'Console PS5 (Zone Standard)', price: 1000, durationMinutes: 60 },
  { id: '3', type: 'ps4_standard', label: 'Console PS4 (Zone Standard)', price: 800, durationMinutes: 60 },
];

const getMaterialTypes = (): HourlyRate[] => {
  const saved = localStorage.getItem('playcontrol_material_types');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }
  return DEFAULT_MATERIAL_TYPES;
};

const saveMaterialTypes = (types: HourlyRate[]) => {
  localStorage.setItem('playcontrol_material_types', JSON.stringify(types));
};

const DEFAULT_PACKAGES: AbonnementPackage[] = [
  { id: '1', name: 'Pass Journalier', price: 1500, durationHours: 2, validityDays: 1, description: 'Accès libre à tous les postes pendant 2 heures de jeu dans la journée.' },
  { id: '2', name: 'Pass Hebdomadaire', price: 5000, durationHours: 8, validityDays: 7, description: '8 heures de crédit de jeu valables pendant 7 jours sur toutes les consoles.' },
  { id: '3', name: 'Pass Mensuel', price: 15000, durationHours: 25, validityDays: 30, description: '25 heures de crédit de jeu valables pendant 30 jours.' },
  { id: '4', name: 'Pass VIP Gold', price: 25000, durationHours: 50, validityDays: 30, description: '50 heures de crédit de jeu sur toutes les consoles, zone VIP incluse.' },
];

const getAbonnementPackages = (): AbonnementPackage[] => {
  const saved = localStorage.getItem('playcontrol_abonnement_packages');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }
  return DEFAULT_PACKAGES;
};

const saveAbonnementPackages = (pkgs: AbonnementPackage[]) => {
  localStorage.setItem('playcontrol_abonnement_packages', JSON.stringify(pkgs));
};

export const AdminTarifs: React.FC = () => {
  const [rates, setRates] = useState<HourlyRate[]>(getMaterialTypes());
  const [packages, setPackages] = useState<AbonnementPackage[]>(getAbonnementPackages());

  const [showEditPackageModal, setShowEditPackageModal] = useState<AbonnementPackage | null>(null);

  // Edit forms
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [editValidity, setEditValidity] = useState<number>(0);

  // Add Package forms
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [isPackageDeleteMode, setIsPackageDeleteMode] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState<number>(5000);
  const [newPkgDuration, setNewPkgDuration] = useState<number>(10);
  const [newPkgValidity, setNewPkgValidity] = useState<number>(7);
  const [newPkgDescription, setNewPkgDescription] = useState('');

  // Add Material Type forms
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypePrice, setNewTypePrice] = useState<number>(1000);
  const [newTypeHours, setNewTypeHours] = useState<number>(1);
  const [newTypeMinutes, setNewTypeMinutes] = useState<number>(0);

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

  const handleRatePriceChange = (id: string, newPrice: number) => {
    setRates(rates.map(r => r.id === id ? { ...r, price: newPrice } : r));
  };

  const handleRateDurationChange = (id: string, newDuration: number) => {
    setRates(rates.map(r => r.id === id ? { ...r, durationMinutes: newDuration } : r));
  };

  const handleSaveHourlyRates = (e: React.FormEvent) => {
    e.preventDefault();
    openConfirm(
      "Enregistrer les tarifs horaires",
      "Êtes-vous sûr de vouloir appliquer ces nouveaux tarifs horaires de jeu ? Ils seront effectifs immédiatement pour toutes les nouvelles sessions.",
      () => {
        saveMaterialTypes(rates);
        showToastMsg("Les tarifs horaires ont été enregistrés avec succès.");
      },
      'info'
    );
  };

  const handleAddMaterialType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeLabel.trim()) return;

    // Check uniqueness
    const key = newTypeLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    if (rates.some(r => r.type === key || r.label.toLowerCase() === newTypeLabel.trim().toLowerCase())) {
      showToastMsg(`Le type de matériel "${newTypeLabel}" existe déjà.`, 'error');
      return;
    }

    const totalMinutes = newTypeHours * 60 + newTypeMinutes;
    const newRate: HourlyRate = {
      id: String(Date.now()),
      type: key,
      label: newTypeLabel.trim(),
      price: newTypePrice,
      durationMinutes: totalMinutes > 0 ? totalMinutes : 1
    };

    const updated = [...rates, newRate];
    setRates(updated);
    saveMaterialTypes(updated);

    setShowAddTypeModal(false);
    setNewTypeLabel('');
    setNewTypePrice(1000);
    setNewTypeHours(1);
    setNewTypeMinutes(0);
    showToastMsg(`Le type de matériel "${newRate.label}" a été créé.`);
  };

  const handleDeleteMaterialType = (id: string, label: string) => {
    openConfirm(
      "Supprimer le type de matériel",
      `Êtes-vous sûr de vouloir supprimer définitivement le type de matériel "${label}" ? Cela supprimera également son tarif associé.`,
      () => {
        const updated = rates.filter(r => r.id !== id);
        setRates(updated);
        saveMaterialTypes(updated);
        setIsDeleteMode(false);
        showToastMsg(`Le type de matériel "${label}" a été supprimé.`);
      },
      'danger'
    );
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;

    const newPkg: AbonnementPackage = {
      id: String(Date.now()),
      name: newPkgName.trim(),
      price: newPkgPrice,
      durationHours: newPkgDuration,
      validityDays: newPkgValidity,
      description: newPkgDescription.trim() || `${newPkgDuration} heures de crédit de jeu valables pendant ${newPkgValidity} jours.`
    };

    const updated = [...packages, newPkg];
    setPackages(updated);
    saveAbonnementPackages(updated);

    setShowAddPackageModal(false);
    setNewPkgName('');
    setNewPkgPrice(5000);
    setNewPkgDuration(10);
    setNewPkgValidity(7);
    setNewPkgDescription('');
    showToastMsg(`Le forfait "${newPkg.name}" a été créé avec succès.`);
  };

  const handleDeletePackage = (id: string, name: string) => {
    openConfirm(
      "Supprimer le forfait d'abonnement",
      `Êtes-vous sûr de vouloir supprimer définitivement le forfait "${name}" ?`,
      () => {
        const updated = packages.filter(p => p.id !== id);
        setPackages(updated);
        saveAbonnementPackages(updated);
        setIsPackageDeleteMode(false);
        showToastMsg(`Le forfait "${name}" a été supprimé.`);
      },
      'danger'
    );
  };

  const handleEditPackageClick = (pkg: AbonnementPackage) => {
    setShowEditPackageModal(pkg);
    setEditPrice(pkg.price);
    setEditDuration(pkg.durationHours);
    setEditValidity(pkg.validityDays);
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditPackageModal) return;

    const updated = packages.map(p => {
      if (p.id === showEditPackageModal.id) {
        return {
          ...p,
          price: editPrice,
          durationHours: editDuration,
          validityDays: editValidity
        };
      }
      return p;
    });

    setPackages(updated);
    saveAbonnementPackages(updated);
    setShowEditPackageModal(null);
    showToastMsg(`Le forfait "${showEditPackageModal.name}" a été configuré avec succès.`);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
          Tarifs & Abonnements
        </h2>
        <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
          Configurez la tarification horaire par console et PC, ainsi que les formules de pass de crédit de temps.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }} className="tarifs-grid">
        
        {/* Left Column: Hourly Rates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} style={{ color: 'var(--primary-500)' }} />
                  Tarification Horaire standard
                </h3>
                <span className="card-subtitle" style={{ margin: 0 }}>Configurez les types de matériel et leurs tarifs.</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button 
                  type="button" 
                  className={`btn ${isDeleteMode ? 'btn-black' : 'btn-secondary'} btn-sm`} 
                  onClick={() => setIsDeleteMode(!isDeleteMode)}
                  style={{ 
                    gap: '4px', 
                    fontSize: 'var(--font-xs)', 
                    padding: '6px 12px',
                    borderColor: isDeleteMode ? '#ef4444' : undefined,
                    color: isDeleteMode ? '#ef4444' : undefined
                  }}
                >
                  <Trash2 size={14} /> {isDeleteMode ? 'Annuler' : 'Supprimer un Type'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => { setIsDeleteMode(false); setShowAddTypeModal(true); }}
                  style={{ gap: '4px', fontSize: 'var(--font-xs)', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Ajouter un Type
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveHourlyRates} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {rates.map(rate => (
                <div key={rate.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                      {rate.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>
                      Facturation à la minute déduite du crédit
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={rate.price}
                      onChange={(e) => handleRatePriceChange(rate.id, Number(e.target.value))}
                      style={{ width: '110px', textAlign: 'center', fontWeight: 700, padding: '0 8px', height: '38px' }}
                      min={50}
                      step={50}
                      placeholder="Prix"
                    />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)' }}>FCFA pour</span>
                    
                    {/* Hours Input */}
                    <input 
                      type="number" 
                      className="input-field" 
                      value={Math.floor(rate.durationMinutes / 60)}
                      onChange={(e) => {
                        const h = Math.max(0, Number(e.target.value));
                        const m = rate.durationMinutes % 60;
                        const total = h * 60 + m;
                        handleRateDurationChange(rate.id, total > 0 ? total : 1);
                      }}
                      style={{ width: '75px', textAlign: 'center', fontWeight: 700, padding: '0 8px', height: '38px' }}
                      min={0}
                      placeholder="h"
                    />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)' }}>h</span>

                    {/* Minutes Input */}
                    <input 
                      type="number" 
                      className="input-field" 
                      value={rate.durationMinutes % 60}
                      onChange={(e) => {
                        const m = Math.max(0, Math.min(59, Number(e.target.value)));
                        const h = Math.floor(rate.durationMinutes / 60);
                        const total = h * 60 + m;
                        handleRateDurationChange(rate.id, total > 0 ? total : 1);
                      }}
                      style={{ width: '75px', textAlign: 'center', fontWeight: 700, padding: '0 8px', height: '38px' }}
                      min={0}
                      max={59}
                      placeholder="min"
                    />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)', marginRight: '4px' }}>min</span>
                    
                    {isDeleteMode && (
                      <button 
                        type="button" 
                        onClick={() => handleDeleteMaterialType(rate.id, rate.label)}
                        className="btn btn-secondary btn-icon animate-fade-in"
                        style={{ color: 'var(--danger-500)', borderColor: 'var(--danger-100)', width: '38px', height: '38px', padding: 0 }}
                        title="Supprimer ce type de matériel"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-100)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <button type="submit" className="btn btn-black" style={{ gap: 'var(--space-2)' }}>
                  <Save size={16} /> Enregistrer les prix
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Packages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} style={{ color: 'var(--accent-500)' }} />
                  Formules d'Abonnement (Crédit Temps)
                </h3>
                <span className="card-subtitle" style={{ margin: 0 }}>Configurez les pass et forfaits prépayés.</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button 
                  type="button" 
                  className={`btn ${isPackageDeleteMode ? 'btn-black' : 'btn-secondary'} btn-sm`} 
                  onClick={() => setIsPackageDeleteMode(!isPackageDeleteMode)}
                  style={{ 
                    gap: '4px', 
                    fontSize: 'var(--font-xs)', 
                    padding: '6px 12px',
                    borderColor: isPackageDeleteMode ? '#ef4444' : undefined,
                    color: isPackageDeleteMode ? '#ef4444' : undefined
                  }}
                >
                  <Trash2 size={14} /> {isPackageDeleteMode ? 'Annuler' : 'Supprimer'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => { setIsPackageDeleteMode(false); setShowAddPackageModal(true); }}
                  style={{ gap: '4px', fontSize: 'var(--font-xs)', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {packages.map(pkg => (
                <div key={pkg.id} style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--neutral-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-4)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-800)' }}>{pkg.name}</strong>
                      <span className="badge badge-info">{pkg.durationHours}h incluses</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)', lineHeight: 1.4 }}>
                      {pkg.description}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--neutral-400)', fontWeight: 600 }}>
                      Prix : {pkg.price.toLocaleString()} FCFA • Validité : {pkg.validityDays} jours
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {isPackageDeleteMode ? (
                      <button 
                        type="button" 
                        onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                        className="btn btn-secondary btn-icon animate-fade-in"
                        style={{ color: 'var(--danger-500)', borderColor: 'var(--danger-100)', width: '38px', height: '38px', padding: 0 }}
                        title="Supprimer ce forfait"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => handleEditPackageClick(pkg)}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '38px', height: '38px', padding: 0 }}
                        title="Configurer le forfait"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Edit Package Modal */}
      {showEditPackageModal && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Configurer {showEditPackageModal.name}
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowEditPackageModal(null)}>✕</button>
            </div>

            <form onSubmit={handleSavePackage} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Tarif de vente (FCFA)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  min={100}
                  step={100}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Crédit de temps inclus (heures)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  min={1}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Durée de validité (jours)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editValidity}
                  onChange={(e) => setEditValidity(Number(e.target.value))}
                  min={1}
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditPackageModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddPackageModal && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Ajouter une Formule d'abonnement
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowAddPackageModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddPackage} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom de la formule (Pass)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Pass VIP Platinum, Pass Week-end" 
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Tarif de vente (FCFA)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newPkgPrice}
                  onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                  min={100}
                  step={100}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Crédit de temps inclus (heures)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newPkgDuration}
                  onChange={(e) => setNewPkgDuration(Number(e.target.value))}
                  min={1}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Durée de validité (jours)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newPkgValidity}
                  onChange={(e) => setNewPkgValidity(Number(e.target.value))}
                  min={1}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description (Optionnel)</label>
                <textarea 
                  className="input-field" 
                  placeholder="Ex: 10 heures de jeu valables pendant une semaine sur PC et Console..." 
                  value={newPkgDescription}
                  onChange={(e) => setNewPkgDescription(e.target.value)}
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPackageModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-black">Ajouter la formule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Material Type Modal */}
      {showAddTypeModal && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Ajouter un Type de matériel
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowAddTypeModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddMaterialType} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom du type de matériel</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Nintendo Switch, Simulateur Auto" 
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Tarif par défaut (FCFA)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newTypePrice}
                  onChange={(e) => setNewTypePrice(Number(e.target.value))}
                  min={50}
                  step={50}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Durée par défaut</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={newTypeHours}
                    onChange={(e) => setNewTypeHours(Math.max(0, Number(e.target.value)))}
                    style={{ width: '80px', textAlign: 'center', fontWeight: 700 }}
                    min={0}
                    placeholder="h"
                    required
                  />
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-600)' }}>h</span>

                  <input 
                    type="number" 
                    className="input-field" 
                    value={newTypeMinutes}
                    onChange={(e) => setNewTypeMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                    style={{ width: '80px', textAlign: 'center', fontWeight: 700 }}
                    min={0}
                    max={59}
                    placeholder="min"
                    required
                  />
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-600)' }}>min</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTypeModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-black">Ajouter le type</button>
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
          borderLeft: '4px solid #10b981',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          fontSize: 'var(--font-sm)',
          animation: 'fade-in 0.3s ease-out'
        }}>
          <span style={{ color: '#10b981', backgroundColor: '#ecfdf5', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</span>
          <span>{toast.message}</span>
        </div>,
        document.body
      )}

      <style>{`
        @media (max-width: 992px) {
          .tarifs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
