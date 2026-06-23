import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Gamepad2, Plus, Search, 
  Trash2, Play, Ban, ArrowRightLeft, Clock, Edit2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface GameStation {
  id: string;
  name: string;
  type: string;
  characteristics: string;
  smartPlugIp: string;
  status: 'libre' | 'en-attente' | 'occupe' | 'hors-service';
  clientName?: string;
  sessionCode?: string;
  minutesRemaining?: number;
  totalDuration?: number; // In minutes
  updatedAt?: string;
}

interface MaterialType {
  id: string;
  type: string;
  label: string;
  price: number;
  durationMinutes: number;
}

interface MemberClient {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  balance: number;
  abonnementType: 'Aucun' | 'Journalier' | 'Hebdomadaire' | 'Mensuel' | 'VIP';
  abonnementExpiration: string | null;
  status: 'active' | 'suspended';
  abonnementRemainingTime?: number;
}



const formatRemainingTime = (minutes: number): string => {
  if (minutes < 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins} min`;
};

const formatPriceTag = (typeKey: string, materialTypes: MaterialType[]): string => {
  const mType = materialTypes.find(t => t.type === typeKey);
  if (!mType) return '';
  if (mType.durationMinutes === 60) {
    return `${mType.price} FCFA / h`;
  }
  return `${mType.price} FCFA / ${mType.durationMinutes} min`;
};

const mapPosteFromDb = (p: any): GameStation => ({
  id: p.id,
  name: p.name,
  type: p.type,
  characteristics: p.characteristics || '',
  smartPlugIp: p.smart_plug_ip || '',
  status: p.status,
  clientName: p.client_name || undefined,
  sessionCode: p.session_code || undefined,
  minutesRemaining: p.minutes_remaining !== null ? p.minutes_remaining : undefined,
  totalDuration: p.total_duration !== null ? p.total_duration : undefined,
  updatedAt: p.updated_at
});

// Génère un code de session à 6 caractères alphanumériques en majuscules
const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const AdminPostes: React.FC = () => {
  const { user } = useAuth();
  const [postes, setPostes] = useState<GameStation[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [dbClients, setDbClients] = useState<MemberClient[]>([]);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'libre' | 'en-attente' | 'occupe' | 'hors-service'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState<GameStation | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<GameStation | null>(null);
  const [showExtendModal, setShowExtendModal] = useState<GameStation | null>(null);

  // Default type key fallback
  const defaultTypeKey = materialTypes[0]?.type || 'ps5_standard';

  // Form states
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>(defaultTypeKey);
  const [newCharacteristics, setNewCharacteristics] = useState('');
  const [newSmartPlugIp, setNewSmartPlugIp] = useState('');

  // Edit Mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState<GameStation | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<string>(defaultTypeKey);
  const [editCharacteristics, setEditCharacteristics] = useState('');
  const [editSmartPlugIp, setEditSmartPlugIp] = useState('');

  // Session Launch states
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [launchMode, setLaunchMode] = useState<'time' | 'abonnement'>('time');
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // 60 minutes
  const [customDuration, setCustomDuration] = useState<string>('');
  const [isGuest, setIsGuest] = useState(true);

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

  const fetchData = async () => {
    try {
      const { data: mtData, error: mtError } = await supabase
        .from('material_types')
        .select('*')
        .order('created_at', { ascending: true });
      if (mtError) throw mtError;
      
      const mappedMaterialTypes = (mtData || []).map(r => ({
        id: r.id,
        type: r.type,
        label: r.label,
        price: r.price,
        durationMinutes: r.duration_minutes
      }));
      setMaterialTypes(mappedMaterialTypes);
      if (mappedMaterialTypes.length > 0) {
        setNewType(mappedMaterialTypes[0].type);
        setEditType(mappedMaterialTypes[0].type);
      }

      const { data: clData, error: clError } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active');
      if (clError) throw clError;
      
      const mappedClients = (clData || []).map(c => ({
        id: c.id,
        username: c.username,
        fullName: c.full_name,
        phone: c.phone || '',
        balance: c.balance,
        abonnementType: c.abonnement_type,
        abonnementExpiration: c.abonnement_expiration,
        status: c.status,
        abonnementRemainingTime: c.abonnement_remaining_time
      }));
      setDbClients(mappedClients);
      if (mappedClients.length > 0) {
        setSelectedClient(mappedClients[0].username);
      }



      const { data: ptData, error: ptError } = await supabase
        .from('postes')
        .select('*')
        .eq('salle_id', user?.salleId)
        .order('name', { ascending: true });
      if (ptError) throw ptError;
      
      setPostes((ptData || []).map(mapPosteFromDb));
    } catch (err: any) {
      showToastMsg(err.message, 'error');
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Subscribe to postes changes
    const channel = supabase
      .channel('realtime-postes-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'postes', filter: `salle_id=eq.${user?.salleId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPost = mapPosteFromDb(payload.new);
            setPostes(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;
              return [...prev, newPost].sort((a, b) => a.name.localeCompare(b.name));
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapPosteFromDb(payload.new);
            setPostes(prev => prev.map(p => p.id === updated.id ? updated : p));
          } else if (payload.eventType === 'DELETE') {
            setPostes(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Safe Live Timer Effect for database
  useEffect(() => {
    const interval = setInterval(async () => {
      const occupied = postes.filter(p => p.status === 'occupe' && p.minutesRemaining !== undefined);
      for (const post of occupied) {
        const now = new Date().getTime();
        const updatedTime = post.updatedAt ? new Date(post.updatedAt).getTime() : 0;
        
        // If updated less than 55 seconds ago, skip to prevent double decrement
        if (now - updatedTime < 55000) {
          continue;
        }

        const nextMin = (post.minutesRemaining || 0) - 1;
        if (nextMin <= 0) {
          // Time's up! Return to libre in database
          await supabase
            .from('postes')
            .update({
              status: 'libre',
              client_name: null,
              session_code: null,
              minutes_remaining: null,
              total_duration: null
            })
            .eq('id', post.id);
          
          showToastMsg(`La session sur "${post.name}" pour "${post.clientName}" est terminée.`);
        } else {
          // Decrement by 1 in database
          await supabase
            .from('postes')
            .update({
              minutes_remaining: nextMin
            })
            .eq('id', post.id);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [postes]);


  // Creation of gaming station
  const handleCreatePoste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    // Validation unique name
    if (postes.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
      showToastMsg(`Le poste "${newName}" existe déjà.`, 'error');
      return;
    }

    const { error } = await supabase
      .from('postes')
      .insert({
        name: newName,
        type: newType,
        characteristics: newCharacteristics || 'Aucune description',
        smart_plug_ip: newSmartPlugIp || '192.168.1.100',
        status: 'libre',
        salle_id: user?.salleId
      });

    if (error) {
      showToastMsg(error.message, 'error');
      return;
    }

    setShowAddModal(false);
    setNewName('');
    setNewCharacteristics('');
    setNewSmartPlugIp('');
    showToastMsg(`Le poste "${newName}" a été créé avec succès.`);
  };

  // Edit mode handlers
  const setEditPoste = (post: GameStation) => {
    setShowEditModal(post);
    setEditName(post.name);
    setEditType(post.type);
    setEditCharacteristics(post.characteristics);
    setEditSmartPlugIp(post.smartPlugIp);
  };

  const handleSaveEditPoste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!editName) return;

    // Check unique name except for the current editing post
    if (postes.some(p => p.id !== showEditModal.id && p.name.toLowerCase() === editName.toLowerCase())) {
      showToastMsg(`Le poste "${editName}" existe déjà.`, 'error');
      return;
    }

    const { error } = await supabase
      .from('postes')
      .update({
        name: editName,
        type: editType,
        characteristics: editCharacteristics,
        smart_plug_ip: editSmartPlugIp
      })
      .eq('id', showEditModal.id);

    if (error) {
      showToastMsg(error.message, 'error');
      return;
    }

    setShowEditModal(null);
    setIsEditMode(false);
    showToastMsg(`Le poste "${editName}" a été modifié avec succès.`);
  };

  // Delete Station
  const handleDeletePoste = (id: string, name: string) => {
    openConfirm(
      "Supprimer le poste",
      `Êtes-vous sûr de vouloir supprimer définitivement le poste "${name}" ? Cette action effacera ses configurations.`,
      async () => {
        const { error } = await supabase
          .from('postes')
          .delete()
          .eq('id', id);

        if (error) {
          showToastMsg(error.message, 'error');
          return;
        }

        showToastMsg(`Le poste "${name}" a été supprimé.`);
      },
      'danger'
    );
  };

  // Out of Service Toggle
  const handleToggleOutOfService = (id: string, name: string, currentStatus: GameStation['status']) => {
    const isHS = currentStatus === 'hors-service';
    openConfirm(
      isHS ? "Remettre en service" : "Mettre hors service",
      isHS ? `Voulez-vous remettre en service le poste "${name}" ?` : `Voulez-vous suspendre temporairement le poste "${name}" pour maintenance ou panne ?`,
      async () => {
        const { error } = await supabase
          .from('postes')
          .update({
            status: isHS ? 'libre' : 'hors-service',
            client_name: null,
            session_code: null,
            minutes_remaining: null,
            total_duration: null
          })
          .eq('id', id);

        if (error) {
          showToastMsg(error.message, 'error');
          return;
        }

        showToastMsg(`Le poste "${name}" est désormais ${isHS ? 'Libre' : 'Hors Service'}.`);
      },
      isHS ? 'info' : 'warning'
    );
  };

  // Launch Session
  const handleLaunchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLaunchModal) return;

    let finalClientName = '';
    let finalDuration = 0;

    const duration = selectedDuration;

    if (isGuest) {
      // Pour un invité temporaire : pas de nom requis, on génère un identifiant
      finalClientName = `Invité-${Date.now().toString(36).toUpperCase().slice(-4)}`;
      finalDuration = duration;
    } else {
      const targetClient = dbClients.find(c => c.username === selectedClient);
      if (!targetClient) return;

      const targetType = materialTypes.find(t => t.type === showLaunchModal.type);
      const rate = targetType ? targetType.price : 1000;
      const rateDuration = targetType ? targetType.durationMinutes : 60;
      const cost = Math.ceil((rate / rateDuration) * duration);

      if (launchMode === 'time' && targetClient.balance < cost) {
        showToastMsg(`Solde insuffisant pour ${targetClient.fullName}. Requis : ${cost} FCFA. Solde : ${targetClient.balance} FCFA.`, 'error');
        return;
      }

      if (launchMode === 'abonnement' && (targetClient.abonnementType === 'Aucun' || (targetClient.abonnementRemainingTime || 0) <= 0)) {
        showToastMsg(`Le client ${targetClient.fullName} ne dispose pas d'un abonnement actif.`, 'error');
        return;
      }

      finalClientName = targetClient.username;
      finalDuration = launchMode === 'time' ? duration : (targetClient.abonnementRemainingTime || 60);

      // Deduct client balance/minutes in database
      if (launchMode === 'time') {
        const { error: clErr } = await supabase
          .from('clients')
          .update({ balance: targetClient.balance - cost })
          .eq('id', targetClient.id);
        if (clErr) {
          showToastMsg(clErr.message, 'error');
          return;
        }
      } else {
        const { error: clErr } = await supabase
          .from('clients')
          .update({ abonnement_remaining_time: Math.max(0, (targetClient.abonnementRemainingTime || 0) - finalDuration) })
          .eq('id', targetClient.id);
        if (clErr) {
          showToastMsg(clErr.message, 'error');
          return;
        }
      }
    }

    const code = generateSessionCode();

    const { error } = await supabase
      .from('postes')
      .update({
        status: 'en-attente',
        client_name: finalClientName,
        session_code: code,
        minutes_remaining: finalDuration,
        total_duration: finalDuration
      })
      .eq('id', showLaunchModal.id);

    if (error) {
      // Rollback
      if (!isGuest) {
        const targetClient = dbClients.find(c => c.username === selectedClient);
        if (targetClient) {
          if (launchMode === 'time') {
            await supabase.from('clients').update({ balance: targetClient.balance }).eq('id', targetClient.id);
          } else {
            await supabase.from('clients').update({ abonnement_remaining_time: targetClient.abonnementRemainingTime }).eq('id', targetClient.id);
          }
        }
      }
      showToastMsg(error.message, 'error');
      return;
    }

    showToastMsg(`Code généré pour "${finalClientName}" sur "${showLaunchModal.name}" : ${code}`);
    setShowLaunchModal(null);
    setIsGuest(true);
    setClientSearch('');
  };

  // Terminate Session early (handles refunding balance or subscription time)
  const handleEndSession = (id: string, name: string, clientName: string) => {
    const post = postes.find(p => p.id === id);
    if (!post) return;

    openConfirm(
      "Annuler / Terminer la session",
      `Êtes-vous sûr de vouloir annuler la session de "${clientName}" sur le poste "${name}" ?`,
      async () => {
        // Refund logic for members
        if (post.clientName && !post.clientName.startsWith('Invité-')) {
          const { data: clData } = await supabase
            .from('clients')
            .select('*')
            .eq('username', post.clientName)
            .maybeSingle();

          if (clData) {
            const minutesToRefund = post.minutesRemaining || 0;
            if (minutesToRefund > 0) {
              const targetType = materialTypes.find(t => t.type === post.type);
              const rate = targetType ? targetType.price : 1000;
              const rateDuration = targetType ? targetType.durationMinutes : 60;

              if (clData.abonnement_type !== 'Aucun') {
                await supabase
                  .from('clients')
                  .update({ abonnement_remaining_time: (clData.abonnement_remaining_time || 0) + minutesToRefund })
                  .eq('id', clData.id);
              } else {
                const refundCost = Math.floor((rate / rateDuration) * minutesToRefund);
                await supabase
                  .from('clients')
                  .update({ balance: clData.balance + refundCost })
                  .eq('id', clData.id);
              }
            }
          }
        }

        const { error } = await supabase
          .from('postes')
          .update({
            status: 'libre',
            client_name: null,
            session_code: null,
            minutes_remaining: null,
            total_duration: null
          })
          .eq('id', id);

        if (error) {
          showToastMsg(error.message, 'error');
          return;
        }

        showToastMsg(`La session sur "${name}" a été arrêtée.`);
      },
      'danger'
    );
  };

  // Extend Session
  const handleExtendSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showExtendModal || showExtendModal.minutesRemaining === undefined) return;

    const extMinutes = customDuration ? Number(customDuration) : selectedDuration;

    if (showExtendModal.clientName && !showExtendModal.clientName.startsWith('Invité-')) {
      const { data: clData } = await supabase
        .from('clients')
        .select('*')
        .eq('username', showExtendModal.clientName)
        .maybeSingle();

      if (!clData) {
        showToastMsg("Impossible de charger les données du membre.", "error");
        return;
      }

      const targetType = materialTypes.find(t => t.type === showExtendModal.type);
      const rate = targetType ? targetType.price : 1000;
      const rateDuration = targetType ? targetType.durationMinutes : 60;
      const cost = Math.ceil((rate / rateDuration) * extMinutes);

      if (clData.abonnement_type !== 'Aucun') {
        if ((clData.abonnement_remaining_time || 0) < extMinutes) {
          showToastMsg(`Temps d'abonnement insuffisant (${clData.abonnement_remaining_time} min restantes).`, 'error');
          return;
        }
        const { error: clErr } = await supabase
          .from('clients')
          .update({ abonnement_remaining_time: clData.abonnement_remaining_time - extMinutes })
          .eq('id', clData.id);
        if (clErr) {
          showToastMsg(clErr.message, 'error');
          return;
        }
      } else {
        if (clData.balance < cost) {
          showToastMsg(`Solde insuffisant pour prolonger. Requis : ${cost} FCFA. Solde : ${clData.balance} FCFA.`, 'error');
          return;
        }
        const { error: clErr } = await supabase
          .from('clients')
          .update({ balance: clData.balance - cost })
          .eq('id', clData.id);
        if (clErr) {
          showToastMsg(clErr.message, 'error');
          return;
        }
      }
    }

    const { error } = await supabase
      .from('postes')
      .update({
        minutes_remaining: (showExtendModal.minutesRemaining || 0) + extMinutes,
        total_duration: (showExtendModal.totalDuration || 0) + extMinutes
      })
      .eq('id', showExtendModal.id);

    if (error) {
      showToastMsg(error.message, 'error');
      return;
    }

    setShowExtendModal(null);
    setCustomDuration('');
    showToastMsg(`Session sur "${showExtendModal.name}" prolongée de ${extMinutes} minutes.`);
  };

  // Transfer Session
  const [selectedTransferPosteId, setSelectedTransferPosteId] = useState('');
  const handleTransferSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal || !selectedTransferPosteId) return;

    const targetPoste = postes.find(p => p.id === selectedTransferPosteId);
    if (!targetPoste) return;

    const { error: err1 } = await supabase
      .from('postes')
      .update({
        status: showTransferModal.status,
        client_name: showTransferModal.clientName || null,
        session_code: showTransferModal.sessionCode || null,
        minutes_remaining: showTransferModal.minutesRemaining || null,
        total_duration: showTransferModal.totalDuration || null
      })
      .eq('id', selectedTransferPosteId);

    if (err1) {
      showToastMsg(err1.message, 'error');
      return;
    }

    const { error: err2 } = await supabase
      .from('postes')
      .update({
        status: 'libre',
        client_name: null,
        session_code: null,
        minutes_remaining: null,
        total_duration: null
      })
      .eq('id', showTransferModal.id);

    if (err2) {
      showToastMsg(err2.message, 'error');
      return;
    }

    setShowTransferModal(null);
    setSelectedTransferPosteId('');
    showToastMsg(`Session de "${showTransferModal.clientName}" transférée de "${showTransferModal.name}" vers "${targetPoste.name}".`);
  };


  // Filters application
  const filteredPostes = postes.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.characteristics.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const renderPosteCard = (post: GameStation) => {
    const percentRemaining = post.minutesRemaining !== undefined && post.totalDuration 
      ? (post.minutesRemaining / post.totalDuration) * 100 
      : 0;

    const mType = materialTypes.find(t => t.type === post.type);
    const priceDisplay = mType ? formatPriceTag(post.type, materialTypes) : '';

    // Status colors and shadows
    let borderLeftColor = 'var(--success-500)';
    let glowShadow = 'var(--shadow-sm)';
    let cardBg = 'var(--neutral-0)';
    let statusLabel = 'Libre';
    let statusBadgeClass = 'badge-success';

    if (post.status === 'occupe') {
      borderLeftColor = 'var(--primary-500)';
      glowShadow = '0 6px 20px rgba(10, 66, 158, 0.12)';
      cardBg = 'var(--neutral-0)';
      statusLabel = 'En Jeu';
      statusBadgeClass = 'badge-info';
    } else if (post.status === 'en-attente') {
      borderLeftColor = 'var(--warning-500)';
      glowShadow = '0 6px 20px rgba(245, 158, 11, 0.15)';
      cardBg = 'var(--neutral-0)';
      statusLabel = 'En attente';
      statusBadgeClass = 'badge-warning';
    } else if (post.status === 'hors-service') {
      borderLeftColor = 'var(--neutral-400)';
      glowShadow = 'var(--shadow-xs)';
      cardBg = '#fafafa';
      statusLabel = 'Maintenance';
      statusBadgeClass = 'badge-danger';
    }

    if (isEditMode) {
      borderLeftColor = 'var(--warning-500)';
      glowShadow = '0 4px 12px rgba(245, 158, 11, 0.15)';
    }

    // Urgent state if minutesRemaining <= 10
    const isUrgent = post.status === 'occupe' && post.minutesRemaining !== undefined && post.minutesRemaining <= 10;

    return (
      <div 
        key={post.id} 
        className={`card animate-fade-in ${isEditMode ? 'edit-pulsing' : ''}`} 
        onClick={() => {
          if (isEditMode) {
            setEditPoste(post);
          }
        }}
        style={{
          padding: 'var(--space-5)',
          border: '1px solid var(--neutral-200)',
          borderLeft: `5px solid ${borderLeftColor}`,
          boxShadow: glowShadow,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          opacity: post.status === 'hors-service' ? 0.85 : 1,
          cursor: isEditMode ? 'pointer' : 'default',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: cardBg,
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: post.status === 'hors-service' 
            ? 'repeating-linear-gradient(-45deg, #f8f9fa, #f8f9fa 10px, #ffffff 10px, #ffffff 20px)' 
            : undefined
        }}
      >
        {/* Urgent overlay border */}
        {isUrgent && (
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid var(--danger-500)',
            borderRadius: 'var(--radius-md)',
            pointerEvents: 'none',
            animation: 'pulse-glow 1.5s infinite'
          }} />
        )}

        {/* Top Row: Name, Type and Status indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {post.name}
              {post.status === 'libre' && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--success-500)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  boxShadow: '0 0 8px var(--success-500)',
                  animation: 'pulse-glow 2s infinite'
                }} />
              )}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gamepad2 size={12} style={{ color: 'var(--primary-400)' }} />
              {mType?.label || post.type}
            </span>
          </div>
          <span className={`badge ${statusBadgeClass}`} style={{ fontWeight: 700, fontSize: '10px', padding: '3px 8px' }}>
            {statusLabel}
          </span>
        </div>

        {/* Middle Row: Details or Play Session info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {post.status === 'occupe' ? (
            <div style={{
              backgroundColor: isUrgent ? 'var(--danger-50)' : 'var(--primary-50)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isUrgent ? 'var(--danger-100)' : 'var(--primary-100)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  👤 <strong>{post.clientName}</strong>
                </span>
                <span style={{ 
                  color: isUrgent ? 'var(--danger-600)' : 'var(--primary-700)', 
                  fontWeight: 800, 
                  fontSize: 'var(--font-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ⏱️ {formatRemainingTime(post.minutesRemaining || 0)} / {formatRemainingTime(post.totalDuration || post.minutesRemaining || 0)}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--neutral-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${percentRemaining}%`, 
                  height: '100%', 
                  background: isUrgent 
                    ? 'linear-gradient(90deg, var(--danger-500), #f43f5e)' 
                    : 'linear-gradient(90deg, var(--primary-500), var(--accent-500))', 
                  transition: 'width 0.5s ease-out' 
                }} />
              </div>
              {isUrgent && (
                <span style={{ fontSize: '9px', color: 'var(--danger-600)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.5px' }}>
                  Temps presque écoulé !
                </span>
              )}
            </div>
          ) : post.status === 'en-attente' ? (
            <div style={{
              backgroundColor: 'var(--warning-50)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--warning-100)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  👤 <strong>{post.clientName}</strong>
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--warning-600)', fontWeight: 600 }}>
                  {formatRemainingTime(post.minutesRemaining || 0)}
                </span>
              </div>
              {/* Code de session bien visible */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: 'var(--space-3)',
                background: 'white',
                borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--warning-500)'
              }}>
                <span style={{ fontSize: '9px', color: 'var(--warning-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Code session — à donner au joueur
                </span>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  letterSpacing: '6px',
                  color: 'var(--neutral-900)',
                  fontFamily: 'monospace'
                }}>
                  {post.sessionCode}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--warning-600)', fontWeight: 500, textAlign: 'center' }}>
                ⏳ En attente que le joueur active la session
              </span>
            </div>
          ) : post.status === 'libre' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-500)', lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                {post.characteristics}
              </p>
              {priceDisplay && (
                <div style={{ 
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--success-50)', 
                  color: 'var(--success-700)', 
                  padding: '2px 8px', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '11px', 
                  fontWeight: 700,
                  border: '1px solid var(--success-100)',
                  marginTop: '4px'
                }}>
                  {priceDisplay}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--neutral-500)' }}>
              <p style={{ fontSize: 'var(--font-xs)', margin: 0, fontWeight: 500 }}>
                🛠️ Poste hors service pour maintenance.
              </p>
              <p style={{ fontSize: '10px', margin: 0, opacity: 0.8 }}>
                Motif: {post.characteristics}
              </p>
            </div>
          )}
          <span style={{ fontSize: '9px', color: 'var(--neutral-400)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
            IP Smart Plug: {post.smartPlugIp}
          </span>
        </div>

        {/* Bottom Row: Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--neutral-100)', paddingTop: 'var(--space-3)' }}>
          {isEditMode ? (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditPoste(post);
              }} 
              className="btn btn-secondary btn-sm" 
              style={{ 
                color: '#b45309', 
                borderColor: '#fcd34d', 
                backgroundColor: '#fffbeb', 
                gap: '4px',
                width: '100%',
                justifyContent: 'center'
              }}
              title="Modifier la configuration"
            >
              <Edit2 size={12} /> Modifier la configuration
            </button>
          ) : (
            <>
              {post.status === 'libre' && (
                <>
                  <button 
                    onClick={() => setShowLaunchModal(post)} 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: 'var(--success-700)', borderColor: 'var(--success-100)', backgroundColor: 'var(--success-50)', gap: '4px', fontWeight: 600 }}
                    title="Lancer une session"
                  >
                    <Play size={12} /> Lancer Session
                  </button>
                  <button 
                    onClick={() => handleToggleOutOfService(post.id, post.name, post.status)} 
                    className="btn btn-secondary btn-icon btn-sm" 
                    style={{ width: '30px', height: '30px', padding: 0 }}
                    title="Mettre hors-service"
                  >
                    <Ban size={12} />
                  </button>
                </>
              )}

              {post.status === 'en-attente' && (
                <button
                  onClick={() => handleEndSession(post.id, post.name, post.clientName || '')}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--warning-600)', borderColor: 'var(--warning-100)', backgroundColor: 'var(--warning-50)', fontWeight: 600 }}
                  title="Annuler la session en attente"
                >
                  Annuler
                </button>
              )}

              {post.status === 'occupe' && (
                <>
                  <button 
                    onClick={() => setShowExtendModal(post)} 
                    className="btn btn-secondary btn-sm" 
                    style={{ width: '30px', height: '30px', padding: 0 }}
                    title="Prolonger"
                  >
                    <Clock size={12} />
                  </button>
                  <button 
                    onClick={() => setShowTransferModal(post)} 
                    className="btn btn-secondary btn-sm" 
                    style={{ width: '30px', height: '30px', padding: 0 }}
                    title="Transférer de poste"
                  >
                    <ArrowRightLeft size={12} />
                  </button>
                  <button 
                    onClick={() => handleEndSession(post.id, post.name, post.clientName || '')} 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: 'var(--danger-500)', borderColor: 'var(--danger-100)', fontWeight: 600 }}
                    title="Terminer la session"
                  >
                    Arrêter
                  </button>
                </>
              )}

              {post.status === 'hors-service' && (
                <>
                  <button 
                    onClick={() => handleToggleOutOfService(post.id, post.name, post.status)} 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: 'var(--primary-600)', borderColor: 'var(--primary-100)' }}
                  >
                    Remettre En Service
                  </button>
                  <button 
                    onClick={() => handleDeletePoste(post.id, post.name)} 
                    className="btn btn-secondary btn-icon btn-sm" 
                    style={{ color: 'var(--danger-500)', borderColor: 'var(--danger-100)', width: '30px', height: '30px', padding: 0 }}
                    title="Supprimer définitivement"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Gestion physique des Postes
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Supervisez les PC, PS5 et casques VR en temps réel. Lancez, transférez ou terminez les sessions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button 
            type="button"
            className={`btn ${isEditMode ? 'btn-black' : 'btn-secondary'}`} 
            onClick={() => setIsEditMode(!isEditMode)} 
            style={{ 
              gap: 'var(--space-2)', 
              borderColor: isEditMode ? '#f59e0b' : undefined,
              boxShadow: isEditMode ? '0 0 10px rgba(245, 158, 11, 0.2)' : undefined
            }}
          >
            <Edit2 size={18} style={{ color: isEditMode ? '#f59e0b' : 'inherit' }} />
            {isEditMode ? 'Quitter Édition' : 'Modifier'}
          </button>
          <button className="btn btn-black" onClick={() => { setNewType(defaultTypeKey); setShowAddModal(true); }} style={{ gap: 'var(--space-2)' }}>
            <Plus size={18} /> Ajouter un Poste
          </button>
        </div>
      </div>

      {isEditMode && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1.5px dashed #f59e0b',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          color: '#b45309',
          fontSize: 'var(--font-sm)',
          fontWeight: 600
        }}>
          💡 Mode Édition Actif — Cliquez sur n'importe quel poste pour modifier sa configuration physique (nom, description, IP Smart Plug, type).
        </div>
      )}

      {/* Search and Filters Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 'var(--space-4)',
        backgroundColor: 'var(--neutral-0)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--neutral-200)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Rechercher un poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: 'var(--font-sm)' }}
            />
          </div>

          {/* Type Filter */}
          <select 
            className="select-field" 
            value={filterType} 
            onChange={(e: any) => setFilterType(e.target.value)}
            style={{ width: '140px', height: '38px', padding: '0 var(--space-3)', fontSize: 'var(--font-sm)' }}
          >
            <option value="all">Tous les types</option>
            {materialTypes.map(t => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            className="select-field" 
            value={filterStatus} 
            onChange={(e: any) => setFilterStatus(e.target.value)}
            style={{ width: '140px', height: '38px', padding: '0 var(--space-3)', fontSize: 'var(--font-sm)' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="libre">Libre</option>
            <option value="occupe">Occupé</option>
            <option value="hors-service">Hors service</option>
          </select>
        </div>

        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--neutral-600)', fontWeight: 600, display: 'flex', gap: 'var(--space-3)' }}>
          <span>Libres: <strong style={{ color: 'var(--success-600)' }}>{postes.filter(p => p.status === 'libre').length}</strong></span>
          <span>Occupés: <strong style={{ color: 'var(--primary-500)' }}>{postes.filter(p => p.status === 'occupe').length}</strong></span>
          <span>HS: <strong style={{ color: 'var(--danger-500)' }}>{postes.filter(p => p.status === 'hors-service').length}</strong></span>
        </div>
      </div>

      {/* Grouped Display */}
      {(() => {
        // Find which types have stations
        const typesWithStations = materialTypes.filter(mType => 
          filteredPostes.some(p => p.type === mType.type)
        );
        const unmatchedStations = filteredPostes.filter(p => 
          !materialTypes.some(m => m.type === p.type)
        );

        if (filteredPostes.length === 0) {
          return (
            <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--neutral-400)' }}>
              Aucun poste ne correspond aux filtres de recherche.
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {typesWithStations.map(mType => {
              const stationsInType = filteredPostes.filter(p => p.type === mType.type);
              
              return (
                <div key={mType.type} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Category Header */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: '2px solid var(--neutral-200)', 
                    paddingBottom: 'var(--space-2)'
                  }}>
                    <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--neutral-800)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Gamepad2 size={18} style={{ color: 'var(--primary-500)' }} />
                      {mType.label}
                    </h3>
                    <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {stationsInType.length} poste{stationsInType.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Grid for this category */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
                    {stationsInType.map(post => renderPosteCard(post))}
                  </div>
                </div>
              );
            })}

            {unmatchedStations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Unmatched Category Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderBottom: '2px solid var(--neutral-200)', 
                  paddingBottom: 'var(--space-2)'
                }}>
                  <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--neutral-800)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <Gamepad2 size={18} style={{ color: 'var(--neutral-400)' }} />
                    Autres Matériels
                  </h3>
                  <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    {unmatchedStations.length} poste{unmatchedStations.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Grid for unmatched category */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
                  {unmatchedStations.map(post => renderPosteCard(post))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Ajouter un Poste</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreatePoste} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom du poste</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: PS5 - VIP #3" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Type de matériel</label>
                <select 
                  className="select-field"
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                >
                  {materialTypes.map(t => (
                    <option key={t.type} value={t.type}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Description / Caractéristiques</label>
                <textarea 
                  className="input-field" 
                  placeholder="Ex: Écran OLED 4K, 120Hz, manettes supplémentaires..." 
                  value={newCharacteristics}
                  onChange={(e) => setNewCharacteristics(e.target.value)}
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Adresse IP Prise Connectée (Smart Plug)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: 192.168.1.101" 
                  value={newSmartPlugIp}
                  onChange={(e) => setNewSmartPlugIp(e.target.value)}
                />
                <span className="input-hint">Permet de couper automatiquement le courant de l'écran en fin de session.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-black">Enregistrer le poste</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Launch Session Modal */}
      {showLaunchModal && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                Lancer Session - {showLaunchModal.name}
              </h3>
              <button className="btn btn-ghost" onClick={() => { setShowLaunchModal(null); setIsGuest(true); setClientSearch(''); }}>✕</button>
            </div>

            <form onSubmit={handleLaunchSession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input 
                  id="is-guest-checkbox"
                  type="checkbox" 
                  checked={isGuest}
                  onChange={(e) => {
                    setIsGuest(e.target.checked);
                    if (e.target.checked) setLaunchMode('time');
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is-guest-checkbox" style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--neutral-700)', cursor: 'pointer' }}>
                  Joueur temporaire / non enregistré (Invité)
                </label>
              </div>

              {isGuest ? (
                /* Pour un invité : pas de nom requis, juste la durée */
                <div style={{
                  backgroundColor: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--neutral-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}>
                  <span style={{ fontSize: '16px' }}>ℹ️</span>
                  <span>Un code de session sera généré automatiquement. Saisissez simplement la durée de jeu ci-dessous.</span>
                </div>
              ) : (
                <div className="input-group">
                  <label className="input-label">Rechercher et sélectionner un client</label>
                  {/* Champ de recherche */}
                  <div style={{ position: 'relative', marginBottom: 'var(--space-2)' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Rechercher par nom ou pseudo..."
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      style={{ paddingLeft: '36px', fontSize: 'var(--font-sm)' }}
                    />
                    <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', fontSize: '14px' }}>🔍</span>
                  </div>
                  {/* Liste filtrée */}
                  <div style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1.5px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--neutral-0)',
                  }}>
                    {dbClients
                      .filter(c =>
                        c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
                        c.username.toLowerCase().includes(clientSearch.toLowerCase())
                      )
                      .map((c, idx, arr) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedClient(c.username)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: 'var(--space-3) var(--space-4)',
                            background: selectedClient === c.username ? 'var(--primary-50)' : 'transparent',
                            border: 'none',
                            borderBottom: idx < arr.length - 1 ? '1px solid var(--neutral-100)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            transition: 'background var(--transition-fast)',
                          }}
                          onMouseEnter={e => { if (selectedClient !== c.username) e.currentTarget.style.background = 'var(--neutral-50)'; }}
                          onMouseLeave={e => { if (selectedClient !== c.username) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {/* Avatar initiales */}
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: selectedClient === c.username ? 'var(--gradient-primary)' : 'var(--neutral-200)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: selectedClient === c.username ? 'white' : 'var(--neutral-600)',
                            flexShrink: 0,
                          }}>
                            {c.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--neutral-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.fullName}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>@{c.username}</div>
                          </div>
                          {selectedClient === c.username && (
                            <span style={{ color: 'var(--primary-500)', fontSize: '14px', flexShrink: 0 }}>✓</span>
                          )}
                        </button>
                      ))
                    }
                    {dbClients.filter(c =>
                      c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
                      c.username.toLowerCase().includes(clientSearch.toLowerCase())
                    ).length === 0 && (
                      <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--neutral-400)', fontSize: 'var(--font-sm)' }}>
                        Aucun client trouvé
                      </div>
                    )}
                  </div>
                  {/* Infos du client sélectionné */}
                  {(() => {
                    const sel = dbClients.find(c => c.username === selectedClient);
                    if (!sel) return null;
                    return (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--neutral-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--neutral-200)',
                        marginTop: 'var(--space-2)',
                        gap: 'var(--space-3)',
                        flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 500 }}>Solde :</span>
                          <span style={{
                            fontWeight: 800,
                            fontSize: 'var(--font-sm)',
                            color: sel.balance > 0 ? 'var(--success-600)' : 'var(--danger-500)',
                          }}>
                            {sel.balance.toLocaleString()} FCFA
                          </span>
                        </div>
                        {sel.abonnementType !== 'Aucun' && (
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                            ⭐ Pass {sel.abonnementType} — {sel.abonnementRemainingTime} min
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {!isGuest && (
                <div style={{ display: 'flex', gap: 'var(--space-4)', margin: 'var(--space-1) 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                    <input 
                      type="radio" 
                      name="launchMode" 
                      checked={launchMode === 'time'} 
                      onChange={() => setLaunchMode('time')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Temps Libre (FCFA)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                    <input 
                      type="radio" 
                      name="launchMode" 
                      checked={launchMode === 'abonnement'} 
                      onChange={() => setLaunchMode('abonnement')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Déduire de l'abonnement
                  </label>
                </div>
              )}

              {launchMode === 'time' && (() => {
                const mType = materialTypes.find(t => t.type === showLaunchModal.type);
                const unitPrice   = mType?.price ?? 0;
                const unitMinutes = mType?.durationMinutes ?? 60;

                const calcCost = (mins: number) =>
                  Math.ceil((unitPrice / unitMinutes) * mins);

                const activeCost = calcCost(selectedDuration);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <label className="input-label">Durée de jeu</label>

                    {/* Boutons preset avec prix */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                      {[
                        { mins: 30,  label: '30 min' },
                        { mins: 60,  label: '1 heure' },
                        { mins: 120, label: '2 heures' },
                      ].map(({ mins, label }) => {
                        const cost = calcCost(mins);
                        const isActive = selectedDuration === mins;
                        return (
                          <button
                            key={mins}
                            type="button"
                            className={`btn ${isActive ? 'btn-black' : 'btn-secondary'} btn-sm`}
                            onClick={() => setSelectedDuration(mins)}
                            style={{ flexDirection: 'column', gap: '2px', height: 'auto', padding: 'var(--space-2) var(--space-1)' }}
                          >
                            <span style={{ fontWeight: 700 }}>{label}</span>
                            <span style={{
                              fontSize: '10px',
                              opacity: 0.85,
                              fontWeight: 600,
                              color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--primary-500)',
                            }}>
                              {cost.toLocaleString()} FCFA
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Récapitulatif du coût */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--gradient-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--primary-100)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>
                        ⏱️ <span>{selectedDuration} min</span>
                        <span style={{ color: 'var(--neutral-300)' }}>·</span>
                        <span style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>
                          {unitPrice.toLocaleString()} FCFA / {unitMinutes} min
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary-600)' }}>
                          {activeCost.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--neutral-500)', marginLeft: '4px' }}>FCFA</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {launchMode === 'abonnement' && (
                <div style={{
                  backgroundColor: 'var(--primary-50)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--primary-700)',
                  fontSize: 'var(--font-xs)',
                  lineHeight: 1.5
                }}>
                  {(() => {
                    const client = dbClients.find(c => c.username === selectedClient);
                    if (client && client.abonnementType !== 'Aucun') {
                      return `✓ Abonnement "${client.abonnementType}" détecté. Temps disponible : ${client.abonnementRemainingTime} minutes.`;
                    }
                    return `⚠️ Ce client ne dispose pas d'un abonnement actif.`;
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowLaunchModal(null); setIsGuest(true); setClientSearch(''); }}>Annuler</button>
                <button type="submit" className="btn btn-black">Activer le poste</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Session Modal */}
      {showExtendModal && (
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
                Prolonger : {showExtendModal.name}
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowExtendModal(null)}>✕</button>
            </div>

            <form onSubmit={handleExtendSession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)' }}>
                Joueur : <strong>{showExtendModal.clientName}</strong> (Temps restant : {showExtendModal.minutesRemaining} min).
              </p>

              <div className="input-group">
                <label className="input-label">Durée supplémentaire</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                  <button 
                    type="button" 
                    className={`btn ${selectedDuration === 30 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setSelectedDuration(30); setCustomDuration(''); }}
                  >
                    +30 min
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${selectedDuration === 60 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setSelectedDuration(60); setCustomDuration(''); }}
                  >
                    +1 heure
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${selectedDuration === 120 && !customDuration ? 'btn-black' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setSelectedDuration(120); setCustomDuration(''); }}
                  >
                    +2 heures
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Durée personnalisée (minutes)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Ex: 15" 
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  min={1}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExtendModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black">Prolonger</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Poste Modal */}
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Modifier le Poste</h3>
              <button className="btn btn-ghost" onClick={() => setShowEditModal(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditPoste} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nom du poste</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: PS5 - VIP #3" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Type de matériel</label>
                <select 
                  className="select-field"
                  value={editType}
                  onChange={(e: any) => setEditType(e.target.value)}
                >
                  {materialTypes.map(t => (
                    <option key={t.type} value={t.type}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Description / Caractéristiques</label>
                <textarea 
                  className="input-field" 
                  placeholder="Ex: Écran OLED 4K, 120Hz, manettes supplémentaires..." 
                  value={editCharacteristics}
                  onChange={(e) => setEditCharacteristics(e.target.value)}
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Adresse IP Prise Connectée (Smart Plug)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: 192.168.1.101" 
                  value={editSmartPlugIp}
                  onChange={(e) => setEditSmartPlugIp(e.target.value)}
                />
                <span className="input-hint">Permet de couper automatiquement le courant de l'écran en fin de session.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black">Enregistrer les modifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Session Modal */}
      {showTransferModal && (
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
                Transférer la Session
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowTransferModal(null)}>✕</button>
            </div>

            <form onSubmit={handleTransferSession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-600)' }}>
                Déplacer <strong>{showTransferModal.clientName}</strong> ({showTransferModal.minutesRemaining} min restantes) depuis <strong>{showTransferModal.name}</strong>.
              </p>

              <div className="input-group">
                <label className="input-label">Sélectionner le poste libre de destination (même type)</label>
                <select 
                  className="select-field"
                  value={selectedTransferPosteId}
                  onChange={(e) => setSelectedTransferPosteId(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un poste libre --</option>
                  {postes
                    .filter(p => p.status === 'libre' && p.type === showTransferModal.type)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.characteristics})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-black" disabled={!selectedTransferPosteId}>
                  Transférer (Switch Smart Plugs)
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

      {/* Toast Portal */}
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
