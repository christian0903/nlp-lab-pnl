import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, FlaskConical, MessageSquare, FileText, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DBModel } from '@/types/model';
import TypeBadge from '@/components/lab/TypeBadge';
import StatusBadge from '@/components/lab/StatusBadge';

interface ProfileData {
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  expertise: string[];
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [models, setModels] = useState<DBModel[]>([]);
  const [journalModels, setJournalModels] = useState<DBModel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      // Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, expertise, created_at')
        .eq('user_id', userId)
        .single();
      if (prof) setProfile(prof as ProfileData);

      // Models owned by this user
      const { data: ownModels } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', userId)
        .eq('approved', true)
        .order('updated_at', { ascending: false });
      if (ownModels) setModels(ownModels as unknown as DBModel[]);

      // Models where user is mentioned in changelog/journal
      const { data: allApproved } = await supabase
        .from('models')
        .select('*')
        .eq('approved', true)
        .neq('user_id', userId);
      if (allApproved && prof) {
        const name = (prof as ProfileData).display_name;
        const mentioned = (allApproved as unknown as DBModel[]).filter(m => {
          if (!m.changelog || !Array.isArray(m.changelog)) return false;
          return m.changelog.some(entry => {
            if ('authors' in entry && Array.isArray(entry.authors)) {
              return entry.authors.includes(name);
            }
            if ('author' in entry && entry.author === name) return true;
            return false;
          });
        });
        setJournalModels(mentioned);
      }

      // Forum posts by this user
      const { data: userPosts } = await supabase
        .from('forum_posts')
        .select('id, title, category, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (userPosts) setPosts(userPosts as Post[]);

      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return date; }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Profil introuvable</p>
        <Link to="/library" className="mt-4 inline-block text-sm text-secondary hover:underline">← Bibliothèque</Link>
      </div>
    );
  }

  const initial = profile.display_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bibliothèque
      </Link>

      {/* Profile header */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name}
              className="h-16 w-16 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {initial}
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{profile.display_name}</h1>
            {profile.bio && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Membre depuis {formatDate(profile.created_at)}</span>
              <span className="flex items-center gap-1"><FlaskConical className="h-3.5 w-3.5" /> {models.length} modèle{models.length !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {posts.length} post{posts.length !== 1 ? 's' : ''}</span>
            </div>
            {profile.expertise && profile.expertise.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.expertise.map(tag => (
                  <span key={tag} className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs text-secondary">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Models */}
      {models.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            <FlaskConical className="mr-2 inline h-5 w-5 text-secondary" />Modèles
          </h2>
          <div className="space-y-2">
            {models.map(m => (
              <Link key={m.id} to={`/model/${m.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-secondary/30 transition-colors">
                <TypeBadge type={m.type as any} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">v{m.version} · {formatDate(m.updated_at)}</p>
                </div>
                <StatusBadge status={m.status as any} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Models where mentioned as contributor */}
      {journalModels.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            <User className="mr-2 inline h-5 w-5 text-secondary" />Contributions
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">Modèles où {profile.display_name} est mentionné comme contributeur dans le journal d'évolution.</p>
          <div className="space-y-2">
            {journalModels.map(m => (
              <Link key={m.id} to={`/model/${m.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-secondary/30 transition-colors">
                <TypeBadge type={m.type as any} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            <MessageSquare className="mr-2 inline h-5 w-5 text-secondary" />Posts communautaires
          </h2>
          <div className="space-y-2">
            {posts.map(p => (
              <Link key={p.id} to="/community"
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-secondary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {formatDate(p.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {models.length === 0 && journalModels.length === 0 && posts.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucune contribution publique pour le moment.
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
