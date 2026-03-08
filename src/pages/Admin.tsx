import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, Check, X, Eye, Users, BarChart3, Clock, UserCog, Activity, GitBranch, MessageSquare, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { DBModel, MODEL_TYPE_LABELS, MODEL_STATUS_LABELS, ModelStatus } from '@/types/model';
import TypeBadge from '@/components/lab/TypeBadge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [models, setModels] = useState<(DBModel & { author_name?: string })[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
        setModels(modelsData.map((m: any) => ({ ...m, author_name: map[m.user_id] })) as any);
      }
      setLoading(false);
    };
    fetchAll();
  }, [isAdmin]);

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('models').update({ approved: true } as any).eq('id', id);
    if (error) { toast.error('Erreur'); return; }
    setModels(prev => prev.map(m => m.id === id ? { ...m, approved: true } : m));
    toast.success('Modèle validé !');
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('models').delete().eq('id', id);
    if (error) { toast.error('Erreur'); return; }
    setModels(prev => prev.filter(m => m.id !== id));
    toast.success('Modèle rejeté et supprimé.');
  };

  const toggleRole = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle');
      return;
    }
    if (currentlyAdmin) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      if (error) { toast.error('Erreur'); return; }
      setRoles(prev => prev.filter(r => !(r.user_id === userId && r.role === 'admin')));
      toast.success('Rôle admin retiré');
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' } as any);
      if (error) { toast.error('Erreur'); return; }
      setRoles(prev => [...prev, { user_id: userId, role: 'admin' }]);
      toast.success('Rôle admin ajouté');
    }
  };

  if (adminLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const pending = models.filter(m => !m.approved);
  const approved = models.filter(m => m.approved);
  const statusCounts: Record<string, number> = {};
  models.forEach(m => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });
  const recentModels = models.slice(0, 8);

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
          <ShieldCheck className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Administration</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble et gestion de la plateforme</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatBox label="En attente" value={pending.length} icon={<Clock className="h-5 w-5 text-amber-500" />} highlight={pending.length > 0} />
        <StatBox label="Modèles validés" value={approved.length} icon={<Check className="h-5 w-5 text-emerald-500" />} />
        <StatBox label="Total modèles" value={models.length} icon={<FileText className="h-5 w-5 text-secondary" />} />
        <StatBox label="Utilisateurs" value={usersCount} icon={<Users className="h-5 w-5 text-primary" />} />
        <StatBox label="Posts forum" value={postsCount} icon={<MessageSquare className="h-5 w-5 text-accent" />} />
        <StatBox label="Publiés" value={statusCounts['publie'] || 0} icon={<BarChart3 className="h-5 w-5 text-lab-teal" />} />
      </div>

      {/* Models by status breakdown */}
      <div className="mb-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Répartition par statut</h2>
        <div className="flex flex-wrap gap-3">
          {STATUS_ORDER.map(s => (
            <div key={s} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <span className="text-sm font-medium text-foreground">{MODEL_STATUS_LABELS[s]}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold text-foreground">{statusCounts[s] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6 w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            🔔 En attente ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            ✅ Validés ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            <Activity className="mr-1.5 inline h-3.5 w-3.5" /> Activité récente
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            <UserCog className="mr-1.5 inline h-3.5 w-3.5" /> Utilisateurs
          </TabsTrigger>
        </TabsList>

        {/* PENDING */}
        <TabsContent value="pending">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Chargement...</div>
          ) : pending.length === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-10 w-10" />} text="Aucun modèle en attente de validation" />
          ) : (
            <div className="space-y-4">
              {pending.map(model => (
                <PendingCard key={model.id} model={model} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* APPROVED */}
        <TabsContent value="approved">
          {approved.length === 0 ? (
            <EmptyState icon={<FileText className="h-10 w-10" />} text="Aucun modèle validé" />
          ) : (
            <div className="space-y-3">
              {approved.map(model => (
                <Link key={model.id} to={`/model/${model.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-secondary/30 transition-colors">
                  <TypeBadge type={model.type as any} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{model.title}</p>
                    <p className="text-xs text-muted-foreground">par {model.author_name || 'Anonyme'} · {MODEL_STATUS_LABELS[model.status as keyof typeof MODEL_STATUS_LABELS]}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">{model.views_count} vues · {model.feedback_count} feedbacks</p>
                    <p className="text-xs text-muted-foreground">{new Date(model.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity">
          {recentModels.length === 0 ? (
            <EmptyState icon={<Activity className="h-10 w-10" />} text="Pas encore d'activité" />
          ) : (
            <div className="space-y-2">
              {recentModels.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <div className={`h-2 w-2 rounded-full ${m.approved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <TypeBadge type={m.type as any} />
                  <Link to={`/model/${m.id}`} className="flex-1 truncate text-sm font-medium text-foreground hover:text-secondary">{m.title}</Link>
                  <span className="text-xs text-muted-foreground">{m.author_name || 'Anonyme'}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(m.updated_at), { addSuffix: true, locale: fr })}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users">
          {allProfiles.length === 0 ? (
            <EmptyState icon={<Users className="h-10 w-10" />} text="Aucun utilisateur inscrit" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inscrit</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allProfiles.map(p => {
                    const isUserAdmin = roles.some(r => r.user_id === p.user_id && r.role === 'admin');
                    const isSelf = p.user_id === user?.id;
                    return (
                      <tr key={p.user_id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                              {p.display_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-foreground">{p.display_name}</span>
                            {isSelf && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Vous</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: fr })}
                        </td>
                        <td className="px-4 py-3">
                          {isUserAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                              <ShieldCheck className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Utilisateur</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => toggleRole(p.user_id, isUserAdmin)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                isUserAdmin
                                  ? 'border border-destructive/30 text-destructive hover:bg-destructive/5'
                                  : 'border border-secondary/30 text-secondary hover:bg-secondary/5'
                              }`}
                            >
                              {isUserAdmin ? 'Retirer admin' : 'Promouvoir admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

const PendingCard = ({ model, onApprove, onReject }: {
  model: DBModel & { author_name?: string };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) => (
  <div className="rounded-xl border border-amber-500/20 bg-card p-5 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <TypeBadge type={model.type as any} />
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">En attente</span>
      </div>
      <span className="text-xs text-muted-foreground">{new Date(model.created_at).toLocaleDateString('fr-FR')}</span>
    </div>
    <h3 className="mb-1 font-display text-lg font-semibold text-foreground">{model.title}</h3>
    <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{model.description}</p>
    <div className="mb-4 flex flex-wrap gap-1.5">
      {model.tags.slice(0, 5).map(tag => (
        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
      ))}
    </div>
    <div className="flex items-center justify-between border-t border-border pt-4">
      <span className="text-xs text-muted-foreground">par {model.author_name || 'Anonyme'} · {model.complexity}</span>
      <div className="flex gap-2">
        <Link to={`/model/${model.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <Eye className="h-3.5 w-3.5" /> Voir
        </Link>
        <button onClick={() => onReject(model.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5">
          <X className="h-3.5 w-3.5" /> Rejeter
        </button>
        <button onClick={() => onApprove(model.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
          <Check className="h-3.5 w-3.5" /> Valider
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

export default Admin;
