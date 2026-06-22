import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Landmark, Wallet, Check, AlertTriangle, FileDown, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface GameStation {
  id: string;
  name: string;
  type: string;
  characteristics: string;
  smartPlugIp: string;
  status: 'libre' | 'occupe' | 'hors-service';
  clientName?: string;
  minutesRemaining?: number;
  totalDuration?: number;
}

const getPostesFromStorage = (): GameStation[] => {
  const saved = localStorage.getItem('playcontrol_postes');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }
  return [
    { id: '1', name: 'PS5 - VIP #1', type: 'ps5_vip', characteristics: 'Écran 4K 120Hz, Manette DualSense Edge', smartPlugIp: '192.168.1.101', status: 'occupe', clientName: 'Gamer_Pro', minutesRemaining: 45, totalDuration: 120 },
    { id: '2', name: 'PS5 - Standard #2', type: 'ps5_standard', characteristics: 'Écran 1080p, Manette standard', smartPlugIp: '192.168.1.102', status: 'libre' },
    { id: '3', name: 'PS5 - Standard #3', type: 'ps5_standard', characteristics: 'Écran 1080p, Manette standard', smartPlugIp: '192.168.1.103', status: 'hors-service' },
    { id: '4', name: 'PS5 - VIP #2', type: 'ps5_vip', characteristics: 'Écran 4K 120Hz, Canapé Confort VIP', smartPlugIp: '192.168.1.104', status: 'occupe', clientName: 'Marc_K', minutesRemaining: 120, totalDuration: 180 },
    { id: '5', name: 'PS4 - Standard #1', type: 'ps4_standard', characteristics: 'Écran 1080p, Manette DualShock 4', smartPlugIp: '192.168.1.105', status: 'libre' },
    { id: '6', name: 'PS4 - Standard #2', type: 'ps4_standard', characteristics: 'Écran 1080p, Manette DualShock 4', smartPlugIp: '192.168.1.106', status: 'libre' },
    { id: '7', name: 'PS5 - VIP #3', type: 'ps5_vip', characteristics: 'Écran 4K 120Hz, Canapé Confort VIP', smartPlugIp: '192.168.1.107', status: 'occupe', clientName: 'Alain_T', minutesRemaining: 15, totalDuration: 60 },
    { id: '8', name: 'PS4 - Standard #3', type: 'ps4_standard', characteristics: 'Écran 1080p, Manette DualShock 4', smartPlugIp: '192.168.1.108', status: 'libre' },
  ];
};

const printShiftReceipt = (data: {
  cashierName: string;
  initialCash: number;
  cashSales: number;
  mobMoneySales: number;
  totalShiftSales: number;
  expectedCashInDrawer: number;
  countedCash: number;
  cashDifference: number;
}) => {
  const ticketWindow = window.open('', '_blank', 'width=350,height=600');
  if (!ticketWindow) {
    alert("Veuillez autoriser les fenêtres pop-up pour imprimer le reçu de clôture de caisse.");
    return;
  }

  const dateStr = new Date().toLocaleString('fr-FR');
  const diffPrefix = data.cashDifference >= 0 ? '+' : '';
  const diffColor = data.cashDifference === 0 ? '#000' : data.cashDifference > 0 ? '#15803d' : '#b91c1c';

  ticketWindow.document.write(`
    <html>
      <head>
        <title>Rapport de Clôture de Caisse - PlayControl</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            padding: 15px;
            margin: 0;
            font-size: 13px;
            color: #000;
          }
          .text-center { text-align: center; }
          .header { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .title { font-size: 16px; font-weight: bold; margin: 5px 0; }
          .subtitle { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
          .info { margin-bottom: 15px; font-size: 12px; line-height: 1.4; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table td { padding: 4px 0; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .double-divider { border-top: 2px dashed #000; margin: 10px 0; }
          .total { font-weight: bold; }
          .footer { margin-top: 25px; border-top: 1px dashed #000; padding-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="title">PLAYCONTROL</div>
          <div class="subtitle">RAPPORT DE FIN DE SERVICE</div>
          <div style="font-size: 11px;">Douala, Cameroun</div>
        </div>

        <div class="info">
          <div><strong>Date/Heure:</strong> ${dateStr}</div>
          <div><strong>Caissier:</strong> ${data.cashierName}</div>
          <div><strong>Statut:</strong> Shift Clôturé</div>
        </div>

        <div class="divider"></div>

        <table class="table">
          <tbody>
            <tr>
              <td>Fonds Initial:</td>
              <td style="text-align: right;">${data.initialCash.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td>Ventes Espèces:</td>
              <td style="text-align: right;">+${data.cashSales.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td>Ventes Mobile Money:</td>
              <td style="text-align: right;">+${data.mobMoneySales.toLocaleString()} FCFA</td>
            </tr>
            <tr class="total">
              <td>Total Recettes:</td>
              <td style="text-align: right;">${data.totalShiftSales.toLocaleString()} FCFA</td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <table class="table">
          <tbody>
            <tr>
              <td>Espèces Attendues:</td>
              <td style="text-align: right; font-weight: bold;">${data.expectedCashInDrawer.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td>Espèces Comptées:</td>
              <td style="text-align: right; font-weight: bold;">${data.countedCash.toLocaleString()} FCFA</td>
            </tr>
          </tbody>
        </table>

        <div class="double-divider"></div>

        <table class="table">
          <tbody>
            <tr style="font-size: 14px; font-weight: bold;">
              <td>ÉCART DE CAISSE:</td>
              <td style="text-align: right; color: ${diffColor};">${diffPrefix}${data.cashDifference.toLocaleString()} FCFA</td>
            </tr>
          </tbody>
        </table>

        <div class="footer text-center">
          <div>Fin de shift enregistrée dans le système.</div>
          <div style="margin-top: 10px; font-size: 9px; opacity: 0.8;">PlayControl System</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
            setTimeout(function() {
              window.close();
            }, 1000);
          }
        </script>
      </body>
    </html>
  `);
  ticketWindow.document.close();
};

interface Transaction {
  id: string;
  time: string;
  clientName: string;
  type: 'session' | 'recharge' | 'abonnement';
  amount: number;
  paymentMethod: 'Espèces' | 'Mobile Money';
}

export const CaissierEncaissements: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialCash, setInitialCash] = useState<number>(50000);
  const [loading, setLoading] = useState<boolean>(true);

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [restrictionModal, setRestrictionModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchActiveShiftAndTransactions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('cashier_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

      if (shiftError) throw shiftError;

      if (shiftData) {
        setActiveShift(shiftData);
        setInitialCash(shiftData.initial_cash);

        const { data: transData, error: transError } = await supabase
          .from('transactions')
          .select('*')
          .eq('shift_id', shiftData.id)
          .order('created_at', { ascending: false });

        if (transError) throw transError;

        setTransactions((transData || []).map((t: any) => ({
          id: t.id,
          time: new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          clientName: t.client_name,
          type: t.transaction_type,
          amount: t.amount,
          paymentMethod: t.payment_method === 'espèces' ? 'Espèces' : 'Mobile Money'
        })));
      }
    } catch (e: any) {
      showToastMsg(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveShiftAndTransactions();
  }, [user?.id]);

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

  const handleCloseShiftConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    try {
      // Check if there are active consoles in database
      const { data: activePostes, error: ptError } = await supabase
        .from('postes')
        .select('id')
        .eq('status', 'occupe');

      if (ptError) throw ptError;

      const hasActiveConsole = activePostes && activePostes.length > 0;
      if (hasActiveConsole) {
        setRestrictionModal({
          isOpen: true,
          title: "Clôture impossible",
          message: "Impossible de clôturer le shift car il y a encore des consoles en cours d'utilisation. Veuillez forcer la fin des sessions ou attendre qu'elles se terminent."
        });
        return;
      }

      // Update shift status to closed in Supabase
      const { error: closeError } = await supabase
        .from('shifts')
        .update({
          closed_at: new Date().toISOString(),
          closed_cash: countedCash,
          expected_cash: expectedCashInDrawer,
          cash_difference: cashDifference,
          status: 'closed'
        })
        .eq('id', activeShift.id);

      if (closeError) throw closeError;

      // Reset shift status in localStorage
      localStorage.setItem('playcontrol_shift_active', 'false');
      localStorage.removeItem('playcontrol_shift_initial_cash');

      // Print closure receipt
      printShiftReceipt({
        cashierName: user?.name || 'Sophie Caisse',
        initialCash,
        cashSales,
        mobMoneySales,
        totalShiftSales,
        expectedCashInDrawer,
        countedCash,
        cashDifference
      });

      showToastMsg("Shift clôturé avec succès. Impression du reçu de caisse...");
      
      setTimeout(() => {
        setShowCloseShiftModal(false);
        logout();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      showToastMsg("Erreur lors de la clôture : " + err.message, 'error');
    }
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
      {restrictionModal.isOpen && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: 'var(--space-6)', borderTop: '5px solid var(--danger-500)', backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--danger-50)',
                color: 'var(--danger-600)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldAlert size={20} />
              </div>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--neutral-800)', margin: 0 }}>
                {restrictionModal.title}
              </h3>
            </div>
            
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)', margin: 0, lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
              {restrictionModal.message}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setRestrictionModal({ ...restrictionModal, isOpen: false })}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: 'var(--font-sm)' }}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
