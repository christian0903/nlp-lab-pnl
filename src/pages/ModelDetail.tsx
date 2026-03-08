import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, GitBranch, MessageSquare, Clock, User, Users } from 'lucide-react';
import { mockModels } from '@/data/mockModels';
import StatusBadge from '@/components/lab/StatusBadge';
import TypeBadge from '@/components/lab/TypeBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ModelDetail = () => {
  const { id } = useParams();
  const model = mockModels.find((m) => m.id === id);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bibliothèque
      </Link>

      {/* Header */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <TypeBadge type={model.type} />
          <StatusBadge status={model.status} />
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">
            v{model.version}
          </span>
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{model.title}</h1>
        <p className="mb-5 text-muted-foreground leading-relaxed">{model.description}</p>

        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {model.author}</span>
          {model.coAuthors.length > 0 && (
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {model.coAuthors.join(', ')}</span>
          )}
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Mis à jour le {model.updatedAt}</span>
          <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {model.views} vues</span>
          <span className="flex items-center gap-1.5"><GitBranch className="h-4 w-4" /> {model.variationsCount} variations</span>
          <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> {model.feedbackCount} feedbacks</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {model.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="presentation" className="w-full">
        <TabsList className="mb-6 w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger value="presentation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Présentation
          </TabsTrigger>
          <TabsTrigger value="historique" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Historique
          </TabsTrigger>
          <TabsTrigger value="variations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Variations ({model.variationsCount})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Feedback ({model.feedbackCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presentation">
          <div className="grid gap-6 lg:grid-cols-2">
            {model.sections?.description && (
              <Section title="Description du phénomène" content={model.sections.description} />
            )}
            {model.sections?.patterns && (
              <Section title="Patterns identifiés" content={model.sections.patterns} />
            )}
            {model.sections?.structure && (
              <Section title="Structure du modèle" content={model.sections.structure} />
            )}
            {model.sections?.protocol && (
              <Section title="Protocole détaillé" content={model.sections.protocol} />
            )}
            {model.sections?.prerequisites && (
              <Section title="Prérequis" content={model.sections.prerequisites} />
            )}
            {model.sections?.philosophy && (
              <Section title="Philosophie et principes" content={model.sections.philosophy} />
            )}
            {model.sections?.toolkit && (
              <Section title="Boîte à outils intégrée" content={model.sections.toolkit} />
            )}
            {!model.sections && (
              <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                Le contenu détaillé de ce modèle sera ajouté prochainement.
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
                    <span className="text-xs text-muted-foreground">· {entry.author}</span>
                  </div>
                  <p className="text-sm text-foreground">{entry.changes}</p>
                </div>
              ))}
            </div>
          ) : (
            <Placeholder text="L'historique des versions sera disponible prochainement." />
          )}
        </TabsContent>

        <TabsContent value="variations">
          <Placeholder text={`${model.variationsCount} variations proposées par la communauté. Cette section sera interactive avec Lovable Cloud.`} />
        </TabsContent>

        <TabsContent value="feedback">
          <Placeholder text={`${model.feedbackCount} retours d'expérience. Cette section sera interactive avec Lovable Cloud.`} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <h3 className="mb-3 font-display text-base font-semibold text-foreground">{title}</h3>
    <div className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{content}</div>
  </div>
);

const Placeholder = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
    {text}
  </div>
);

export default ModelDetail;
