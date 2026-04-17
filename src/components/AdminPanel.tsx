import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut, LogIn, Users, Heart, Download, Search, Bell, UserPlus,
  Calendar, Phone, Image as ImageIcon, Radio, Plus,
  Trash2, Check, X, Pencil, AlertTriangle,
  Loader2, LayoutDashboard, Menu as MenuIcon, Eye, EyeOff, MessageCircle, Info, ExternalLink, Mail, MapPin, HeartHandshake, User, Scissors, Box, BookOpen, GripVertical
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

type Tab = 'dashboard' | 'registrations' | 'crm_pipeline' | 'banners' | 'lives' | 'events' | 'prayers' | 'team' | 'settings' | 'volunteers';

const ALL_TABS: Tab[] = ['dashboard', 'registrations', 'crm_pipeline', 'banners', 'lives', 'events', 'prayers', 'team', 'settings'];
const DELETABLE_TABS: Tab[] = ['registrations', 'banners', 'lives', 'events', 'prayers', 'team'];



export default function AdminPanel() {
  const MAIN_ADMIN_EMAIL = 'contato@salveprajesus.org';
  const LEGACY_BLOCKED_EMAIL = 'sarahb.contato@gmail.com';
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<any>({});
  const [filesToUpload, setFilesToUpload] = useState<Record<string, File>>({});
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [filterRegistrations, setFilterRegistrations] = useState<'all' | 'acceptedJesus' | 'attendsChurch' | 'hasBible' | 'noBible' | 'knowing' | 'wantsUpdates'>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null);
  const [editingStatus, setEditingStatus] = useState('');
  const [editingOwner, setEditingOwner] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<'idle'|'ok'|'err'>('idle');
  const [teamRows, setTeamRows] = useState<any[]>([]);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [memberPassword, setMemberPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isVerifyingDelete, setIsVerifyingDelete] = useState(false);

  const [settings, setSettings] = useState<any>({
    site_name: 'O SALVE É PRA JESUS',
    logo_url: '',
    donation_image_url: '',
    google_fonts_url: '',
    font_family: 'Bebas Neue',
    instagram_url: '',
    youtube_url: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.email) {
        setHasAccess(false);
        setIsCheckingAccess(false);
        return;
      }

      if (user.email === LEGACY_BLOCKED_EMAIL) {
        setHasAccess(false);
        setIsCheckingAccess(false);
        return;
      }

      if (user.email === MAIN_ADMIN_EMAIL) {
        setHasAccess(true);
        setIsCheckingAccess(false);
        return;
      }

      const { data: teamMember } = await supabase
        .from('team')
        .select('email, active')
        .eq('email', user.email)
        .maybeSingle();

      setHasAccess(Boolean(teamMember) && teamMember.active !== false);
      setIsCheckingAccess(false);
    };

    setIsCheckingAccess(true);
    checkAccess();
  }, [user]);

  const isMainAdmin = user?.email === MAIN_ADMIN_EMAIL;
  
  const canViewTab = (tab: Tab) => true;
  const canEditTab = (tab: Tab) => true;
  const canDeleteTab = (tab: Tab) => true;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  const getTableName = (tab: Tab) => {
    if (tab === 'prayers') return 'registrations';
    if (tab === 'volunteers') return 'volunteers';
    return tab;
  };

  const loadTabData = async (tab: Tab) => {
    if (tab === 'crm_pipeline') {
      const { data: registrationsData } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      setData(registrationsData || []);
      return;
    }
    if (tab === 'settings') {
      const { data: sData } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (sData) setSettings(sData);
      return;
    }

    if (tab === 'prayers') {
      const { data: regPrayers } = await supabase
        .from('registrations')
        .select('*')
        .not('prayer_request', 'is', null)
        .neq('prayer_request', '');

      const { data: dedicatedPrayers } = await supabase
        .from('prayer_requests')
        .select('*');

      const merged = [
        ...(regPrayers || []).map(p => ({ ...p, _source: 'registrations' })),
        ...(dedicatedPrayers || []).map(p => ({
          ...p,
          prayer_request: p.request,
          _source: 'prayer_requests',
          whatsapp: p.whatsapp || 'N/A',
          accepted_jesus: false
        }))
      ];

      merged.sort((a, b) => {
        if (a.prayer_done === b.prayer_done) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.prayer_done ? 1 : -1;
      });

      setData(merged);
      return;
    }

    if (tab === 'team') {
      let rows: any[] = [];
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('manage-team-auth', {
          body: { action: 'list_team' },
        });
        if (!fnError && Array.isArray(fnData?.rows)) {
          rows = fnData.rows;
        }
      } catch {
      }

      if (rows.length === 0) {
        const { data: teamData } = await supabase
          .from('team')
          .select('*')
          .order('created_at', { ascending: false });
        rows = teamData || [];
      }
      setTeamRows(rows);
      setData(rows);
      return;
    }

    let tableName = getTableName(tab);
    if (tab === 'dashboard') tableName = 'registrations';

    let query = supabase.from(tableName).select('*');

    if (tab === 'dashboard' || tab === 'registrations') {
      query = query.order('prayer_done', { ascending: true }).order('created_at', { ascending: false });
    } else if (tab === 'banners') {
      query = query.order('order', { ascending: true });
    } else if (tab === 'lives') {
      query = query.order('date', { ascending: false });
    } else if (tab === 'events') {
      query = query.order('date', { ascending: true });
    } else if (tab === 'volunteers') {
      query = query.order('created_at', { ascending: false });
    }

    const { data: result } = await query;
    setData(result || []);
  };

  const openTeamTab = () => {
    setSearchTerm('');
    setIsAdding(false);
    setEditingId(null);
    setActiveTab('team');
    setIsSidebarOpen(false);
    loadTabData('team');
  };

  useEffect(() => {
    if (!hasAccess || !canViewTab(activeTab)) return;

    let isMounted = true;
    setIsTabLoading(true);
    loadTabData(activeTab).finally(() => {
      if (isMounted) setIsTabLoading(false);
    });

    if (activeTab === 'prayers') {
      const channelReg = supabase
        .channel('prayers-reg')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => loadTabData(activeTab))
        .subscribe();
      
      const channelDed = supabase
        .channel('prayers-ded')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_requests' }, () => loadTabData(activeTab))
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channelReg);
        supabase.removeChannel(channelDed);
      };
    } else {
      const tableName = activeTab === 'settings'
        ? 'settings'
        : (activeTab === 'dashboard' || activeTab === 'crm_pipeline' ? 'registrations' : getTableName(activeTab));
      const channel = supabase
        .channel(`admin-${activeTab}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
          loadTabData(activeTab);
        })
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeTab, hasAccess, isMainAdmin]);

  const validateDeletePermission = async () => {
    if (!canDeleteTab(activeTab)) return false;
    if (isMainAdmin) return true;
    if (!user?.email) return false;
    if (!deletePassword) {
      setDeleteError('Digite sua senha para confirmar a exclusão.');
      return false;
    }

    setDeleteError('');
    setIsVerifyingDelete(true);
    let isValid = false;
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePassword,
    });
    isValid = !error;
    setIsVerifyingDelete(false);

    if (!isValid) {
      setDeleteError('Senha inválida para exclusão.');
      return false;
    }

    setDeletePassword('');
    setDeleteError('');
    return true;
  };

  const resetTeamForm = () => {
    setMemberPassword('');
  };

  const logDeletionAudit = async (tableName: string, targetId: string | null, totalItems: number) => {
    try {
      await supabase.from('deletion_audit_logs').insert([{
        actor_email: user?.email || 'desconhecido',
        source_table: tableName,
        target_id: targetId,
        total_items: totalItems,
        created_at: new Date().toISOString(),
      }]);
    } catch {
    }
  };

  const syncTeamUserWithAuth = async (emailToSync: string, basePasswordToSync: string) => {
    const { error } = await supabase.functions.invoke('manage-team-auth', {
      body: {
        email: emailToSync,
        password: basePasswordToSync,
      },
    });
    if (error) {
      let detailedError = error.message || 'Falha ao criar usuário de login no Auth.';
      const maybeContext = (error as any).context;
      if (maybeContext && typeof maybeContext.json === 'function') {
        const parsed = await maybeContext.json().catch(() => null);
        if (parsed?.error) detailedError = parsed.error;
        if (parsed?.message) detailedError = parsed.message;
      }
      throw new Error(detailedError);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError('E-mail ou senha inválidos.');
      setIsLoggingIn(false);
      return;
    }

    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const finalSettings = { ...settings };
      for (const [key, file] of Object.entries(filesToUpload) as [string, File][]) {
        if (file) {
          const path = `settings/${key}_${Date.now()}_${file.name}`;
          finalSettings[key] = await uploadFile(file, 'uploads', path);
        }
      }
      await supabase.from('settings').update(finalSettings).eq('id', 1);
      setSettings(finalSettings);
      setFilesToUpload({});
      alert('Configurações salvas!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, isSetting = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (isSetting) {
      setSettings({ ...settings, [field]: previewUrl });
    } else {
      setNewItem({ ...newItem, [field]: previewUrl });
    }
    setFilesToUpload({ ...filesToUpload, [field]: file });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditTab(activeTab)) return;
    setIsUploading(true);
    try {
      const tableName = getTableName(activeTab);
      const payload: any = { ...newItem };
      let shouldSyncAuth = false;
      let authSyncEmail = '';
      let authSyncPassword = '';
      delete payload.id;
      delete payload.created_at;

      for (const [key, file] of Object.entries(filesToUpload) as [string, File][]) {
        if (file) {
          const path = `${tableName}/${key}_${Date.now()}_${file.name}`;
          payload[key] = await uploadFile(file, 'uploads', path);
        }
      }

      if (activeTab === 'banners' && payload.active === undefined) payload.active = true;
      if (activeTab === 'lives' && payload.is_main === undefined) payload.is_main = false;
      if (activeTab === 'team') {
        payload.role = 'admin_geral';
        const originalItem = editingId ? data.find((d) => d.id === editingId) : null;
        const emailChanged = Boolean(editingId && originalItem?.email !== payload.email);
        shouldSyncAuth = !editingId || Boolean(memberPassword) || emailChanged;
        
        if (shouldSyncAuth) {
          if (!memberPassword) {
            alert('Ao criar usuário novo ou alterar o e-mail, informe a senha de acesso.');
            setIsUploading(false);
            return;
          }
          authSyncEmail = payload.email;
          authSyncPassword = memberPassword;
        }
      }

      if (editingId) {
        const { error } = await supabase.from(tableName).update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName).insert([payload]);
        if (error) throw error;
      }

      if (activeTab === 'team' && shouldSyncAuth && authSyncEmail && authSyncPassword) {
        try {
          await syncTeamUserWithAuth(authSyncEmail, authSyncPassword);
        } catch (syncError) {
          alert(`Equipe salva, mas o login automático não foi sincronizado: ${(syncError as Error).message}`);
        }
      }

      setIsAdding(false);
      setEditingId(null);
      setNewItem({});
      setFilesToUpload({});
      setSearchTerm('');
      resetTeamForm();
      await loadTabData(activeTab);
    } catch (err) {
      console.error('Error saving item:', err);
      alert(`Não foi possível salvar: ${(err as Error).message || 'erro desconhecido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    if (!(await validateDeletePermission())) return;
    
    let tableName = getTableName(activeTab);
    
    // Check if it's a prayer request from the dedicated table
    if (activeTab === 'prayers') {
      const item = data.find(d => d.id === itemToDelete);
      if (item && item._source) {
        tableName = item._source;
      }
    }

    try {
      const { data: deletedRows, error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemToDelete)
        .select('id');

      if (deleteError) throw deleteError;
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('Nenhum registro foi removido. Verifique permissões de exclusão no Supabase.');
      }

      await logDeletionAudit(tableName, itemToDelete, deletedRows.length);
      await loadTabData(activeTab);
      setItemToDelete(null);
      setDeletePassword('');
      setDeleteError('');
    } catch (err: any) {
      setDeleteError(err?.message || 'Não foi possível deletar este item.');
    }
  };


  const handleCancelAdd = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewItem({});
    setFilesToUpload({});
    resetTeamForm();
  };

  const handleEdit = (item: any) => {
    if (!canEditTab(activeTab)) return;
    setEditingId(item.id);
    setNewItem({ ...item });
    setFilesToUpload({});
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
    if (!canEditTab('banners')) return;
    await supabase.from('banners').update({ active: !currentStatus }).eq('id', id);
  };

  const togglePrayerStatus = async (id: string, currentStatus: boolean, source: string = 'registrations') => {
    if (!canEditTab(activeTab)) return;
    await supabase.from(source).update({ prayer_done: !currentStatus }).eq('id', id);
    await loadTabData(activeTab);
  };

  const toggleBibleDeliveredStatus = async (id: string) => {
    if (!canEditTab('registrations')) return;
    await supabase.from('registrations').update({ has_bible: true }).eq('id', id);
    await loadTabData(activeTab);
  };

  const exportToCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).filter((k) => k !== 'created_at');
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          let val = row[header];
          if (typeof val === 'string') val = val.replace(/"/g, '""');
          return `"${val || ''}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${activeTab}_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR }); } catch { return ''; }
  };

  const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    novo:              { label: 'Novo',              color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    dot: 'bg-blue-400' },
    contatado:         { label: 'Contatado',         color: 'bg-urban-yellow/10 text-urban-yellow border-urban-yellow/20', dot: 'bg-urban-yellow' },
    acompanhamento:    { label: 'Em Acompanhamento', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400' },
    sem_biblia:        { label: 'Sem Bíblia',        color: 'bg-amber-400/10 text-amber-300 border-amber-400/20', dot: 'bg-amber-300' },
    concluido:         { label: 'Concluído',         color: 'bg-urban-yellow/10 text-urban-yellow border-urban-yellow/30 shadow-[0_0_12px_rgba(206,189,103,0.25)]',  dot: 'bg-urban-yellow' },
  };

  const getStatus = (item: any) => item.status || 'novo';
  const hasNoBible = (item: any) =>
    item?.has_bible === false ||
    item?.has_bible === 'false' ||
    item?.has_bible === 0 ||
    item?.has_bible === '0';
  const getPipelineStage = (item: any) => {
    const currentStage = getStatus(item);
    if (hasNoBible(item) && currentStage !== 'concluido') return 'sem_biblia';
    return currentStage;
  };

  const parseAdminNotes = (notes: string | null | undefined) => {
    const text = notes || '';
    const match = text.match(/^RESPONSAVEL:\s*(.+)$/im);
    const owner = match ? match[1].trim() : '';
    const cleaned = text
      .replace(/^RESPONSAVEL:\s*.+$/im, '')
      .replace(/^\s+/, '')
      .trim();
    return { owner, notes: cleaned };
  };

  const buildAdminNotes = (owner: string, notes: string) => {
    const ownerLine = owner.trim() ? `RESPONSAVEL: ${owner.trim()}` : '';
    const notesPart = notes.trim();
    if (ownerLine && notesPart) return `${ownerLine}\n\n${notesPart}`;
    if (ownerLine) return ownerLine;
    return notesPart;
  };

  const moveCadastroToStage = async (id: string, nextStatus: string) => {
    if (!canEditTab('registrations')) return;
    const { data: updated, error } = await supabase
      .from('registrations')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('id,status');
    if (!error && updated && updated.length > 0) {
      setData(prev => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));
    }
  };

  const handlePipelineDrop = async (targetStage: string) => {
    if (!draggedCardId) return;
    await moveCadastroToStage(draggedCardId, targetStage);
    setDraggedCardId(null);
    setDragOverStage(null);
  };

  const updateRegistrationStatus = async () => {
    if (!selectedRegistration) return;
    setIsSavingStatus(true);
    setSaveStatusMsg('idle');
    const table = activeTab === 'volunteers' ? 'volunteers' : 'registrations';
    console.log('[CRM] Salvando status:', editingStatus, 'notas:', editingNotes, 'id:', selectedRegistration.id, 'tabela:', table);
    const { data: updated, error } = await supabase
      .from(table)
      .update({ status: editingStatus, admin_notes: buildAdminNotes(editingOwner, editingNotes) })
      .eq('id', selectedRegistration.id)
      .select();
    console.log('[CRM] Resultado:', { updated, error, rowsAffected: updated?.length });

    const zeroRows = !error && (!updated || updated.length === 0);
    if (!error && !zeroRows) {
      setSaveStatusMsg('ok');
      const nextAdminNotes = buildAdminNotes(editingOwner, editingNotes);
      setData(prev => prev.map(r => r.id === selectedRegistration.id ? { ...r, status: editingStatus, admin_notes: nextAdminNotes } : r));
      setSelectedRegistration((prev: any) => ({ ...prev, status: editingStatus, admin_notes: nextAdminNotes }));
      // força reload para garantir que o estado local reflita o banco
      setTimeout(() => { loadTabData(activeTab); setSaveStatusMsg('idle'); }, 800);
    } else {
      setSaveStatusMsg('err');
      const msg = zeroRows ? 'UPDATE retornou 0 linhas — verifique a política RLS no Supabase' : (error?.message || '');
      console.error('[CRM] ERRO AO SALVAR:', msg, error?.code, error?.hint);
      setTimeout(() => setSaveStatusMsg('idle'), 4000);
    }
    setIsSavingStatus(false);
  };

  if (loading || isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-urban-black">
        <Loader2 className="animate-spin h-12 w-12 text-urban-yellow" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-urban-black p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="street-card p-10 rounded-3xl max-w-md w-full text-center border-t-8 border-t-urban-yellow"
        >
          <div className="w-20 h-20 bg-urban-yellow/10 rounded-2xl flex items-center justify-center mx-auto text-urban-yellow mb-8">
            <LogIn size={40} />
          </div>
          <h2 className="font-display text-4xl text-white mb-2">ACESSO ADMIN</h2>
          <p className="font-urban text-gray-400 mb-8">Entre com seu e-mail e senha cadastrados.</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-gray-500 text-xs font-bold uppercase mb-2">E-mail</label>
              <input 
                type="email" 
                className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {loginError && (
              <p className="text-red-500 text-sm font-bold text-center mt-2">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 transition-all street-border mt-4 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <Loader2 size={24} className="animate-spin" /> : 'ENTRAR NO PAINEL'}
            </button>
          </form>
          
          {user && !hasAccess && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-red-400 text-sm mb-4">A conta {user.email} não tem permissão de acesso.</p>
              <button 
                onClick={handleLogout}
                className="text-white hover:text-urban-yellow font-bold text-sm underline"
              >
                Sair desta conta
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const totalCadastros = data.length;
  const aceitaramJesus = data.filter((d) => d.accepted_jesus === true).length;
  const frequentamIgreja = data.filter((d) => d.attends_church === true).length;
  const naoFrequentamIgreja = data.filter((d) => d.attends_church === false).length;
  const temBiblia = data.filter((d) => d.has_bible === true).length;
  const naoTemBiblia = data.filter((d) => hasNoBible(d)).length;
  const aindaConhecendo = data.filter((d) => d.accepted_jesus === false && d.attends_church === false).length;
  const jaCaminha = data.filter((d) => d.accepted_jesus === false && d.attends_church !== false).length;

  const dataJesus = [
    { name: `Aceitaram (${aceitaramJesus})`, value: aceitaramJesus, color: '#FFE81F' },
    { name: `Conhecendo (${aindaConhecendo})`, value: aindaConhecendo, color: '#00FF66' },
    { name: `Já Cristão/Outros (${jaCaminha})`, value: jaCaminha, color: '#333333' }
  ];

  const dataIgreja = [
    { name: `Frequenta (${frequentamIgreja})`, value: frequentamIgreja, color: '#00D1FF' },
    { name: `Não Frequenta (${naoFrequentamIgreja})`, value: naoFrequentamIgreja, color: '#333333' }
  ];

  const dataBiblia = [
    { name: `Não Tem (${naoTemBiblia})`, value: naoTemBiblia, color: '#A855F7' },
    { name: `Tem Bíblia (${temBiblia})`, value: temBiblia, color: '#333333' }
  ];
  const sourceRows = activeTab === 'team' ? teamRows : data;
  const visibleData = (sourceRows || [])
    .filter((item) => {
      if (activeTab === 'registrations') {
        if (filterRegistrations === 'acceptedJesus') return item.accepted_jesus === true;
        if (filterRegistrations === 'knowing') return item.accepted_jesus === false && item.attends_church === false;
        if (filterRegistrations === 'wantsUpdates') return item.wants_updates === true;
        if (filterRegistrations === 'noBible') return hasNoBible(item);
      }
      return true;
    })
    .filter((item) => {
      if (!normalizedSearchTerm) return true;
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(normalizedSearchTerm)
      );
    })
    .sort((a, b) => {
      const order: Record<string, number> = { novo: 0, contatado: 1, acompanhamento: 2, sem_biblia: 3, concluido: 4 };
      return (order[a.status || 'novo'] ?? 0) - (order[b.status || 'novo'] ?? 0);
    });

  return (
    <div className="min-h-screen bg-urban-black flex">
      <aside className={cn(
        'bg-urban-gray border-r border-white/10 flex flex-col fixed top-0 left-0 h-screen z-50 transition-transform duration-300',
        isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64 md:translate-x-0 md:w-64'
      )}>
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <h1 className="font-display text-2xl text-white">PAINEL <span className="text-urban-yellow">ADMIN</span></h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-4 flex-grow overflow-y-auto">
          {canViewTab('dashboard') && <SidebarButton active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} icon={<LayoutDashboard size={20} />} label="Visão Geral" />}
          {canViewTab('registrations') && <SidebarButton active={activeTab === 'registrations'} onClick={() => { setActiveTab('registrations'); setFilterRegistrations('all'); setIsSidebarOpen(false); }} icon={<Users size={20} />} label="Cadastros" />}
          {canViewTab('crm_pipeline') && <SidebarButton active={activeTab === 'crm_pipeline'} onClick={() => { setActiveTab('crm_pipeline'); setIsSidebarOpen(false); }} icon={<Box size={20} />} label="Pipeline CRM" />}
          {/* {canViewTab('banners') && <SidebarButton active={activeTab === 'banners'} onClick={() => { setActiveTab('banners'); setIsSidebarOpen(false); }} icon={<ImageIcon size={20} />} label="Banners" />} */}
          {/* canViewTab('lives') && <SidebarButton active={activeTab === 'lives'} onClick={() => { setActiveTab('lives'); setIsSidebarOpen(false); }} icon={<Radio size={20} />} label="Lives" /> */}
          {/* canViewTab('events') && <SidebarButton active={activeTab === 'events'} onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }} icon={<Calendar size={20} />} label="Eventos" /> */}
          {canViewTab('prayers') && <SidebarButton active={activeTab === 'prayers'} onClick={() => { setActiveTab('prayers'); setIsSidebarOpen(false); }} icon={<Heart size={20} />} label="Orações" />}
          {/* {canViewTab('team') && <SidebarButton active={activeTab === 'team'} onClick={openTeamTab} icon={<Users size={20} />} label="Equipe" />} */}
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-2 mb-2">
            <p className="text-gray-500 text-[10px] font-bold uppercase">Logado como</p>
            <p className="text-white text-xs truncate font-bold">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors">
            <LogOut size={20} /> Sair do Painel
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 w-full bg-urban-gray border-b border-white/10 p-4 z-40 flex items-center justify-between">
        <h1 className="font-display text-xl text-white">PAINEL <span className="text-urban-yellow">ADMIN</span></h1>
        <button onClick={() => setIsSidebarOpen(true)} className="text-white"><MenuIcon size={24} /></button>
      </div>

      <div className="flex-1 md:ml-64 pt-20 md:pt-8 p-4 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">

          {activeTab === 'dashboard' && canViewTab('dashboard') && (
            isTabLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="animate-spin h-12 w-12 text-urban-yellow" />
              </div>
            ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className="street-card cursor-pointer p-6 rounded-2xl border-l-4 border-urban-yellow hover:scale-[1.05] hover:bg-urban-yellow/5 transition-all shadow-[0_0_15px_rgba(255,232,31,0.1)]"
                  onClick={() => { setActiveTab('registrations'); setFilterRegistrations('all'); }}
                >
                  <h3 className="text-gray-400 font-urban text-sm uppercase font-bold text-urban-yellow">Total de Cadastros</h3>
                  <p className="text-5xl text-white font-display mt-2">{totalCadastros}</p>
                </div>
                <div
                  className="street-card cursor-pointer p-6 rounded-2xl border-l-4 border-[#00FF66] hover:scale-[1.05] hover:bg-[#00FF66]/5 transition-all shadow-[0_0_15px_rgba(0,255,102,0.1)]"
                  onClick={() => { setActiveTab('registrations'); setFilterRegistrations('acceptedJesus'); }}
                >
                  <h3 className="text-[#00FF66] font-urban text-sm uppercase font-bold">Aceitaram a Jesus</h3>
                  <p className="text-5xl text-white font-display mt-2">{aceitaramJesus}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Gráfico 1: Decisão */}
                <div className="street-card cursor-pointer p-6 rounded-2xl hover:scale-[1.02] hover:bg-urban-yellow/5 transition-all" onClick={() => { setActiveTab('registrations'); setFilterRegistrations('acceptedJesus'); }}>
                  <h3 className="text-white font-display text-lg mb-6 text-center tracking-widest uppercase opacity-70">Decisão por Cristo</h3>
                  <div className="h-56 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dataJesus} innerRadius={65} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={40}>
                          {dataJesus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: entry.value > 0 ? `drop-shadow(0px 0px 6px ${entry.color}88)` : 'none' }} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'transparent' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico 2: Igreja */}
                <div className="street-card cursor-pointer p-6 rounded-2xl hover:scale-[1.02] hover:bg-blue-500/5 transition-all" onClick={() => { setActiveTab('registrations'); setFilterRegistrations('attendsChurch'); }}>
                  <h3 className="text-white font-display text-lg mb-6 text-center tracking-widest uppercase opacity-70">Frequência Igreja</h3>
                  <div className="h-56 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dataIgreja} innerRadius={65} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={40}>
                          {dataIgreja.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: entry.value > 0 ? `drop-shadow(0px 0px 6px ${entry.color}88)` : 'none' }} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'transparent' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico 3: Bíblia */}
                <div className="street-card cursor-pointer p-6 rounded-2xl hover:scale-[1.02] hover:bg-purple-500/5 transition-all" onClick={() => { setActiveTab('registrations'); setFilterRegistrations('hasBible'); }}>
                  <h3 className="text-white font-display text-lg mb-6 text-center tracking-widest uppercase opacity-70">Tem Bíblia?</h3>
                  <div className="h-56 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dataBiblia} innerRadius={65} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={40}>
                          {dataBiblia.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: entry.value > 0 ? `drop-shadow(0px 0px 6px ${entry.color}88)` : 'none' }} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'transparent' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            )
          )}

          {activeTab === 'crm_pipeline' ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="rounded-3xl bg-urban-gray/80 border border-white/10 p-6 md:p-8 flex flex-col gap-4 shadow-[0_0_15px_rgba(255,232,31,0.08)]">
                <div>
                  <h3 className="text-white font-display text-3xl uppercase tracking-wide mb-2">Pipeline CRM</h3>
                  <p className="text-gray-400 font-urban">Visual em formato Trello com os dados reais de Cadastros.</p>
                </div>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar nome, WhatsApp, cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-urban-gray border border-white/10 rounded-xl text-white focus:border-urban-yellow/60 outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto md:overflow-x-visible scrollbar-hidden pb-2">
                <div className="grid grid-flow-col auto-cols-[88vw] gap-4 md:grid-flow-row md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:auto-cols-auto">
                  {(['novo', 'contatado', 'acompanhamento', 'sem_biblia', 'concluido'] as const).map((stageKey) => {
                    const cards = (data || [])
                      .filter((item: any) => getPipelineStage(item) === stageKey)
                      .filter((item: any) => {
                        if (!normalizedSearchTerm) return true;
                        return [item.name, item.whatsapp, item.city, item.neighborhood, item.email]
                          .some((val) => String(val || '').toLowerCase().includes(normalizedSearchTerm));
                      });
                    const stageCfg = STATUS_CONFIG[stageKey];
                    return (
                      <div
                        key={stageKey}
                        onDragOver={(e) => { e.preventDefault(); setDragOverStage(stageKey); }}
                        onDragLeave={() => setDragOverStage((prev) => (prev === stageKey ? null : prev))}
                        onDrop={() => handlePipelineDrop(stageKey)}
                        className={cn(
                          "rounded-3xl p-4 bg-urban-gray/75 backdrop-blur-sm transition-all shadow-[0_0_15px_rgba(255,232,31,0.05)]",
                          dragOverStage === stageKey ? "ring-1 ring-urban-yellow/60 bg-urban-yellow/[0.06] shadow-[0_0_15px_rgba(255,232,31,0.18)]" : "ring-1 ring-white/6"
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-display text-xl text-white tracking-wide uppercase">{stageCfg.label}</h4>
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border', stageCfg.color)}>{cards.length}</span>
                        </div>
                        <div className="space-y-3 max-h-[65vh] overflow-y-auto scrollbar-hidden pr-1">
                          {cards.map((item: any) => {
                            const parsed = parseAdminNotes(item.admin_notes);
                            return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => setDraggedCardId(item.id)}
                              onDragEnd={() => { setDraggedCardId(null); setDragOverStage(null); }}
                              onClick={() => {
                                setSelectedRegistration(item);
                                setEditingStatus(item.status || 'novo');
                                setEditingOwner(parsed.owner);
                                setEditingNotes(parsed.notes);
                              }}
                              className={cn(
                                "bg-urban-gray rounded-2xl p-4 space-y-3 transition-all cursor-grab active:cursor-grabbing ring-1 ring-white/10 hover:ring-white/20 hover:shadow-[0_0_15px_rgba(255,232,31,0.1)]",
                                draggedCardId === item.id ? "opacity-60 scale-[0.99]" : "opacity-100"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2">
                                  <GripVertical size={15} className="text-gray-500 mt-1 shrink-0" />
                                  <h5 className="font-urban font-bold text-white leading-snug break-words">{item.name || 'Sem nome'}</h5>
                                </div>
                                {item.accepted_jesus && <span className="text-[10px] shrink-0 px-2 py-0.5 bg-[#00FF66]/10 text-[#00FF66] rounded-full uppercase font-bold border border-[#00FF66]/20">Aceitou Jesus</span>}
                              </div>
                              <div className="text-xs text-gray-300 space-y-1 leading-relaxed">
                                <p>{item.whatsapp || 'Sem WhatsApp'}</p>
                                {item.city && <p>{item.city}{item.neighborhood ? ` • ${item.neighborhood}` : ''}</p>}
                                <p className="text-gray-500">{item.created_at ? formatDate(item.created_at) : ''}</p>
                                {parsed.owner && (
                                  <p className="text-urban-yellow/90">Acompanhando: {parsed.owner}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex flex-wrap gap-1.5">
                                  {hasNoBible(item) && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/12 text-amber-300 uppercase font-bold border border-amber-300/20">Sem Bíblia</span>}
                                  {item.wants_updates && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/12 text-purple-300 uppercase font-bold">Atualizações</span>}
                                </div>
                                <select
                                  value={item.status || 'novo'}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => moveCadastroToStage(item.id, e.target.value)}
                                  className="bg-urban-gray border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-urban-yellow/60 outline-none"
                                >
                                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )})}
                          {cards.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-white/15 bg-urban-gray/60 rounded-xl">
                              Nenhum cadastro nesta etapa.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'settings' && canViewTab('settings') ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSaveSettings}
              className="street-card p-10 rounded-3xl space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input label="Nome do Site" value={settings.site_name} onChange={(v) => setSettings({ ...settings, site_name: v })} />
                <div>
                  <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Logo do Site (Upload)</label>
                  <div className="flex items-center gap-4">
                    {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="w-12 h-12 object-contain bg-white/5 rounded-lg" />}
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo_url', true)} className="flex-grow bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none" />
                  </div>
                </div>
                <Input label="Google Fonts URL" value={settings.google_fonts_url} onChange={(v) => setSettings({ ...settings, google_fonts_url: v })} placeholder="https://fonts.googleapis.com/css2?family=..." />
                <Input label="Nome da Fonte (CSS)" value={settings.font_family} onChange={(v) => setSettings({ ...settings, font_family: v })} placeholder="Bebas Neue" />
                <Input label="Instagram URL" value={settings.instagram_url} onChange={(v) => setSettings({ ...settings, instagram_url: v })} />
                <Input label="YouTube URL" value={settings.youtube_url} onChange={(v) => setSettings({ ...settings, youtube_url: v })} />
                <div className="md:col-span-2">
                  <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Imagem da Página de Doação (Upload)</label>
                  <div className="flex items-center gap-4">
                    {settings.donation_image_url && <img src={settings.donation_image_url} alt="Donation" className="w-20 h-12 object-cover rounded-lg" />}
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'donation_image_url', true)} className="flex-grow bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isUploading} className="w-full py-5 bg-urban-yellow text-urban-black font-bold text-xl rounded-xl hover:bg-yellow-500 transition-all street-border flex items-center justify-center">
                {isUploading ? <Loader2 size={24} className="animate-spin" /> : 'SALVAR CONFIGURAÇÕES GERAIS'}
              </button>
            </motion.form>
          ) : activeTab !== 'dashboard' ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-display text-2xl uppercase tracking-widest">
                  Aba atual: {activeTab}
                </h3>
                <span className="text-gray-400 text-sm font-bold">
                  {sourceRows.length} registro(s)
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-urban-gray border border-white/10 rounded-xl text-white focus:border-urban-yellow outline-none"
                  />
                </div>
                {activeTab !== 'registrations' && activeTab !== 'prayers' && activeTab !== 'volunteers' && canEditTab(activeTab) && (
                  <button
                    onClick={isAdding ? handleCancelAdd : () => {
                      if (activeTab === 'team') resetTeamForm();
                      setIsAdding(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 transition-colors street-border"
                    disabled={isUploading}
                  >
                    {isAdding ? <X size={20} /> : <Plus size={20} />} {isAdding ? 'CANCELAR' : 'ADICIONAR NOVO'}
                  </button>
                )}
                {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers') && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">

                    <button
                      onClick={exportToCSV}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors street-border"
                    >
                      <Download size={20} /> EXPORTAR CSV
                    </button>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {isAdding && canEditTab(activeTab) && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddItem}
                    className="street-card p-8 rounded-2xl border-2 border-urban-yellow space-y-6 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* activeTab === 'banners' && (
                        <>
                          <Input label="Titulo" value={newItem.title} onChange={(v) => setNewItem({ ...newItem, title: v })} />
                          <Input label="Subtitulo" value={newItem.subtitle} onChange={(v) => setNewItem({ ...newItem, subtitle: v })} />
                          <div className="md:col-span-2">
                            <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Imagem do Banner (Upload)</label>
                            <div className="flex items-center gap-4">
                              {newItem.image_url && <img src={newItem.image_url} alt="Banner" className="w-20 h-12 object-cover rounded-lg" />}
                              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'image_url')} className="flex-grow bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none" />
                            </div>
                          </div>
                          <Input label="Ordem (Número)" type="number" value={newItem.order} onChange={(v) => setNewItem({ ...newItem, order: parseInt(v) })} />
                        </>
                      ) */}
                      {/* activeTab === 'lives' && (
                        <>
                          <Input label="Título da Live" value={newItem.title} onChange={(v) => setNewItem({ ...newItem, title: v })} />
                          <Input label="YouTube ID (ex: dQw4w9WgXcQ)" value={newItem.youtube_id} onChange={(v) => setNewItem({ ...newItem, youtube_id: v })} />
                          <Input label="Data e Hora" type="datetime-local" value={newItem.date} onChange={(v) => setNewItem({ ...newItem, date: v })} />
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={newItem.is_main} onChange={(e) => setNewItem({ ...newItem, is_main: e.target.checked })} />
                            <label className="text-white font-urban">Transmissão Principal</label>
                          </div>
                        </>
                      ) */}
                      {/* activeTab === 'events' && (
                        <>
                          <Input label="Título do Evento" value={newItem.title} onChange={(v) => setNewItem({ ...newItem, title: v })} />
                          <Input label="Local" value={newItem.location} onChange={(v) => setNewItem({ ...newItem, location: v })} />
                          <Input label="Data e Hora" type="datetime-local" value={newItem.date} onChange={(v) => setNewItem({ ...newItem, date: v })} />
                          <textarea
                            placeholder="Descrição"
                            className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none md:col-span-2"
                            value={newItem.description || ''}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          />
                        </>
                      ) */}
                      {activeTab === 'team' && (
                        <>
                          <Input label="Nome" value={newItem.name} onChange={(v) => setNewItem({ ...newItem, name: v })} />
                          <div className="md:col-span-2">
                            <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Foto (Upload)</label>
                            <div className="flex items-center gap-4">
                              {newItem.photo_url && <img src={newItem.photo_url} alt="Team" className="w-12 h-12 object-cover rounded-full" />}
                              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo_url')} className="flex-grow bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none" />
                            </div>
                          </div>
                          <Input label="Email" value={newItem.email} onChange={(v) => setNewItem({ ...newItem, email: v })} />
                          <div className="md:col-span-2">
                            <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Senha do Painel</label>
                            <input
                              type="password"
                              value={memberPassword}
                              onChange={(e) => setMemberPassword(e.target.value)}
                              className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none"
                              placeholder={editingId ? 'Manter atual se vazio' : 'Obrigatória para novo acesso'}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <button type="submit" disabled={isUploading} className="w-full flex items-center justify-center gap-2 py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 street-border">
                      {isUploading ? <Loader2 size={24} className="animate-spin" /> : (editingId ? 'SALVAR ALTERAÇÕES' : 'SALVAR ITEM')}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 gap-4">
                {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers') && (
                  <div className="flex flex-wrap gap-3 mb-2">
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('all'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all', (filterRegistrations === 'all' && activeTab === 'registrations') ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10')}
                    >
                      Todos os Cadastros
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('acceptedJesus'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'acceptedJesus' && activeTab === 'registrations') ? 'bg-[#00FF66] text-black shadow-[0_0_15px_rgba(0,255,102,0.4)]' : 'bg-white/5 border border-white/10 text-[#00FF66] opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <Heart size={16} /> Aceitaram a Jesus
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('knowing'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'knowing' && activeTab === 'registrations') ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-white/5 border border-white/10 text-cyan-400 opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <UserPlus size={16} /> Estão Conhecendo
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('wantsUpdates'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'wantsUpdates' && activeTab === 'registrations') ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 border border-white/10 text-purple-400 opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <Bell size={16} /> Querem Atualizações
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('noBible'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'noBible' && activeTab === 'registrations') ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'bg-white/5 border border-white/10 text-amber-300 opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <BookOpen size={16} /> Sem Bíblia
                    </button>
                    <button
                      onClick={() => setActiveTab(canViewTab('prayers') ? 'prayers' : 'registrations')}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', activeTab === 'prayers' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-white/5 border border-white/10 text-blue-400 hover:text-blue-300 hover:bg-white/10')}
                    >
                      <Heart size={16} /> Pedidos de Oração
                    </button>
                    <button
                      onClick={() => setActiveTab('volunteers')}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', activeTab === 'volunteers' ? 'bg-urban-yellow text-urban-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'bg-white/5 border border-white/10 text-urban-yellow hover:text-urban-yellow hover:bg-white/10')}
                    >
                      <HeartHandshake size={16} /> Voluntários
                    </button>
                  </div>
                )}

                {isTabLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="animate-spin h-10 w-10 text-urban-yellow" />
                    <p className="text-gray-500 font-urban text-sm animate-pulse tracking-widest uppercase">Carregando dados...</p>
                  </div>
                ) : (
                  <>
                    {(sourceRows || []).length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        {activeTab === 'team' ? 'Nenhum membro encontrado na equipe.' : 'Nenhum dado encontrado aqui.'}
                      </div>
                    )}
                    {(sourceRows || []).length > 0 && visibleData.length === 0 && (
                      <div className="text-center py-3 text-gray-500">
                        Nenhum item está passando no filtro de busca. <button onClick={() => setSearchTerm('')} className="text-urban-yellow font-bold">Limpar busca</button>
                      </div>
                    )}

                    {visibleData.map((item) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={item.id}
                          className="street-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                        >
                      <div className="flex items-center gap-4">
                        {/* activeTab === 'banners' && <img src={item.image_url} className="w-20 h-12 object-cover rounded-lg" /> */}
                        {activeTab === 'team' && <img src={item.photo_url} className="w-12 h-12 object-cover rounded-full" />}
                        {/* activeTab === 'lives' && <div className="w-12 h-12 bg-urban-yellow/10 rounded-xl flex items-center justify-center text-urban-yellow"><Radio size={24} /></div> */}
                        {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers') && (
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl relative shrink-0",
                            item.accepted_jesus ? "bg-[#00FF66]/20 text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.2)]" : "bg-urban-yellow/10 text-urban-yellow",
                            activeTab === 'prayers' && item.prayer_done && "opacity-30"
                          )}>
                            {item.name ? item.name[0].toUpperCase() : '?'}
                            {item.prayer_request && (
                              <div className={cn(
                                "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-urban-gray flex items-center justify-center",
                                activeTab === 'prayers' && item.prayer_done ? "bg-green-500" : "bg-blue-500"
                              )}>
                                {activeTab === 'prayers' && item.prayer_done ? <Check size={8} className="text-white" /> : <Heart size={8} className="text-white" fill="currentColor" />}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={cn("flex-grow min-w-0", (activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers') ? "overflow-visible" : "overflow-hidden")}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn("font-urban font-bold text-white text-lg min-w-0 max-w-full", (activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers') ? "whitespace-normal break-words leading-snug" : "truncate", activeTab === 'prayers' && item.prayer_done && "text-gray-500 line-through")}>{item.title || item.name || 'Sem Título'}</h4>
                            {item.accepted_jesus && (
                              <span className="shrink-0 px-2 py-0.5 bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-bold rounded uppercase tracking-wider">Aceitou Jesus</span>
                            )}
                            {activeTab === 'registrations' && item.accepted_jesus === false && item.attends_church === false && (
                              <span className="shrink-0 px-3 py-1 bg-cyan-400/15 text-cyan-300 text-[11px] font-bold rounded-md uppercase tracking-wider border border-cyan-300/30 flex items-center gap-1.5">
                                <UserPlus size={12} /> Conhecendo Jesus
                              </span>
                            )}
                            {activeTab === 'registrations' && hasNoBible(item) && (
                              <span className="shrink-0 px-3 py-1 bg-amber-400/15 text-amber-300 text-[11px] font-bold rounded-md uppercase tracking-wider border border-amber-300/30 flex items-center gap-1.5">
                                <BookOpen size={12} /> Sem Bíblia
                              </span>
                            )}
                            {activeTab === 'prayers' && item.prayer_done && (
                              <span className="shrink-0 px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1"><Check size={10} /> Concluído</span>
                            )}
                            {/* Status badge CRM */}
                            {(activeTab === 'registrations' || activeTab === 'volunteers') && (() => {
                              const st = getStatus(item);
                              const cfg = STATUS_CONFIG[st];
                              return cfg ? (
                                <span className={cn('shrink-0 px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider flex items-center gap-1', cfg.color)}>
                                  <span className={cn('w-1.5 h-1.5 rounded-full inline-block', cfg.dot)} />
                                  {cfg.label}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <p className="text-gray-500 text-sm">
                            {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers') ? (
                              <span className={cn("flex flex-col gap-1", activeTab === 'prayers' && item.prayer_done && "opacity-50")}>
                                <span className="flex items-center gap-2 flex-wrap">
                                  {item.whatsapp}
                                  {item.prayer_request && activeTab === 'registrations' && <span className="text-blue-400 text-xs italic flex items-center gap-1 shrink-0">• <MessageCircle size={10} /> Tem pedido de oração</span>}
                                  {activeTab === 'volunteers' && item.city && <span className="text-gray-400 text-xs italic shrink-0">• {item.city} (Idade: {item.age || 'N/A'})</span>}
                                </span>
                                {activeTab === 'prayers' && item.prayer_request && (
                                  <span className="text-white font-urban bg-white/5 p-2 rounded-lg mt-1 border-l-2 border-blue-400 line-clamp-1">
                                    "{item.prayer_request}"
                                  </span>
                                )}
                                {activeTab === 'volunteers' && item.how_to_help && item.how_to_help.length > 0 && (
                                  <span className="text-urban-yellow font-urban bg-urban-yellow/5 p-2 rounded-lg mt-1 border-l-2 border-urban-yellow text-xs line-clamp-1">
                                    {item.how_to_help.join(', ')}
                                  </span>
                                )}
                              </span>
                            ) : (item.subtitle || item.location || item.youtube_id || (activeTab === 'team' ? "Administrador" : item.role) || item.prayer_request)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <p className="text-gray-500 text-xs uppercase font-urban">
                            {item.created_at ? formatDate(item.created_at) : ''}
                            {item.date && !item.created_at ? formatDate(item.date) : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* activeTab === 'banners' && canEditTab('banners') && (
                            <button
                              onClick={() => toggleBannerStatus(item.id, item.active)}
                              className={cn('p-2 rounded-lg transition-colors', item.active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500')}
                            >
                              {item.active ? <Check size={20} /> : <X size={20} />}
                            </button>
                          ) */}
                          {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers') && (
                            <div className="flex items-center gap-2">
                              {activeTab === 'prayers' && (
                                <button 
                                  onClick={() => togglePrayerStatus(item.id, item.prayer_done, item._source || (activeTab === 'prayers' ? 'prayer_requests' : 'registrations'))}
                                  className={cn(
                                    "p-2 rounded-lg transition-all",
                                    item.prayer_done 
                                      ? "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                                      : "bg-white/5 text-gray-400 hover:bg-green-500/20 hover:text-green-500 border border-white/5"
                                  )}
                                  title={item.prayer_done ? "Reabrir" : "Marcar como Feito"}
                                >
                                  <Check size={20} />
                                </button>
                              )}
                              {activeTab === 'registrations' && filterRegistrations === 'noBible' && hasNoBible(item) && (
                                <button
                                  onClick={() => toggleBibleDeliveredStatus(item.id)}
                                  className="p-2 rounded-lg transition-all bg-amber-400/15 text-amber-300 hover:bg-amber-400 hover:text-black border border-amber-300/30"
                                  title="Marcar Bíblia entregue"
                                >
                                  <Check size={20} />
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  const parsed = parseAdminNotes(item.admin_notes);
                                  setSelectedRegistration(item);
                                  setEditingStatus(item.status || 'novo');
                                  setEditingOwner(parsed.owner);
                                  setEditingNotes(parsed.notes);
                                }}
                                className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all border border-white/5"
                                title="Ver Detalhes Completos"
                              >
                                <Info size={20} />
                              </button>
                              <a 
                                href={`https://wa.me/55${item.whatsapp?.replace(/\D/g, '')}`} 
                                target="_blank" 
                                className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-lg hover:bg-[#25D366] hover:text-white transition-all shadow-[0_0_10px_rgba(37,211,102,0.1)]"
                                title="Abrir WhatsApp"
                              >
                                <MessageCircle size={20} />
                              </a>
                            </div>
                          )}
                            {activeTab !== 'registrations' && activeTab !== 'prayers' && activeTab !== 'volunteers' && canEditTab(activeTab) && (
                              <button onClick={() => handleEdit(item)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                                <Pencil size={20} />
                              </button>
                            )}
                            {canDeleteTab(activeTab) && (
                              <button onClick={() => { setDeleteError(''); setDeletePassword(''); setItemToDelete(item.id); }} className="p-2 bg-urban-yellow/10 text-urban-yellow rounded-lg hover:bg-urban-yellow hover:text-urban-black transition-all">
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </>
          ) : null}

          <AnimatePresence>
            {itemToDelete && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-urban-gray p-8 rounded-3xl max-w-sm w-full border border-white/10 text-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6"><AlertTriangle size={32} /></div>
                  <h3 className="font-display text-2xl text-white mb-2">Confirmar Exclusão</h3>
                  <p className="font-urban text-gray-400 mb-4">Essa ação não pode ser desfeita. Deseja deletar este item permanentemente?</p>
                  {!isMainAdmin && (
                    <div className="mb-4 text-left">
                      <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Senha para confirmar</label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none"
                        placeholder="Digite sua senha"
                      />
                    </div>
                  )}
                  {deleteError && <p className="text-red-500 text-sm font-bold mb-4">{deleteError}</p>}
                  <div className="flex gap-4">
                    <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 text-white bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors">Cancelar</button>
                    <button disabled={isVerifyingDelete} onClick={handleDelete} className="flex-1 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors disabled:opacity-50">
                      {isVerifyingDelete ? 'Validando...' : 'Sim, Deletar'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>


          <AnimatePresence>
            {selectedRegistration && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
                onClick={() => setSelectedRegistration(null)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }} 
                  animate={{ scale: 1, y: 0 }} 
                  exit={{ scale: 0.9, y: 20 }} 
                  className="bg-urban-gray rounded-3xl max-w-2xl w-full border border-white/10 overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-8 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-urban-black to-transparent">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          selectedRegistration.accepted_jesus ? "bg-[#00FF66]/10 text-[#00FF66]" : "bg-urban-yellow/10 text-urban-yellow"
                        )}>
                          CADASTRO #{selectedRegistration.id.slice(0, 8)}
                        </div>
                        {selectedRegistration.accepted_jesus && (
                          <div className="flex items-center gap-1 text-[#00FF66] font-bold text-[10px] uppercase tracking-widest">
                            <Heart size={12} fill="currentColor" /> ACEITOU JESUS
                          </div>
                        )}
                      </div>
                      <h2 className="font-display text-5xl text-white leading-none">{selectedRegistration.name}</h2>
                    </div>
                    <button 
                      onClick={() => setSelectedRegistration(null)}
                      className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

                    {/* === CRM: Status + Notas === */}
                    {(activeTab === 'registrations' || activeTab === 'volunteers' || activeTab === 'crm_pipeline') && (
                      <div className="space-y-4 p-5 bg-urban-black rounded-2xl border border-white/10">
                        <h4 className="text-white font-display text-lg tracking-widest uppercase">Acompanhamento</h4>
                        <div>
                          <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Status do contato</label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <button
                                key={key}
                                onClick={() => setEditingStatus(key)}
                                className={cn(
                                  'px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider transition-all flex items-center gap-1.5',
                                  editingStatus === key ? cfg.color + ' scale-105' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                                )}
                              >
                                <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Quem está acompanhando / falando com a pessoa</label>
                          <input
                            type="text"
                            value={editingOwner}
                            onChange={e => setEditingOwner(e.target.value)}
                            placeholder="Ex: Ana (WhatsApp) / João (Ligação)"
                            className="w-full bg-urban-gray border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none font-urban text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Nota interna da equipe</label>
                          <textarea
                            rows={3}
                            value={editingNotes}
                            onChange={e => setEditingNotes(e.target.value)}
                            placeholder="Ex: Falei com ela no WhatsApp, vai vir no próximo encontro..."
                            className="w-full bg-urban-gray border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none resize-none font-urban text-sm"
                          />
                        </div>
                        <button
                          onClick={updateRegistrationStatus}
                          disabled={isSavingStatus}
                          className={cn(
                            'w-full py-3 font-bold uppercase tracking-widest rounded-xl transition-all street-border text-sm disabled:opacity-50',
                            saveStatusMsg === 'ok' ? 'bg-green-500 text-white' :
                            saveStatusMsg === 'err' ? 'bg-red-500 text-white' :
                            'bg-urban-yellow text-urban-black hover:bg-yellow-400'
                          )}
                        >
                          {isSavingStatus ? 'Salvando...' : saveStatusMsg === 'ok' ? '✓ Salvo!' : saveStatusMsg === 'err' ? '✕ Erro ao Salvar' : 'SALVAR ACOMPANHAMENTO'}
                        </button>
                      </div>
                    )}

                    {/* Exibe painel diferido caso seja um voluntário */}
                    {activeTab === 'volunteers' ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <DetailItem icon={<MessageCircle className="text-green-500" />} label="WhatsApp" value={selectedRegistration.whatsapp} isCopy />
                          <DetailItem icon={<MapPin className="text-red-400" />} label="Cidade / Bairro" value={selectedRegistration.city || 'Não informado'} />
                          <DetailItem icon={<User className="text-blue-400" />} label="Idade" value={selectedRegistration.age || 'Não informado'} />
                          <DetailItem icon={<Calendar className="text-urban-yellow" />} label="Data do Cadastro" value={formatDate(selectedRegistration.created_at)} />
                        </div>
                        
                        <div className="space-y-4">
                          {selectedRegistration.how_to_help && selectedRegistration.how_to_help.length > 0 && (
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                              <h4 className="text-white font-display text-lg mb-2 flex items-center gap-2"><HeartHandshake size={16} /> Como quer ajudar</h4>
                              <p className="text-gray-400 font-urban whitespace-pre-wrap">{selectedRegistration.how_to_help.join(', ')}</p>
                            </div>
                          )}
                          {selectedRegistration.talents && selectedRegistration.talents.length > 0 && (
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                              <h4 className="text-white font-display text-lg mb-2 flex items-center gap-2"><Scissors size={16} /> Talentos</h4>
                              <p className="text-gray-400 font-urban whitespace-pre-wrap">{selectedRegistration.talents.join(', ')}</p>
                            </div>
                          )}
                          {selectedRegistration.availability && selectedRegistration.availability.length > 0 && (
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                              <h4 className="text-white font-display text-lg mb-2 flex items-center gap-2"><Calendar size={16} /> Horários</h4>
                              <p className="text-gray-400 font-urban whitespace-pre-wrap">{selectedRegistration.availability.join(', ')}</p>
                            </div>
                          )}
                          {selectedRegistration.logistics && selectedRegistration.logistics.length > 0 && (
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                              <h4 className="text-white font-display text-lg mb-2 flex items-center gap-2"><Box size={16} /> Logística</h4>
                              <p className="text-gray-400 font-urban whitespace-pre-wrap">{selectedRegistration.logistics.join(', ')}</p>
                            </div>
                          )}
                          {selectedRegistration.motivation && (
                            <div className="px-4 py-3 bg-urban-yellow/10 border border-urban-yellow/20 rounded-2xl">
                              <h4 className="text-urban-yellow font-display text-lg mb-1">MOTIVAÇÃO</h4>
                              <p className="text-white font-urban italic">"{selectedRegistration.motivation}"</p>
                            </div>
                          )}
                          {selectedRegistration.notes && (
                            <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
                              <h4 className="text-red-400 font-bold text-xs uppercase mb-1">Observações Importantes</h4>
                              <p className="text-gray-300 font-urban text-sm">{selectedRegistration.notes}</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <DetailItem icon={<MessageCircle className="text-green-500" />} label="WhatsApp" value={selectedRegistration.whatsapp} isCopy />
                          <DetailItem icon={<Mail className="text-blue-400" />} label="E-mail" value={selectedRegistration.email || 'Não informado'} isCopy={!!selectedRegistration.email} />
                          <DetailItem icon={<MapPin className="text-red-400" />} label="Cidade / Bairro" value={`${selectedRegistration.city || 'Não informado'} / ${selectedRegistration.neighborhood || ''}`} />
                          <DetailItem icon={<Users className="text-blue-500" />} label="Frequenta Igreja?" value={selectedRegistration.attends_church ? "Sim, frequenta" : "Não frequenta"} />
                          <DetailItem icon={<div className="font-bold text-xs">📖</div>} label="Contato com a Bíblia?" value={hasNoBible(selectedRegistration) ? "Não tem Bíblia" : "Sim, tem Bíblia"} />
                          <DetailItem icon={<Calendar className="text-urban-yellow" />} label="Data do Cadastro" value={formatDate(selectedRegistration.created_at)} />
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-4 py-3 bg-urban-black border border-white/5 rounded-2xl">
                         <div className={cn("w-3 h-3 rounded-full", selectedRegistration.wants_updates ? "bg-urban-yellow" : "bg-gray-700")} />
                         <span className="font-urban text-sm text-gray-300">
                           {selectedRegistration.wants_updates ? "Deseja receber novidades por WhatsApp" : "Não solicitou novidades"}
                         </span>
                      </div>
                    </div>

                    {selectedRegistration.prayer_request && (
                      <div className="street-card p-6 rounded-2xl border-l-4 border-l-blue-500 bg-blue-500/5">
                        <label className="block text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Heart size={12} fill="currentColor" /> PEDIDO DE ORAÇÃO
                        </label>
                        <p className="font-urban text-white text-lg leading-relaxed italic">
                          "{selectedRegistration.prayer_request}"
                        </p>
                      </div>
                    )}
                    </>
                  )}
                  </div>

                  <div className="p-6 bg-urban-black border-t border-white/5 flex gap-4">
                    <a 
                      href={`https://wa.me/55${selectedRegistration.whatsapp?.replace(/\D/g, '')}`} 
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20ba59] transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                    >
                      <MessageCircle size={20} /> CHAMAR NO WHATSAPP
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SidebarButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl font-urban font-bold text-sm transition-all text-left',
        active ? 'bg-urban-yellow text-urban-black shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      )}
    >
      {icon} {label}
    </button>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-gray-500 text-xs font-bold uppercase mb-2">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none"
      />
    </div>
  );
}

function DetailItem({ icon, label, value, isCopy }: { icon: React.ReactNode, label: string, value: string, isCopy?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg text-gray-400">{icon}</div>
        <span className="text-white font-urban font-bold break-all">{value}</span>
      </div>
    </div>
  );
}
