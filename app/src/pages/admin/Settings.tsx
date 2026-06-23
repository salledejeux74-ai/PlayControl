import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, ShieldAlert, Landmark, User, MapPin, Phone, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface SalleData {
  id: string;
  name: string;
  location: string;
  phone: string;
  owner: string;
  status: string;
}

interface ChangeRequest {
  status: 'pending' | 'approved' | 'rejected' | 'none';
  name: string;
  location: string;
  phone: string;
  requestedAt: string;
}

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [salleData, setSalleData] = useState<SalleData | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+237');
  const [rawPhoneNum, setRawPhoneNum] = useState('');

  // Track if a pending request was already submitted this session
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Country config ─────────────────────────────────────────────────────────
  const countries = [
    { code: '+237', flag: '🇨🇲', name: 'Cameroun',       length: 9,  placeholder: '699 99 99 99' },
    { code: '+241', flag: '🇬🇦', name: 'Gabon',           length: 9,  placeholder: '66 12 34 56' },
    { code: '+242', flag: '🇨🇬', name: 'Congo',           length: 9,  placeholder: '06 123 45 67' },
    { code: '+243', flag: '🇨🇩', name: 'RDC',             length: 9,  placeholder: '81 234 56 78' },
    { code: '+236', flag: '🇨🇫', name: 'RCA',             length: 8,  placeholder: '75 12 34 56' },
    { code: '+235', flag: '🇹🇩', name: 'Tchad',           length: 8,  placeholder: '66 12 34 56' },
    { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire",   length: 10, placeholder: '07 12 34 56 78' },
    { code: '+221', flag: '🇸🇳', name: 'Sénégal',         length: 9,  placeholder: '77 123 45 67' },
    { code: '+234', flag: '🇳🇬', name: 'Nigeria',         length: 10, placeholder: '80 31 23 45 67' },
    { code: '+33',  flag: '🇫🇷', name: 'France',          length: 9,  placeholder: '6 12 34 56 78' },
  ];
  const activeCountry = countries.find(c => c.code === phoneCountryCode) || countries[0];

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Confirm modal ──────────────────────────────────────────────────────────
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

  // ── Parse phone stored as "+237699999999" → code + num ─────────────────────
  const parsePhone = (fullPhone: string) => {
    if (!fullPhone) return { code: '+237', num: '' };
    const match = countries.find(c => fullPhone.startsWith(c.code));
    if (match) {
      return { code: match.code, num: fullPhone.slice(match.code.length) };
    }
    return { code: '+237', num: fullPhone };
  };

  // ── Fetch salle data ──────────────────────────────────────────────────────
  const fetchSalle = async () => {
    if (!user?.salleId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salles')
        .select('id, name, location, phone, owner, status, pending_update')
        .eq('id', user.salleId)
        .single();

      if (error) throw error;

      if (data) {
        setSalleData(data as SalleData);
        setName(data.name || '');
        setLocation(data.location || '');

        const { code, num } = parsePhone(data.phone || '');
        setPhoneCountryCode(code);
        setRawPhoneNum(num);

        if (data.pending_update) {
          setChangeRequest(data.pending_update as ChangeRequest);
        } else {
          setChangeRequest(null);
        }
      }
    } catch (err: any) {
      showToastMsg(err.message || 'Erreur lors du chargement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalle();
  }, [user?.salleId]);

  // ── Handle phone input ─────────────────────────────────────────────────────
  const handlePhoneInputChange = (val: string) => {
    const numbersOnly = val.replace(/\D/g, '');
    if (numbersOnly.length <= activeCountry.length) {
      setRawPhoneNum(numbersOnly);
    }
  };

  // ── Submit change request ────────────────────────────────────────────────
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    if (rawPhoneNum.length !== activeCountry.length) {
      showToastMsg(`Le numéro pour le ${activeCountry.name} doit contenir exactement ${activeCountry.length} chiffres.`, 'error');
      return;
    }

    openConfirm(
      'Soumettre les modifications',
      'Les modifications du profil de la salle seront envoyées au Super Administrateur pour validation.',
      async () => {
        setSubmitting(true);
        try {
          const fullPhone = `${phoneCountryCode}${rawPhoneNum}`;
          const requestedAt = new Date().toISOString();

          const pendingJson = {
            status: 'pending' as const,
            name,
            location,
            phone: fullPhone,
            requestedAt
          };

          if (!user?.salleId) {
            showToastMsg('Utilisateur non connecté ou sans salle associée.', 'error');
            return;
          }

          // 1. Mettre à jour la table salles
          const { error: updateError } = await supabase
            .from('salles')
            .update({ pending_update: pendingJson })
            .eq('id', user.salleId);
          
          if (updateError) throw updateError;

          // 2. Insérer une notification pour l'admin (confirmation d'envoi)
          await supabase.from('notifications').insert({
            salle_id: salleData!.id,
            recipient_role: 'admin',
            type: 'info',
            title: 'Demande de modification soumise',
            message: `Votre demande de changement du nom en « ${name} » a été transmise au Super Administrateur.`,
          });

          // 3. Insérer une notification pour le superadmin
          await supabase.from('notifications').insert({
            salle_id: salleData!.id,
            recipient_role: 'superadmin',
            type: 'warning',
            title: `Demande de modification — ${salleData!.name}`,
            message: `Le gérant demande : Nom « ${name} », Adresse « ${location} », Tél. ${fullPhone}.`,
          });

          setChangeRequest(pendingJson);
          showToastMsg('Demande soumise au Super Administrateur.');
        } catch (err: any) {
          showToastMsg(err.message, 'error');
        } finally {
          setSubmitting(false);
        }
      },
      'info'
    );
  };

  const handleClearPendingAlert = async () => {
    setChangeRequest(null);
    if (user?.salleId) {
      await supabase
        .from('salles')
        .update({ pending_update: null })
        .eq('id', user.salleId);
    }
  };

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
        <div>
          <div className="skeleton" style={{ width: '220px', height: '28px', borderRadius: 'var(--radius-md)', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '340px', height: '16px', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="skeleton" style={{ width: '120px', height: '13px', borderRadius: 'var(--radius-sm)', marginBottom: '6px' }} />
              <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '650px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Paramètres de la Salle
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Coordonnées actuelles de votre salle — les modifications sont soumises au Super Administrateur.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={fetchSalle}
          style={{ gap: 'var(--space-2)' }}
        >
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {/* Info card — données actuelles en lecture seule */}
      {salleData && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', backgroundColor: 'var(--neutral-25, #fafafa)', border: '1px solid var(--neutral-150, #f0f0f0)' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Nom actuel</div>
            <div style={{ fontWeight: 700, color: 'var(--neutral-800)', fontSize: 'var(--font-sm)' }}>{salleData.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Propriétaire</div>
            <div style={{ fontWeight: 700, color: 'var(--neutral-800)', fontSize: 'var(--font-sm)' }}>{salleData.owner}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Adresse actuelle</div>
            <div style={{ fontWeight: 600, color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>{salleData.location}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Téléphone actuel</div>
            <div style={{ fontWeight: 600, color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>{salleData.phone || '—'}</div>
          </div>
        </div>
      )}

      {/* Pending, approved, or rejected banners */}
      {changeRequest && (
        <div style={{
          backgroundColor: changeRequest.status === 'pending' ? '#fffbeb' : changeRequest.status === 'approved' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${changeRequest.status === 'pending' ? '#f59e0b' : changeRequest.status === 'approved' ? '#10b981' : '#ef4444'}`,
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-5)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: changeRequest.status === 'pending' ? '#b45309' : changeRequest.status === 'approved' ? '#065f46' : '#991b1b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={16} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>
                {changeRequest.status === 'pending' ? 'Demande en attente de validation' : changeRequest.status === 'approved' ? 'Demande approuvée !' : 'Demande rejetée'}
              </div>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: changeRequest.status === 'pending' ? '#d97706' : changeRequest.status === 'approved' ? '#047857' : '#b91c1c',
                margin: 0, lineHeight: 1.4
              }}>
                {changeRequest.status === 'pending' ? (
                  <>Nom demandé : <strong>« {changeRequest.name} »</strong> — Adresse : <strong>« {changeRequest.location} »</strong>.</>
                ) : changeRequest.status === 'approved' ? (
                  <>Le Super Administrateur a validé et appliqué vos nouvelles coordonnées.</>
                ) : (
                  <>Le Super Administrateur a refusé les modifications demandées.</>
                )}
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearPendingAlert}
            style={{ padding: '4px 10px', fontSize: 'var(--font-xs)', flexShrink: 0 }}>
            Masquer
          </button>
        </div>
      )}

      {/* Form — modifier et soumettre */}
      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-50)', color: 'var(--primary-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Landmark size={18} />
            </div>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-800)' }}>
              Modifier le profil de la salle
            </h3>
          </div>

          {/* Nom */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Landmark size={13} style={{ color: 'var(--neutral-400)' }} />
              Nom commercial de la salle
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : GameHub Bastos"
              required
            />
          </div>

          {/* Adresse */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} style={{ color: 'var(--neutral-400)' }} />
              Adresse de la salle
            </label>
            <input
              type="text"
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex : Bastos, Yaoundé, Cameroun"
              required
            />
          </div>

          {/* Téléphone */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={13} style={{ color: 'var(--neutral-400)' }} />
              Numéro de Téléphone
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <select
                className="select-field"
                value={phoneCountryCode}
                onChange={(e) => { setPhoneCountryCode(e.target.value); setRawPhoneNum(''); }}
                style={{ width: '130px', flexShrink: 0 }}
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
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

          {/* Owner (read-only) */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} style={{ color: 'var(--neutral-400)' }} />
              Propriétaire <span style={{ fontSize: '11px', color: 'var(--neutral-400)', fontWeight: 400 }}>(non modifiable ici)</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={salleData?.owner || ''}
              disabled
              style={{ backgroundColor: 'var(--neutral-50)', color: 'var(--neutral-400)', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        {/* Save footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-200)', paddingTop: 'var(--space-4)' }}>
          <button
            type="submit"
            className="btn btn-black"
            style={{ gap: 'var(--space-2)', width: '210px' }}
            disabled={changeRequest?.status === 'pending' || submitting}
          >
            <Save size={16} />
            {submitting ? 'Envoi en cours...' : changeRequest?.status === 'pending' ? 'Demande en cours...' : 'Soumettre les modifications'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(20, 23, 34, 0.4)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)' }}>
            <h3 style={{
              fontSize: 'var(--font-lg)', fontWeight: 700,
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
              <button type="button" className="btn btn-black"
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && createPortal(
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          backgroundColor: '#ffffff', color: 'var(--neutral-800)',
          padding: '16px 20px', borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          borderLeft: `4px solid ${toast.type === 'error' ? '#ef4444' : '#10b981'}`,
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px',
          fontWeight: 600, fontSize: 'var(--font-sm)', animation: 'fade-in 0.3s ease-out'
        }}>
          <span style={{
            color: toast.type === 'error' ? '#ef4444' : '#10b981',
            backgroundColor: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
            width: '22px', height: '22px', borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
          }}>
            {toast.type === 'error' ? '✕' : '✓'}
          </span>
          <span>{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
};
