import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Send, User, FileText, Lightbulb } from 'lucide-react';
import { MODEL_TYPE_LABELS, ModelType } from '@/types/model';

const complexityOptions = [
  { value: 'débutant', label: 'Débutant' },
  { value: 'intermédiaire', label: 'Intermédiaire' },
  { value: 'avancé', label: 'Avancé' },
];

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

const Contribute = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ModelType>('outil');
  const [complexity, setComplexity] = useState('intermédiaire');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [sectionValues, setSectionValues] = useState<Record<string, string>>({});
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
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const { error } = await supabase.from('models').insert({
      user_id: user.id,
      title: trimmedTitle,
      type,
      description: trimmedDesc,
      complexity,
      tags,
      sections: sectionValues,
      status: 'brouillon',
      approved: false,
    } as any);

    setSubmitting(false);

    if (error) {
      toast.error('Erreur lors de la soumission');
      console.error(error);
      return;
    }

    toast.success('Modèle soumis ! Un administrateur doit le valider avant qu\'il apparaisse dans la bibliothèque.');
    navigate('/library');
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Proposer un modèle</h1>
        <p className="mt-1 text-muted-foreground">
          Votre modèle sera soumis à validation par un administrateur avant d'être visible dans la bibliothèque.
        </p>
      </div>

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-lab-warm" />
        <div className="text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Workflow de publication :</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>Vous soumettez votre modèle → <strong>En attente de validation</strong></li>
            <li>Un admin valide → le modèle passe en <strong>Brouillon</strong></li>
            <li>Cycle de vie : Brouillon → En révision → En test → <strong>Publié</strong></li>
          </ol>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre modèle : quel problème résout-il ? Comment fonctionne-t-il ?"
            maxLength={5000}
            rows={5}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            required
          />
        </div>

        {sectionsByType[type].map((section) => (
          <div key={section.key}>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{section.label}</label>
            <textarea
              value={sectionValues[section.key] || ''}
              onChange={(e) => setSectionValues(prev => ({ ...prev, [section.key]: e.target.value }))}
              placeholder={section.placeholder}
              maxLength={3000}
              rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
        ))}

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

        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Link to="/" className="rounded-lg px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">
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
