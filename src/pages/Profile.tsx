import { useState, useEffect, useRef } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Save, X, Plus, User as UserIcon, ExternalLink, Eye } from 'lucide-react';

interface PersonalLink {
  label: string;
  url: string;
}

interface ProfileData {
  display_name: string;
  bio: string;
  avatar_url: string | null;
  expertise: string[];
  cv: string;
  personal_links: PersonalLink[];
}

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [searchParams] = useSearchParams();
  // Admin can edit another user's profile via ?user=userId
  const editUserId = (isAdmin && searchParams.get('user')) || user?.id;
  const isEditingOther = editUserId !== user?.id;

  const [profile, setProfile] = useState<ProfileData>({
    display_name: '', bio: '', avatar_url: null, expertise: [], cv: '', personal_links: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newExpertise, setNewExpertise] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editUserId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, expertise, cv, personal_links')
        .eq('user_id', editUserId)
        .single();
      if (data) {
        setProfile({
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url,
          expertise: data.expertise || [],
          cv: (data as any).cv || '',
          personal_links: (data as any).personal_links || [],
        });
      }
      setLoading(false);
    };
    fetch();
  }, [editUserId]);

  if (!user) return <Navigate to="/auth" replace />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editUserId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t('profile.avatarTooBig')); return; }
    if (!file.type.startsWith('image/')) { toast.error(t('profile.onlyImages')); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${editUserId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { toast.error(t('profile.uploadError')); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: avatarUrl } as any).eq('user_id', editUserId);
    setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
    setUploading(false);
    toast.success(t('profile.avatarUpdated'));
  };

  const addExpertise = () => {
    const trimmed = newExpertise.trim();
    if (!trimmed || profile.expertise.includes(trimmed)) return;
    setProfile(prev => ({ ...prev, expertise: [...prev.expertise, trimmed] }));
    setNewExpertise('');
  };

  const removeExpertise = (item: string) => {
    setProfile(prev => ({ ...prev, expertise: prev.expertise.filter(e => e !== item) }));
  };

  const addLink = () => {
    setProfile(prev => ({ ...prev, personal_links: [...prev.personal_links, { label: '', url: '' }] }));
  };

  const updateLink = (i: number, field: 'label' | 'url', value: string) => {
    setProfile(prev => ({
      ...prev,
      personal_links: prev.personal_links.map((l, j) => j === i ? { ...l, [field]: value } : l)
    }));
  };

  const removeLink = (i: number) => {
    setProfile(prev => ({ ...prev, personal_links: prev.personal_links.filter((_, j) => j !== i) }));
  };

  const handleSave = async () => {
    if (!profile.display_name.trim()) { toast.error(t('profile.displayNameRequired')); return; }
    setSaving(true);
    const savedLinks = profile.personal_links.filter(l => l.url.trim() && l.label.trim());
    const { error } = await supabase.from('profiles').update({
      display_name: profile.display_name.trim(),
      bio: profile.bio.trim() || null,
      expertise: profile.expertise,
      cv: profile.cv.trim() || null,
      personal_links: savedLinks,
    } as any).eq('user_id', editUserId);

    setSaving(false);
    if (error) { toast.error(t('profile.saveError')); return; }
    toast.success(t('profile.saved'));
  };

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          {isEditingOther ? t('profile.editOther', { name: profile.display_name }) : t('profile.title')}
        </h1>
        <Link to={`/profil/${editUserId}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary">
          <Eye className="h-3.5 w-3.5" /> {t('profile.viewPublic')}
        </Link>
      </div>

      {/* Avatar */}
      <div className="mb-8 flex items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-secondary-foreground hover:brightness-110 disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div>
          <p className="font-medium text-foreground">{profile.display_name || t('profile.noName')}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {uploading && <p className="mt-1 text-xs text-secondary">{t('profile.uploadInProgress')}</p>}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('profile.displayName')}</label>
          <input type="text" value={profile.display_name}
            onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
            maxLength={100}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('profile.bio')}</label>
          <textarea value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            maxLength={500} rows={3}
            placeholder={t('profile.bioPlaceholder')}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
          <p className="mt-1 text-xs text-muted-foreground">{profile.bio.length}/500</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('profile.cv')}</label>
          <p className="mb-1.5 text-xs text-muted-foreground">{t('profile.cvDesc')}</p>
          <textarea value={profile.cv}
            onChange={(e) => setProfile(prev => ({ ...prev, cv: e.target.value }))}
            maxLength={5000} rows={8}
            placeholder={t('profile.cvPlaceholder')}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
          <p className="mt-1 text-xs text-muted-foreground">{profile.cv.length}/5000 — {t('common.markdownSupported')}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('profile.expertise')}</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {profile.expertise.map(item => (
              <span key={item} className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
                {item}
                <button onClick={() => removeExpertise(item)} className="text-secondary/60 hover:text-secondary">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newExpertise}
              onChange={(e) => setNewExpertise(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
              placeholder={t('profile.expertisePlaceholder')}
              maxLength={50}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
            <button onClick={addExpertise}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" /> {t('common.add')}
            </button>
          </div>
        </div>

        {/* Liens personnels */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">{t('profile.personalLinks')}</label>
            <button onClick={addLink}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary/10">
              <Plus className="h-3.5 w-3.5" /> {t('profile.addLink')}
            </button>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">{t('profile.personalLinksDesc')}</p>
          {profile.personal_links.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('profile.noLinks')}</p>
          ) : (
            <div className="space-y-2">
              {profile.personal_links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={link.label}
                    onChange={(e) => updateLink(i, 'label', e.target.value)}
                    placeholder={t('profile.linkLabel')}
                    className="w-1/3 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-ring focus:ring-2" />
                  <input type="url" value={link.url}
                    onChange={(e) => updateLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-ring focus:ring-2" />
                  <button onClick={() => removeLink(i)} className="rounded p-1 text-muted-foreground hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
