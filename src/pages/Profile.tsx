import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Save, X, Plus, User as UserIcon } from 'lucide-react';

interface ProfileData {
  display_name: string;
  bio: string;
  avatar_url: string | null;
  expertise: string[];
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({ display_name: '', bio: '', avatar_url: null, expertise: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newExpertise, setNewExpertise] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, expertise')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setProfile({
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url,
          expertise: data.expertise || [],
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (!user) return <Navigate to="/auth" replace />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2 Mo');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Erreur lors de l\'upload');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    await supabase.from('profiles').update({ avatar_url: avatarUrl } as any).eq('user_id', user.id);
    setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
    setUploading(false);
    toast.success('Avatar mis à jour !');
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

  const handleSave = async () => {
    if (!profile.display_name.trim()) {
      toast.error('Le nom d\'affichage est requis');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: profile.display_name.trim(),
      bio: profile.bio.trim() || null,
      expertise: profile.expertise,
    } as any).eq('user_id', user.id);

    setSaving(false);
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      return;
    }
    toast.success('Profil mis à jour !');
  };

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 font-display text-3xl font-bold text-foreground">Mon profil</h1>

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
          <p className="font-medium text-foreground">{profile.display_name || 'Sans nom'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {uploading && <p className="mt-1 text-xs text-secondary">Upload en cours...</p>}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nom d'affichage *</label>
          <input
            type="text"
            value={profile.display_name}
            onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
            maxLength={100}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            maxLength={500}
            rows={4}
            placeholder="Parlez de vous, votre parcours en PNL, vos centres d'intérêt..."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">{profile.bio.length}/500</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Domaines d'expertise</label>
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
            <input
              type="text"
              value={newExpertise}
              onChange={(e) => setNewExpertise(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
              placeholder="Ex: Hypnose, Coaching, Modélisation..."
              maxLength={50}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
            <button onClick={addExpertise}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
