import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, GitBranch, MessageSquare, Clock, User, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DBModel, MODEL_STATUS_LABELS } from '@/types/model';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import StatusBadge from '@/components/lab/StatusBadge';
import TypeBadge from '@/components/lab/TypeBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const ModelDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [model, setModel] = useState<DBModel | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', id!)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      const m = data as unknown as DBModel;
      setModel(m);

      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', m.user_id)
        .single();
      if (prof) setAuthorName(prof.display_name);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!model) return;
    await supabase.from('models').update({ status: newStatus } as any).eq('id', model.id);
    setModel({ ...model, status: newStatus });
    toast.success(`Statut changé en "${MODEL_STATUS_LABELS[newStatus as keyof typeof MODEL_STATUS_LABELS] || newStatus}"`);
  };

  const handleApprove = async () => {
    if (!model) return;
    await supabase.from('models').update({ approved: true } as any).eq('id', model.id);
    setModel({ ...model, approved: true });
    toast.success('Modèle validé !');
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!model) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Modèle introuvable</p>
        <Link to="/library" className="mt-4 inline-block text-sm text-secondary hover:underline">
          ← Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  const canManage = isAdmin || (user && user.id === model.user_id);
  const sections = (model.sections || {}) as Record<string, string>;
  const statusFlow: string[] = ['brouillon', 'en_revision', 'en_test', 'publie', 'en_evolution'];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bibliothèque
      </Link>

      {/* Admin actions */}
      {isAdmin && !model.approved && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          <span className="text-sm text-foreground">Ce modèle est en attente de validation.</span>
          <button
            onClick={handleApprove}
            className="ml-auto rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Valider
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <TypeBadge type={model.type as any} />
          <StatusBadge status={model.status as any} />
          {!model.approved && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
              En attente de validation
            </span>
          )}
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">
            v{model.version}
          </span>
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{model.title}</h1>
        <p className="mb-5 text-muted-foreground leading-relaxed">{model.description}</p>

        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {authorName || 'Anonyme'}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Mis à jour le {new Date(model.updated_at).toLocaleDateString('fr-FR')}</span>
          <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {model.views_count} vues</span>
          <span className="flex items-center gap-1.5"><GitBranch className="h-4 w-4" /> {model.variations_count} variations</span>
          <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> {model.feedback_count} feedbacks</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {model.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
          ))}
        </div>
      </div>

      {/* Status management for admin/owner */}
      {canManage && model.approved && (
        <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-foreground">Changer le statut :</p>
          <div className="flex flex-wrap gap-2">
            {statusFlow.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={model.status === s}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  model.status === s
                    ? 'bg-secondary text-secondary-foreground'
                    : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {MODEL_STATUS_LABELS[s as keyof typeof MODEL_STATUS_LABELS]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <Tabs defaultValue="presentation" className="w-full">
        <TabsList className="mb-6 w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger value="presentation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Présentation
          </TabsTrigger>
          <TabsTrigger value="historique" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presentation">
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(sections).filter(([_, v]) => v).map(([key, content]) => (
              <Section key={key} title={sectionLabel(key)} content={content} />
            ))}
            {Object.keys(sections).length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                Le contenu détaillé sera ajouté prochainement.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historique">
          {model.changelog && model.changelog.length > 0 ? (
            <div className="space-y-4">
              {model.changelog.map((entry, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-secondary">
                      v{entry.version}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="text-sm text-foreground">{entry.changes}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Aucun historique disponible.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const sectionLabel = (key: string) => {
  const labels: Record<string, string> = {
    description: 'Description du phénomène',
    patterns: 'Patterns identifiés',
    structure: 'Structure du modèle',
    protocol: 'Protocole détaillé',
    prerequisites: 'Prérequis',
    philosophy: 'Philosophie et principes',
    toolkit: 'Boîte à outils',
  };
  return labels[key] || key;
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <h3 className="mb-3 font-display text-base font-semibold text-foreground">{title}</h3>
    <div className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{content}</div>
  </div>
);

export default ModelDetail;
