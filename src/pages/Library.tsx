import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { DBModel, ModelType, ModelStatus, MODEL_TYPE_LABELS, MODEL_STATUS_LABELS } from '@/types/model';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useAdmin';
import StatusBadge from '@/components/lab/StatusBadge';
import TypeBadge from '@/components/lab/TypeBadge';
import KanbanBoard from '@/components/lab/KanbanBoard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [expandedApproches, setExpandedApproches] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setModels(data as unknown as DBModel[]);
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

  const toggleApproche = (id: string) => {
    setExpandedApproches(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // For "Par approche" tab
  const approvedModels = models.filter(m => m.approved);
  const approches = approvedModels.filter(m => m.type === 'approche');
  const getModelsForApproche = (approcheId: string) =>
    approvedModels.filter(m => m.approche_id === approcheId && m.type !== 'approche');
  const unlinkedModels = approvedModels.filter(m => m.type !== 'approche' && !m.approche_id);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Bibliothèque de Modèles</h1>
          <p className="mt-1 text-muted-foreground">
            {showPending ? 'Modèles en attente de validation' : 'Explorez les modèles PNL validés'}
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

      <Tabs defaultValue="catalogue" className="w-full">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto border-b border-border bg-transparent p-0">
          <TabsTrigger value="catalogue" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Catalogue
          </TabsTrigger>
          <TabsTrigger value="kanban" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="approches" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Par approche
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 — Catalogue (par type) */}
        <TabsContent value="catalogue">
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

          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Chargement...</div>
          ) : filtered.length > 0 ? (
            <div className="space-y-10">
              {([
                { type: 'approche', label: 'Approches', description: 'Architectures cohérentes regroupant plusieurs modèles autour d\'une vision' },
                { type: 'outil', label: 'Outils', description: 'Protocoles, formats et techniques utilisables en séance' },
                { type: 'problematique', label: 'Expériences', description: 'Cartographies d\'expériences vécues, états problèmes ou ressources' },
              ] as const).map(({ type: sectionType, label, description: desc }) => {
                const sectionModels = filtered.filter(m => m.type === sectionType);
                if (sectionModels.length === 0 && typeFilter !== 'all' && typeFilter !== sectionType) return null;
                return (
                  <div key={sectionType}>
                    <div className="mb-4">
                      <h2 className="font-display text-xl font-bold text-foreground">{label}</h2>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    {sectionModels.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sectionModels.map((model, i) => (
                          <ModelCardDB key={model.id} model={model} authorName={profiles[model.user_id]} index={i} canManage={canManage} onApprove={async (id) => {
                            await supabase.from('models').update({ approved: true } as any).eq('id', id);
                            setModels(prev => prev.map(m => m.id === id ? { ...m, approved: true } : m));
                          }} />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                        Aucun(e) {label.toLowerCase()} pour le moment
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aucun modèle ne correspond à vos critères</p>
            </div>
          )}
        </TabsContent>

        {/* Tab 2 — Pipeline Kanban */}
        <TabsContent value="kanban">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Vue d'ensemble du pipeline de recherche — chaque colonne représente un stade du cycle de vie des modèles.</p>
          </div>
          <KanbanBoard />
        </TabsContent>

        {/* Tab 3 — Par approche */}
        <TabsContent value="approches">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Explorez les modèles organisés par approche. Cliquez sur une approche pour voir les outils et expériences qui en font partie.</p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Chargement...</div>
          ) : (
            <div className="space-y-3">
              {approches.map(approche => {
                const children = getModelsForApproche(approche.id);
                const isExpanded = expandedApproches.has(approche.id);
                return (
                  <div key={approche.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleApproche(approche.id)}
                      className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-secondary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-foreground">{approche.title}</h3>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{children.length} modèle{children.length !== 1 ? 's' : ''}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{approche.description}</p>
                      </div>
                      <Link
                        to={`/model/${approche.id}`}
                        onClick={e => e.stopPropagation()}
                        className="shrink-0 text-xs text-secondary hover:underline"
                      >
                        Voir la fiche
                      </Link>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 px-4 py-3">
                        {children.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {children.map((model, i) => (
                              <Link key={model.id} to={`/model/${model.id}`}
                                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-secondary/30 transition-colors">
                                <TypeBadge type={model.type as any} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{model.title}</p>
                                  <p className="text-xs text-muted-foreground">v{model.version} · {profiles[model.user_id] || 'Anonyme'}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="py-4 text-center text-sm text-muted-foreground">Aucun modèle rattaché à cette approche</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Modèles sans approche */}
              {unlinkedModels.length > 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleApproche('__unlinked__')}
                    className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    {expandedApproches.has('__unlinked__') ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-semibold text-muted-foreground">Sans approche</h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{unlinkedModels.length}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">Modèles non rattachés à une approche</p>
                    </div>
                  </button>
                  {expandedApproches.has('__unlinked__') && (
                    <div className="border-t border-border bg-muted/20 px-4 py-3">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {unlinkedModels.map(model => (
                          <Link key={model.id} to={`/model/${model.id}`}
                            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-secondary/30 transition-colors">
                            <TypeBadge type={model.type as any} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{model.title}</p>
                              <p className="text-xs text-muted-foreground">v{model.version} · {profiles[model.user_id] || 'Anonyme'}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {approches.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                  <p>Aucune approche n'a encore été créée.</p>
                  <Link to="/contribute" className="mt-2 inline-block text-sm text-secondary hover:underline">Créer une approche →</Link>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
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
            v{model.version} · <Link to={`/profil/${model.user_id}`} onClick={e => e.stopPropagation()} className="hover:text-secondary">{authorName || 'Anonyme'}</Link>
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
          Valider ce modèle
        </button>
      )}
    </div>
  );
};

export default Library;
