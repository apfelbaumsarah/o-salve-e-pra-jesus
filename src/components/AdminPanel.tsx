import React, { useState, useEffect, useMemo, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut, LogIn, Users, Heart, Download, Search, Bell, UserPlus,
  Calendar, Phone, Image as ImageIcon, Radio, Plus,
  Trash2, Check, X, Pencil, AlertTriangle,
  Loader2, LayoutDashboard, Menu as MenuIcon, Eye, EyeOff, MessageCircle, Info, ExternalLink, Mail, MapPin, HeartHandshake, User, Scissors, Box, BookOpen, GripVertical, Settings, Columns, ArrowUpRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

type Tab = 'dashboard' | 'registrations' | 'crm_pipeline' | 'banners' | 'lives' | 'events' | 'prayers' | 'team' | 'settings' | 'volunteers' | 'collection' | 'events_gallery';

const ALL_TABS: Tab[] = ['dashboard', 'registrations', 'crm_pipeline', 'banners', 'lives', 'events', 'prayers', 'team', 'settings', 'volunteers', 'collection', 'events_gallery'];
const DELETABLE_TABS: Tab[] = ['registrations', 'banners', 'lives', 'events', 'prayers', 'team', 'events_gallery'];

interface AdminDonutProps {
  labels: string[];
  values: number[];
  colors: string[];
  centerLabel?: string;
}

const AdminDonut: React.FC<AdminDonutProps> = ({ labels, values, colors, centerLabel = 'Total' }) => {
  const total = values.reduce((a, b) => a + b, 0);
  const options: ApexOptions = {
    chart: { type: 'donut', background: 'transparent', foreColor: '#E5E7EB', animations: { speed: 600 }, dropShadow: { enabled: true, top: 0, left: 0, blur: 10, color: colors[0], opacity: 0.25 } },
    labels,
    colors,
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    theme: { mode: 'dark' },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: { colors: '#9CA3AF' },
      markers: { size: 6 },
      fontSize: '12px',
      fontFamily: 'inherit',
      itemMargin: { horizontal: 8, vertical: 4 },
      formatter: (seriesName: string, opts) => `${seriesName} — ${opts.w.globals.series[opts.seriesIndex]}`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, color: '#9CA3AF', fontSize: '11px', fontFamily: 'inherit', offsetY: 22 },
            value: { show: true, color: '#FFFFFF', fontSize: '34px', fontFamily: 'inherit', fontWeight: 700, offsetY: -14, formatter: (v: string) => v },
            total: { show: true, label: centerLabel, color: '#9CA3AF', fontSize: '11px', fontFamily: 'inherit', fontWeight: 600, formatter: () => String(total) },
          },
        },
        expandOnClick: true,
      },
    },
    fill: {
      type: 'gradient',
      gradient: { shade: 'dark', type: 'diagonal1', shadeIntensity: 0.2, gradientToColors: colors, inverseColors: false, opacityFrom: 1, opacityTo: 0.85, stops: [0, 100] },
    },
    tooltip: { theme: 'dark', fillSeriesColor: false, y: { formatter: (v: number) => String(v) } },
    states: {
      hover: { filter: { type: 'lighten'} },
      active: { filter: { type: 'darken'} },
    },
  };
  return <Chart options={options} series={values} type="donut" height={280} />;
};


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
  const [filterRegistrations, setFilterRegistrations] = useState<'all' | 'acceptedJesus' | 'attendsChurch' | 'hasBible' | 'noBible' | 'knowing' | 'wantsUpdates' | 'returning'>('all');
  const [volunteerAreaFilter, setVolunteerAreaFilter] = useState<string>('all');
  const [volunteerStatusFilter, setVolunteerStatusFilter] = useState<'all' | 'disponivel' | 'escalado' | 'inativo'>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null);
  const [editingStatus, setEditingStatus] = useState('');
  const [editingOwner, setEditingOwner] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<'idle'|'ok'|'err'>('idle');
  const [settingsSaveStatus, setSettingsSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [teamRows, setTeamRows] = useState<any[]>([]);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<any | null>(null);
  const [activePipelineFilters, setActivePipelineFilters] = useState<string[]>([]);

  // Multiple selection state (Cadastros tab)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [memberPassword, setMemberPassword] = useState('');

  type UserProfile = { role: 'super_admin' | 'admin' | 'igreja' | 'editor'; church_id: string | null; church_name: string | null };
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isVerifyingDelete, setIsVerifyingDelete] = useState(false);
  const [dashboardRange, setDashboardRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');

  const [settings, setSettings] = useState<any>({
    site_name: 'O SALVE É PRA JESUS',
    logo_url: '',
    donation_image_url: '',
    google_fonts_url: '',
    font_family: 'Bebas Neue',
    instagram_url: '',
    youtube_url: ''
  });

  // Events Gallery state
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventPhotos, setEventPhotos] = useState<any[]>([]);
  const [uploadQueue, setUploadQueue] = useState<{ id: string; file: File; progress: number; status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error' }[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

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
        setUserProfile({ role: 'super_admin', church_id: null, church_name: null });
        setHasAccess(true);
        setIsCheckingAccess(false);
        return;
      }

      const { data: row } = await supabase
        .from('team')
        .select('email, role_type, church_id, churches(name)')
        .eq('email', user.email)
        .maybeSingle();

      if (row) {
        setUserProfile({
          role: (row.role_type as any) || 'admin',
          church_id: row.church_id,
          church_name: (row as any).churches?.name ?? null,
        });
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
      setIsCheckingAccess(false);
    };

    setIsCheckingAccess(true);
    checkAccess();
  }, [user]);

  const isMainAdmin = user?.email === MAIN_ADMIN_EMAIL;

  const canViewTab = (tab: Tab) => {
    if (!userProfile) return false;
    if (userProfile.role === 'super_admin' || userProfile.role === 'admin') return true;
    if (userProfile.role === 'editor') return tab === 'events_gallery';
    // igreja: only pipeline and prayers
    return tab === 'prayers' || tab === 'crm_pipeline';
  };
  const canEditTab = (tab: Tab) => {
    if (!userProfile) return false;
    if (userProfile.role === 'super_admin' || userProfile.role === 'admin') return true;
    if (userProfile.role === 'editor') return tab === 'events_gallery';
    // igreja can edit registrations (via pipeline/modal) and prayers
    return tab === 'prayers' || tab === 'crm_pipeline' || tab === 'registrations';
  };
  const canDeleteTab = (tab: Tab) => {
    if (!userProfile) return false;
    if (userProfile.role === 'editor') return tab === 'events_gallery';
    // only super_admin and admin can delete; igreja never deletes
    return userProfile.role === 'super_admin' || userProfile.role === 'admin';
  };
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  // Redirect 'igreja' users away from dashboard (which they cannot see)
  // Redirect 'editor' users to events_gallery
  useEffect(() => {
    if (userProfile?.role === 'igreja' && activeTab === 'dashboard') {
      setActiveTab('crm_pipeline');
    }
    if (userProfile?.role === 'editor' && activeTab !== 'events_gallery') {
      setActiveTab('events_gallery');
    }
  }, [userProfile, activeTab]);

  // Live-preview: inject Google Font into <head> when on settings tab
  useEffect(() => {
    if (activeTab !== 'settings') return;
    const url = settings.google_fonts_url;
    if (!url) return;
    let link = document.getElementById('settings-preview-font') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'settings-preview-font';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = url;
    return () => {
      // Remove only when leaving settings tab
      const el = document.getElementById('settings-preview-font');
      if (el) el.remove();
    };
  }, [activeTab, settings.google_fonts_url]);

  const getTableName = (tab: Tab) => {
    if (tab === 'prayers') return 'registrations';
    if (tab === 'volunteers') return 'volunteers';
    if (tab === 'collection') return 'collection_signups';
    return tab;
  };

  const loadTabData = async (tab: Tab) => {
    if (tab === 'events_gallery') {
      const { data: evts } = await supabase.from('events_gallery').select('*, gallery_photos(count)').order('created_at', { ascending: false });
      setEvents(evts || []);
      return;
    }
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

    if (tab === 'dashboard') {
      query = query.order('prayer_done', { ascending: true }).order('created_at', { ascending: false });
    } else if (tab === 'registrations') {
      query = query.order('created_at', { ascending: false });
    } else if (tab === 'banners') {
      query = query.order('order', { ascending: true });
    } else if (tab === 'lives') {
      query = query.order('date', { ascending: false });
    } else if (tab === 'events') {
      query = query.order('date', { ascending: true });
    } else if (tab === 'volunteers') {
      query = query.order('created_at', { ascending: false });
    } else if (tab === 'collection') {
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
    } else if (activeTab === 'events_gallery') {
      const channel = supabase
        .channel('admin-events_gallery')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events_gallery' }, () => {
          loadTabData('events_gallery');
        })
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
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

  // Clear selection when tab or filter changes
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab, filterRegistrations]);

  // Reset volunteer filters when leaving volunteers tab
  useEffect(() => {
    if (activeTab !== 'volunteers') {
      setVolunteerAreaFilter('all');
      setVolunteerStatusFilter('all');
    }
  }, [activeTab]);

  // Load event photos + realtime when an event is selected
  useEffect(() => {
    if (!selectedEventId) {
      setEventPhotos([]);
      return;
    }
    let isMounted = true;
    supabase
      .from('gallery_photos')
      .select('*')
      .eq('event_id', selectedEventId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (isMounted) setEventPhotos(data || []);
      });

    const channel = supabase
      .channel(`gallery-photos-${selectedEventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gallery_photos', filter: `event_id=eq.${selectedEventId}` },
        (payload) => {
          if (isMounted) setEventPhotos((prev) => [payload.new as any, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'gallery_photos', filter: `event_id=eq.${selectedEventId}` },
        (payload) => {
          if (isMounted) setEventPhotos((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [selectedEventId]);

  // Close sidebar on ESC key (mobile)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

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

  const createEvent = async () => {
    if (!newEventName.trim()) return;
    const slug = newEventName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const { data, error } = await supabase
      .from('events_gallery')
      .insert([{ name: newEventName.trim(), slug, event_date: newEventDate || null }])
      .select()
      .single();
    if (!error && data) {
      setEvents((prev) => [data, ...prev]);
      setSelectedEventId(data.id);
      setNewEventName('');
      setNewEventDate('');
      setIsCreatingEvent(false);
    }
  };

  const uploadPhotos = async (files: File[]) => {
    if (!selectedEventId) return;
    for (const file of files) {
      const id = crypto.randomUUID();
      setUploadQueue((q) => [...q, { id, file, progress: 0, status: 'compressing' }]);
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 3,
          maxWidthOrHeight: 2560,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.92,
        });
        setUploadQueue((q) => q.map((x) => (x.id === id ? { ...x, status: 'uploading', progress: 30 } : x)));
        const path = `${selectedEventId}/${id}.webp`;
        const { error: upErr } = await supabase.storage
          .from('event-gallery')
          .upload(path, compressed, { contentType: 'image/webp', upsert: false });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('event-gallery').getPublicUrl(path);
        const dims = await new Promise<{ w: number; h: number }>((res) => {
          const img = new Image();
          img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
          img.src = URL.createObjectURL(compressed);
        });
        await supabase.from('gallery_photos').insert([{
          event_id: selectedEventId,
          storage_path: path,
          public_url: publicUrl,
          width: dims.w,
          height: dims.h,
          uploaded_by: user?.email || null,
        }]);
        setUploadQueue((q) => q.map((x) => (x.id === id ? { ...x, status: 'done', progress: 100 } : x)));
        setTimeout(() => setUploadQueue((q) => q.filter((x) => x.id !== id)), 1500);
      } catch (err) {
        console.error('Upload error:', err);
        setUploadQueue((q) => q.map((x) => (x.id === id ? { ...x, status: 'error' } : x)));
      }
    }
  };

  const deletePhoto = async (photo: any) => {
    if (!confirm('Remover esta foto?')) return;
    await supabase.storage.from('event-gallery').remove([photo.storage_path]);
    await supabase.from('gallery_photos').delete().eq('id', photo.id);
    setEventPhotos((prev) => prev.filter((p) => p.id !== photo.id));
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
    setSettingsSaveStatus('saving');
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
      setSettingsSaveStatus('ok');
      setTimeout(() => setSettingsSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSettingsSaveStatus('error');
      setTimeout(() => setSettingsSaveStatus('idle'), 3000);
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

  const exportToCSV = (rows: any[]) => {
    if (!rows.length) return;

    const toCsvCell = (val: unknown) => {
      const normalized = val == null ? '' : String(val);
      return `"${normalized.replace(/"/g, '""')}"`;
    };

    const sanitizePdfText = (value: unknown) => {
      const raw = String(value ?? '');
      const withoutControls = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
      const withoutEmoji = withoutControls.replace(
        /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}]/gu,
        ''
      );
      const withoutUnsupported = withoutEmoji.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
      return withoutUnsupported.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
    };

    if (activeTab === 'prayers') {
      const prayerRows = [...rows]
        .filter((row) => String(row?.prayer_request || '').trim() !== '')
        .sort((a, b) => {
          const prayerDoneDiff = Number(!!a?.prayer_done) - Number(!!b?.prayer_done);
          if (prayerDoneDiff !== 0) return prayerDoneDiff;
          return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
        });

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      const marginTop = 56;
      const marginBottom = 56;
      const contentWidth = pageWidth - marginX * 2;
      let y = marginTop;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Lista de Orações', marginX, y);
      y += 24;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, marginX, y);
      doc.setTextColor(0, 0, 0);
      y += 24;

      prayerRows.forEach((row, idx) => {
        const baseName = sanitizePdfText(row?.name || 'Sem nome') || 'Sem nome';
        const actions: string[] = [];
        const semBiblia =
          row?.has_bible === false ||
          row?.has_bible === 'false' ||
          row?.has_bible === 0 ||
          row?.has_bible === '0';
        if (semBiblia) actions.push('SEM BIBLIA');
        if (row?.attends_church === false) actions.push('SEM IGREJA');
        if (row?.accepted_jesus === false && row?.attends_church === false) actions.push('ESTA CONHECENDO');
        if (row?.is_returning === true) {
          actions.push('RETORNANDO');
        } else if (row?.accepted_jesus === true) {
          actions.push('ACEITOU JESUS');
        }
        const actionSuffix = actions.map((a) => `[${a}]`).join(' ');
        const name = actionSuffix ? `${baseName} ${actionSuffix}` : baseName;
        const phoneRaw = sanitizePdfText(row?.whatsapp || row?.phone || '');
        const phone = phoneRaw && phoneRaw.toUpperCase() !== 'N/A' ? phoneRaw : 'Sem telefone';
        const parsedNotes = parseAdminNotes(typeof row?.admin_notes === 'string' ? row.admin_notes : '');
        const ownerRaw = row?.responsavel || row?.responsible || row?.owner || row?.assigned_to || parsedNotes.owner || '';
        const owner = sanitizePdfText(ownerRaw);
        const contactLine = owner ? `Contato: ${phone} | Responsavel: ${owner}` : `Contato: ${phone}`;
        const contactLines = doc.splitTextToSize(contactLine, contentWidth);
        const prayer = sanitizePdfText(row?.prayer_request || '') || 'Sem oração informada.';
        const prayerLines = doc.splitTextToSize(prayer, contentWidth);
        const blockHeight = 20 + contactLines.length * 13 + 8 + prayerLines.length * 15 + 18;

        if (y + blockHeight > pageHeight - marginBottom) {
          doc.addPage();
          y = marginTop;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(name, marginX, y);
        y += 20;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(contactLines, marginX, y);
        doc.setTextColor(0, 0, 0);
        y += contactLines.length * 13 + 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(prayerLines, marginX, y);
        y += prayerLines.length * 15 + 8;

        if (idx < prayerRows.length - 1) {
          doc.setDrawColor(205, 205, 205);
          doc.setLineWidth(0.8);
          doc.line(marginX, y, pageWidth - marginX, y);
          y += 14;
        }
      });

      doc.save(`oracoes_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      return;
    }

    const headers = Object.keys(rows[0]).filter((k) => k !== 'created_at');
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => toCsvCell(row[header])).join(',')),
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
    concluido:         { label: 'Concluído',         color: 'bg-urban-yellow/10 text-urban-yellow border-urban-yellow/30 shadow-[0_0_12px_rgba(206,189,103,0.25)]',  dot: 'bg-urban-yellow' },
  };

  const VOLUNTEER_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    disponivel: { label: 'Disponível', color: 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20', dot: 'bg-[#00FF66]' },
    escalado:   { label: 'Escalado',   color: 'bg-urban-yellow/10 text-urban-yellow border-urban-yellow/20', dot: 'bg-urban-yellow' },
    inativo:    { label: 'Inativo',    color: 'bg-white/5 text-gray-400 border-white/10', dot: 'bg-gray-500' },
  };

  const getVolunteerStatus = (item: any) => item?.volunteer_status || 'disponivel';

  const updateVolunteerStatus = async (id: string, nextStatus: string) => {
    const targetTab: Tab = activeTab === 'collection' ? 'collection' : 'volunteers';
    if (!canEditTab(targetTab)) return;
    const tableName = getTableName(targetTab);
    const { error } = await supabase.from(tableName).update({ volunteer_status: nextStatus }).eq('id', id);
    if (!error) {
      setData(prev => prev.map((r: any) => (r.id === id ? { ...r, volunteer_status: nextStatus } : r)));
    }
  };

  const getStatus = (item: any) => item.status || 'novo';
  const hasNoBible = (item: any) =>
    item?.has_bible === false ||
    item?.has_bible === 'false' ||
    item?.has_bible === 0 ||
    item?.has_bible === '0';
  const getPipelineStage = (item: any) => {
    const currentStage = getStatus(item);
    if (currentStage === 'sem_biblia') return 'acompanhamento';
    return currentStage;
  };
  const isEligibleForPipeline = (item: any) =>
    item?.accepted_jesus === true ||
    (item?.accepted_jesus === false && item?.attends_church === false);

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

  const getPipelineTimestamp = (item: any) => {
    const updatedAt = item?.updated_at ? new Date(item.updated_at).getTime() : NaN;
    if (Number.isFinite(updatedAt)) return updatedAt;
    const createdAt = item?.created_at ? new Date(item.created_at).getTime() : NaN;
    return Number.isFinite(createdAt) ? createdAt : 0;
  };

  const hasPipelineUpdate = (item: any) => {
    const parsed = parseAdminNotes(item?.admin_notes);
    const hasNotes = Boolean(parsed.owner || parsed.notes);
    const movedFromNovo = item?.status && item.status !== 'novo';
    const updatedAt = item?.updated_at ? new Date(item.updated_at).getTime() : NaN;
    const createdAt = item?.created_at ? new Date(item.created_at).getTime() : NaN;
    const hasTimestampUpdate =
      Number.isFinite(updatedAt) &&
      Number.isFinite(createdAt) &&
      updatedAt > createdAt + 1000;

    return hasNotes || movedFromNovo || hasTimestampUpdate;
  };

  const comparePipelineCards = (a: any, b: any) => {
    const aHasUpdate = hasPipelineUpdate(a);
    const bHasUpdate = hasPipelineUpdate(b);

    // Sem atualização primeiro; mais atualizados ficam no final da coluna.
    if (aHasUpdate !== bHasUpdate) return aHasUpdate ? 1 : -1;
    return getPipelineTimestamp(a) - getPipelineTimestamp(b);
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

  // dnd-kit sensors
  const pipelineSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const handleDndDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current?.item ?? null;
    setActiveDragItem(item);
    setDraggedCardId(active.data.current?.item?.id ?? null);
  };

  const handleDndDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setDraggedCardId(null);
    if (!over) return;
    const fromStage = active.data.current?.stageKey as string | undefined;
    const toStage = over.data.current?.stageKey as string | undefined;
    if (!fromStage || !toStage || fromStage === toStage) return;
    const cardId = active.data.current?.item?.id as string | undefined;
    if (!cardId) return;
    await moveCadastroToStage(cardId, toStage);
  };

  const getInitials = (owner: string): string => {
    if (!owner) return '';
    return owner
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  };

  const EMPTY_COPY: Record<string, string> = {
    novo: 'Ninguém aguardando. Novos cadastros aparecem aqui.',
    contatado: 'Arraste alguém de Novo após o primeiro contato.',
    acompanhamento: 'Puxe discípulos ativos para cá.',
    concluido: 'Celebre os formados aqui.',
  };

  const PIPELINE_FILTER_DEFS: { key: string; label: string; fn: (item: any) => boolean }[] = [
    { key: 'aceitaram', label: 'Aceitaram Jesus (1a decisao)', fn: (item) => item.accepted_jesus === true && item.is_returning !== true },
    { key: 'conhecendo', label: 'Estão conhecendo', fn: (item) => item.accepted_jesus === false && item.attends_church === false && item.is_returning !== true },
    { key: 'sem_biblia', label: 'Sem Bíblia', fn: (item) => hasNoBible(item) },
    { key: 'ultimos7', label: 'Últimos 7 dias', fn: (item) => new Date(item.created_at).getTime() >= Date.now() - 7 * 24 * 3600 * 1000 },
  ];

  const togglePipelineFilter = (key: string) => {
    setActivePipelineFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const updateRegistrationStatus = async () => {
    if (!selectedRegistration) return;
    setIsSavingStatus(true);
    setSaveStatusMsg('idle');
    const table = activeTab === 'volunteers' || activeTab === 'collection'
      ? getTableName(activeTab)
      : 'registrations';
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

  const rangedData = useMemo(() => {
    if (dashboardRange === 'all') return data;
    const now = Date.now();
    const days = dashboardRange === '7d' ? 7 : dashboardRange === '30d' ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return data.filter((d: any) => d.created_at && new Date(d.created_at).getTime() >= cutoff);
  }, [data, dashboardRange]);

  const volunteerAreas = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach((d: any) => (d.how_to_help || []).forEach((h: string) => s.add(h)));
    return Array.from(s).sort();
  }, [data]);

  const chipCounts = useMemo(() => {
    const rows = activeTab === 'team' ? teamRows : data;
    return {
      all: (rows || []).length,
      acceptedJesus: (rows || []).filter((d: any) => d.accepted_jesus === true && d.is_returning !== true).length,
      knowing: (rows || []).filter((d: any) => d.accepted_jesus === false && d.attends_church === false && d.is_returning !== true).length,
      wantsUpdates: (rows || []).filter((d: any) => d.wants_updates === true).length,
      noBible: (rows || []).filter((d: any) => hasNoBible(d)).length,
      returning: (rows || []).filter((d: any) => d.is_returning === true).length,
    };
  }, [activeTab, data, teamRows]);

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
              <label htmlFor="admin-email" className="block text-gray-500 text-xs font-bold uppercase mb-2">E-mail</label>
              <input
                id="admin-email"
                name="email"
                autoComplete="email"
                type="email"
                className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urban-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-urban-black"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-gray-500 text-xs font-bold uppercase mb-2">Senha</label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urban-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-urban-black"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  aria-controls="admin-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div role="alert" aria-live="assertive">
                <p className="text-red-500 text-sm font-bold text-center mt-2">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              aria-busy={isLoggingIn}
              className="w-full py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 transition-all street-border mt-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

  const totalCadastros = rangedData.length;
  const aceitaramJesus = rangedData.filter((d) => d.accepted_jesus === true && d.is_returning !== true).length;
  const frequentamIgreja = rangedData.filter((d) => d.attends_church === true).length;
  const naoFrequentamIgreja = rangedData.filter((d) => d.attends_church === false).length;
  const temBiblia = rangedData.filter((d) => d.has_bible === true).length;
  const naoTemBiblia = rangedData.filter((d) => hasNoBible(d)).length;
  const aindaConhecendo = rangedData.filter((d) => d.accepted_jesus === false && d.attends_church === false && d.is_returning !== true).length;
  const jaCaminha = rangedData.filter((d) => d.accepted_jesus === false && d.attends_church !== false && d.is_returning !== true).length;
  const querVoltar = rangedData.filter((d) => d.is_returning === true).length;

  const sourceRows = activeTab === 'team' ? teamRows : data;

  const visibleData = (sourceRows || [])
    .filter((item) => {
      if (activeTab === 'registrations') {
        if (filterRegistrations === 'acceptedJesus') return item.accepted_jesus === true && item.is_returning !== true;
        if (filterRegistrations === 'knowing') return item.accepted_jesus === false && item.attends_church === false && item.is_returning !== true;
        if (filterRegistrations === 'wantsUpdates') return item.wants_updates === true;
        if (filterRegistrations === 'noBible') return hasNoBible(item);
        if (filterRegistrations === 'returning') return item.is_returning === true;
      }
      if (activeTab === 'volunteers') {
        if (volunteerAreaFilter !== 'all' && !item.how_to_help?.includes(volunteerAreaFilter)) return false;
        if (volunteerStatusFilter !== 'all' && getVolunteerStatus(item) !== volunteerStatusFilter) return false;
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
      if (activeTab === 'registrations' && filterRegistrations === 'all') return 0;
      if (activeTab === 'registrations') {
        const prayerDiff = Number(!!a.prayer_done) - Number(!!b.prayer_done);
        if (prayerDiff !== 0) return prayerDiff;
      }
      const order: Record<string, number> = { novo: 0, contatado: 1, acompanhamento: 2, concluido: 3 };
      return (order[a.status || 'novo'] ?? 0) - (order[b.status || 'novo'] ?? 0);
    });

  return (
    <div className="min-h-screen bg-urban-black flex">
      <aside
        id="admin-sidebar"
        className={cn(
          "bg-urban-gray border-r border-white/10 flex flex-col fixed top-0 left-0 h-screen z-50 transition-transform duration-300",
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full w-64 md:translate-x-0 md:w-64",
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <h1 className="font-display text-2xl text-white">
            PAINEL <span className="text-urban-yellow">ADMIN</span>
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        <nav
          aria-label="Seções do painel"
          className="flex flex-col gap-2 p-4 flex-grow overflow-y-auto"
        >
          {canViewTab("dashboard") && (
            <SidebarButton
              active={activeTab === "dashboard"}
              onClick={() => {
                setActiveTab("dashboard");
                setIsSidebarOpen(false);
              }}
              icon={<LayoutDashboard size={20} />}
              label="Visão Geral"
            />
          )}
          {canViewTab("crm_pipeline") && (
            <SidebarButton
              active={activeTab === "crm_pipeline"}
              onClick={() => {
                setActiveTab("crm_pipeline");
                setIsSidebarOpen(false);
              }}
              icon={<Columns size={20} />}
              label="Pipeline CRM"
            />
          )}
          {canViewTab("registrations") && (
            <SidebarButton
              active={
                activeTab === "registrations" && filterRegistrations === "all"
              }
              onClick={() => {
                setActiveTab("registrations");
                setFilterRegistrations("all");
                setIsSidebarOpen(false);
              }}
              icon={<Users size={20} />}
              label="Cadastros"
            />
          )}
          {canViewTab("registrations") && (
            <SidebarButton
              active={
                activeTab === "registrations" &&
                filterRegistrations === "noBible"
              }
              onClick={() => {
                setActiveTab("registrations");
                setFilterRegistrations("noBible");
                setIsSidebarOpen(false);
              }}
              icon={<BookOpen size={20} />}
              label="Sem Bíblia"
            />
          )}
          {canViewTab("prayers") && (
            <SidebarButton
              active={activeTab === "prayers"}
              onClick={() => {
                setActiveTab("prayers");
                setIsSidebarOpen(false);
              }}
              icon={<Heart size={20} />}
              label="Orações"
            />
          )}
          {canViewTab("volunteers") && (
            <SidebarButton
              active={activeTab === "volunteers"}
              onClick={() => {
                setActiveTab("volunteers");
                setIsSidebarOpen(false);
              }}
              icon={<HeartHandshake size={20} />}
              label="Voluntários"
            />
          )}
          {canViewTab("collection") && (
            <SidebarButton
              active={activeTab === "collection"}
              onClick={() => {
                setActiveTab("collection");
                setIsSidebarOpen(false);
              }}
              icon={<Box size={20} />}
              label="Coleta"
            />
          )}
          {canViewTab('events_gallery') && (
            <SidebarButton
              active={activeTab === 'events_gallery'}
              onClick={() => { setActiveTab('events_gallery'); setIsSidebarOpen(false); }}
              icon={<Calendar size={20} />}
              label="Eventos"
            />
          )}
          {/* {canViewTab('team') && <SidebarButton active={activeTab === 'team'} onClick={openTeamTab} icon={<Users size={20} />} label="Equipe" />} */}
          {canViewTab('settings') && (
            <SidebarButton
              active={activeTab === 'settings'}
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
              icon={<Settings size={20} />}
              label="Configurações"
            />
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-2 mb-2">
            <p className="text-gray-500 text-[10px] font-bold uppercase">
              Logado como
            </p>
            <p className="text-white text-xs truncate font-bold">
              {user.email}
            </p>
            {userProfile?.role === 'igreja' && (
              <p className="text-urban-yellow text-xs font-bold mt-1">{userProfile.church_name || 'Igreja'}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 bg-white/5 text-gray-300 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={20} /> Sair do Painel
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="md:hidden fixed top-0 w-full bg-urban-gray border-b border-white/10 p-4 z-40 flex items-center justify-between">
        <h1 className="font-display text-xl text-white">
          PAINEL <span className="text-urban-yellow">ADMIN</span>
        </h1>
        <button
          aria-label="Abrir menu"
          aria-expanded={isSidebarOpen}
          aria-controls="admin-sidebar"
          onClick={() => setIsSidebarOpen(true)}
          className="text-white"
        >
          <MenuIcon size={24} />
        </button>
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
              {/* Time range selector */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDashboardRange(range)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all',
                      dashboardRange === range
                        ? 'bg-urban-yellow text-urban-black'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : range === '90d' ? '90 dias' : 'Tudo'}
                  </button>
                ))}
              </div>

              {/* 6-card KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {/* Total de Cadastros */}
                <div
                  className="street-card cursor-pointer relative p-4 rounded-2xl border-l-4 border-urban-yellow hover:scale-[1.04] hover:bg-urban-yellow/5 transition-all"
                  onClick={() => { setActiveTab('registrations'); setFilterRegistrations('all'); }}
                  role="button"
                  tabIndex={0}
                  title="Ver todos os cadastros"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveTab('registrations'); setFilterRegistrations('all'); } }}
                >
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-500" />
                  <p className="text-urban-yellow font-urban text-xs uppercase font-bold mb-1">Total</p>
                  <p className="text-3xl text-white font-display">{totalCadastros}</p>
                </div>

                {/* Aceitaram a Jesus (1a decisao) */}
                <div
                  className="street-card cursor-pointer relative p-4 rounded-2xl border-l-4 border-[#00FF66] hover:scale-[1.04] hover:bg-[#00FF66]/5 transition-all"
                  onClick={() => { setActiveTab('registrations'); setFilterRegistrations('acceptedJesus'); }}
                  role="button"
                  tabIndex={0}
                  title="Ver quem aceitou Jesus pela primeira vez"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveTab('registrations'); setFilterRegistrations('acceptedJesus'); } }}
                >
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-500" />
                  <p className="text-[#00FF66] font-urban text-xs uppercase font-bold mb-1">Aceitaram (1a)</p>
                  <p className="text-3xl text-white font-display">{aceitaramJesus}</p>
                </div>

                {/* Não Frequentam Igreja */}
                <div
                  className="street-card cursor-pointer relative p-4 rounded-2xl border-l-4 border-[#00D1FF] hover:scale-[1.04] hover:bg-[#00D1FF]/5 transition-all"
                  onClick={() => { setActiveTab('registrations'); setFilterRegistrations('all'); }}
                  role="button"
                  tabIndex={0}
                  title="Ver quem não frequenta igreja"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveTab('registrations'); setFilterRegistrations('all'); } }}
                >
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-500" />
                  <p className="text-[#00D1FF] font-urban text-xs uppercase font-bold mb-1">Sem Igreja</p>
                  <p className="text-3xl text-white font-display">{naoFrequentamIgreja}</p>
                </div>

                {/* Sem Bíblia */}
                <div
                  className="street-card cursor-pointer relative p-4 rounded-2xl border-l-4 border-amber-400 hover:scale-[1.04] hover:bg-amber-400/5 transition-all"
                  onClick={() => { setActiveTab('registrations'); setFilterRegistrations('noBible'); }}
                  role="button"
                  tabIndex={0}
                  title="Ver quem não tem Bíblia"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveTab('registrations'); setFilterRegistrations('noBible'); } }}
                >
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-500" />
                  <p className="text-amber-400 font-urban text-xs uppercase font-bold mb-1">Sem Bíblia</p>
                  <p className="text-3xl text-white font-display">{naoTemBiblia}</p>
                </div>

                {/* Ainda Conhecendo */}
                <div
                  className="street-card cursor-pointer relative p-4 rounded-2xl border-l-4 border-purple-400 hover:scale-[1.04] hover:bg-purple-400/5 transition-all"
                  onClick={() => { setActiveTab('registrations'); setFilterRegistrations('knowing'); }}
                  role="button"
                  tabIndex={0}
                  title="Ver quem ainda está conhecendo"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveTab('registrations'); setFilterRegistrations('knowing'); } }}
                >
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-500" />
                  <p className="text-purple-400 font-urban text-xs uppercase font-bold mb-1">Conhecendo</p>
                  <p className="text-3xl text-white font-display">{aindaConhecendo}</p>
                </div>

                {/* Querem Voltar ao Pai */}
                <div
                  className="street-card cursor-pointer relative p-4 rounded-2xl border-l-4 border-orange-400 hover:scale-[1.04] hover:bg-orange-400/5 transition-all"
                  onClick={() => { setActiveTab('registrations'); setFilterRegistrations('returning'); }}
                  role="button"
                  tabIndex={0}
                  title="Ver quem quer voltar ao Pai"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveTab('registrations'); setFilterRegistrations('returning'); } }}
                >
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-500" />
                  <p className="text-orange-400 font-urban text-xs uppercase font-bold mb-1">Retornando</p>
                  <p className="text-3xl text-white font-display">{querVoltar}</p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Gráfico 1: Decisão */}
                <div className="street-card cursor-pointer p-6 rounded-2xl hover:bg-urban-yellow/5 transition-all" onClick={() => { setActiveTab('registrations'); setFilterRegistrations('acceptedJesus'); }}>
                  <h3 className="text-white font-display text-lg mb-4 text-center tracking-widest uppercase">Decisão por Cristo</h3>
                  <AdminDonut
                    labels={['Aceitaram (1a)', 'Retornando', 'Conhecendo', 'Já Cristão/Outros']}
                    values={[aceitaramJesus, querVoltar, aindaConhecendo, jaCaminha]}
                    colors={['#00FF66', '#FB923C', '#A855F7', '#6B7280']}
                    centerLabel="Total"
                  />
                </div>

                {/* Gráfico 2: Igreja */}
                <div className="street-card cursor-pointer p-6 rounded-2xl hover:bg-blue-500/5 transition-all" onClick={() => { setActiveTab('registrations'); setFilterRegistrations('attendsChurch'); }}>
                  <h3 className="text-white font-display text-lg mb-4 text-center tracking-widest uppercase">Frequência Igreja</h3>
                  <AdminDonut
                    labels={['Frequenta', 'Sem Igreja']}
                    values={[frequentamIgreja, naoFrequentamIgreja]}
                    colors={['#6B7280', '#00D1FF']}
                    centerLabel="Total"
                  />
                </div>

                {/* Gráfico 3: Bíblia */}
                <div className="street-card cursor-pointer p-6 rounded-2xl hover:bg-purple-500/5 transition-all" onClick={() => { setActiveTab('registrations'); setFilterRegistrations('hasBible'); }}>
                  <h3 className="text-white font-display text-lg mb-4 text-center tracking-widest uppercase">Tem Bíblia?</h3>
                  <AdminDonut
                    labels={['Sem Bíblia', 'Tem Bíblia']}
                    values={[naoTemBiblia, temBiblia]}
                    colors={['#FFE81F', '#6B7280']}
                    centerLabel="Total"
                  />
                </div>
              </div>
            </div>
            )
          )}

          {activeTab === 'crm_pipeline' ? (
            (() => {
              const pipelineBase = (data || [])
                .filter((item: any) => isEligibleForPipeline(item))
                .filter((item: any) => {
                  if (activePipelineFilters.length === 0) return true;
                  return PIPELINE_FILTER_DEFS.every((fd) =>
                    activePipelineFilters.includes(fd.key) ? fd.fn(item) : true
                  );
                });
              const pipelineFiltered = pipelineBase.filter((item: any) => {
                if (!normalizedSearchTerm) return true;
                return [item.name, item.whatsapp, item.city, item.neighborhood, item.email]
                  .some((val) => String(val || '').toLowerCase().includes(normalizedSearchTerm));
              });
              const isFiltering = !!(normalizedSearchTerm || activePipelineFilters.length > 0);
              const stageKeys = ['novo', 'contatado', 'acompanhamento', 'concluido'] as const;
              const stageTotals = Object.fromEntries(
                stageKeys.map((sk) => [sk, pipelineBase.filter((i: any) => getPipelineStage(i) === sk).length])
              ) as Record<string, number>;
              const totalVisible = pipelineBase.length;
              return (
                <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
                  <div className="rounded-2xl md:rounded-3xl bg-urban-gray/80 border border-white/10 p-4 md:p-8 flex flex-col gap-3 md:gap-4 shadow-[0_0_15px_rgba(255,232,31,0.08)]">
                    <div>
                      <h3 className="text-white font-display text-2xl md:text-3xl uppercase tracking-wide mb-1 md:mb-2 leading-tight">Acompanhamento de Discípulos</h3>
                      <p className="text-gray-400 font-urban text-sm md:text-base">Acompanhe cada pessoa que aceitou Jesus ou está conhecendo, do primeiro contato ao discipulado.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center flex-wrap">
                      <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                          type="text"
                          placeholder="Buscar nome, WhatsApp, cidade..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-urban-gray border border-white/10 rounded-xl text-white text-sm md:text-base focus:border-urban-yellow/60 outline-none"
                        />
                      </div>
                      <div className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-1 px-1 md:flex-wrap md:overflow-visible md:mx-0 md:px-0">
                        {PIPELINE_FILTER_DEFS.map((fd) => (
                          <button
                            key={fd.key}
                            onClick={() => togglePipelineFilter(fd.key)}
                            className={cn(
                              "shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                              activePipelineFilters.includes(fd.key)
                                ? "bg-urban-yellow text-urban-black border-urban-yellow"
                                : "bg-white/5 text-gray-300 border-white/10 hover:border-urban-yellow/40 hover:text-white"
                            )}
                          >
                            {fd.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dica mobile de scroll horizontal */}
                  <div className="md:hidden flex items-center justify-center gap-2 text-gray-500 text-xs uppercase tracking-wider font-bold">
                    <ChevronLeft size={14} />
                    <span>Deslize para ver todas as etapas</span>
                    <ChevronRight size={14} />
                  </div>

                  <div className="-mx-4 lg:mx-0 overflow-x-auto lg:overflow-visible scrollbar-hidden pb-2 snap-x snap-mandatory lg:snap-none scroll-px-4 lg:scroll-px-0">
                    <DndContext
                      sensors={pipelineSensors}
                      collisionDetection={closestCorners}
                      onDragStart={handleDndDragStart}
                      onDragEnd={handleDndDragEnd}
                    >
                      <div className="grid grid-flow-col auto-cols-[82vw] md:auto-cols-[320px] lg:grid-flow-row lg:grid-cols-4 lg:auto-cols-auto gap-3 md:gap-4 px-4 lg:px-0">
                        {stageKeys.map((stageKey) => {
                          const totalForStage = stageTotals[stageKey];
                          const cards = pipelineFiltered
                            .filter((item: any) => getPipelineStage(item) === stageKey)
                            .sort(comparePipelineCards);
                          const stageCfg = STATUS_CONFIG[stageKey];
                          return (
                            <div
                              key={stageKey}
                              className="snap-start min-w-0 rounded-2xl md:rounded-3xl p-3 md:p-4 bg-urban-gray/75 backdrop-blur-sm transition-all shadow-[0_0_15px_rgba(255,232,31,0.05)] ring-1 ring-white/[0.06]"
                            >
                              <div className="flex items-center justify-between mb-3 md:mb-4 sticky top-0 bg-urban-gray/75 backdrop-blur-sm -mx-3 md:-mx-4 px-3 md:px-4 py-2 rounded-t-2xl md:rounded-t-3xl z-10">
                                <h4 className="font-display text-lg md:text-xl text-white tracking-wide uppercase truncate pr-2">{stageCfg.label}</h4>
                                <span className={cn('shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border', stageCfg.color)}>
                                  {isFiltering ? `${cards.length}/${totalForStage}` : totalForStage}
                                </span>
                              </div>
                              <PipelineColumn stageKey={stageKey}>
                                {cards.map((item: any) => {
                                  const parsed = parseAdminNotes(item.admin_notes);
                                  return (
                                    <PipelineCard
                                      key={item.id as string}
                                      item={item}
                                      stageKey={stageKey}
                                      stageLabel={stageCfg.label}
                                      parsed={parsed}
                                      hasNoBibleFn={hasNoBible}
                                      getInitialsFn={getInitials}
                                      onClick={() => {
                                        setSelectedRegistration(item);
                                        setEditingStatus(item.status || 'novo');
                                        setEditingOwner(parsed.owner);
                                        setEditingNotes(parsed.notes);
                                      }}
                                    />
                                  );
                                })}
                                {cards.length === 0 && (
                                  <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-white/15 bg-urban-gray/60 rounded-xl px-3">
                                    {EMPTY_COPY[stageKey] ?? 'Nenhum cadastro nesta etapa.'}
                                  </div>
                                )}
                              </PipelineColumn>
                            </div>
                          );
                        })}
                      </div>
                      <DragOverlay>
                        {activeDragItem ? (
                          <div className="bg-urban-gray rounded-2xl p-3 ring-2 ring-urban-yellow/60 shadow-[0_0_20px_rgba(255,232,31,0.25)] opacity-95 w-72">
                            <p className="font-urban font-bold text-white text-sm line-clamp-2">{activeDragItem.name || 'Sem nome'}</p>
                            <p className="text-xs text-gray-400 mt-1">{activeDragItem.whatsapp || ''}</p>
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  </div>
                </div>
              );
            })()
          ) : activeTab === 'events_gallery' && canViewTab('events_gallery') ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                {selectedEventId ? (
                  <>
                    <button
                      onClick={() => { setSelectedEventId(null); setEventPhotos([]); setUploadQueue([]); }}
                      className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors"
                    >
                      <span className="text-urban-yellow">&#8592;</span> Voltar para Eventos
                    </button>
                    <h3 className="text-white font-display text-2xl uppercase tracking-widest">
                      {events.find((e) => e.id === selectedEventId)?.name || 'Evento'}
                    </h3>
                  </>
                ) : (
                  <>
                    <h3 className="text-white font-display text-2xl uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={24} className="text-urban-yellow" /> Galeria de Eventos
                    </h3>
                    {canEditTab('events_gallery') && (
                      <button
                        onClick={() => setIsCreatingEvent(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-400 transition-all street-border"
                      >
                        <Plus size={18} /> Novo Evento
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Create event form */}
              {!selectedEventId && isCreatingEvent && (
                <div className="street-card p-6 rounded-2xl border border-white/10 space-y-4">
                  <h4 className="text-white font-display text-lg uppercase tracking-wide">Novo Evento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Nome do Evento</label>
                      <input
                        type="text"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="Ex: Evento de Natal 2024"
                        className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Data do Evento</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={createEvent}
                      disabled={!newEventName.trim()}
                      className="px-6 py-3 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50"
                    >
                      Criar Evento
                    </button>
                    <button
                      onClick={() => { setIsCreatingEvent(false); setNewEventName(''); setNewEventDate(''); }}
                      className="px-6 py-3 bg-white/5 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition-all border border-white/10"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Events list */}
              {!selectedEventId && (
                isTabLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-urban-yellow" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl text-gray-500">
                    <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-urban">Nenhum evento criado ainda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((ev) => {
                      const photoCount = ev.gallery_photos?.[0]?.count ?? 0;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEventId(ev.id)}
                          className="street-card text-left p-5 rounded-2xl border border-white/10 hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-white font-display text-lg uppercase tracking-wide group-hover:text-urban-yellow transition-colors line-clamp-2">
                              {ev.name}
                            </h4>
                            <span className="shrink-0 px-2 py-1 rounded-full text-xs font-bold bg-urban-yellow/10 text-urban-yellow border border-urban-yellow/20">
                              {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                            </span>
                          </div>
                          {ev.event_date && (
                            <p className="text-gray-500 text-xs font-urban">
                              {format(new Date(ev.event_date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          )}
                          <p className="text-gray-600 text-[10px] font-urban mt-1">
                            Criado em {format(new Date(ev.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )
              )}

              {/* Event detail: upload + photo grid */}
              {selectedEventId && (
                <div className="space-y-6">
                  {/* Drop zone */}
                  {canEditTab('events_gallery') && (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files as FileList).filter((f: File) => f.type.startsWith('image/'));
                        if (files.length) uploadPhotos(files);
                      }}
                      className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center hover:border-urban-yellow/50 transition-colors group cursor-pointer"
                      onClick={() => document.getElementById('gallery-file-input')?.click()}
                    >
                      <ImageIcon size={40} className="mx-auto mb-3 text-gray-500 group-hover:text-urban-yellow transition-colors" />
                      <p className="text-gray-400 font-urban font-bold">Arraste fotos aqui ou clique para selecionar</p>
                      <p className="text-gray-600 text-xs mt-1">JPG, PNG, WEBP — múltiplas fotos permitidas</p>
                      <input
                        id="gallery-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from((e.target.files || []) as unknown as FileList) as File[];
                          if (files.length) uploadPhotos(files);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}

                  {/* Upload queue */}
                  {uploadQueue.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Enviando...</h5>
                      {uploadQueue.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-urban-gray rounded-xl px-4 py-3 border border-white/10">
                          <span className="text-xs text-gray-400 font-urban truncate flex-1">{item.file.name}</span>
                          <span className={cn(
                            'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                            item.status === 'compressing' ? 'bg-blue-500/15 text-blue-400' :
                            item.status === 'uploading' ? 'bg-urban-yellow/15 text-urban-yellow' :
                            item.status === 'done' ? 'bg-green-500/15 text-green-400' :
                            'bg-red-500/15 text-red-400'
                          )}>
                            {item.status === 'compressing' ? 'Comprimindo' :
                             item.status === 'uploading' ? 'Enviando' :
                             item.status === 'done' ? 'Concluído' : 'Erro'}
                          </span>
                          {(item.status === 'compressing' || item.status === 'uploading') && (
                            <Loader2 size={14} className="animate-spin text-urban-yellow shrink-0" />
                          )}
                          {item.status === 'done' && <Check size={14} className="text-green-400 shrink-0" />}
                          {item.status === 'error' && <X size={14} className="text-red-400 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Photos grid */}
                  {eventPhotos.length === 0 && uploadQueue.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-gray-500">
                      <ImageIcon size={36} className="mx-auto mb-3 opacity-30" />
                      <p className="font-urban text-sm">Nenhuma foto ainda. Envie a primeira!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {eventPhotos.map((photo) => (
                        <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-urban-gray border border-white/10">
                          <img
                            src={photo.public_url}
                            alt={photo.caption || 'Foto do evento'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {canDeleteTab('events_gallery') && (
                            <button
                              onClick={() => deletePhoto(photo)}
                              className="absolute top-2 right-2 p-1.5 bg-black/70 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                              title="Remover foto"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'settings' && canViewTab('settings') ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-start"
            >
              {/* Form */}
              <form onSubmit={handleSaveSettings} className="street-card p-10 rounded-3xl space-y-8">

                {/* Secao: Identidade */}
                <section className="space-y-4">
                  <div className="border-b border-white/10 pb-2 mb-4">
                    <h4 className="font-display text-xl text-urban-yellow tracking-wide uppercase">Identidade</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nome do Site" value={settings.site_name} onChange={(v) => setSettings({ ...settings, site_name: v })} />
                    <div>
                      <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Logo do Site (Upload)</label>
                      <div className="flex items-center gap-4">
                        {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="w-12 h-12 object-contain bg-white/5 rounded-lg" />}
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo_url', true)} className="flex-grow bg-urban-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-urban-yellow outline-none" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Secao: Tipografia */}
                <section className="space-y-4">
                  <div className="border-b border-white/10 pb-2 mb-4">
                    <h4 className="font-display text-xl text-urban-yellow tracking-wide uppercase">Tipografia</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Google Fonts URL" value={settings.google_fonts_url} onChange={(v) => setSettings({ ...settings, google_fonts_url: v })} placeholder="https://fonts.googleapis.com/css2?family=..." />
                    <Input label="Nome da Fonte (CSS)" value={settings.font_family} onChange={(v) => setSettings({ ...settings, font_family: v })} placeholder="Bebas Neue" />
                  </div>
                </section>

                {/* Secao: Redes & Midia */}
                <section className="space-y-4">
                  <div className="border-b border-white/10 pb-2 mb-4">
                    <h4 className="font-display text-xl text-urban-yellow tracking-wide uppercase">Redes &amp; Mídia</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </section>

                {settingsSaveStatus === 'ok' && (
                  <div role="status" aria-live="polite" className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold">Configurações salvas com sucesso.</div>
                )}
                {settingsSaveStatus === 'error' && (
                  <div role="alert" className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold">Erro ao salvar configurações. Tente novamente.</div>
                )}
                <button type="submit" disabled={settingsSaveStatus === 'saving' || isUploading} className="w-full py-5 bg-urban-yellow text-urban-black font-bold text-xl rounded-xl hover:bg-yellow-500 transition-all street-border flex items-center justify-center">
                  {settingsSaveStatus === 'saving' ? <><Loader2 size={24} className="animate-spin mr-2" />SALVANDO...</> : isUploading ? <Loader2 size={24} className="animate-spin" /> : 'SALVAR CONFIGURAÇÕES GERAIS'}
                </button>
              </form>

              {/* Live Preview */}
              <aside className="hidden md:block sticky top-6">
                <div className="street-card rounded-3xl p-6 space-y-4 bg-urban-black border border-white/10">
                  <h4 className="font-display text-lg text-urban-yellow tracking-wide uppercase border-b border-white/10 pb-2">Pré-visualização</h4>

                  <p
                    className="font-display text-3xl text-white leading-tight break-words"
                    style={{ fontFamily: settings.font_family ? `${settings.font_family}, sans-serif` : undefined }}
                  >
                    {settings.site_name || 'Nome do Site'}
                  </p>

                  {settings.logo_url && (
                    <img src={settings.logo_url} alt="Logo preview" className="h-12 object-contain" />
                  )}

                  <p
                    className="font-urban text-sm text-gray-300"
                    style={{ fontFamily: settings.font_family ? `${settings.font_family}, sans-serif` : undefined }}
                  >
                    Aqui vai aparecer como o texto do site ficará.
                  </p>

                  <div className="flex flex-col gap-1 pt-1">
                    {settings.instagram_url && (
                      <a
                        href={settings.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-urban-yellow/80 hover:text-urban-yellow underline truncate"
                      >
                        Instagram: {settings.instagram_url}
                      </a>
                    )}
                    {settings.youtube_url && (
                      <a
                        href={settings.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-urban-yellow/80 hover:text-urban-yellow underline truncate"
                      >
                        YouTube: {settings.youtube_url}
                      </a>
                    )}
                    {!settings.instagram_url && !settings.youtube_url && (
                      <p className="text-xs text-gray-600 italic">Preencha as URLs das redes sociais para visualizá-las aqui.</p>
                    )}
                  </div>
                </div>
              </aside>
            </motion.div>
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
                {activeTab !== 'registrations' && activeTab !== 'prayers' && activeTab !== 'volunteers' && activeTab !== 'collection' && canEditTab(activeTab) && (
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
                {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers' || activeTab === 'collection') && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">

                    <button
                      onClick={() => exportToCSV(visibleData)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors street-border"
                    >
                      <Download size={20} /> {activeTab === 'prayers' ? 'EXPORTAR PDF' : 'EXPORTAR CSV'}
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
                {activeTab === 'registrations' && (userProfile?.role === 'super_admin' || userProfile?.role === 'admin') && (
                  <div className="flex flex-wrap gap-3 mb-2">
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('all'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all', (filterRegistrations === 'all' && activeTab === 'registrations') ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10')}
                    >
                      Todos os Cadastros ({chipCounts.all})
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('acceptedJesus'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'acceptedJesus' && activeTab === 'registrations') ? 'bg-[#00FF66] text-black shadow-[0_0_15px_rgba(0,255,102,0.4)]' : 'bg-white/5 border border-white/10 text-[#00FF66] opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <Heart size={16} /> Aceitaram a Jesus (1a) ({chipCounts.acceptedJesus})
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('knowing'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'knowing' && activeTab === 'registrations') ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-white/5 border border-white/10 text-cyan-400 opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <UserPlus size={16} /> Estão Conhecendo ({chipCounts.knowing})
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('returning'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'returning' && activeTab === 'registrations') ? 'bg-orange-400 text-black shadow-[0_0_15px_rgba(251,146,60,0.4)]' : 'bg-white/5 border border-white/10 text-orange-300 opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <Heart size={16} /> Retornando ({chipCounts.returning})
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('wantsUpdates'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'wantsUpdates' && activeTab === 'registrations') ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 border border-white/10 text-purple-400 opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <Bell size={16} /> Querem Atualizações ({chipCounts.wantsUpdates})
                    </button>
                    <button
                      onClick={() => { setActiveTab('registrations'); setFilterRegistrations('noBible'); }}
                      className={cn('px-5 py-2.5 rounded-full font-display tracking-widest uppercase text-sm transition-all flex items-center gap-2', (filterRegistrations === 'noBible' && activeTab === 'registrations') ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'bg-white/5 border border-white/10 text-amber-300 opacity-70 hover:opacity-100 hover:bg-white/10')}
                    >
                      <BookOpen size={16} /> Sem Bíblia ({chipCounts.noBible})
                    </button>
                  </div>
                )}

                {/* Volunteer-specific filters: status + area */}
                {activeTab === 'volunteers' && (
                  <div className="flex flex-col gap-3 mb-2">
                    {/* Status filter chips */}
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'disponivel', 'escalado', 'inativo'] as const).map((s) => {
                        const cfg = s !== 'all' ? VOLUNTEER_STATUS_CONFIG[s] : null;
                        const isActive = volunteerStatusFilter === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setVolunteerStatusFilter(s)}
                            className={cn(
                              'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 border',
                              isActive
                                ? (cfg ? cn(cfg.color, 'shadow-sm') : 'bg-white text-black border-white')
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            {cfg && <span className={cn('w-1.5 h-1.5 rounded-full inline-block', cfg.dot)} />}
                            {s === 'all' ? 'Todos' : cfg!.label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Area filter chips */}
                    {volunteerAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setVolunteerAreaFilter('all')}
                          className={cn(
                            'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all border',
                            volunteerAreaFilter === 'all'
                              ? 'bg-urban-yellow text-urban-black border-urban-yellow'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          Todas as áreas
                        </button>
                        {volunteerAreas.map((area) => (
                          <button
                            key={area}
                            onClick={() => setVolunteerAreaFilter(area)}
                            className={cn(
                              'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all border',
                              volunteerAreaFilter === area
                                ? 'bg-urban-yellow/20 text-urban-yellow border-urban-yellow/40'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-urban-yellow/10 hover:text-urban-yellow hover:border-urban-yellow/20'
                            )}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Master checkbox — visible only in Cadastros tab */}
                {activeTab === 'registrations' && !isTabLoading && visibleData.length > 0 && (
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos visíveis"
                      ref={(el) => {
                        (masterCheckboxRef as any).current = el;
                        if (el) {
                          const allSelected = visibleData.length > 0 && visibleData.every((d: any) => selectedIds.has(d.id));
                          const someSelected = !allSelected && visibleData.some((d: any) => selectedIds.has(d.id));
                          el.checked = allSelected;
                          el.indeterminate = someSelected;
                        }
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(visibleData.map((d: any) => d.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded accent-urban-yellow cursor-pointer"
                    />
                    <span className="text-gray-500 text-xs font-urban uppercase tracking-widest">
                      Selecionar todos ({visibleData.length})
                    </span>
                  </div>
                )}

                {/* Bulk actions toolbar — visible when items are selected in Cadastros */}
                {activeTab === 'registrations' && selectedIds.size > 0 && (
                  <div className="sticky top-0 z-20 bg-urban-gray border border-urban-yellow/40 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 mb-4 shadow-[0_0_15px_rgba(255,232,31,0.1)]">
                    <span className="text-white font-bold text-sm">{selectedIds.size} selecionado(s)</span>

                    <button
                      onClick={() => exportToCSV(visibleData.filter((d: any) => selectedIds.has(d.id)))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold hover:bg-green-500/25 transition-colors"
                    >
                      <Download size={14} /> Exportar seleção
                    </button>

                    <button
                      onClick={() => {
                        const selected = visibleData.filter((d: any) => selectedIds.has(d.id) && hasNoBible(d));
                        selected.forEach((item: any) => toggleBibleDeliveredStatus(item.id));
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/15 text-amber-300 border border-amber-300/30 rounded-lg text-xs font-bold hover:bg-amber-400/25 transition-colors"
                    >
                      <BookOpen size={14} /> Marcar Bíblia entregue
                    </button>

                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const newStatus = e.target.value;
                        selectedIds.forEach((id) => moveCadastroToStage(id, newStatus));
                        e.target.value = '';
                      }}
                      className="bg-urban-gray border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-urban-yellow/60 outline-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Mudar status...</option>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-400 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 hover:text-white transition-colors ml-auto"
                    >
                      <X size={14} /> Limpar seleção
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
                        {activeTab === 'team' ? 'Nenhum membro encontrado na equipe.' : activeTab === 'prayers' && !normalizedSearchTerm ? 'Nenhum pedido de oração pendente no momento. Todas as orações foram cobertas.' : 'Nenhum dado encontrado aqui.'}
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
                        {/* Per-row checkbox — only in Cadastros */}
                        {activeTab === 'registrations' && (
                          <input
                            type="checkbox"
                            aria-label={`Selecionar ${item.name}`}
                            checked={selectedIds.has(item.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(item.id);
                                else next.delete(item.id);
                                return next;
                              });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded accent-urban-yellow cursor-pointer shrink-0"
                          />
                        )}
                        {/* activeTab === 'banners' && <img src={item.image_url} className="w-20 h-12 object-cover rounded-lg" /> */}
                        {activeTab === 'team' && <img src={item.photo_url} className="w-12 h-12 object-cover rounded-full" />}
                        {/* activeTab === 'lives' && <div className="w-12 h-12 bg-urban-yellow/10 rounded-xl flex items-center justify-center text-urban-yellow"><Radio size={24} /></div> */}
                        {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers' || activeTab === 'collection') && (
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
                        <div className={cn("flex-grow min-w-0", (activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers' || activeTab === 'collection') ? "overflow-visible" : "overflow-hidden")}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn("font-urban font-bold text-white text-lg min-w-0 max-w-full", (activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers' || activeTab === 'collection') ? "whitespace-normal break-words leading-snug" : "truncate", activeTab === 'prayers' && item.prayer_done && "text-gray-500 line-through")}>{item.title || item.name || 'Sem Título'}</h4>
                            {item.accepted_jesus && !item.is_returning && (
                              <span className="shrink-0 px-2 py-0.5 bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-bold rounded uppercase tracking-wider">Aceitou Jesus</span>
                            )}
                            {item.is_returning && (
                              <span className="shrink-0 px-2 py-0.5 bg-orange-400/15 text-orange-300 text-[10px] font-bold rounded uppercase tracking-wider border border-orange-300/30">Retornando</span>
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
                            {/* Status badge CRM — registrations */}
                            {activeTab === 'registrations' && (() => {
                              const st = getStatus(item);
                              const cfg = STATUS_CONFIG[st];
                              return cfg ? (
                                <span className={cn('shrink-0 px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider flex items-center gap-1', cfg.color)}>
                                  <span className={cn('w-1.5 h-1.5 rounded-full inline-block', cfg.dot)} />
                                  {cfg.label}
                                </span>
                              ) : null;
                            })()}
                            {/* Status badge — volunteers */}
                            {(activeTab === 'volunteers' || activeTab === 'collection') && (() => {
                              const vst = getVolunteerStatus(item);
                              const vcfg = VOLUNTEER_STATUS_CONFIG[vst];
                              return vcfg ? (
                                <span className={cn('shrink-0 px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider flex items-center gap-1', vcfg.color)}>
                                  <span className={cn('w-1.5 h-1.5 rounded-full inline-block', vcfg.dot)} />
                                  {vcfg.label}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <p className="text-gray-500 text-sm">
                            {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers' || activeTab === 'collection') ? (
                              <span className={cn("flex flex-col gap-1", activeTab === 'prayers' && item.prayer_done && "opacity-50")}>
                                <span className="flex items-center gap-2 flex-wrap">
                                  {item.whatsapp}
                                  {item.instagram && (activeTab === 'registrations' || activeTab === 'volunteers' || activeTab === 'collection') && (
                                    <span className="text-pink-300 text-xs italic shrink-0">
                                      • IG: {item.instagram}
                                    </span>
                                  )}
                                  {item.prayer_request && activeTab === 'registrations' && <span className="text-blue-400 text-xs italic flex items-center gap-1 shrink-0">• <MessageCircle size={10} /> Tem pedido de oração</span>}
                                  {(activeTab === 'volunteers' || activeTab === 'collection') && item.city && (
                                    <span className="text-gray-400 text-xs italic shrink-0">
                                      • {item.city}
                                      {item.age && <span> · {item.age} anos</span>}
                                    </span>
                                  )}
                                </span>
                                {activeTab === 'prayers' && item.prayer_request && (
                                  <span className="text-white font-urban bg-white/5 p-2 rounded-lg mt-1 border-l-2 border-blue-400 line-clamp-1">
                                    "{item.prayer_request}"
                                  </span>
                                )}
                                {(activeTab === 'volunteers' || activeTab === 'collection') && item.how_to_help && item.how_to_help.length > 0 && (
                                  <span className="flex flex-wrap gap-1 mt-1">
                                    {(item.how_to_help as string[]).map((area) => (
                                      <span key={area} className="text-[11px] px-2 py-0.5 rounded-full bg-urban-yellow/15 text-urban-yellow border border-urban-yellow/20">
                                        {area}
                                      </span>
                                    ))}
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
                          {(activeTab === 'registrations' || activeTab === 'prayers' || activeTab === 'volunteers' || activeTab === 'collection') && (
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
                              {activeTab === 'registrations' && hasNoBible(item) && (
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
                              {/* Inline status select — only in Cadastros */}
                              {activeTab === 'registrations' && (
                                <select
                                  value={item.status || 'novo'}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    moveCadastroToStage(item.id, e.target.value);
                                  }}
                                  className="bg-urban-gray border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:border-urban-yellow/60 outline-none"
                                  title="Mudar status"
                                >
                                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                  ))}
                                </select>
                              )}
                              {/* Inline volunteer status select */}
                              {(activeTab === 'volunteers' || activeTab === 'collection') && (
                                <select
                                  value={getVolunteerStatus(item)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateVolunteerStatus(item.id, e.target.value);
                                  }}
                                  className="bg-urban-gray border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:border-urban-yellow/60 outline-none"
                                  title="Mudar status do voluntário"
                                >
                                  {Object.entries(VOLUNTEER_STATUS_CONFIG).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                            {activeTab !== 'registrations' && activeTab !== 'prayers' && activeTab !== 'volunteers' && activeTab !== 'collection' && canEditTab(activeTab) && (
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
                className="fixed inset-0 z-[100] flex items-start md:items-center justify-center bg-black/90 backdrop-blur-sm px-2 md:px-4 py-4 overflow-y-auto"
                onClick={() => setSelectedRegistration(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-urban-gray rounded-2xl md:rounded-3xl max-w-2xl w-full border border-white/10 overflow-hidden shadow-2xl my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 md:p-8 border-b border-white/10 flex justify-between items-start gap-3 bg-gradient-to-r from-urban-black to-transparent">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <div className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          selectedRegistration.accepted_jesus ? "bg-[#00FF66]/10 text-[#00FF66]" : "bg-urban-yellow/10 text-urban-yellow"
                        )}>
                          CADASTRO #{selectedRegistration.id.slice(0, 8)}
                        </div>
                        {selectedRegistration.accepted_jesus && !selectedRegistration.is_returning && (
                          <div className="flex items-center gap-1 text-[#00FF66] font-bold text-[10px] uppercase tracking-widest">
                            <Heart size={12} fill="currentColor" /> ACEITOU JESUS
                          </div>
                        )}
                        {selectedRegistration.is_returning && (
                          <div className="flex items-center gap-1 text-orange-300 font-bold text-[10px] uppercase tracking-widest">
                            <Heart size={12} fill="currentColor" /> RETORNANDO
                          </div>
                        )}
                      </div>
                      <h2 className="font-display text-2xl md:text-5xl text-white leading-tight md:leading-none break-words">{selectedRegistration.name}</h2>
                    </div>
                    <button
                      onClick={() => setSelectedRegistration(null)}
                      className="shrink-0 p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="p-4 md:p-8 space-y-4 md:space-y-6">

                    {/* === CRM: Status + Notas === */}
                    {(activeTab === 'registrations' || activeTab === 'volunteers' || activeTab === 'collection' || activeTab === 'crm_pipeline') && (
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
                    {(activeTab === 'volunteers' || activeTab === 'collection') ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <DetailItem icon={<MessageCircle className="text-green-500" />} label="WhatsApp" value={selectedRegistration.whatsapp} isCopy />
                          <DetailItem icon={<ExternalLink className="text-pink-400" />} label="Instagram" value={selectedRegistration.instagram || 'Não informado'} isCopy={!!selectedRegistration.instagram} />
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
                          <DetailItem icon={<ExternalLink className="text-pink-400" />} label="Instagram" value={selectedRegistration.instagram || 'Não informado'} isCopy={!!selectedRegistration.instagram} />
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

                  <div className="p-4 md:p-6 bg-urban-black border-t border-white/5 flex gap-3">
                    <a
                      href={`https://wa.me/55${selectedRegistration.whatsapp?.replace(/\D/g, '')}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-2 py-3 md:py-4 bg-[#25D366] text-white font-bold text-sm md:text-base rounded-xl hover:bg-[#20ba59] transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                    >
                      <MessageCircle size={20} /> CHAMAR NO WHATSAPP
                    </a>
                    {canDeleteTab(activeTab === 'crm_pipeline' ? 'registrations' : activeTab) && (
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setDeletePassword('');
                          setItemToDelete(selectedRegistration.id);
                          setSelectedRegistration(null);
                        }}
                        className="p-4 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        title="Deletar registro"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
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

// ── Pipeline helpers ──────────────────────────────────────────────────────────

interface PipelineCardProps {
  item: any;
  stageKey: string;
  stageLabel: string;
  parsed: { owner: string; notes: string };
  hasNoBibleFn: (item: any) => boolean;
  getInitialsFn: (s: string) => string;
  onClick: () => void;
}

const PipelineCard: React.FC<PipelineCardProps> = ({
  item,
  stageKey,
  stageLabel,
  parsed,
  hasNoBibleFn,
  getInitialsFn,
  onClick,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${item.id}`,
    data: { stageKey, item },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
    touchAction: 'none',
  };

  const createdShort = item.created_at
    ? (() => {
        try {
          const d = new Date(item.created_at);
          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        } catch {
          return '';
        }
      })()
    : '';

  const initials = getInitialsFn(parsed.owner);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`${item.name || 'Sem nome'} — ${stageLabel}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "relative group bg-urban-gray rounded-2xl p-3 space-y-2 transition-all md:cursor-grab active:cursor-grabbing ring-1 ring-white/10 hover:ring-white/20 hover:shadow-[0_0_15px_rgba(255,232,31,0.1)]",
        "before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-white/10 before:transition-colors",
        "hover:before:bg-urban-yellow/40",
        isDragging ? "scale-[0.98]" : ""
      )}
    >
      {/* Header row: name + owner avatar */}
      <div className="flex items-start justify-between gap-2">
        <h5
          className="font-urban font-bold text-white text-sm line-clamp-2 leading-snug break-words flex-1"
          title={item.name || 'Sem nome'}
        >
          {item.name || 'Sem nome'}
        </h5>
        {parsed.owner ? (
          <div
            className="shrink-0 w-6 h-6 rounded-full bg-urban-yellow/20 border border-urban-yellow/40 flex items-center justify-center text-[9px] font-bold text-urban-yellow"
            title={parsed.owner}
          >
            {initials || '?'}
          </div>
        ) : (
          <div
            className="shrink-0 w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[10px] text-gray-500 hover:border-urban-yellow/50 hover:text-urban-yellow transition-colors cursor-pointer"
            title="Atribuir responsável"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            +
          </div>
        )}
      </div>

      {/* Metadata: whatsapp + date | city • neighborhood */}
      <div className="text-xs text-gray-300 space-y-0.5 leading-relaxed">
        <p className="flex items-center gap-1.5">
          <span>{item.whatsapp || 'Sem WhatsApp'}</span>
          {createdShort && <span className="text-gray-500">• {createdShort}</span>}
        </p>
        {(item.city || item.neighborhood) && (
          <p className="text-gray-400 line-clamp-1">
            {[item.city, item.neighborhood].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {item.accepted_jesus && !item.is_returning && (
          <span className="text-[10px] px-2 py-0.5 bg-[#00FF66]/10 text-[#00FF66] rounded-full uppercase font-bold border border-[#00FF66]/20">
            Aceitou Jesus
          </span>
        )}
        {item.is_returning && (
          <span className="text-[10px] px-2 py-0.5 bg-orange-400/15 text-orange-300 rounded-full uppercase font-bold border border-orange-300/30">
            Retornando
          </span>
        )}
        {hasNoBibleFn(item) && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/12 text-amber-300 uppercase font-bold border border-amber-300/20">
            Sem Bíblia
          </span>
        )}
      </div>
    </div>
  );
};

interface PipelineColumnProps {
  stageKey: string;
  children: React.ReactNode;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stageKey,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${stageKey}`,
    data: { stageKey },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] space-y-2 max-h-[65vh] overflow-y-auto pipeline-scrollbar pr-1 transition-colors rounded-xl",
        isOver ? "bg-urban-yellow/[0.04] ring-1 ring-urban-yellow/30" : ""
      )}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

function SidebarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-xl font-urban font-bold text-sm transition-all text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urban-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-urban-black",
        active
          ? "bg-urban-yellow text-urban-black shadow-lg before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-urban-yellow before:rounded-r"
          : "text-gray-400 hover:bg-white/5 hover:text-white",
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
