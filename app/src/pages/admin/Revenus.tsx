import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Landmark, Search, FileDown, TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  clientName: string;
  type: 'session' | 'recharge' | 'abonnement';
  amount: number;
  paymentMethod: 'Espèces' | 'Mobile Money' | 'Solde';
  cashier: string;
}

export const AdminRevenus: React.FC = () => {
  const [transactions] = useState<Transaction[]>([
    { id: '1', date: '2026-06-15 14:30', clientName: 'Gamer_Pro', type: 'abonnement', amount: 25000, paymentMethod: 'Espèces', cashier: 'Sophie Caisse' },
    { id: '2', date: '2026-06-15 13:15', clientName: 'Marc_K', type: 'recharge', amount: 5000, paymentMethod: 'Mobile Money', cashier: 'Sophie Caisse' },
    { id: '3', date: '2026-06-15 12:00', clientName: 'Alain_T', type: 'session', amount: 1200, paymentMethod: 'Solde', cashier: 'Sophie Caisse' },
    { id: '4', date: '2026-06-15 10:45', clientName: 'Serge_F', type: 'session', amount: 2400, paymentMethod: 'Solde', cashier: 'Sophie Caisse' },
    { id: '5', date: '2026-06-14 20:30', clientName: 'Gamer_Pro', type: 'recharge', amount: 10000, paymentMethod: 'Mobile Money', cashier: 'Jean Bernard' },
    { id: '6', date: '2026-06-14 18:00', clientName: 'Amadou_B', type: 'abonnement', price: 1500, amount: 1500, paymentMethod: 'Espèces', cashier: 'Jean Bernard' } as any,
    { id: '7', date: '2026-06-14 16:15', clientName: 'Marc_K', type: 'session', amount: 1600, paymentMethod: 'Solde', cashier: 'Jean Bernard' },
  ]);

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [filterType, setFilterType] = useState<'all' | 'session' | 'recharge' | 'abonnement'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Export actions simulation
  const handleExport = (format: 'PDF' | 'CSV') => {
    openConfirm(
      `Exporter le rapport en ${format}`,
      `Êtes-vous sûr de vouloir générer et télécharger le rapport financier local au format ${format} ?`,
      () => {
        showToastMsg(`Rapport financier téléchargé avec succès en format ${format}.`);
      },
      'info'
    );
  };

  // Calculate stats
  const totalAmount = transactions.reduce((acc, t) => acc + t.amount, 0);
  const sessionSales = transactions.filter(t => t.type === 'session').reduce((acc, t) => acc + t.amount, 0);
  const rechargeSales = transactions.filter(t => t.type === 'recharge').reduce((acc, t) => acc + t.amount, 0);
  const abonnementSales = transactions.filter(t => t.type === 'abonnement').reduce((acc, t) => acc + t.amount, 0);

  // SVG Chart values
  const categories = [
    { label: 'Sessions', amount: sessionSales, color: 'var(--primary-500)' },
    { label: 'Recharges', amount: rechargeSales, color: 'var(--success-500)' },
    { label: 'Abonnements', amount: abonnementSales, color: 'var(--accent-500)' },
  ];

  const maxAmount = Math.max(...categories.map(c => c.amount)) || 1;
  const chartHeight = 160;

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Revenus & Rapports comptables
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Consultez les transactions financières, filtrez les encaissements et exportez les pièces comptables.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={() => handleExport('CSV')} style={{ gap: 'var(--space-2)' }}>
            <FileDown size={16} /> Exporter CSV
          </button>
          <button className="btn btn-black" onClick={() => handleExport('PDF')} style={{ gap: 'var(--space-2)' }}>
            <FileDown size={16} /> Exporter PDF
          </button>
        </div>
      </div>

      {/* Stats and Graph */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'var(--space-6)' }} className="revenus-grid">
        
        {/* Left Card: Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="stat-card-icon blue" style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-lg)' }}>
              <Landmark size={26} />
            </div>
            <div>
              <span className="stat-card-label" style={{ fontSize: 'var(--font-xs)' }}>Recettes Totales Cumulées</span>
              <div className="stat-card-value" style={{ fontSize: 'var(--font-2xl)' }}>{totalAmount.toLocaleString()} FCFA</div>
              <span style={{ fontSize: '10px', color: 'var(--neutral-400)', fontWeight: 600 }}>Sur la base des transactions simulées</span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 'var(--space-2)' }}>
              Répartition par type d'encaissement
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {categories.map(cat => (
                <div key={cat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--neutral-500)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                    {cat.label}
                  </span>
                  <strong style={{ color: 'var(--neutral-800)' }}>{cat.amount.toLocaleString()} FCFA</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: SVG Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary-500)' }} />
              Graphique Comparatif des ventes
            </h3>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: `${chartHeight}px`, paddingTop: '20px', paddingBottom: '10px' }}>
            {categories.map(cat => {
              const heightPercent = (cat.amount / maxAmount) * 100 || 5; // Minimum 5% to show bar
              return (
                <div key={cat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-600)' }}>
                    {cat.amount.toLocaleString()} F
                  </div>
                  
                  {/* Bar */}
                  <div style={{
                    width: '40px',
                    height: `${(chartHeight - 40) * (heightPercent / 100)}px`,
                    backgroundColor: cat.color,
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    transition: 'height 0.5s ease-out'
                  }} />
                  
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', fontWeight: 600 }}>
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Nom client, caissier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: 'var(--font-sm)' }}
            />
          </div>

          {/* Type filter */}
          <select 
            className="select-field" 
            value={filterType} 
            onChange={(e: any) => setFilterType(e.target.value)}
            style={{ width: '150px', height: '38px', padding: '0 var(--space-3)', fontSize: 'var(--font-sm)' }}
          >
            <option value="all">Tous les types</option>
            <option value="session">Sessions de Jeu</option>
            <option value="recharge">Recharges Compte</option>
            <option value="abonnement">Abonnements Pass</option>
          </select>

          {/* Date range filter */}
          <div style={{ display: 'flex', border: '1.5px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button 
              onClick={() => setDateRange('today')}
              style={{ padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 600, backgroundColor: dateRange === 'today' ? 'var(--neutral-900)' : 'var(--neutral-0)', color: dateRange === 'today' ? 'var(--neutral-0)' : 'var(--neutral-600)' }}
            >
              Aujourd'hui
            </button>
            <button 
              onClick={() => setDateRange('week')}
              style={{ padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 600, backgroundColor: dateRange === 'week' ? 'var(--neutral-900)' : 'var(--neutral-0)', color: dateRange === 'week' ? 'var(--neutral-0)' : 'var(--neutral-600)' }}
            >
              Semaine
            </button>
            <button 
              onClick={() => setDateRange('month')}
              style={{ padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 600, backgroundColor: dateRange === 'month' ? 'var(--neutral-900)' : 'var(--neutral-0)', color: dateRange === 'month' ? 'var(--neutral-0)' : 'var(--neutral-600)' }}
            >
              Mois
            </button>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Client</th>
              <th>Type de vente</th>
              <th>Montant</th>
              <th>Mode de paiement</th>
              <th>Caissier</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)' }}>{t.date}</td>
                  <td style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>@{t.clientName}</td>
                  <td>
                    <span className={`badge ${
                      t.type === 'session' ? 'badge-info' :
                      t.type === 'recharge' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {t.type === 'session' ? 'Session de jeu' :
                       t.type === 'recharge' ? 'Recharge compte' : 'Forfait / Pass'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>
                    {t.amount.toLocaleString()} FCFA
                  </td>
                  <td style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>
                    {t.paymentMethod}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--neutral-700)' }}>
                    {t.cashier}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--neutral-400)' }}>
                  Aucune transaction trouvée pour ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
          .revenus-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
