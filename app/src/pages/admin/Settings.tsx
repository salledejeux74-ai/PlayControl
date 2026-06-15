import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, Database, ShieldAlert, Cpu, RefreshCw, Landmark } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [salleName, setSalleName] = useState('Zone Gaming Center');
  const [salleAddress, setSalleAddress] = useState('Bastos, Yaoundé, Cameroun');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+237');
  const [rawPhoneNum, setRawPhoneNum] = useState('699999999');

  const [sessionTimeout, setSessionTimeout] = useState(15);
  const [smartPlugAutoCut, setSmartPlugAutoCut] = useState(true);
  const [smartPlugRange, setSmartPlugRange] = useState('192.168.1.100-200');

  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
      "Enregistrer les configurations",
      "Voulez-vous enregistrer les modifications de profil et de réseau local de votre salle ?",
      () => {
        showToastMsg("Paramètres de la salle enregistrés localement avec succès.");
      },
      'info'
    );
  };

  const handleTriggerBackup = () => {
    setIsBackupRunning(true);
    setTimeout(() => {
      setIsBackupRunning(false);
      showToastMsg("Sauvegarde SQLite locale enregistrée (backup_playcontrol_local.db).");
    }, 1500);
  };

  const handleTriggerCloudSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToastMsg("Synchronisation avec Supabase Cloud réussie !");
    }, 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Paramètres de la Salle
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Configurez les coordonnées de la salle, les prises connectées locales et les sauvegardes SQLite.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }} className="settings-grid">
          
          {/* Left Column: Salle Profile & Network */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
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

            {/* Smart Plugs LAN Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
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
                  <Cpu size={18} />
                </div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                  Prises Connectées (Smart Plugs LAN)
                </h3>
              </div>

              <div className="input-group">
                <label className="input-label">Plage d'adresses IP Smart Plugs sur le réseau local</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={smartPlugRange} 
                  onChange={(e) => setSmartPlugRange(e.target.value)}
                  placeholder="Ex: 192.168.1.100-200"
                  required 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <input 
                  id="smartplug-autocut"
                  type="checkbox" 
                  checked={smartPlugAutoCut}
                  onChange={(e) => setSmartPlugAutoCut(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="smartplug-autocut" style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-700)', cursor: 'pointer' }}>
                  Couper le courant automatiquement en fin de session
                </label>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--neutral-400)', lineHeight: 1.4 }}>
                Éteint l'écran de la console ou du PC après expiration du compte à rebours pour empêcher le jeu gratuit.
              </p>
            </div>

          </div>

          {/* Right Column: Database backup, timeout security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Database SQLite Local-first */}
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
                  <Database size={18} />
                </div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>
                  Base de données locale & Cloud
                </h3>
              </div>

              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', lineHeight: 1.5 }}>
                PlayControl utilise une architecture Local-First. Toutes les données sont enregistrées en local dans une base SQLite puis synchronisées avec Supabase Cloud.
              </p>

              <button 
                type="button" 
                onClick={handleTriggerBackup}
                className="btn btn-secondary" 
                style={{ gap: 'var(--space-2)', justifyContent: 'center' }}
                disabled={isBackupRunning}
              >
                <Database size={14} className={isBackupRunning ? 'animate-spin' : ''} />
                {isBackupRunning ? 'Sauvegarde...' : 'Effectuer un backup local'}
              </button>

              <button 
                type="button" 
                onClick={handleTriggerCloudSync}
                className="btn btn-secondary" 
                style={{ gap: 'var(--space-2)', justifyContent: 'center' }}
                disabled={isSyncing}
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Synchronisation...' : 'Forcer la synchro cloud'}
              </button>
            </div>

            {/* Security settings card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
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
                  Sécurité de la Caisse
                </h3>
              </div>

              <div className="input-group">
                <label className="input-label">Déconnexion automatique de la caisse par inactivité (minutes)</label>
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

        </div>

        {/* Save footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-200)', paddingTop: 'var(--space-4)' }}>
          <button type="submit" className="btn btn-black" style={{ gap: 'var(--space-2)', width: '180px' }}>
            <Save size={18} /> Enregistrer
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

      <style>{`
        @media (max-width: 992px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
