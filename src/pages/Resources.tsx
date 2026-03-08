import { useState, useMemo } from 'react';
import { Search, BookOpen, Lightbulb, FileText, CheckCircle2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { glossaryData, glossaryCategories } from '@/data/glossary';

const guideSteps = [
  {
    icon: Lightbulb,
    title: "1. Identifier le phénomène",
    content: "Observez et décrivez précisément le pattern, la compétence ou le processus que vous souhaitez modéliser. Collectez des exemples concrets et variés. Soyez spécifique : « Comment fait X pour obtenir Y dans le contexte Z ? »",
  },
  {
    icon: Search,
    title: "2. Observer et collecter",
    content: "Utilisez l'observation multi-niveaux (comportements, stratégies cognitives, croyances, états internes). Interviewez les experts. Filmez les démonstrations. Notez les patterns récurrents et les différences entre experts et novices.",
  },
  {
    icon: FileText,
    title: "3. Structurer le modèle",
    content: "Organisez vos observations en une structure transmissible : prérequis, étapes séquentielles, points de décision, indicateurs de réussite. Distinguez les éléments essentiels des éléments accessoires.",
  },
  {
    icon: Users,
    title: "4. Tester et itérer",
    content: "Enseignez le modèle à des praticiens de différents niveaux. Observez ce qui fonctionne et ce qui pose problème. Recueillez les feedbacks structurés. Affinez le modèle sur la base des retours terrain.",
  },
  {
    icon: CheckCircle2,
    title: "5. Documenter et partager",
    content: "Rédigez une documentation complète : contexte, protocole détaillé, cas d'application, contre-indications, résultats attendus. Soumettez au Lab R&D pour validation et publication.",
  },
];

const qualityCriteria = [
  "Le modèle est basé sur l'observation directe (pas uniquement théorique)",
  "Le protocole est suffisamment détaillé pour être reproduit par un praticien formé",
  "Les prérequis et contre-indications sont clairement identifiés",
  "Au moins 3 cas d'application documentés avec résultats",
  "Le modèle respecte les présupposés éthiques de la PNL",
  "La vérification écologique est intégrée au processus",
  "Les variations contextuelles sont mentionnées",
  "Les limites du modèle sont honnêtement décrites",
];

const Resources = () => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'guide' | 'criteria'>('guide');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [glossaryCatFilter, setGlossaryCatFilter] = useState('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const filteredGlossary = useMemo(() => {
    return glossaryData
      .filter((e) => {
        const matchSearch = !glossarySearch || 
          e.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
          e.definition.toLowerCase().includes(glossarySearch.toLowerCase());
        const matchCat = glossaryCatFilter === 'all' || e.category === glossaryCatFilter;
        return matchSearch && matchCat;
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [glossarySearch, glossaryCatFilter]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Ressources</h1>
        <p className="mt-1 text-muted-foreground">Guides, méthodologie et base de connaissances PNL</p>
      </div>

      {/* Tab navigation */}
      <div className="mb-8 flex gap-1 rounded-lg bg-muted p-1">
        {[
          { id: 'guide' as const, label: '📘 Guide du Modélisateur' },
          { id: 'glossary' as const, label: '📖 Glossaire PNL' },
          { id: 'criteria' as const, label: '✅ Critères de qualité' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Guide du Modélisateur */}
      {activeTab === 'guide' && (
        <div>
          <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Guide du Modélisateur</h2>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  Ce guide décrit le processus standard pour créer, documenter et soumettre un modèle PNL 
                  au Lab R&D. Suivez ces étapes pour contribuer des modèles de qualité à la communauté.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {guideSteps.map((step, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 shadow-sm opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <step.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Glossaire */}
      {activeTab === 'glossary' && (
        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un terme..."
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
              />
            </div>
            <select
              value={glossaryCatFilter}
              onChange={(e) => setGlossaryCatFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            >
              <option value="all">Toutes catégories</option>
              {glossaryCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">{filteredGlossary.length} terme{filteredGlossary.length !== 1 ? 's' : ''}</p>

          <div className="space-y-2">
            {filteredGlossary.map((entry) => (
              <button
                key={entry.term}
                onClick={() => setExpandedEntry(expandedEntry === entry.term ? null : entry.term)}
                className="w-full rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-base font-semibold text-foreground">{entry.term}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{entry.category}</span>
                  </div>
                  {expandedEntry === entry.term ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {expandedEntry === entry.term && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{entry.definition}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Critères de qualité */}
      {activeTab === 'criteria' && (
        <div>
          <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-2 font-display text-xl font-bold text-foreground">Critères de qualité d'un modèle</h2>
            <p className="text-muted-foreground">
              Chaque modèle soumis au Lab R&D est évalué selon ces critères. Ils garantissent 
              la rigueur et l'utilité pratique des modèles publiés.
            </p>
          </div>

          <div className="space-y-3">
            {qualityCriteria.map((criterion, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lab-success" />
                <p className="text-sm text-foreground">{criterion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
