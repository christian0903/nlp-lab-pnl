import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, BookOpen, Users, GitBranch, ArrowRight, Microscope } from 'lucide-react';
import { mockModels } from '@/data/mockModels';
import KanbanBoard from '@/components/lab/KanbanBoard';
import ModelCard from '@/components/lab/ModelCard';
import StatCard from '@/components/lab/StatCard';

const Index = () => {
  const publishedModels = mockModels.filter((m) => m.status === 'publie');
  const totalVariations = mockModels.reduce((sum, m) => sum + m.variationsCount, 0);

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
          <StatCard icon={FlaskConical} label="Modèles" value={mockModels.length} accent />
          <StatCard icon={BookOpen} label="Publiés" value={publishedModels.length} />
          <StatCard icon={GitBranch} label="Variations" value={totalVariations} />
          <StatCard icon={Users} label="Contributeurs" value={12} accent />
        </div>
      </section>

      {/* Kanban */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">🔬 Modèles en développement</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble du pipeline de recherche</p>
          </div>
        </div>
        <KanbanBoard />
      </section>

      {/* Recent Models */}
      <section className="container mx-auto px-4 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">📚 Modèles récents</h2>
            <p className="mt-1 text-sm text-muted-foreground">Les derniers ajouts et mises à jour</p>
          </div>
          <Link
            to="/library"
            className="text-sm font-medium text-secondary hover:underline"
          >
            Voir tout →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockModels.slice(0, 6).map((model, i) => (
            <ModelCard key={model.id} model={model} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
