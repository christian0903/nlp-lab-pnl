import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Send, User, FileText, Lightbulb } from 'lucide-react';
import { MODEL_TYPE_LABELS, ModelType } from '@/data/mockModels';

const complexityOptions = [
  { value: 'débutant', label: 'Débutant' },
  { value: 'intermédiaire', label: 'Intermédiaire' },
  { value: 'avancé', label: 'Avancé' },
];

const Contribute = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ModelType>('outil');
  const [complexity, setComplexity] = useState('intermédiaire');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [protocol, setProtocol] = useState('');
  const [philosophy, setPhilosophy] = useState('');
  const [patterns, setPatterns] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Contribuer au Lab R&D</h1>
        <p className="mb-6 text-muted-foreground">Connectez-vous pour proposer un nouveau modèle PNL</p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
        >
          <User className="h-4 w-4" /> Se connecter
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    if (!trimmedTitle || !trimmedDesc) {
      toast.error('Le titre et la description sont requis');
      return;
    }

    setSubmitting(true);

    // For now, create a forum post in the "modeles" category as a proposal
    // In the future, this would insert into a dedicated models table
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    
    const content = [
      `**Type :** ${MODEL_TYPE_LABELS[type]}`,
      `**Complexité :** ${complexity}`,
      `**Tags :** ${tags.join(', ') || 'Aucun'}`,
      '',
      `## Description`,
      trimmedDesc,
      prerequisites ? `\n## Prérequis\n${prerequisites}` : '',
      protocol ? `\n## Protocole\n${protocol}` : '',
      philosophy ? `\n## Philosophie & Principes\n${philosophy}` : '',
      patterns ? `\n## Patterns identifiés\n${patterns}` : '',
    ].filter(Boolean).join('\n');

    const { error } = await supabase.from('forum_posts').insert({
      user_id: user.id,
      title: `[Proposition] ${trimmedTitle}`,
      content,
      category: 'modeles',
    });

    setSubmitting(false);

    if (error) {
      toast.error('Erreur lors de la soumission');
      return;
    }

    toast.success('Modèle proposé avec succès ! La communauté peut maintenant le consulter et commenter.');
    navigate('/community');
  };

  const sectionsByType: Record<ModelType, { label: string; key: string; placeholder: string }[]> = {
    problematique: [
      { label: 'Patterns identifiés', key: 'patterns', placeholder: 'Décrivez les patterns comportementaux observés...' },
      { label: 'Prérequis', key: 'prerequisites', placeholder: 'Connaissances ou compétences nécessaires...' },
    ],
    outil: [
      { label: 'Protocole détaillé', key: 'protocol', placeholder: 'Décrivez les étapes du protocole...' },
      { label: 'Prérequis', key: 'prerequisites', placeholder: 'Rapport, état de ressource, calibration...' },
    ],
    approche: [
      { label: 'Philosophie et principes', key: 'philosophy', placeholder: 'Décrivez les fondements philosophiques...' },
      { label: 'Prérequis', key: 'prerequisites', placeholder: 'Formations ou expériences recommandées...' },
    ],
  };

  const setFieldValue = (key: string, value: string) => {
    if (key === 'patterns') setPatterns(value);
    else if (key === 'protocol') setProtocol(value);
    else if (key === 'philosophy') setPhilosophy(value);
    else if (key === 'prerequisites') setPrerequisites(value);
  };

  const getFieldValue = (key: string) => {
    if (key === 'patterns') return patterns;
    if (key === 'protocol') return protocol;
    if (key === 'philosophy') return philosophy;
    if (key === 'prerequisites') return prerequisites;
    return '';
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Proposer un modèle</h1>
        <p className="mt-1 text-muted-foreground">
          Soumettez votre modèle PNL pour que la communauté puisse le consulter, tester et enrichir.
        </p>
      </div>

      {/* Tips */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-lab-warm" />
        <div className="text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Conseils pour une bonne soumission :</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Décrivez le modèle de manière détaillée et structurée</li>
            <li>Incluez des exemples concrets et cas d'application</li>
            <li>Consultez le <Link to="/resources" className="text-secondary hover:underline">Guide du Modélisateur</Link> et les critères de qualité</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Titre du modèle *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Recadrage Somatique en 4 Étapes"
            maxLength={200}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            required
          />
        </div>

        {/* Type + Complexity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Type de modèle *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ModelType)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            >
              {(Object.entries(MODEL_TYPE_LABELS) as [ModelType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Complexité</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            >
              {complexityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre modèle : quel problème résout-il ? Comment fonctionne-t-il ? Quels résultats avez-vous observé ?"
            maxLength={5000}
            rows={5}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            required
          />
        </div>

        {/* Dynamic sections based on type */}
        {sectionsByType[type].map((section) => (
          <div key={section.key}>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{section.label}</label>
            <textarea
              value={getFieldValue(section.key)}
              onChange={(e) => setFieldValue(section.key, e.target.value)}
              placeholder={section.placeholder}
              maxLength={3000}
              rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
        ))}

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Tags (séparés par des virgules)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="ancrage, somatique, dissociation, ressource"
            maxLength={200}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Link
            to="/"
            className="rounded-lg px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Envoi...' : 'Soumettre le modèle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Contribute;
