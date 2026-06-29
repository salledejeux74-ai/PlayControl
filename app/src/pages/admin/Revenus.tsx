import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Landmark, Search, FileDown, TrendingUp, RefreshCw, Calendar, AlertCircle, User, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';

// Appliquer le plugin à jsPDF pour l'interopérabilité en mode module (ESM)
try {
  applyPlugin(jsPDF);
} catch (e) {
  console.warn('Could not apply jspdf-autotable plugin:', e);
}

const runAutoTable = (pdfDoc: jsPDF, options: any) => {
  if (typeof (pdfDoc as any).autoTable === 'function') {
    (pdfDoc as any).autoTable(options);
  } else if (typeof autoTable === 'function') {
    autoTable(pdfDoc, options);
  } else if (autoTable && typeof (autoTable as any).default === 'function') {
    (autoTable as any).default(pdfDoc, options);
  } else {
    throw new Error("Le plugin d'export PDF n'est pas disponible.");
  }
};


interface Transaction {
  id: string;
  created_at: string;
  client_name: string;
  transaction_type: 'session' | 'recharge' | 'abonnement';
  amount: number;
  payment_method: string;
  cashier_name: string;
}

// ── Skeleton loader ──────────────────────────────────────────────────────────

const RevenusSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    {/* Header skeleton */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div className="skeleton" style={{ width: '280px', height: '28px', borderRadius: 'var(--radius-md)', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '420px', height: '16px', borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <div className="skeleton" style={{ width: '130px', height: '38px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ width: '130px', height: '38px', borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
    {/* Stats grid skeleton */}
    <div className="grid-responsive-1-2-1">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="card" style={{ height: '100px' }}>
          <div className="skeleton" style={{ width: '60%', height: '22px', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }} />
          <div className="skeleton" style={{ width: '40%', height: '32px', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="card" style={{ height: '120px' }}>
          <div className="skeleton" style={{ width: '80%', height: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }} />
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ width: `${60 + i * 10}%`, height: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }} />
          ))}
        </div>
      </div>
      <div className="card" style={{ height: '240px' }}>
        <div className="skeleton" style={{ width: '60%', height: '20px', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '140px' }}>
          {[80, 50, 65].map((h, i) => (
            <div key={i} className="skeleton" style={{ width: '40px', height: `${h}px`, borderRadius: '4px 4px 0 0' }} />
          ))}
        </div>
      </div>
    </div>
    {/* Table skeleton */}
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--neutral-100)' }}>
        <div className="skeleton" style={{ width: '200px', height: '36px', borderRadius: 'var(--radius-md)' }} />
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', borderBottom: '1px solid var(--neutral-50)' }}>
          <div className="skeleton" style={{ width: '120px', height: '16px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '90px', height: '16px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '110px', height: '22px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ width: '80px', height: '16px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '100px', height: '16px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '110px', height: '16px', borderRadius: 'var(--radius-sm)' }} />
        </div>
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const AdminRevenus: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [filterType, setFilterType] = useState<'all' | 'session' | 'recharge' | 'abonnement'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null); // null = tous

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchRevenus = useCallback(async () => {
    if (!user?.salleId) return;

    setLoading(true);
    setError(null);

    try {
      // Date range filter
      const now = new Date();
      let startDate: Date;
      if (dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
      }

      // ── Étape 1 : Récupérer les IDs des caissiers/admins de cette salle ──────
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('salle_id', user.salleId);

      if (profilesError) throw profilesError;
      if (!profilesData || profilesData.length === 0) {
        setTransactions([]);
        return;
      }

      const cashierIds = profilesData.map(p => p.id);
      const cashierMap: Record<string, string> = {};
      profilesData.forEach(p => { cashierMap[p.id] = p.name || 'Caissier'; });

      // ── Étape 2 : Récupérer les shifts de ces caissiers ──────────────────────
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          id,
          cashier_id,
          opened_at,
          closed_at,
          status,
          transactions (
            id,
            created_at,
            client_name,
            transaction_type,
            amount,
            payment_method
          )
        `)
        .in('cashier_id', cashierIds)
        .gte('opened_at', startDate.toISOString())
        .order('opened_at', { ascending: false });

      if (shiftsError) throw shiftsError;

      // ── Étape 3 : Aplatir toutes les transactions ─────────────────────────────
      const allTransactions: Transaction[] = [];
      (shiftsData || []).forEach((shift: any) => {
        const cashierName = cashierMap[shift.cashier_id] || 'Caissier';
        (shift.transactions || []).forEach((t: any) => {
          allTransactions.push({
            ...t,
            cashier_name: cashierName,
          });
        });
      });

      // Tri par date décroissante
      allTransactions.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(allTransactions);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [user?.salleId, dateRange]);

  useEffect(() => {
    fetchRevenus();
  }, [fetchRevenus]);

  // ── Real-time subscription ─────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.salleId) return;

    const channel = supabase
      .channel(`revenus-realtime-${user.salleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => { fetchRevenus(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.salleId, fetchRevenus]);

  // ── Per-cashier stats ──────────────────────────────────────────────────────

  const cashierNames = Array.from(new Set(transactions.map(t => t.cashier_name))).sort();

  const cashierStats = cashierNames.map(name => {
    const cx = transactions.filter(t => t.cashier_name === name);
    return {
      name,
      total: cx.reduce((a, t) => a + t.amount, 0),
      count: cx.length,
      sessions: cx.filter(t => t.transaction_type === 'session').reduce((a, t) => a + t.amount, 0),
      recharges: cx.filter(t => t.transaction_type === 'recharge').reduce((a, t) => a + t.amount, 0),
      abonnements: cx.filter(t => t.transaction_type === 'abonnement').reduce((a, t) => a + t.amount, 0),
    };
  });

  // ── Stats calculations (global) ────────────────────────────────────────────

  const baseTx = selectedCashier
    ? transactions.filter(t => t.cashier_name === selectedCashier)
    : transactions;

  const totalAmount = baseTx.reduce((acc, t) => acc + t.amount, 0);
  const sessionSales = baseTx.filter(t => t.transaction_type === 'session').reduce((acc, t) => acc + t.amount, 0);
  const rechargeSales = baseTx.filter(t => t.transaction_type === 'recharge').reduce((acc, t) => acc + t.amount, 0);
  const abonnementSales = baseTx.filter(t => t.transaction_type === 'abonnement').reduce((acc, t) => acc + t.amount, 0);

  const categories = [
    { label: 'Sessions', amount: sessionSales, color: 'var(--primary-500)' },
    { label: 'Recharges', amount: rechargeSales, color: 'var(--success-500)' },
    { label: 'Abonnements', amount: abonnementSales, color: 'var(--accent-500)' },
  ];
  const maxAmount = Math.max(...categories.map(c => c.amount)) || 1;
  const chartHeight = 160;

  // ── Filtered transactions ──────────────────────────────────────────────────

  const filteredTransactions = baseTx.filter(t => {
    const matchesType = filterType === 'all' || t.transaction_type === filterType;
    const matchesSearch =
      t.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cashier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.payment_method.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = (format: 'PDF' | 'CSV') => {
    openConfirm(
      `Exporter le rapport en ${format}`,
      `Générer et télécharger le rapport financier de votre salle au format ${format} ?`,
      () => {
        const dateLabel = dateRange === 'today' ? "Aujourd'hui"
          : dateRange === 'week' ? '7 derniers jours'
          : '30 derniers jours';
        const cashierLabel = selectedCashier ? `Caissier : ${selectedCashier}` : 'Tous les caissiers';
        const now = new Date();

        if (format === 'CSV') {
          const headers = ['Date', 'Client', 'Type', 'Montant (FCFA)', 'Paiement', 'Caissier'];
          const rows = filteredTransactions.map(t => [
            new Date(t.created_at).toLocaleString('fr-FR'),
            t.client_name,
            t.transaction_type === 'session' ? 'Session de jeu' : t.transaction_type === 'recharge' ? 'Recharge compte' : 'Forfait / Pass',
            t.amount.toString(),
            t.payment_method,
            t.cashier_name,
          ]);
          const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `rapport_revenus_${now.toISOString().split('T')[0]}.csv`;
          link.click();
          URL.revokeObjectURL(url);

        } else {
          // ── PDF ───────────────────────────────────────────────────
          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const pageW = doc.internal.pageSize.getWidth();
          const margin = 14;

          // ── Header band ────────────────────────────────────────────
          doc.setFillColor(15, 23, 42);       // dark navy
          doc.rect(0, 0, pageW, 28, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.text('PlayControl — Rapport Financier', margin, 12);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, margin, 20);
          doc.text(`Période : ${dateLabel}   |   ${cashierLabel}`, margin, 25);

          // ── Recap stats row ─────────────────────────────────────────
          let y = 36;
          const stats = [
            { label: 'Total encaissé', value: `${totalAmount.toLocaleString('fr-FR')} FCFA` },
            { label: 'Sessions', value: `${sessionSales.toLocaleString('fr-FR')} FCFA` },
            { label: 'Recharges', value: `${rechargeSales.toLocaleString('fr-FR')} FCFA` },
            { label: 'Abonnements', value: `${abonnementSales.toLocaleString('fr-FR')} FCFA` },
            { label: 'Transactions', value: `${filteredTransactions.length}` },
          ];
          const colW = (pageW - margin * 2) / stats.length;
          stats.forEach((s, i) => {
            const x = margin + i * colW;
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(x, y, colW - 3, 18, 2, 2, 'F');
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(s.label.toUpperCase(), x + 3, y + 6);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(s.value, x + 3, y + 13);
          });
          y += 24;

          // ── Per-cashier summary table ───────────────────────────────
          if (cashierStats.length > 0) {
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Récapitulatif par Caissier', margin, y);
            y += 4;

            runAutoTable(doc, {
              startY: y,
              margin: { left: margin, right: margin },
              head: [['Caissier', 'Transactions', 'Sessions', 'Recharges', 'Abonnements', 'Total']],
              body: cashierStats.map(cs => [
                cs.name,
                cs.count.toString(),
                `${cs.sessions.toLocaleString('fr-FR')} F`,
                `${cs.recharges.toLocaleString('fr-FR')} F`,
                `${cs.abonnements.toLocaleString('fr-FR')} F`,
                `${cs.total.toLocaleString('fr-FR')} FCFA`,
              ]),
              headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
              bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              columnStyles: {
                0: { fontStyle: 'bold' },
                5: { fontStyle: 'bold', textColor: [37, 99, 235] },
              },
              didDrawPage: (data: any) => { y = data.cursor?.y ?? y; },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
          }

          // ── Transactions table ───────────────────────────────────────
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Détail des Transactions', margin, y);
          y += 4;

          runAutoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Date & Heure', 'Client', 'Type', 'Montant', 'Paiement', 'Caissier']],
            body: filteredTransactions.map(t => [
              formatDate(t.created_at),
              `@${t.client_name}`,
              t.transaction_type === 'session' ? 'Session' : t.transaction_type === 'recharge' ? 'Recharge' : 'Abonnement',
              `${t.amount.toLocaleString('fr-FR')} F`,
              t.payment_method.replace('_', ' '),
              t.cashier_name,
            ]),
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
            alternateRowStyles: { fillColor: [239, 246, 255] },
            columnStyles: {
              3: { fontStyle: 'bold', halign: 'right' },
            },
            // Footer row with total
            foot: [['', '', `${filteredTransactions.length} transactions`, `${totalAmount.toLocaleString('fr-FR')} FCFA`, '', '']],
            footStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            showFoot: 'lastPage',
          });

          // ── Page numbers ───────────────────────────────────────────────
          const totalPages = (doc.internal as any).getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'normal');
            doc.text(`Page ${i} / ${totalPages}   —   PlayControl © ${now.getFullYear()}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
          }

          doc.save(`rapport_revenus_${now.toISOString().split('T')[0]}.pdf`);
        }

        showToastMsg(`Rapport ${format} généré et téléchargé avec succès.`);
      },
      'info'
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <RevenusSkeleton />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Revenus & Rapports comptables
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Transactions financières en temps réel — spécifiques à votre salle.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchRevenus()}
            style={{ gap: 'var(--space-2)' }}
          >
            <RefreshCw size={15} /> Actualiser
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('CSV')} style={{ gap: 'var(--space-2)' }}>
            <FileDown size={16} /> Exporter CSV
          </button>
          <button className="btn btn-black" onClick={() => handleExport('PDF')} style={{ gap: 'var(--space-2)' }}>
            <FileDown size={16} /> Exporter PDF
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--danger-50)', border: '1px solid var(--danger-200)', color: 'var(--danger-700)'
        }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{error}</span>
          <button
            style={{ marginLeft: 'auto', fontSize: 'var(--font-xs)', textDecoration: 'underline', background: 'none', border: 'none', color: 'var(--danger-600)', cursor: 'pointer' }}
            onClick={() => fetchRevenus()}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ── Rapport par Caissier ─────────────────────────────────────────── */}
      {cashierStats.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} style={{ color: 'var(--primary-500)' }} />
              Rapport par Caissier
              {selectedCashier && (
                <span style={{
                  fontSize: 'var(--font-xs)', fontWeight: 600, padding: '2px 10px',
                  borderRadius: '20px', backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)'
                }}>
                  Filtré : {selectedCashier}
                </span>
              )}
            </h3>
            {selectedCashier && (
              <button
                onClick={() => setSelectedCashier(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)',
                  background: 'none', border: '1px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-md)', padding: '4px 12px', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <X size={13} /> Voir tous
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            {cashierStats.map((cs, idx) => {
              const isActive = selectedCashier === cs.name;
              const colors = [
                { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb', light: '#dbeafe' },
                { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', light: '#dcfce7' },
                { bg: '#fdf4ff', border: '#e9d5ff', accent: '#9333ea', light: '#f3e8ff' },
                { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', light: '#ffedd5' },
                { bg: '#f0fdfa', border: '#99f6e4', accent: '#0d9488', light: '#ccfbf1' },
              ];
              const c = colors[idx % colors.length];
              const maxBar = Math.max(cs.sessions, cs.recharges, cs.abonnements) || 1;

              return (
                <div
                  key={cs.name}
                  onClick={() => setSelectedCashier(isActive ? null : cs.name)}
                  style={{
                    backgroundColor: isActive ? c.bg : 'var(--neutral-0)',
                    border: `2px solid ${isActive ? c.accent : 'var(--neutral-150, #f0f0f0)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 0 3px ${c.light}` : '0 1px 3px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Active indicator dot */}
                  {isActive && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: c.accent, boxShadow: `0 0 0 2px ${c.light}`
                    }} />
                  )}

                  {/* Avatar + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: isActive ? c.accent : c.bg,
                      border: `2px solid ${c.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 800,
                      color: isActive ? '#fff' : c.accent,
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}>
                      {cs.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--neutral-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cs.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--neutral-400)', fontWeight: 500 }}>
                        {cs.count} transaction{cs.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: isActive ? c.accent : 'var(--neutral-800)', marginBottom: 'var(--space-3)', letterSpacing: '-0.5px' }}>
                    {cs.total.toLocaleString('fr-FR')} <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-400)' }}>FCFA</span>
                  </div>

                  {/* Mini bar chart */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {[
                      { label: 'Sessions', val: cs.sessions, color: '#3b82f6' },
                      { label: 'Recharges', val: cs.recharges, color: '#22c55e' },
                      { label: 'Abonnem.', val: cs.abonnements, color: '#a855f7' },
                    ].map(bar => (
                      <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--neutral-400)', width: '52px', flexShrink: 0, fontWeight: 500 }}>{bar.label}</span>
                        <div style={{ flex: 1, height: '5px', backgroundColor: 'var(--neutral-100)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(bar.val / maxBar) * 100}%`,
                            backgroundColor: bar.color,
                            borderRadius: '99px',
                            transition: 'width 0.4s ease-out',
                            minWidth: bar.val > 0 ? '4px' : '0'
                          }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-600)', width: '52px', textAlign: 'right', flexShrink: 0 }}>
                          {bar.val > 0 ? `${(bar.val / 1000).toFixed(0)}k` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Clic hint */}
                  <div style={{ marginTop: 'var(--space-3)', fontSize: '10px', color: isActive ? c.accent : 'var(--neutral-300)', fontWeight: 600, textAlign: 'center' }}>
                    {isActive ? '✓ Filtre actif — cliquer pour réinitialiser' : 'Cliquer pour filtrer'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats and Chart */}
      <div className="grid-responsive-1-2-1">

        {/* Left: Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="stat-card-icon blue" style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-lg)' }}>
              <Landmark size={26} />
            </div>
            <div>
              <span className="stat-card-label" style={{ fontSize: 'var(--font-xs)' }}>Recettes Totales</span>
              <div className="stat-card-value" style={{ fontSize: 'var(--font-2xl)' }}>{totalAmount.toLocaleString('fr-FR')} FCFA</div>
              <span style={{ fontSize: '10px', color: 'var(--neutral-400)', fontWeight: 600 }}>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} sur la période
              </span>
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
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }} />
                    {cat.label}
                  </span>
                  <strong style={{ color: 'var(--neutral-800)' }}>{cat.amount.toLocaleString('fr-FR')} FCFA</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary-500)' }} />
              Graphique Comparatif des ventes
            </h3>
          </div>

          {totalAmount === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', color: 'var(--neutral-400)' }}>
              <Calendar size={36} strokeWidth={1.5} />
              <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>Aucun encaissement sur cette période</p>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: `${chartHeight}px`, paddingTop: '20px', paddingBottom: '10px' }}>
              {categories.map(cat => {
                const heightPercent = (cat.amount / maxAmount) * 100 || 5;
                return (
                  <div key={cat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-600)' }}>
                      {cat.amount.toLocaleString('fr-FR')} F
                    </div>
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
          )}
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
              placeholder="Client, caissier..."
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
            style={{ width: '160px', height: '38px', padding: '0 var(--space-3)', fontSize: 'var(--font-sm)' }}
          >
            <option value="all">Tous les types</option>
            <option value="session">Sessions de Jeu</option>
            <option value="recharge">Recharges Compte</option>
            <option value="abonnement">Abonnements Pass</option>
          </select>

          {/* Date range */}
          <div style={{ display: 'flex', border: '1.5px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {(['today', 'week', 'month'] as const).map((range, idx) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: '4px 14px',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  backgroundColor: dateRange === range ? 'var(--neutral-900)' : 'var(--neutral-0)',
                  color: dateRange === range ? 'var(--neutral-0)' : 'var(--neutral-600)',
                  borderLeft: idx > 0 ? '1px solid var(--neutral-200)' : 'none',
                  transition: 'background 0.2s, color 0.2s',
                  cursor: 'pointer'
                }}
              >
                {range === 'today' ? "Aujourd'hui" : range === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container">
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
                  <td style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)' }}>{formatDate(t.created_at)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>@{t.client_name}</td>
                  <td>
                    <span className={`badge ${
                      t.transaction_type === 'session' ? 'badge-info' :
                      t.transaction_type === 'recharge' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {t.transaction_type === 'session' ? 'Session de jeu' :
                       t.transaction_type === 'recharge' ? 'Recharge compte' : 'Forfait / Pass'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>
                    {t.amount.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-sm)', textTransform: 'capitalize' }}>
                    {t.payment_method.replace('_', ' ')}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--neutral-700)' }}>
                    {t.cashier_name}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--neutral-400)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Calendar size={36} strokeWidth={1.5} />
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>
                      Aucune transaction trouvée pour ces critères.
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
              <button
                type="button"
                className="btn btn-black"
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
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
          position: 'fixed', bottom: '24px', right: '24px',
          backgroundColor: '#ffffff', color: 'var(--neutral-800)',
          padding: '16px 20px', borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
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
