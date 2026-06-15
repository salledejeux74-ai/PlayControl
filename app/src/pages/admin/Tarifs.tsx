import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, Receipt, Award, Edit2 } from 'lucide-react';

interface HourlyRate {
  id: string;
  type: string;
  label: string;
  rate: number;
}

interface AbonnementPackage {
  id: string;
  name: string;
  price: number;
  durationHours: number;
  validityDays: number;
  description: string;
}

export const AdminTarifs: React.FC = () => {
  const [rates, setRates] = useState<HourlyRate[]>([
    { id: '1', type: 'console', label: 'Console PS5 (Standard & VIP)', rate: 1200 },
    { id: '2', type: 'pc', label: 'PC Gamer RTX (Gaming Zone)', rate: 800 },
    { id: '3', type: 'vr', label: 'VR Headset (Meta Quest & HTC Vive)', rate: 2500 },
  ]);

  const [packages, setPackages] = useState<AbonnementPackage[]>([
    { id: '1', name: 'Pass Journalier', price: 1500, durationHours: 2, validityDays: 1, description: 'Accès libre à tous les postes pendant 2 heures de jeu dans la journée.' },
    { id: '2', name: 'Pass Hebdomadaire', price: 5000, durationHours: 8, validityDays: 7, description: '8 heures de crédit de jeu valables pendant 7 jours sur console et PC.' },
    { id: '3', name: 'Pass Mensuel', price: 15000, durationHours: 25, validityDays: 30, description: '25 heures de crédit de jeu valables pendant 30 jours.' },
    { id: '4', name: 'Pass VIP Gold', price: 25000, durationHours: 50, validityDays: 30, description: '50 heures de crédit de jeu sur tous les postes, VR incluse.' },
  ]);

  const [showEditPackageModal, setShowEditPackageModal] = useState<AbonnementPackage | null>(null);

  // Edit forms
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [editValidity, setEditValidity] = useState<number>(0);

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

  const handleRateChange = (id: string, newRate: number) => {
    setRates(rates.map(r => r.id === id ? { ...r, rate: newRate } : r));
  };

  const handleSaveHourlyRates = (e: React.FormEvent) => {
    e.preventDefault();
    openConfirm(
      "Enregistrer les tarifs horaires",
      "Êtes-vous sûr de vouloir appliquer ces nouveaux tarifs horaires de jeu ? Ils seront effectifs immédiatement pour toutes les nouvelles sessions.",
      () => {
        showToastMsg("Les tarifs horaires ont été enregistrés avec succès.");
      },
      'info'
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

    setPackages(packages.map(p => {
      if (p.id === showEditPackageModal.id) {
        return {
          ...p,
          price: editPrice,
          durationHours: editDuration,
          validityDays: editValidity
        };
      }
      return p;
    }));

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
            <div className="card-header" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} style={{ color: 'var(--primary-500)' }} />
                Tarification Horaire standard
              </h3>
              <span className="card-subtitle" style={{ margin: 0 }}>Modifiez les prix de jeu à la minute / heure.</span>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={rate.rate}
                      onChange={(e) => handleRateChange(rate.id, Number(e.target.value))}
                      style={{ width: '120px', textAlign: 'right', fontWeight: 700 }}
                      min={100}
                      step={50}
                    />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)' }}>FCFA/h</span>
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
            <div className="card-header" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--accent-500)' }} />
                Formules d'Abonnement (Crédit Temps)
              </h3>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
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

                  <button 
                    type="button" 
                    onClick={() => handleEditPackageClick(pkg)}
                    className="btn btn-secondary btn-icon"
                    title="Configurer le forfait"
                  >
                    <Edit2 size={14} />
                  </button>
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
