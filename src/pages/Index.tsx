import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, BookOpen, Users, GitBranch, ArrowRight, Microscope, Eye, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DBModel } from '@/types/model';
import KanbanBoard from '@/components/lab/KanbanBoard';
import StatCard from '@/components/lab/StatCard';
import StatusBadge from '@/components/lab/StatusBadge';
import TypeBadge from '@/components/lab/TypeBadge';

const Index = () => {
  const [models, setModels] = useState<DBModel[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      const { data } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const m = data as unknown as DBModel[];
        setModels(m);

        const userIds = [...new Set(m.map(mod => mod.user_id))];
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

  const approvedModels = models.filter(m => m.approved);
  const publishedModels = models.filter(m => m.status === 'publie');
  const totalVariations = models.reduce((sum, m) => sum + m.variations_count, 0);
  const contributorCount = new Set(models.map(m => m.user_id)).size;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="lab-hero-section relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(180_50%_35%/0.15),transparent_60%)]" />
        <div className="container relative mx-auto px-4 py-16 pb-24 md:py-20 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-sm text-primary-foreground/80">
              <Microscope className="h-4 w-4" />
              Laboratoire de Recherche & Développement
            </div>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight md:text-5xl">
              Modéliser l'excellence{' '}
              <span className="text-lab-teal-light">ensemble</span>
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/70 leading-relaxed">
              Un espace collaboratif où praticiens et chercheurs en PNL créent, testent et font évoluer
              des modèles au service de la transformation humaine.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/library"
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110"
              >
                Explorer la bibliothèque <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contribute"
                className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/20 px-5 py-2.5 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10"
              >
                Contribuer
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto -mt-14 relative z-10 px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={FlaskConical} label="Modèles" value={models.length} accent />
          <StatCard icon={BookOpen} label="Publiés" value={publishedModels.length} />
          <StatCard icon={GitBranch} label="Variations" value={totalVariations} />
          <StatCard icon={Users} label="Contributeurs" value={contributorCount} accent />
        </div>
      </section>

      {/* Kanban */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Modèles en développement</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble du pipeline de recherche</p>
          </div>
        </div>
        <KanbanBoard />
      </section>

      {/* Recent Models */}
      <section className="container mx-auto px-4 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Modèles récents</h2>
            <p className="mt-1 text-sm text-muted-foreground">Les derniers ajouts et mises à jour</p>
          </div>
          <Link
            to="/library"
            className="text-sm font-medium text-secondary hover:underline"
          >
            Voir tout →
          </Link>
        </div>
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Chargement...</div>
        ) : models.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {models.slice(0, 6).map((model, i) => (
              <Link
                key={model.id}
                to={`/model/${model.id}`}
                className="lab-card block p-5 opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <TypeBadge type={model.type as any} />
                  <StatusBadge status={model.status as any} />
                </div>
                <h3 className="mb-1.5 font-display text-lg font-semibold text-foreground leading-snug">
                  {model.title}
                </h3>
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{model.description}</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {model.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
                  ))}
                  {model.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{model.tags.length - 3}</span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    v{model.version} · {profiles[model.user_id] || 'Anonyme'}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {model.views_count}</span>
                    <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> {model.variations_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {model.feedback_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <p className="mb-3 text-muted-foreground">Aucun modèle pour le moment</p>
            <Link to="/contribute" className="text-sm font-medium text-secondary hover:underline">
              Créer le premier modèle →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
