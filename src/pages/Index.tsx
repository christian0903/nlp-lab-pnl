import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, BookOpen, Users, GitBranch, ArrowRight, Microscope, FileText, Clock, Sparkles, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DBModel, JournalEntry, LegacyChangelogEntry } from '@/types/model';
import TypeBadge from '@/components/lab/TypeBadge';

interface NewsItem {
  id: string;
  type: 'new_model' | 'model_update' | 'new_resource';
  date: string;
  title: string;
  subtitle?: string;
  link: string;
  modelType?: string;
  version?: string;
  authors?: string[];
}

const Index = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ models: 0, published: 0, contributors: 0 });

  useEffect(() => {
    const fetchNews = async () => {
      const items: NewsItem[] = [];

      // Fetch models
      const { data: models } = await supabase
        .from('models')
        .select('*')
        .eq('approved', true)
        .order('updated_at', { ascending: false });

      if (models) {
        const allModels = models as unknown as DBModel[];

        // Stats
        setStats({
          models: allModels.length,
          published: allModels.filter(m => m.status === 'publie').length,
          contributors: new Set(allModels.map(m => m.user_id)).size,
        });

        // New models (recently created)
        for (const m of allModels) {
          items.push({
            id: `model-${m.id}`,
            type: 'new_model',
            date: m.created_at,
            title: m.title,
            subtitle: m.description.slice(0, 150) + (m.description.length > 150 ? '...' : ''),
            link: `/model/${m.id}`,
            modelType: m.type,
            version: m.version,
          });

          // Journal/changelog entries
          if (m.changelog && m.changelog.length > 0) {
            for (const entry of m.changelog) {
              const isJournal = 'authors' in entry && Array.isArray((entry as JournalEntry).authors);
              const note = isJournal ? (entry as JournalEntry).note : (entry as LegacyChangelogEntry).changes;
              const authors = isJournal ? (entry as JournalEntry).authors : [(entry as LegacyChangelogEntry).author].filter(Boolean);
              items.push({
                id: `update-${m.id}-${entry.version}-${entry.date}`,
                type: 'model_update',
                date: entry.date + 'T12:00:00Z',
                title: `${m.title} → v${entry.version}`,
                subtitle: note,
                link: `/model/${m.id}`,
                modelType: m.type,
                version: entry.version,
                authors,
              });
            }
          }
        }
      }

      // Fetch resources
      const { data: resources } = await supabase
        .from('resources')
        .select('id, title, slug, category, created_at, updated_at')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (resources) {
        for (const r of resources) {
          items.push({
            id: `resource-${r.id}`,
            type: 'new_resource',
            date: r.created_at,
            title: r.title,
            subtitle: r.category === 'guide' ? 'Guide' : r.category === 'glossaire' ? 'Glossaire' : r.category === 'technique' ? 'Technique' : 'Article',
            link: '/resources',
          });
        }
      }

      // Sort by date descending, deduplicate by keeping the most recent per model
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Remove duplicate new_model entries if there's already an update entry for the same model on the same day
      const seen = new Set<string>();
      const deduped = items.filter(item => {
        const key = item.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setNews(deduped.slice(0, 30));
      setLoading(false);
    };
    fetchNews();
  }, []);

  const newsIcon = (type: NewsItem['type']) => {
    switch (type) {
      case 'new_model': return <Plus className="h-4 w-4 text-emerald-500" />;
      case 'model_update': return <Sparkles className="h-4 w-4 text-secondary" />;
      case 'new_resource': return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const newsLabel = (type: NewsItem['type']) => {
    switch (type) {
      case 'new_model': return 'Nouveau modèle';
      case 'model_update': return 'Mise à jour';
      case 'new_resource': return 'Ressource';
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return date;
    }
  };

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
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
            <FlaskConical className="mx-auto mb-1 h-5 w-5 text-secondary" />
            <p className="font-display text-2xl font-bold text-foreground">{stats.models}</p>
            <p className="text-xs text-muted-foreground">Modèles</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
            <BookOpen className="mx-auto mb-1 h-5 w-5 text-secondary" />
            <p className="font-display text-2xl font-bold text-foreground">{stats.published}</p>
            <p className="text-xs text-muted-foreground">Publiés</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
            <Users className="mx-auto mb-1 h-5 w-5 text-secondary" />
            <p className="font-display text-2xl font-bold text-foreground">{stats.contributors}</p>
            <p className="text-xs text-muted-foreground">Contributeurs</p>
          </div>
        </div>
      </section>

      {/* Bienvenue */}
      <section className="container mx-auto px-4 pt-16 pb-6">
        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-6">
          <h2 className="mb-3 font-display text-xl font-bold text-foreground">Vous découvrez le Lab ?</h2>
          <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
            Ce site est un laboratoire collaboratif où les praticiens PNL partagent, testent et font évoluer des modèles.
            Voici par où commencer :
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/library" className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-secondary/40 transition-colors">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Explorer la bibliothèque</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Parcourez les approches, outils et expériences documentés par la communauté.</p>
              </div>
            </Link>
            <Link to="/resources" className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-secondary/40 transition-colors">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Lire les ressources</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Guides, glossaire PNL et méthodologie pour comprendre notre démarche.</p>
              </div>
            </Link>
            <Link to="/community" className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-secondary/40 transition-colors">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Rejoindre la communauté</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Échangez avec les praticiens, posez vos questions et partagez vos découvertes.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* News feed */}
      <section className="container mx-auto px-4 py-10 pb-20">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">Dernières nouvelles</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nouveaux modèles, mises à jour et ressources</p>
        </div>
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Chargement...</div>
        ) : news.length > 0 ? (
          <div className="space-y-3">
            {news.map((item, i) => (
              <Link
                key={item.id}
                to={item.link}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-secondary/30 opacity-0 animate-fade-in"
                style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {newsIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      item.type === 'new_model' ? 'bg-emerald-500/10 text-emerald-600' :
                      item.type === 'model_update' ? 'bg-secondary/10 text-secondary' :
                      'bg-blue-500/10 text-blue-600'
                    }`}>
                      {newsLabel(item.type)}
                    </span>
                    {item.modelType && <TypeBadge type={item.modelType as any} />}
                    {item.version && item.type === 'model_update' && (
                      <span className="font-mono text-[10px] text-muted-foreground">v{item.version}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
                  )}
                  {item.authors && item.authors.length > 0 && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">par {item.authors.join(', ')}</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(item.date)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <p className="mb-3 text-muted-foreground">Aucune activité pour le moment</p>
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
