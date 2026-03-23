import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, MessageSquare, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Contributor {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  expertise: string[];
  model_count: number;
  post_count: number;
}

const Contributors = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributors = async () => {
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, bio, avatar_url, expertise')
        .order('display_name');

      if (!profiles) { setLoading(false); return; }

      // Fetch model counts per user
      const { data: models } = await supabase
        .from('models')
        .select('user_id')
        .eq('approved', true);

      // Fetch post counts per user
      const { data: posts } = await supabase
        .from('forum_posts')
        .select('user_id');

      const modelCounts: Record<string, number> = {};
      models?.forEach((m: any) => { modelCounts[m.user_id] = (modelCounts[m.user_id] || 0) + 1; });

      const postCounts: Record<string, number> = {};
      posts?.forEach((p: any) => { postCounts[p.user_id] = (postCounts[p.user_id] || 0) + 1; });

      // Build contributors list — only people with at least one contribution
      const contribs: Contributor[] = profiles
        .map((p: any) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          bio: p.bio,
          avatar_url: p.avatar_url,
          expertise: p.expertise || [],
          model_count: modelCounts[p.user_id] || 0,
          post_count: postCounts[p.user_id] || 0,
        }))
        .filter(c => c.model_count > 0 || c.post_count > 0)
        .sort((a, b) => (b.model_count + b.post_count) - (a.model_count + a.post_count));

      setContributors(contribs);
      setLoading(false);
    };
    fetchContributors();
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Contributeurs</h1>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Les praticiens qui font vivre ce Lab. Leur curiosité, leur expertise et leur générosité construisent
          une bibliothèque PNL unique, ouverte à tous.
        </p>
      </div>

      {contributors.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {contributors.map(c => {
            const initial = c.display_name?.[0]?.toUpperCase() || '?';
            return (
              <Link key={c.user_id} to={`/profil/${c.user_id}`}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-secondary/30 hover:shadow-md">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt={c.display_name}
                    className="h-14 w-14 shrink-0 rounded-full object-cover border border-border" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {initial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-semibold text-foreground">{c.display_name}</h3>
                  {c.bio && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{c.bio}</p>
                  )}
                  {c.expertise.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.expertise.slice(0, 4).map(tag => (
                        <span key={tag} className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] text-secondary">{tag}</span>
                      ))}
                      {c.expertise.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">+{c.expertise.length - 4}</span>
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    {c.model_count > 0 && (
                      <span className="flex items-center gap-1"><FlaskConical className="h-3 w-3" /> {c.model_count} modèle{c.model_count !== 1 ? 's' : ''}</span>
                    )}
                    {c.post_count > 0 && (
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {c.post_count} post{c.post_count !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun contributeur pour le moment.</p>
          <Link to="/contribute" className="mt-2 inline-block text-sm text-secondary hover:underline">Soyez le premier →</Link>
        </div>
      )}
    </div>
  );
};

export default Contributors;
