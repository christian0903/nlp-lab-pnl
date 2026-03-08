import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, Check, X, Eye, Clock, Users, GitBranch } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { DBModel, MODEL_TYPE_LABELS, MODEL_STATUS_LABELS } from '@/types/model';
import TypeBadge from '@/components/lab/TypeBadge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserWithRole {
  user_id: string;
  display_name: string;
  email?: string;
  is_admin: boolean;
}

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [models, setModels] = useState<(DBModel & { author_name?: string })[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAll = async () => {
      const { data } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        const map: Record<string, string> = {};
        profs?.forEach((p: any) => { map[p.user_id] = p.display_name; });
        setProfiles(map);
        setModels(data.map((m: any) => ({ ...m, author_name: map[m.user_id] })) as any);
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

  if (adminLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const pending = models.filter(m => !m.approved);
  const approved = models.filter(m => m.approved);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
          <ShieldCheck className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Administration</h1>
          <p className="text-sm text-muted-foreground">Gérez les modèles et validez les soumissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatBox label="En attente" value={pending.length} icon="🔔" highlight />
        <StatBox label="Validés" value={approved.length} icon="✅" />
        <StatBox label="Total" value={models.length} icon="📊" />
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6 w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            En attente ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Validés ({approved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Chargement...</div>
          ) : pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucun modèle en attente de validation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(model => (
                <PendingCard key={model.id} model={model} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {approved.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground">Aucun modèle validé</p>
            </div>
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
                  <span className="text-xs text-muted-foreground">{new Date(model.created_at).toLocaleDateString('fr-FR')}</span>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

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

const StatBox = ({ label, value, icon, highlight }: { label: string; value: number; icon: string; highlight?: boolean }) => (
  <div className={`rounded-xl border p-4 text-center ${highlight && value > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card'}`}>
    <span className="text-lg">{icon}</span>
    <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default Admin;
