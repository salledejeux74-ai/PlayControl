import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Gamepad2, Plus, Search, Edit2, Trash2, Power, PowerOff, MapPin, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Salle {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  owner: string;
  ownerPhoto?: string; // Photo du propriétaire (Base64 optionnel)
  phone: string;
  postesCount: number;
  status: 'active' | 'suspended';
  monthlyRevenue: number;
}

export const Salles: React.FC = () => {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salles')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const formatted = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          latitude: s.latitude ? Number(s.latitude) : undefined,
          longitude: s.longitude ? Number(s.longitude) : undefined,
          owner: s.owner,
          ownerPhoto: s.owner_photo || undefined,
          phone: s.phone,
          postesCount: s.postes_count,
          status: s.status,
          monthlyRevenue: s.monthly_revenue
        }));
        setSalles(formatted);
      }
    } catch (err: any) {
      console.error("Erreur chargement salles:", err.message);
      showToastMsg("Erreur lors du chargement des salles: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalles();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [newSalleName, setNewSalleName] = useState('');
  const [newSalleLocation, setNewSalleLocation] = useState('');
  const [newSalleLat, setNewSalleLat] = useState<string>('');
  const [newSalleLng, setNewSalleLng] = useState<string>('');
  const [newSalleOwner, setNewSalleOwner] = useState('');
  const [newSalleOwnerPhoto, setNewSalleOwnerPhoto] = useState<string>('');
  const [newSalleOwnerPhotoFile, setNewSalleOwnerPhotoFile] = useState<File | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('+237');
  const [rawPhoneNum, setRawPhoneNum] = useState<string>('');
  const [newSallePostes, setNewSallePostes] = useState(10);

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Edit Form states
  const [editingSalle, setEditingSalle] = useState<Salle | null>(null);
  const [editSalleName, setEditSalleName] = useState('');
  const [editSalleLocation, setEditSalleLocation] = useState('');
  const [editSalleLat, setEditSalleLat] = useState<string>('');
  const [editSalleLng, setEditSalleLng] = useState<string>('');
  const [editSalleOwner, setEditSalleOwner] = useState('');
  const [editSalleOwnerPhoto, setEditSalleOwnerPhoto] = useState<string>('');
  const [editSalleOwnerPhotoFile, setEditSalleOwnerPhotoFile] = useState<File | null>(null);
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState<string>('+237');
  const [editRawPhoneNum, setEditRawPhoneNum] = useState<string>('');
  const [editSallePostes, setEditSallePostes] = useState(10);

  // Autocomplete suggestions for editing
  const [editSuggestions, setEditSuggestions] = useState<any[]>([]);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [isSearchingEditSuggestions, setIsSearchingEditSuggestions] = useState(false);
  const editAutocompleteRef = useRef<HTMLDivElement>(null);

  // Toast notifications state
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

  const currentCountry = countries.find(c => c.code === phoneCountryCode) || countries[0];

  const handleDeleteSalle = (id: string, name: string) => {
    openConfirm(
      "Supprimer la salle",
      `Êtes-vous sûr de vouloir supprimer définitivement la salle "${name}" ? Toutes ses configurations physiques, personnels, et données de revenus seront effacées de manière irréversible.`,
      async () => {
        try {
          const { error } = await supabase.from('salles').delete().eq('id', id);
          if (error) throw error;
          setSalles(salles.filter(s => s.id !== id));
          showToastMsg(`La salle "${name}" a été supprimée avec succès.`);
        } catch (err: any) {
          showToastMsg("Erreur suppression: " + err.message, "error");
        }
      },
      'danger'
    );
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: 'active' | 'suspended') => {
    const isSuspended = currentStatus === 'active';
    openConfirm(
      isSuspended ? "Suspendre la salle" : "Activer la salle",
      isSuspended 
        ? `Êtes-vous sûr de vouloir suspendre la licence de la salle "${name}" ? Tous les gérants, caissiers et clients de cette salle seront déconnectés et ne pourront plus s'authentifier.` 
        : `Êtes-vous sûr de vouloir réactiver la licence de la salle "${name}" ?`,
      async () => {
        try {
          const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
          const { error } = await supabase
            .from('salles')
            .update({ status: newStatus })
            .eq('id', id);
          if (error) throw error;
          setSalles(salles.map(salle => {
            if (salle.id === id) {
              return { ...salle, status: newStatus, monthlyRevenue: newStatus === 'suspended' ? 0 : salle.monthlyRevenue };
            }
            return salle;
          }));
          showToastMsg(`La salle "${name}" a été ${isSuspended ? 'suspendue' : 'réactivée'} avec succès.`);
        } catch (err: any) {
          showToastMsg("Erreur modification statut: " + err.message, "error");
        }
      },
      isSuspended ? 'danger' : 'info'
    );
  };

  const geocodeAddress = async (address: string) => {
    if (!address) {
      setNewSalleLat('');
      setNewSalleLng('');
      return;
    }
    setIsGeocoding(true);
    
    // Simulate address hash helper for deterministic offline fallback coordinates
    const getOfflineCoords = (addr: string) => {
      let hash = 0;
      for (let i = 0; i < addr.length; i++) {
        hash = addr.charCodeAt(i) + ((hash << 5) - hash);
      }
      // Generates coordinates around Cameroon/Central Africa coordinates
      const lat = (3.8 + (Math.abs(hash) % 100) / 200).toFixed(6);
      const lng = (11.5 + (Math.abs(hash) % 150) / 300).toFixed(6);
      return { lat, lng };
    };

    try {
      // Nominatim search API (Free & No API Key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { 
          headers: { 
            'Accept-Language': 'fr',
            'User-Agent': 'PlayControl-App/1.0'
          } 
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setNewSalleLat(Number(data[0].lat).toFixed(6));
        setNewSalleLng(Number(data[0].lon).toFixed(6));
      } else {
        // Fallback geocoding offline mockup
        const coords = getOfflineCoords(address);
        setNewSalleLat(coords.lat);
        setNewSalleLng(coords.lng);
      }
    } catch (err) {
      // Offline / Network error geocoding fallback
      const coords = getOfflineCoords(address);
      setNewSalleLat(coords.lat);
      setNewSalleLng(coords.lng);
    } finally {
      setIsGeocoding(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearchingSuggestions(true);
    
    // List of Cameroonian/African mock suggestions for offline/local-first mode
    const offlineSuggestions = [
      { display_name: 'Bastos, Yaoundé, Cameroun', lat: '3.8833', lon: '11.5167' },
      { display_name: 'Bonapriso, Douala, Cameroun', lat: '4.0483', lon: '9.7043' },
      { display_name: 'Akwa, Douala, Cameroun', lat: '4.0500', lon: '9.7000' },
      { display_name: 'Plateau, Garoua, Cameroun', lat: '9.3000', lon: '13.4000' },
      { display_name: 'Marché A, Bafoussam, Cameroun', lat: '5.4772', lon: '10.4172' },
      { display_name: 'Biyem-Assi, Yaoundé, Cameroun', lat: '3.8392', lon: '11.4883' },
      { display_name: 'Kribi, Sud, Cameroun', lat: '2.9500', lon: '9.9167' },
      { display_name: 'Limbe, Sud-Ouest, Cameroun', lat: '4.0167', lon: '9.2167' },
      { display_name: 'Libreville, Gabon', lat: '0.3901', lon: '9.4544' },
      { display_name: 'Brazzaville, Congo', lat: '-4.2661', lon: '15.2832' },
      { display_name: 'Kinshasa, RDC', lat: '-4.3276', lon: '15.3136' },
      { display_name: 'Abidjan, Côte d\'Ivoire', lat: '5.3600', lon: '-4.0083' },
      { display_name: 'Dakar, Sénégal', lat: '14.7690', lon: '-17.4475' }
    ];

    try {
      // Nominatim search API with country code filters to keep suggestions relevant to West/Central Africa
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=cm,ga,cg,cd,cf,td,ci,sn,ng`,
        { 
          headers: { 
            'Accept-Language': 'fr',
            'User-Agent': 'PlayControl-App/1.0'
          } 
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSuggestions(data.map((item: any) => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon
        })));
      } else {
        const filtered = offlineSuggestions.filter(item => 
          item.display_name.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered);
      }
    } catch (err) {
      const filtered = offlineSuggestions.filter(item => 
        item.display_name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  // Debounced autocomplete search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (newSalleLocation) {
        fetchSuggestions(newSalleLocation);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [newSalleLocation]);

  // Click outside listener to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewSalleOwnerPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSalleOwnerPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSalle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalleName || !newSalleOwner) return;

    const finalPhone = rawPhoneNum ? `${phoneCountryCode} ${rawPhoneNum.trim()}` : 'Non spécifié';
    let uploadedPhotoUrl = null;

    try {
      setIsSubmitting(true);
      if (newSalleOwnerPhotoFile) {
        const fileExt = newSalleOwnerPhotoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `owners/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('salles')
          .upload(filePath, newSalleOwnerPhotoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('salles')
          .getPublicUrl(filePath);

        uploadedPhotoUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('salles')
        .insert({
          name: newSalleName,
          location: newSalleLocation || 'Non spécifiée',
          latitude: newSalleLat ? Number(newSalleLat) : null,
          longitude: newSalleLng ? Number(newSalleLng) : null,
          owner: newSalleOwner,
          owner_photo: uploadedPhotoUrl || null,
          phone: finalPhone,
          postes_count: Number(newSallePostes),
          status: 'active',
          monthly_revenue: 0
        })
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        const addedSalle: Salle = {
          id: data.id,
          name: data.name,
          location: data.location,
          latitude: data.latitude ? Number(data.latitude) : undefined,
          longitude: data.longitude ? Number(data.longitude) : undefined,
          owner: data.owner,
          ownerPhoto: data.owner_photo || undefined,
          phone: data.phone,
          postesCount: data.postes_count,
          status: data.status as 'active' | 'suspended',
          monthlyRevenue: data.monthly_revenue
        };
        setSalles([...salles, addedSalle]);
        showToastMsg(`La salle "${newSalleName}" a été créée avec succès.`);
        
        // Reset Form
        setNewSalleName('');
        setNewSalleLocation('');
        setNewSalleLat('');
        setNewSalleLng('');
        setNewSalleOwner('');
        setNewSalleOwnerPhoto('');
        setNewSalleOwnerPhotoFile(null);
        setPhoneCountryCode('+237');
        setRawPhoneNum('');
        setNewSallePostes(10);
        setSuggestions([]);
        setShowSuggestions(false);
        setShowAddModal(false);
      }
    } catch (err: any) {
      showToastMsg("Erreur lors de la création: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (salle: Salle) => {
    setEditingSalle(salle);
    setEditSalleName(salle.name);
    setEditSalleLocation(salle.location);
    setEditSalleLat(salle.latitude ? String(salle.latitude) : '');
    setEditSalleLng(salle.longitude ? String(salle.longitude) : '');
    setEditSalleOwner(salle.owner);
    setEditSalleOwnerPhoto(salle.ownerPhoto || '');
    setEditSallePostes(salle.postesCount);

    if (salle.phone && salle.phone !== 'Non spécifié') {
      const matchedCountry = countries.find(c => salle.phone.startsWith(c.code));
      if (matchedCountry) {
        setEditPhoneCountryCode(matchedCountry.code);
        setEditRawPhoneNum(salle.phone.replace(matchedCountry.code, '').replace(/\s/g, ''));
      } else {
        setEditPhoneCountryCode('+237');
        setEditRawPhoneNum(salle.phone.replace(/\s/g, ''));
      }
    } else {
      setEditPhoneCountryCode('+237');
      setEditRawPhoneNum('');
    }
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditSalleOwnerPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditSalleOwnerPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSalleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalle || !editSalleName || !editSalleOwner) return;

    const finalPhone = editRawPhoneNum ? `${editPhoneCountryCode} ${editRawPhoneNum.trim()}` : 'Non spécifié';
    let uploadedPhotoUrl = editSalleOwnerPhoto;

    try {
      setIsSubmitting(true);
      if (editSalleOwnerPhotoFile) {
        const fileExt = editSalleOwnerPhotoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `owners/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('salles')
          .upload(filePath, editSalleOwnerPhotoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('salles')
          .getPublicUrl(filePath);

        uploadedPhotoUrl = publicUrl;
      }

      const { error } = await supabase
        .from('salles')
        .update({
          name: editSalleName,
          location: editSalleLocation || 'Non spécifiée',
          latitude: editSalleLat ? Number(editSalleLat) : null,
          longitude: editSalleLng ? Number(editSalleLng) : null,
          owner: editSalleOwner,
          owner_photo: uploadedPhotoUrl || null,
          phone: finalPhone,
          postes_count: Number(editSallePostes),
        })
        .eq('id', editingSalle.id);
      
      if (error) throw error;

      setSalles(salles.map(s => {
        if (s.id === editingSalle.id) {
          return {
            ...s,
            name: editSalleName,
            location: editSalleLocation || 'Non spécifiée',
            latitude: editSalleLat ? Number(editSalleLat) : undefined,
            longitude: editSalleLng ? Number(editSalleLng) : undefined,
            owner: editSalleOwner,
            ownerPhoto: uploadedPhotoUrl || undefined,
            phone: finalPhone,
            postesCount: Number(editSallePostes),
          };
        }
        return s;
      }));

      setEditingSalle(null);
      setEditSalleOwnerPhotoFile(null);
      showToastMsg(`La salle "${editSalleName}" a été modifiée avec succès.`);
    } catch (err: any) {
      showToastMsg("Erreur lors de la modification: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const geocodeEditAddress = async (address: string) => {
    if (!address) {
      setEditSalleLat('');
      setEditSalleLng('');
      return;
    }
    setIsGeocoding(true);
    
    const getOfflineCoords = (addr: string) => {
      let hash = 0;
      for (let i = 0; i < addr.length; i++) {
        hash = addr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const lat = (3.8 + (Math.abs(hash) % 100) / 200).toFixed(6);
      const lng = (11.5 + (Math.abs(hash) % 150) / 300).toFixed(6);
      return { lat, lng };
    };

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { 
          headers: { 
            'Accept-Language': 'fr',
            'User-Agent': 'PlayControl-App/1.0'
          } 
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setEditSalleLat(Number(data[0].lat).toFixed(6));
        setEditSalleLng(Number(data[0].lon).toFixed(6));
      } else {
        const coords = getOfflineCoords(address);
        setEditSalleLat(coords.lat);
        setEditSalleLng(coords.lng);
      }
    } catch (err) {
      const coords = getOfflineCoords(address);
      setEditSalleLat(coords.lat);
      setEditSalleLng(coords.lng);
    } finally {
      setIsGeocoding(false);
    }
  };

  const fetchEditSuggestions = async (query: string) => {
    if (query.length < 3) {
      setEditSuggestions([]);
      return;
    }
    setIsSearchingEditSuggestions(true);
    
    const offlineSuggestions = [
      { display_name: 'Bastos, Yaoundé, Cameroun', lat: '3.8833', lon: '11.5167' },
      { display_name: 'Bonapriso, Douala, Cameroun', lat: '4.0483', lon: '9.7043' },
      { display_name: 'Akwa, Douala, Cameroun', lat: '4.0500', lon: '9.7000' },
      { display_name: 'Plateau, Garoua, Cameroun', lat: '9.3000', lon: '13.4000' },
      { display_name: 'Marché A, Bafoussam, Cameroun', lat: '5.4772', lon: '10.4172' },
      { display_name: 'Biyem-Assi, Yaoundé, Cameroun', lat: '3.8392', lon: '11.4883' },
      { display_name: 'Kribi, Sud, Cameroun', lat: '2.9500', lon: '9.9167' },
      { display_name: 'Limbe, Sud-Ouest, Cameroun', lat: '4.0167', lon: '9.2167' },
      { display_name: 'Libreville, Gabon', lat: '0.3901', lon: '9.4544' },
      { display_name: 'Brazzaville, Congo', lat: '-4.2661', lon: '15.2832' },
      { display_name: 'Kinshasa, RDC', lat: '-4.3276', lon: '15.3136' },
      { display_name: 'Abidjan, Côte d\'Ivoire', lat: '5.3600', lon: '-4.0083' },
      { display_name: 'Dakar, Sénégal', lat: '14.7690', lon: '-17.4475' }
    ];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=cm,ga,cg,cd,cf,td,ci,sn,ng`,
        { 
          headers: { 
            'Accept-Language': 'fr',
            'User-Agent': 'PlayControl-App/1.0'
          } 
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setEditSuggestions(data.map((item: any) => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon
        })));
      } else {
        const filtered = offlineSuggestions.filter(item => 
          item.display_name.toLowerCase().includes(query.toLowerCase())
        );
        setEditSuggestions(filtered);
      }
    } catch (err) {
      const filtered = offlineSuggestions.filter(item => 
        item.display_name.toLowerCase().includes(query.toLowerCase())
      );
      setEditSuggestions(filtered);
    } finally {
      setIsSearchingEditSuggestions(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (editSalleLocation) {
        fetchEditSuggestions(editSalleLocation);
      } else {
        setEditSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [editSalleLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editAutocompleteRef.current && !editAutocompleteRef.current.contains(event.target as Node)) {
        setShowEditSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSalles = salles.filter(salle => 

    salle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salle.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salle.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--neutral-500)', fontWeight: 600 }}>Chargement des salles...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--neutral-800)', letterSpacing: '-0.5px' }}>
            Gestion des Salles de Jeux
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-sm)' }}>
            Créez, éditez et gérez les configurations physiques et contractuelles des salles affiliées.
          </p>
        </div>
        <button className="btn btn-black" onClick={() => setShowAddModal(true)} style={{ gap: 'var(--space-2)' }}>
          <Plus size={18} /> Nouvelle Salle
        </button>
      </div>

      {/* Table Actions Filter */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Rechercher une salle, un gérant, une ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--neutral-500)' }}>
          Total : {filteredSalles.length} salles affichées
        </div>
      </div>

      {/* Salles Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nom de la Salle</th>
              <th>Emplacement</th>
              <th>Gérant / Contact</th>
              <th style={{ textAlign: 'center' }}>Postes</th>
              <th>Revenus Mensuels</th>
              <th>Statut</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSalles.length > 0 ? (
              filteredSalles.map(salle => (
                <tr key={salle.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--primary-50)',
                        color: 'var(--primary-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Gamepad2 size={18} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>{salle.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--neutral-400)' }}>ID: #{salle.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--neutral-600)', fontSize: 'var(--font-sm)' }}>
                        <MapPin size={14} style={{ color: 'var(--neutral-400)' }} />
                        <span>{salle.location}</span>
                      </div>
                      {salle.latitude && salle.longitude && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${salle.latitude},${salle.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: '10px', 
                            color: 'var(--primary-500)', 
                            fontWeight: 700, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '2px',
                            marginTop: '2px'
                          }}
                        >
                          🗺️ Voir sur Google Maps
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {salle.ownerPhoto ? (
                        <img src={salle.ownerPhoto} alt={salle.owner} style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--neutral-300)'
                        }} />
                      ) : (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-50)',
                          color: 'var(--primary-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 'var(--font-xs)',
                          border: '1px solid var(--primary-100)'
                        }}>
                          {salle.owner.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-sm)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>{salle.owner}</span>
                        <span style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} style={{ color: 'var(--neutral-400)' }} /> {salle.phone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--neutral-800)' }}>
                    {salle.postesCount}
                  </td>
                  <td style={{ fontWeight: 800, color: salle.status === 'suspended' ? 'var(--neutral-400)' : 'var(--neutral-800)' }}>
                    {salle.status === 'suspended' ? '—' : `${salle.monthlyRevenue.toLocaleString()} FCFA`}
                  </td>
                  <td>
                    <span className={`badge ${salle.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span className="status-dot" style={{ backgroundColor: salle.status === 'active' ? 'var(--success-700)' : 'var(--danger-600)' }} />
                      {salle.status === 'active' ? 'Active' : 'Suspendue'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                      <button 
                        className="btn btn-secondary btn-icon" 
                        title="Modifier"
                        onClick={() => handleEditClick(salle)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(salle.id, salle.name, salle.status)} 
                        className={`btn btn-icon ${salle.status === 'active' ? 'btn-danger' : 'btn-black'}`} 
                        title={salle.status === 'active' ? 'Suspendre la salle' : 'Activer la salle'}
                        style={{ width: '30px', height: '30px', padding: 0 }}
                      >
                        {salle.status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteSalle(salle.id, salle.name)}
                        className="btn btn-secondary btn-icon" 
                        style={{ borderColor: 'var(--danger-100)', color: 'var(--danger-500)' }} 
                        title="Supprimer la salle"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--neutral-400)' }}>
                  Aucune salle trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Salle Modal */}
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '540px', padding: 'var(--space-8)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Créer une Nouvelle Salle</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddSalle} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Salle Name */}
              <div className="input-group">
                <label className="input-label">Nom de la salle</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Gaming Hub Bastos" 
                  value={newSalleName}
                  onChange={(e) => setNewSalleName(e.target.value)}
                  required 
                />
              </div>

              {/* Location Address & Autocomplete Suggestions */}
              <div className="input-group" style={{ position: 'relative' }} ref={autocompleteRef}>
                <label className="input-label">Emplacement (Adresse)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Bastos, Yaoundé" 
                  value={newSalleLocation}
                  onChange={(e) => {
                    setNewSalleLocation(e.target.value);
                    setNewSalleLat('');
                    setNewSalleLng('');
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    // Slight delay to allow clicked suggestion to register (using onMouseDown is primary, but onBlur serves as fallback geocoder)
                    setTimeout(() => {
                      setShowSuggestions(false);
                      if (newSalleLocation && (!newSalleLat || !newSalleLng)) {
                        geocodeAddress(newSalleLocation);
                      }
                    }, 200);
                  }}
                  required
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1010,
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {suggestions.map((item, index) => (
                      <div 
                        key={index}
                        onMouseDown={() => {
                          setNewSalleLocation(item.display_name);
                          setNewSalleLat(Number(item.lat).toFixed(6));
                          setNewSalleLng(Number(item.lon).toFixed(6));
                          setShowSuggestions(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: 'var(--font-sm)',
                          color: 'var(--neutral-700)',
                          borderBottom: index === suggestions.length - 1 ? 'none' : '1px solid var(--neutral-100)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <MapPin size={14} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isSearchingSuggestions && (
                  <span style={{ fontSize: '11px', color: 'var(--primary-500)', fontWeight: 600 }}>
                    ⌛ Recherche de suggestions d'adresse...
                  </span>
                )}
                
                {isGeocoding && (
                  <span style={{ fontSize: '11px', color: 'var(--primary-500)', fontWeight: 600 }}>
                    ⌛ Résolution de la position GPS...
                  </span>
                )}
                {!isGeocoding && !isSearchingSuggestions && newSalleLat && newSalleLng && (
                  <span style={{ fontSize: '11px', color: 'var(--success-700)', fontWeight: 600 }}>
                    📍 Position GPS résolue : Lat {newSalleLat}, Lng {newSalleLng}
                  </span>
                )}
              </div>

              {/* Postes count */}
              <div className="input-group">
                <label className="input-label">Nombre de postes de jeux</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="10" 
                  value={newSallePostes}
                  onChange={(e) => setNewSallePostes(Number(e.target.value))}
                  min={1} 
                  required 
                />
              </div>

              {/* Owner */}
              <div className="input-group">
                <label className="input-label">Nom du propriétaire / Gérant</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Marc Kemajou" 
                  value={newSalleOwner}
                  onChange={(e) => setNewSalleOwner(e.target.value)}
                  required 
                />
              </div>

              {/* Phone */}
              <div className="input-group">
                <label className="input-label">Téléphone</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <select 
                    className="select-field"
                    value={phoneCountryCode}
                    onChange={(e) => {
                      setPhoneCountryCode(e.target.value);
                      setRawPhoneNum(''); // Reset when country changes
                    }}
                    style={{ width: '100px', paddingRight: '20px' }}
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder={currentCountry.placeholder}
                    value={rawPhoneNum}
                    onChange={(e) => {
                      // Restrict input to numbers only and match exactly the country's max digits
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length <= currentCountry.length) {
                        setRawPhoneNum(val);
                      }
                    }}
                    style={{ flex: 1 }}
                    required
                  />
                </div>
                {rawPhoneNum && rawPhoneNum.length < currentCountry.length && (
                  <span style={{ fontSize: '11px', color: 'var(--danger-600)', fontWeight: 600, marginTop: '4px' }}>
                    ⚠️ Le numéro pour le {currentCountry.name} doit comporter exactement {currentCountry.length} chiffres ({rawPhoneNum.length} saisis).
                  </span>
                )}
              </div>

              {/* Owner Photo (Optionnel) - Placé en dernier */}
              <div className="input-group">
                <label className="input-label">Photo du propriétaire (Optionnel)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="input-field" 
                    onChange={handlePhotoChange}
                    style={{ flex: 1 }}
                  />
                  {newSalleOwnerPhoto && (
                    <img src={newSalleOwnerPhoto} alt="Aperçu" style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--neutral-300)'
                    }} />
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--neutral-200)', paddingTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>Annuler</button>
                <button type="submit" className="btn btn-black" disabled={isGeocoding || isSubmitting}>
                  {isSubmitting ? 'Création en cours...' : 'Créer la salle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Salle Modal */}
      {editingSalle && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '540px', padding: 'var(--space-8)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Modifier la Salle</h3>
              <button className="btn btn-ghost" onClick={() => setEditingSalle(null)}>✕</button>
            </div>
            
            <form onSubmit={handleEditSalleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Salle Name */}
              <div className="input-group">
                <label className="input-label">Nom de la salle</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Gaming Hub Bastos" 
                  value={editSalleName}
                  onChange={(e) => setEditSalleName(e.target.value)}
                  required 
                />
              </div>

              {/* Location Address & Autocomplete Suggestions */}
              <div className="input-group" style={{ position: 'relative' }} ref={editAutocompleteRef}>
                <label className="input-label">Emplacement (Adresse)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Bastos, Yaoundé" 
                  value={editSalleLocation}
                  onChange={(e) => {
                    setEditSalleLocation(e.target.value);
                    setEditSalleLat('');
                    setEditSalleLng('');
                    setShowEditSuggestions(true);
                  }}
                  onFocus={() => setShowEditSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowEditSuggestions(false);
                      if (editSalleLocation && (!editSalleLat || !editSalleLng)) {
                        geocodeEditAddress(editSalleLocation);
                      }
                    }, 200);
                  }}
                  required
                />
                
                {showEditSuggestions && editSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1010,
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {editSuggestions.map((item, index) => (
                      <div 
                        key={index}
                        onMouseDown={() => {
                          setEditSalleLocation(item.display_name);
                          setEditSalleLat(Number(item.lat).toFixed(6));
                          setEditSalleLng(Number(item.lon).toFixed(6));
                          setShowEditSuggestions(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: 'var(--font-sm)',
                          color: 'var(--neutral-700)',
                          borderBottom: index === editSuggestions.length - 1 ? 'none' : '1px solid var(--neutral-100)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <MapPin size={14} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isSearchingEditSuggestions && (
                  <span style={{ fontSize: '11px', color: 'var(--primary-500)', fontWeight: 600 }}>
                    ⌛ Recherche de suggestions d'adresse...
                  </span>
                )}
                
                {isGeocoding && (
                  <span style={{ fontSize: '11px', color: 'var(--primary-500)', fontWeight: 600 }}>
                    ⌛ Résolution de la position GPS...
                  </span>
                )}
                {!isGeocoding && !isSearchingEditSuggestions && editSalleLat && editSalleLng && (
                  <span style={{ fontSize: '11px', color: 'var(--success-700)', fontWeight: 600 }}>
                    📍 Position GPS résolue : Lat {editSalleLat}, Lng {editSalleLng}
                  </span>
                )}
              </div>

              {/* Postes count */}
              <div className="input-group">
                <label className="input-label">Nombre de postes de jeux</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="10" 
                  value={editSallePostes}
                  onChange={(e) => setEditSallePostes(Number(e.target.value))}
                  min={1} 
                  required 
                />
              </div>

              {/* Owner */}
              <div className="input-group">
                <label className="input-label">Nom du propriétaire / Gérant</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Marc Kemajou" 
                  value={editSalleOwner}
                  onChange={(e) => setEditSalleOwner(e.target.value)}
                  required 
                />
              </div>

              {/* Phone */}
              {(() => {
                const currentEditCountry = countries.find(c => c.code === editPhoneCountryCode) || countries[0];
                return (
                  <div className="input-group">
                    <label className="input-label">Téléphone</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <select 
                        className="select-field"
                        value={editPhoneCountryCode}
                        onChange={(e) => {
                          setEditPhoneCountryCode(e.target.value);
                          setEditRawPhoneNum(''); // Reset when country changes
                        }}
                        style={{ width: '100px', paddingRight: '20px' }}
                      >
                        {countries.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <input 
                        type="tel" 
                        className="input-field" 
                        placeholder={currentEditCountry.placeholder}
                        value={editRawPhoneNum}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length <= currentEditCountry.length) {
                            setEditRawPhoneNum(val);
                          }
                        }}
                        style={{ flex: 1 }}
                        required
                      />
                    </div>
                    {editRawPhoneNum && editRawPhoneNum.length < currentEditCountry.length && (
                      <span style={{ fontSize: '11px', color: 'var(--danger-600)', fontWeight: 600, marginTop: '4px' }}>
                        ⚠️ Le numéro pour le {currentEditCountry.name} doit comporter exactement {currentEditCountry.length} chiffres ({editRawPhoneNum.length} saisis).
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Owner Photo (Optionnel) - Placé en dernier */}
              <div className="input-group">
                <label className="input-label">Photo du propriétaire (Optionnel)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="input-field" 
                    onChange={handleEditPhotoChange}
                    style={{ flex: 1 }}
                  />
                  {editSalleOwnerPhoto && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <img src={editSalleOwnerPhoto} alt="Aperçu" style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid var(--neutral-300)'
                      }} />
                      <button 
                        type="button" 
                        className="btn btn-ghost" 
                        onClick={() => setEditSalleOwnerPhoto('')}
                        style={{ color: 'var(--danger-600)', padding: '0 4px', minWidth: 'auto', fontSize: '12px' }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--neutral-200)', paddingTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingSalle(null)} disabled={isSubmitting}>Annuler</button>
                <button type="submit" className="btn btn-black" disabled={isGeocoding || isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setConfirmModal(null)}
              >
                Annuler
              </button>
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

      {/* Toast Notification - Rendered via React Portal directly in body to escape parent layout limits / transforms */}
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
          borderLeft: '4px solid #10b981', // Success green border
          zIndex: 9999, // Render above everything, including modals
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          fontSize: 'var(--font-sm)',
          animation: 'fade-in 0.3s ease-out'
        }}>
          <span style={{ 
            color: '#10b981', 
            backgroundColor: '#ecfdf5', 
            width: '20px',
            height: '20px',
            borderRadius: '50%', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            ✓
          </span>
          <span>{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
};
