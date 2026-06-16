import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, ShieldAlert, Landmark } from 'lucide-react';

interface SalleSettings {
  salleName: string;
  salleAddress: string;
  phoneCountryCode: string;
  rawPhoneNum: string;
}

const DEFAULT_SETTINGS: SalleSettings = {
  salleName: 'Zone Gaming Center',
  salleAddress: 'Bastos, Yaoundé, Cameroun',
  phoneCountryCode: '+237',
  rawPhoneNum: '699999999'
};

const getActiveSettings = (): SalleSettings => {
  const saved = localStorage.getItem('playcontrol_active_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return DEFAULT_SETTINGS;
};

interface PendingSettingsUpdate extends SalleSettings {
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

const getPendingUpdate = (): PendingSettingsUpdate | null => {
  const saved = localStorage.getItem('playcontrol_pending_settings_update');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return null;
};

export const AdminSettings: React.FC = () => {
  const activeSettings = getActiveSettings();
  const [salleName, setSalleName] = useState(activeSettings.salleName);
  const [salleAddress, setSalleAddress] = useState(activeSettings.salleAddress);
  const [phoneCountryCode, setPhoneCountryCode] = useState(activeSettings.phoneCountryCode);
  const [rawPhoneNum, setRawPhoneNum] = useState(activeSettings.rawPhoneNum);

  const [pendingUpdate, setPendingUpdate] = useState<PendingSettingsUpdate | null>(getPendingUpdate());

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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    if (rawPhoneNum.length !== activeCountry.length) {
      showToastMsg(`Le numéro de téléphone pour le ${activeCountry.name} doit contenir exactement ${activeCountry.length} chiffres.`, 'error');
      return;
    }

    openConfirm(
      "Soumettre les modifications",
      "Les modifications apportées au profil de la salle doivent être validées par le Super Administrateur. Soumettre la demande ?",
      () => {
        const updateRequest: PendingSettingsUpdate = {
          status: 'pending',
          salleName,
          salleAddress,
          phoneCountryCode,
          rawPhoneNum,
          requestedAt: new Date().toISOString()
        };
        localStorage.setItem('playcontrol_pending_settings_update', JSON.stringify(updateRequest));
        setPendingUpdate(updateRequest);
        showToastMsg("Demande de modification soumise au Super Administrateur.");
      },
      'info'
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Paramètres de la Salle
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Configurez les coordonnées de la salle (soumis à validation du Super Administrateur).
          </p>
        </div>
      </div>

      {pendingUpdate && pendingUpdate.status === 'pending' && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #f59e0b',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          color: '#b45309'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></span>
            Demande de modification en attente de validation
          </div>
          <p style={{ fontSize: 'var(--font-xs)', color: '#d97706', margin: 0, lineHeight: 1.4 }}>
            Vous avez soumis des modifications (Nom : "{pendingUpdate.salleName}", Adresse : "{pendingUpdate.salleAddress}"). Elles seront actives dès qu'elles auront été approuvées par le Super Administrateur.
          </p>
        </div>
      )}

      {pendingUpdate && pendingUpdate.status === 'rejected' && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#b91c1c'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
              Demande de modification refusée
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: '#dc2626', margin: 0 }}>
              Votre dernière demande de modification de profil a été rejetée par le Super Administrateur.
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => {
              localStorage.removeItem('playcontrol_pending_settings_update');
              setPendingUpdate(null);
            }}
            style={{ padding: '4px 10px', fontSize: 'var(--font-xs)', color: '#dc2626', borderColor: '#fee2e2' }}
          >
            Masquer
          </button>
        </div>
      )}

      {pendingUpdate && pendingUpdate.status === 'approved' && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#15803d'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></span>
              Modifications approuvées et appliquées !
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: '#16a34a', margin: 0 }}>
              Le Super Administrateur a validé vos modifications de profil. Elles sont maintenant appliquées.
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => {
              localStorage.removeItem('playcontrol_pending_settings_update');
              setPendingUpdate(null);
            }}
            style={{ padding: '4px 10px', fontSize: 'var(--font-xs)', color: '#16a34a', borderColor: '#dcfce7' }}
          >
            Fermer
          </button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        {/* Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
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
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>
              Profil & Contact de la Salle
            </h3>
          </div>

          <div className="input-group">
            <label className="input-label">Nom commercial de la salle</label>
            <input 
              type="text" 
              className="input-field" 
              value={salleName} 
              onChange={(e) => setSalleName(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Adresse de la salle (Geocodage local)</label>
            <input 
              type="text" 
              className="input-field" 
              value={salleAddress} 
              onChange={(e) => setSalleAddress(e.target.value)}
              required 
            />
          </div>

          {/* Telephone input validation */}
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
        </div>

        {/* Save footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-200)', paddingTop: 'var(--space-4)' }}>
          <button type="submit" className="btn btn-black" style={{ gap: 'var(--space-2)', width: '180px' }} disabled={pendingUpdate?.status === 'pending'}>
            <Save size={18} /> Soumettre
          </button>
        </div>

      </form>

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
                className="btn btn-black" 
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

    </div>
  );
};
