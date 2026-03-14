import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { DBModel, ModelType, ModelStatus, MODEL_TYPE_LABELS, MODEL_STATUS_LABELS } from '@/types/model';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useAdmin';
import StatusBadge from '@/components/lab/StatusBadge';
import TypeBadge from '@/components/lab/TypeBadge';
import { Eye, GitBranch, MessageSquare } from 'lucide-react';

const Library = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ModelType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ModelStatus | 'all'>('all');
  const [models, setModels] = useState<DBModel[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { canManage } = useRole();
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setModels(data as unknown as DBModel[]);
        // fetch profiles for authors
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', userIds);
          if (profs) {
            const map: Record<string, string> = {};
            profs.forEach((p: any) => { map[p.user_id] = p.display_name; });
            setProfiles(map);
          }
        }
      }
      setLoading(false);
    };
    fetchModels();
  }, []);

  const filtered = useMemo(() => {
    return models.filter((m) => {
      // Visibility: approved models for everyone, pending only for admin when toggled or for owner
      if (!m.approved) {
        if (canManage && showPending) {
          // show
        } else if (user && m.user_id === user.id) {
          // owner can see own
        } else {
          return false;
        }
      }
      if (showPending && canManage && m.approved) return false;

      const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [search, typeFilter, statusFilter, models, canManage, showPending, user]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Bibliothèque de Modèles</h1>
          <p className="mt-1 text-muted-foreground">
            {showPending ? 'Modèles en attente de validation' : `Explorez les modèles PNL validés`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowPending(!showPending)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showPending
                ? 'bg-secondary text-secondary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            {showPending ? 'Voir validés' : `En attente (${models.filter(m => !m.approved).length})`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm border border-border sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un modèle ou un tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ModelType | 'all')}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          >
            <option value="all">Tous les types</option>
            {(Object.entries(MODEL_TYPE_LABELS) as [ModelType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ModelStatus | 'all')}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          >
            <option value="all">Tous les statuts</option>
            {(Object.entries(MODEL_STATUS_LABELS) as [ModelStatus, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Chargement...</div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((model, i) => (
            <ModelCardDB key={model.id} model={model} authorName={profiles[model.user_id]} index={i} canManage={canManage} onApprove={async (id) => {
              await supabase.from('models').update({ approved: true } as any).eq('id', id);
              setModels(prev => prev.map(m => m.id === id ? { ...m, approved: true } : m));
            }} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun modèle ne correspond à vos critères</p>
        </div>
      )}
    </div>
  );
};

const ModelCardDB = ({ model, authorName, index = 0, canManage, onApprove }: {
  model: DBModel;
  authorName?: string;
  index?: number;
  canManage: boolean;
  onApprove: (id: string) => void;
}) => {
  return (
    <div
      className="lab-card block p-5 opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Link to={`/model/${model.id}`} className="block">
        <div className="mb-3 flex items-start justify-between gap-2">
          <TypeBadge type={model.type as any} />
          <div className="flex items-center gap-2">
            {!model.approved && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                En attente
              </span>
            )}
            <StatusBadge status={model.status as any} />
          </div>
        </div>

        <h3 className="mb-1.5 font-display text-lg font-semibold text-foreground leading-snug">
          {model.title}
        </h3>
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{model.description}</p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {model.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
          {model.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{model.tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            v{model.version} · {authorName || 'Anonyme'}
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {model.views_count}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5" /> {model.variations_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> {model.feedback_count}
            </span>
          </div>
        </div>
      </Link>

      {canManage && !model.approved && (
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(model.id); }}
          className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          ✓ Valider ce modèle
        </button>
      )}
    </div>
  );
};

export default Library;
