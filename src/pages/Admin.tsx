import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, Check, X, Eye, Users, BarChart3, Clock, UserCog, Activity, GitBranch, MessageSquare, FileText, Download, Upload, ImageIcon, Settings, Trash2, RefreshCw, Save, Loader2, Heart, Globe, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { DBModel, MODEL_TYPE_LABELS, MODEL_STATUS_LABELS, ModelStatus } from '@/types/model';
import TypeBadge from '@/components/lab/TypeBadge';
import LangBadge from '@/components/lab/LangBadge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const stripMd = (md: string) =>
  md.replace(/#{1,6}\s+/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{2,}/g, ' ')
    .trim();

interface ProfileRow {
  user_id: string;
  display_name: string;
  created_at: string;
}

interface RoleRow {
  user_id: string;
  role: string;
}

const STATUS_ORDER: ModelStatus[] = ['brouillon', 'en_revision', 'en_test', 'publie', 'en_evolution'];

const Admin = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isAdmin, canManage, loading: adminLoading } = useAdmin();
  const [models, setModels] = useState<(DBModel & { author_name?: string })[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Images
  const [images, setImages] = useState<{ name: string; path: string; size: number; updated_at: string; url: string }[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingPath, setReplacingPath] = useState<string | null>(null);

  // Settings
  const [maxImageSizeMb, setMaxImageSizeMb] = useState(2);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAll = async () => {
      // Fetch models
      const { data: modelsData } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all profiles
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name, created_at')
        .order('created_at', { ascending: false });

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Fetch posts count
      const { count: pCount } = await supabase
        .from('forum_posts')
        .select('id', { count: 'exact', head: true });

      const map: Record<string, string> = {};
      const profsList = (profs || []) as ProfileRow[];
      profsList.forEach((p) => { map[p.user_id] = p.display_name; });
      setProfileMap(map);
      setAllProfiles(profsList);
      setRoles((rolesData || []) as RoleRow[]);
      setUsersCount(profsList.length);
      setPostsCount(pCount || 0);

      if (modelsData) {
        setModels(modelsData.map((m: any) => ({ ...m, uploader_name: map[m.user_id] })) as any);
      }
      setLoading(false);
    };
    fetchAll();
  }, [isAdmin]);

  const loadImages = async () => {
    setImagesLoading(true);
    const { data: folders } = await supabase.storage.from('model-images').list('', { limit: 100 });
    const allFiles: typeof images = [];
    if (folders) {
      for (const folder of folders) {
        if (folder.id) {
          // It's a file at root
          const { data: { publicUrl } } = supabase.storage.from('model-images').getPublicUrl(folder.name);
          allFiles.push({ name: folder.name, path: folder.name, size: (folder.metadata as any)?.size || 0, updated_at: folder.updated_at || '', url: publicUrl });
        } else {
          // It's a folder, list its contents
          const { data: files } = await supabase.storage.from('model-images').list(folder.name, { limit: 200 });
          if (files) {
            for (const f of files) {
              if (!f.id) continue;
              const filePath = `${folder.name}/${f.name}`;
              const { data: { publicUrl } } = supabase.storage.from('model-images').getPublicUrl(filePath);
              allFiles.push({ name: f.name, path: filePath, size: (f.metadata as any)?.size || 0, updated_at: f.updated_at || '', url: publicUrl });
            }
          }
        }
      }
    }
    setImages(allFiles);
    setImagesLoading(false);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'max_image_size_mb').single();
    if (data?.value != null) setMaxImageSizeMb(Number(data.value));
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadImages();
    loadSettings();
  }, [isAdmin]);

  const handleDeleteImage = async (path: string) => {
    const { error } = await supabase.storage.from('model-images').remove([path]);
    if (error) { toast.error(t('admin.deleteError')); return; }
    setImages(prev => prev.filter(i => i.path !== path));
    toast.success(t('admin.imageDeleted'));
  };

  const handleReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingPath) return;
    if (!file.type.startsWith('image/')) { toast.error(t('profile.onlyImages')); return; }
    if (file.size > maxImageSizeMb * 1024 * 1024) { toast.error(`Max ${maxImageSizeMb} Mo`); return; }

    const { error } = await supabase.storage.from('model-images').update(replacingPath, file, { upsert: true });
    if (error) { toast.error(t('admin.replaceError')); console.error(error); return; }
    toast.success(t('admin.imageReplaced'));
    setReplacingPath(null);
    loadImages();
    if (replaceInputRef.current) replaceInputRef.current.value = '';
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    const { error } = await supabase.from('app_settings').update({ value: maxImageSizeMb, updated_at: new Date().toISOString() } as any).eq('key', 'max_image_size_mb');
    setSettingsSaving(false);
    if (error) { toast.error(t('admin.settingsError')); return; }
    toast.success(t('admin.settingsSaved'));
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('models').update({ approved: true } as any).eq('id', id);
    if (error) { toast.error(t('auth.error')); return; }
    setModels(prev => prev.map(m => m.id === id ? { ...m, approved: true } : m));
    toast.success(t('admin.validated'));
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('models').delete().eq('id', id);
    if (error) { toast.error(t('auth.error')); return; }
    setModels(prev => prev.filter(m => m.id !== id));
    toast.success(t('admin.rejected'));
  };

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(t('admin.exported', { filename }));
  };

  const exportModels = () => {
    const headers = ['ID', 'Titre', 'Type', 'Statut', 'Version', 'Complexité', 'Approuvé', 'Auteur', 'Chargé par', 'Vues', 'Feedbacks', 'Variations', 'Tags', 'Créé le', 'Mis à jour'];
    const rows = models.map(m => [m.id, m.title, m.type, m.status, m.version, m.complexity, m.approved ? 'Oui' : 'Non', m.author_name || '', (m as any).uploader_name || '', String(m.views_count), String(m.feedback_count), String(m.variations_count), m.tags.join('; '), m.created_at, m.updated_at]);
    downloadCSV('models_export.csv', headers, rows);
  };

  const exportUsers = () => {
    const headers = ['User ID', 'Nom', 'Inscrit le', 'Rôle'];
    const rows = allProfiles.map(p => [p.user_id, p.display_name, p.created_at, roles.some(r => r.user_id === p.user_id && r.role === 'admin') ? 'Admin' : 'Utilisateur']);
    downloadCSV('users_export.csv', headers, rows);
  };

  const exportPosts = async () => {
    const { data } = await supabase.from('forum_posts').select('*').order('created_at', { ascending: false });
    if (!data || data.length === 0) { toast.error(t('admin.noActivity')); return; }
    const headers = ['ID', 'Titre', 'Catégorie', 'Contenu', 'Likes', 'Commentaires', 'User ID', 'Créé le'];
    const rows = data.map((p: any) => [p.id, p.title, p.category, p.content, String(p.likes_count), String(p.comments_count), p.user_id, p.created_at]);
    downloadCSV('posts_export.csv', headers, rows);
  };

  if (adminLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  if (!user || !canManage) return <Navigate to="/" replace />;

  const pending = models.filter(m => !m.approved);
  const approved = models.filter(m => m.approved);
  const statusCounts: Record<string, number> = {};
  models.forEach(m => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });
  const recentModels = models.slice(0, 8);

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <ShieldCheck className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t('admin.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('admin.subtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Link to="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all">
              <Users className="h-3.5 w-3.5" /> {t('admin.manageUsers')}
            </Link>
          )}
          <Link to="/admin/annonce"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-all">
            <Activity className="h-3.5 w-3.5" /> {t('admin.announcement')}
          </Link>
          <Link to="/admin/donations"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all">
            <Heart className="h-3.5 w-3.5" /> {t('admin.donations')}
          </Link>
          <Link to="/admin/import"
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground hover:brightness-110 transition-all">
            <Upload className="h-3.5 w-3.5" /> {t('admin.importModel')}
          </Link>
          <button onClick={exportModels}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> {t('admin.modelsCSV')}
          </button>
          <button onClick={exportUsers}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> {t('admin.usersCSV')}
          </button>
          <button onClick={exportPosts}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> {t('admin.postsCSV')}
          </button>
          <Link to="/admin/guide"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <FileText className="h-3.5 w-3.5" /> {t('admin.adminGuide')}
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <StatBox label={t('admin.pending')} value={pending.length} icon={<Clock className="h-5 w-5 text-amber-500" />} highlight={pending.length > 0} />
        <StatBox label={`${t('admin.validatedModels')} FR`} value={approved.filter(m => (m.lang || 'fr') === 'fr').length} icon={<Check className="h-5 w-5 text-emerald-500" />} />
        <StatBox label={`${t('admin.validatedModels')} EN`} value={approved.filter(m => (m.lang || 'fr') === 'en').length} icon={<Check className="h-5 w-5 text-blue-500" />} />
        <StatBox label={t('admin.totalModels')} value={models.length} icon={<FileText className="h-5 w-5 text-secondary" />} />
        <StatBox label={t('admin.users')} value={usersCount} icon={<Users className="h-5 w-5 text-primary" />} />
        <StatBox label={t('admin.forumPosts')} value={postsCount} icon={<MessageSquare className="h-5 w-5 text-accent" />} />
        <StatBox label={`${t('admin.publishedStat')} FR`} value={models.filter(m => m.status === 'publie' && (m.lang || 'fr') === 'fr').length} icon={<BarChart3 className="h-5 w-5 text-lab-teal" />} />
        <StatBox label={`${t('admin.publishedStat')} EN`} value={models.filter(m => m.status === 'publie' && (m.lang || 'fr') === 'en').length} icon={<BarChart3 className="h-5 w-5 text-blue-500" />} />
      </div>

      {/* Models by status breakdown */}
      <div className="mb-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.statusBreakdown')}</h2>
        <div className="flex flex-wrap gap-3">
          {STATUS_ORDER.map(s => (
            <div key={s} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <span className="text-sm font-medium text-foreground">{t('modelStatuses.' + s)}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold text-foreground">{statusCounts[s] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6 w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            {t('admin.pendingTab', { count: pending.length })}
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            {t('admin.validatedTab', { count: approved.length })}
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            <Activity className="mr-1.5 inline h-3.5 w-3.5" /> {t('admin.recentActivity')}
          </TabsTrigger>
          <TabsTrigger value="images" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            <ImageIcon className="mr-1.5 inline h-3.5 w-3.5" /> {t('admin.imagesCount', { count: images.length })}
          </TabsTrigger>
          <TabsTrigger value="translations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            <Globe className="mr-1.5 inline h-3.5 w-3.5" /> {t('admin.translations')}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
              <Settings className="mr-1.5 inline h-3.5 w-3.5" /> {t('admin.settings')}
            </TabsTrigger>
          )}
        </TabsList>

        {/* PENDING */}
        <TabsContent value="pending">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : pending.length === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-10 w-10" />} text={t('admin.noPending')} />
          ) : (
            <div className="space-y-4">
              {pending.map(model => (
                <PendingCard key={model.id} model={model} onApprove={handleApprove} onReject={handleReject} t={t} i18n={i18n} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* APPROVED */}
        <TabsContent value="approved">
          {approved.length === 0 ? (
            <EmptyState icon={<FileText className="h-10 w-10" />} text={t('admin.noValidated')} />
          ) : (
            <div className="space-y-3">
              {approved.map(model => (
                <Link key={model.id} to={`/model/${model.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-secondary/30 transition-colors">
                  <TypeBadge type={model.type as any} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{model.title}</p>
                    <p className="text-xs text-muted-foreground">par {model.author_name || (model as any).uploader_name || t('common.anonymous')} · {t('modelStatuses.' + model.status)}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">{model.views_count} vues · {model.feedback_count} feedbacks</p>
                    <p className="text-xs text-muted-foreground">{new Date(model.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity">
          {recentModels.length === 0 ? (
            <EmptyState icon={<Activity className="h-10 w-10" />} text={t('admin.noActivity')} />
          ) : (
            <div className="space-y-2">
              {recentModels.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <div className={`h-2 w-2 rounded-full ${m.approved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <TypeBadge type={m.type as any} />
                  <Link to={`/model/${m.id}`} className="flex-1 truncate text-sm font-medium text-foreground hover:text-secondary">{m.title}</Link>
                  <span className="text-xs text-muted-foreground">{m.author_name || t('common.anonymous')}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(m.updated_at), { addSuffix: true, locale: i18n.language?.startsWith('en') ? undefined : fr })}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>



        {/* IMAGES */}
        <TabsContent value="images">
          <input ref={replaceInputRef} type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleReplaceImage} />
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('admin.imagesStored', { count: images.length })}</p>
            <button onClick={loadImages} disabled={imagesLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <RefreshCw className={`h-3.5 w-3.5 ${imagesLoading ? 'animate-spin' : ''}`} /> {t('admin.refresh')}
            </button>
          </div>
          {imagesLoading ? (
            <div className="py-10 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : images.length === 0 ? (
            <EmptyState icon={<ImageIcon className="h-10 w-10" />} text={t('admin.noImages')} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {images.map(img => (
                <div key={img.path} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`${img.url}?t=${Date.now()}`} alt={img.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-foreground truncate" title={img.path}>{img.name}</p>
                    <p className="text-[10px] text-muted-foreground">{img.path}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {img.size > 0 ? `${(img.size / 1024).toFixed(0)} Ko` : ''}{img.updated_at ? ` · ${new Date(img.updated_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}` : ''}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => { setReplacingPath(img.path); replaceInputRef.current?.click(); }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground">
                        <RefreshCw className="h-3 w-3" /> {t('admin.replace')}
                      </button>
                      <button onClick={() => handleDeleteImage(img.path)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                        <Trash2 className="h-3 w-3" /> {t('common.delete')}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(img.url); toast.success(t('admin.urlCopied')); }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground">
                        {t('admin.copyUrl')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TRANSLATIONS */}
        <TabsContent value="translations">
          <TranslationDashboard models={models} t={t} />
        </TabsContent>

        {/* PARAMÈTRES */}
        <TabsContent value="settings">
          <div className="max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">{t('admin.appSettings')}</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('admin.maxImageSize')}</label>
                <p className="mb-2 text-xs text-muted-foreground">{t('admin.maxImageSizeDesc')}</p>
                <input type="number" value={maxImageSizeMb} onChange={e => setMaxImageSizeMb(Math.max(0.1, Number(e.target.value)))}
                  min={0.1} max={50} step={0.5}
                  className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
                <span className="ml-2 text-sm text-muted-foreground">Mo</span>
              </div>
              <div className="border-t border-border pt-4">
                <button onClick={saveSettings} disabled={settingsSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
                  {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {settingsSaving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EmptyState = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="rounded-xl border border-dashed border-border py-16 text-center">
    <div className="mx-auto mb-3 text-muted-foreground/30">{icon}</div>
    <p className="text-muted-foreground">{text}</p>
  </div>
);

const PendingCard = ({ model, onApprove, onReject, t, i18n }: {
  model: DBModel & { author_name?: string };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  t: (key: string, options?: any) => string;
  i18n: { language?: string };
}) => (
  <div className="rounded-xl border border-amber-500/20 bg-card p-5 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <TypeBadge type={model.type as any} />
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">{t('admin.pending')}</span>
      </div>
      <span className="text-xs text-muted-foreground">{new Date(model.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}</span>
    </div>
    <h3 className="mb-1 font-display text-lg font-semibold text-foreground">{model.title}</h3>
    <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{stripMd(model.summary || model.description || '')}</p>
    <div className="mb-4 flex flex-wrap gap-1.5">
      {model.tags.slice(0, 5).map(tag => (
        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
      ))}
    </div>
    <div className="flex items-center justify-between border-t border-border pt-4">
      <span className="text-xs text-muted-foreground">par {model.author_name || (model as any).uploader_name || t('common.anonymous')} · {model.complexity}</span>
      <div className="flex gap-2">
        <Link to={`/model/${model.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <Eye className="h-3.5 w-3.5" /> {t('admin.view')}
        </Link>
        <button onClick={() => onReject(model.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5">
          <X className="h-3.5 w-3.5" /> {t('admin.reject')}
        </button>
        <button onClick={() => onApprove(model.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
          <Check className="h-3.5 w-3.5" /> {t('admin.validate')}
        </button>
      </div>
    </div>
  </div>
);

const StatBox = ({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) => (
  <div className={`rounded-xl border p-4 text-center ${highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card'}`}>
    <div className="mx-auto mb-1">{icon}</div>
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const TranslationDashboard = ({ models, t }: {
  models: (DBModel & { author_name?: string })[];
  t: (key: string, options?: any) => string;
}) => {
  const approvedModels = models.filter(m => m.approved);
  const modelMap = new Map(approvedModels.map(m => [m.id, m]));

  // Build translation pairs
  interface TranslationPair {
    original: DBModel & { author_name?: string };
    translation: DBModel & { author_name?: string };
  }
  const pairs: TranslationPair[] = [];
  const pairedIds = new Set<string>();

  for (const m of approvedModels) {
    if (m.translation_of && modelMap.has(m.translation_of) && !pairedIds.has(m.id)) {
      pairs.push({ original: modelMap.get(m.translation_of)!, translation: m });
      pairedIds.add(m.id);
      pairedIds.add(m.translation_of);
    }
  }

  const withoutTranslation = approvedModels.filter(m => !pairedIds.has(m.id));

  // Detect inconsistencies
  interface Inconsistency {
    type: 'approach_mismatch' | 'orphan' | 'bidirectional';
    models: (DBModel & { author_name?: string })[];
    detail: string;
  }
  const inconsistencies: Inconsistency[] = [];

  // Check approach mismatches in pairs
  for (const pair of pairs) {
    const origApproche = pair.original.approche_id;
    const transApproche = pair.translation.approche_id;
    if (origApproche && transApproche) {
      // Both have approaches — check if they're translations of each other
      const origApp = modelMap.get(origApproche);
      const transApp = modelMap.get(transApproche);
      if (origApp && transApp) {
        const linked = origApp.translation_of === transApp.id || transApp.translation_of === origApp.id;
        if (!linked) {
          inconsistencies.push({
            type: 'approach_mismatch',
            models: [pair.original, pair.translation],
            detail: `${pair.original.title} → ${origApp.title} | ${pair.translation.title} → ${transApp.title}`,
          });
        }
      }
    } else if ((origApproche && !transApproche) || (!origApproche && transApproche)) {
      inconsistencies.push({
        type: 'approach_mismatch',
        models: [pair.original, pair.translation],
        detail: origApproche
          ? `${pair.original.title}: ${modelMap.get(origApproche)?.title || '?'} | ${pair.translation.title}: ${t('admin.noApproach')}`
          : `${pair.original.title}: ${t('admin.noApproach')} | ${pair.translation.title}: ${modelMap.get(transApproche!)?.title || '?'}`,
      });
    }
  }

  // Check orphan translations
  for (const m of approvedModels) {
    if (m.translation_of && !modelMap.has(m.translation_of)) {
      inconsistencies.push({
        type: 'orphan',
        models: [m],
        detail: `translation_of = ${m.translation_of.slice(0, 8)}...`,
      });
    }
  }

  // Check bidirectional links
  for (const pair of pairs) {
    if (pair.original.translation_of === pair.translation.id) {
      inconsistencies.push({
        type: 'bidirectional',
        models: [pair.original, pair.translation],
        detail: `${pair.original.title} ↔ ${pair.translation.title}`,
      });
    }
  }

  // Group models without translation by type
  const approchesWithout = withoutTranslation.filter(m => m.type === 'approche');
  const outilsWithout = withoutTranslation.filter(m => m.type === 'outil');
  const probsWithout = withoutTranslation.filter(m => m.type === 'problematique');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 font-display text-lg font-bold text-foreground">{t('admin.translationDashboard')}</h2>
        <p className="text-sm text-muted-foreground">{t('admin.translationDashboardDesc')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-display text-2xl font-bold text-emerald-600">{pairs.length}</p>
          <p className="text-xs text-muted-foreground">{t('admin.withTranslation')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-display text-2xl font-bold text-amber-600">{withoutTranslation.length}</p>
          <p className="text-xs text-muted-foreground">{t('admin.withoutTranslation')}</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${inconsistencies.length > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
          <p className={`font-display text-2xl font-bold ${inconsistencies.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{inconsistencies.length}</p>
          <p className="text-xs text-muted-foreground">{t('admin.inconsistencies')}</p>
        </div>
      </div>

      {/* Inconsistencies */}
      {inconsistencies.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-red-600">
            <AlertTriangle className="h-4 w-4" /> {t('admin.inconsistencies')} ({inconsistencies.length})
          </h3>
          <div className="space-y-2">
            {inconsistencies.map((inc, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {inc.type === 'approach_mismatch' && t('admin.inconsistencyApproachMismatch')}
                    {inc.type === 'orphan' && t('admin.inconsistencyOrphanTranslation')}
                    {inc.type === 'bidirectional' && t('admin.inconsistencyBidirectional')}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{inc.detail}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {inc.models.map(m => (
                      <Link key={m.id} to={`/model/${m.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2 py-0.5 text-xs text-secondary hover:underline">
                        <LangBadge lang={m.lang || 'fr'} /> {m.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {inconsistencies.length === 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center text-sm text-emerald-600">
          <Check className="inline h-4 w-4 mr-1" /> {t('admin.noInconsistencies')}
        </div>
      )}

      {/* Pairs with translation */}
      <div>
        <h3 className="mb-3 font-display text-base font-semibold text-foreground">
          {t('admin.withTranslation')} ({pairs.length})
        </h3>
        {pairs.length > 0 ? (
          <div className="space-y-2">
            {pairs.map(pair => (
              <div key={pair.original.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <TypeBadge type={pair.original.type as any} />
                <div className="flex-1 min-w-0 grid gap-1 sm:grid-cols-2">
                  <Link to={`/model/${pair.original.id}`} className="flex items-center gap-1.5 text-sm truncate hover:text-secondary">
                    <LangBadge lang={pair.original.lang || 'fr'} />
                    <span className="truncate">{pair.original.title}</span>
                    <span className="shrink-0 text-[10px] text-emerald-600">({t('admin.original')})</span>
                  </Link>
                  <Link to={`/model/${pair.translation.id}`} className="flex items-center gap-1.5 text-sm truncate hover:text-secondary">
                    <LangBadge lang={pair.translation.lang || 'fr'} />
                    <span className="truncate">{pair.translation.title}</span>
                  </Link>
                </div>
                {pair.original.approche_id && modelMap.get(pair.original.approche_id) && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    {t('admin.approach')}: {modelMap.get(pair.original.approche_id)?.title}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Globe className="h-10 w-10" />} text={t('admin.noInconsistencies')} />
        )}
      </div>

      {/* Without translation */}
      <div>
        <h3 className="mb-3 font-display text-base font-semibold text-foreground">
          {t('admin.withoutTranslation')} ({withoutTranslation.length})
        </h3>
        {[
          { label: t('modelTypes.approche'), items: approchesWithout },
          { label: t('modelTypes.outil'), items: outilsWithout },
          { label: t('modelTypes.problematique'), items: probsWithout },
        ].filter(g => g.items.length > 0).map(group => (
          <div key={group.label} className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label} ({group.items.length})</p>
            <div className="space-y-1">
              {group.items.map(m => (
                <Link key={m.id} to={`/model/${m.id}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 hover:border-secondary/30 transition-colors">
                  <LangBadge lang={m.lang || 'fr'} />
                  <span className="text-sm text-foreground truncate flex-1">{m.title}</span>
                  {m.approche_id && modelMap.get(m.approche_id) && (
                    <span className="text-[10px] text-muted-foreground">{modelMap.get(m.approche_id)?.title}</span>
                  )}
                  <span className="text-[10px] text-amber-600">{t('admin.missingTranslation')}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
