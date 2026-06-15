import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Landmark, Wallet, Check, AlertTriangle, FileDown, ShieldAlert } from 'lucide-react';

interface Transaction {
  id: string;
  time: string;
  clientName: string;
  type: 'session' | 'recharge' | 'abonnement';
  amount: number;
  paymentMethod: 'Espèces' | 'Mobile Money';
}

export const CaissierEncaissements: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [initialCash] = useState<number>(50000); // 50 000 FCFA initial cash drawer
  const [transactions] = useState<Transaction[]>([
    { id: '1', time: '14:30', clientName: 'Invité_PS5_1', type: 'session', amount: 1200, paymentMethod: 'Espèces' },
    { id: '2', time: '13:15', clientName: 'Marc_K', type: 'recharge', amount: 5000, paymentMethod: 'Mobile Money' },
    { id: '3', time: '12:00', clientName: 'Arthur Mbe', type: 'abonnement', amount: 25000, paymentMethod: 'Espèces' },
    { id: '4', time: '10:45', clientName: 'Invité_PC_3', type: 'session', amount: 800, paymentMethod: 'Espèces' },
    { id: '5', time: '09:15', clientName: 'Serge_F', type: 'recharge', amount: 2000, paymentMethod: 'Espèces' },
  ]);

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState<string>('');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Calculate shift sums
  const cashSales = transactions
    .filter(t => t.paymentMethod === 'Espèces')
    .reduce((acc, t) => acc + t.amount, 0);

  const mobMoneySales = transactions
    .filter(t => t.paymentMethod === 'Mobile Money')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalShiftSales = cashSales + mobMoneySales;
  const expectedCashInDrawer = initialCash + cashSales;

  // Closure calculation
  const countedCash = actualCashInput ? Number(actualCashInput) : expectedCashInDrawer;
  const cashDifference = countedCash - expectedCashInDrawer;

  const handleCloseShiftConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate closure printing receipt
    showToastMsg("Shift clôturé avec succès. Impression du reçu de caisse...");
    
    setTimeout(() => {
      setShowCloseShiftModal(false);
      logout();
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Gestion de Caisse & Shift
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Suivez le tiroir de caisse, vos encaissements et fermez votre session de travail en fin de journée.
          </p>
        </div>
        <button 
          className="btn btn-danger" 
          onClick={() => setShowCloseShiftModal(true)}
          style={{ gap: 'var(--space-2)' }}
        >
          <AlertTriangle size={18} /> Clôturer mon Shift (Fin de caisse)
        </button>
      </div>

      {/* Caisse Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-5)' }}>
        
        {/* initial cash */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
          <div className="stat-card-icon orange" style={{ width: '44px', height: '44px' }}>
            <Wallet size={20} />
          </div>
          <div>
            <span className="stat-card-label" style={{ fontSize: '11px' }}>Fonds de Caisse Initial</span>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>{initialCash.toLocaleString()} FCFA</div>
          </div>
        </div>

        {/* sales shift */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
          <div className="stat-card-icon blue" style={{ width: '44px', height: '44px' }}>
            <Landmark size={20} />
          </div>
          <div>
            <span className="stat-card-label" style={{ fontSize: '11px' }}>Ventes Encaissées (Shift)</span>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>{totalShiftSales.toLocaleString()} FCFA</div>
            <span style={{ fontSize: '9px', color: 'var(--neutral-400)' }}>
              Espèces: {cashSales.toLocaleString()} | MM: {mobMoneySales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Expected drawer cash */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
          <div className="stat-card-icon green" style={{ width: '44px', height: '44px' }}>
            <Check size={20} />
          </div>
          <div>
            <span className="stat-card-label" style={{ fontSize: '11px' }}>Fonds de Caisse Attendu</span>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--success-700)' }}>
              {expectedCashInDrawer.toLocaleString()} FCFA
            </div>
            <span style={{ fontSize: '9px', color: 'var(--neutral-400)' }}>Initial + Espèces encaissés</span>
          </div>
        </div>
      </div>

      {/* Shift Transactions Table */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 className="card-title" style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>
          Historique des Encaissements (Shift Actuel)
        </h3>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Client</th>
                <th>Type de transaction</th>
                <th>Montant</th>
                <th>Mode de Paiement</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--neutral-400)', fontSize: 'var(--font-xs)' }}>{t.time}</td>
                  <td style={{ fontWeight: 700 }}>{t.clientName}</td>
                  <td>
                    <span className={`badge ${
                      t.type === 'session' ? 'badge-info' : 
                      t.type === 'recharge' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {t.type === 'session' ? 'Ticket de session' : 
                       t.type === 'recharge' ? 'Recharge portefeuille' : 'Pass / Abonnement'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.amount.toLocaleString()} FCFA</td>
                  <td style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>{t.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--danger-600)' }}>
                Fermeture de Caisse
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowCloseShiftModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCloseShiftConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)', lineHeight: 1.5 }}>
                Veuillez compter physiquement l'argent liquide présent dans le tiroir de caisse et saisir le montant ci-dessous.
              </p>

              <div style={{
                backgroundColor: 'var(--neutral-50)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-xs)',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 600
              }}>
                <span style={{ color: 'var(--neutral-500)' }}>Espèces attendues en caisse :</span>
                <span style={{ color: 'var(--neutral-800)' }}>{expectedCashInDrawer.toLocaleString()} FCFA</span>
              </div>

              <div className="input-group">
                <label className="input-label">Montant Réel Recompté (FCFA)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder={expectedCashInDrawer.toString()}
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  required 
                />
              </div>

              {/* Cash drawer discrepancy warning */}
              {actualCashInput && cashDifference !== 0 && (
                <div style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-xs)',
                  backgroundColor: 'var(--danger-50)',
                  color: 'var(--danger-700)',
                  border: '1px solid var(--danger-100)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)'
                }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Écart de caisse détecté : {cashDifference > 0 ? '+' : ''}{cashDifference.toLocaleString()} FCFA</strong>
                    <p style={{ fontSize: '10px', marginTop: '2px' }}>
                      {cashDifference < 0 
                        ? "Il y a un déficit de caisse. Cet écart sera mentionné dans le rapport de shift."
                        : "Il y a un surplus de caisse. Cet écart sera mentionné dans le rapport de shift."}
                    </p>
                  </div>
                </div>
              )}

              {actualCashInput && cashDifference === 0 && (
                <div style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-xs)',
                  backgroundColor: 'var(--success-50)',
                  color: 'var(--success-700)',
                  border: '1px solid var(--success-100)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  <Check size={16} />
                  <span>Caisse équilibrée ! Écart nul.</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCloseShiftModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-danger" style={{ gap: 'var(--space-2)' }}>
                  <FileDown size={14} /> Clôturer et Imprimer Reçu
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
