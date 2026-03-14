import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, GitBranch, MessageSquare, Clock, User, ShieldCheck, Star, Plus, Send, Pencil, X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DBModel, MODEL_STATUS_LABELS, MODEL_TYPE_LABELS, ModelType } from '@/types/model';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import StatusBadge from '@/components/lab/StatusBadge';
import TypeBadge from '@/components/lab/TypeBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Variation {
  id: string;
  model_id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  author_name?: string;
}

interface Feedback {
  id: string;
  model_id: string;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
  author_name?: string;
}

const ModelDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [model, setModel] = useState<DBModel | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(true);

  // Variations
  const [variations, setVariations] = useState<Variation[]>([]);
  const [showVarForm, setShowVarForm] = useState(false);
  const [varTitle, setVarTitle] = useState('');
  const [varDesc, setVarDesc] = useState('');
  const [varSubmitting, setVarSubmitting] = useState(false);

  // Feedbacks
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showFbForm, setShowFbForm] = useState(false);
  const [fbContent, setFbContent] = useState('');
  const [fbRating, setFbRating] = useState(4);
  const [fbSubmitting, setFbSubmitting] = useState(false);

  const [profiles, setProfiles] = useState<Record<string, string>>({});

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<ModelType>('outil');
  const [editComplexity, setEditComplexity] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editSections, setEditSections] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', id!)
        .single();

      if (error || !data) { setLoading(false); return; }
      const m = data as unknown as DBModel;
      setModel(m);

      // Fetch variations, feedbacks, and profiles in parallel
      const [varsRes, fbsRes, profRes] = await Promise.all([
        supabase.from('model_variations').select('*').eq('model_id', id!).order('created_at', { ascending: false }),
        supabase.from('model_feedbacks').select('*').eq('model_id', id!).order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, display_name').eq('user_id', m.user_id),
      ]);

      if (profRes.data?.[0]) setAuthorName(profRes.data[0].display_name);

      const allUserIds = new Set<string>([m.user_id]);
      const vars = (varsRes.data || []) as unknown as Variation[];
      const fbs = (fbsRes.data || []) as unknown as Feedback[];
      vars.forEach(v => allUserIds.add(v.user_id));
      fbs.forEach(f => allUserIds.add(f.user_id));

      const { data: allProfs } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', [...allUserIds]);

      const profMap: Record<string, string> = {};
      allProfs?.forEach((p: any) => { profMap[p.user_id] = p.display_name; });
      setProfiles(profMap);

      setVariations(vars.map(v => ({ ...v, author_name: profMap[v.user_id] })));
      setFeedbacks(fbs.map(f => ({ ...f, author_name: profMap[f.user_id] })));
      setLoading(false);
    };
    fetchAll();
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

  const submitVariation = async () => {
    if (!user || !model || !varTitle.trim()) return;
    setVarSubmitting(true);
    const { data, error } = await supabase.from('model_variations').insert({
      model_id: model.id,
      user_id: user.id,
      title: varTitle.trim(),
      description: varDesc.trim(),
    } as any).select().single();

    setVarSubmitting(false);
    if (error) { toast.error('Erreur'); return; }
    const newVar = { ...(data as unknown as Variation), author_name: profiles[user.id] || 'Vous' };
    setVariations(prev => [newVar, ...prev]);
    setModel(prev => prev ? { ...prev, variations_count: prev.variations_count + 1 } : prev);
    setVarTitle(''); setVarDesc(''); setShowVarForm(false);
    toast.success('Variation ajoutée !');
  };

  const submitFeedback = async () => {
    if (!user || !model || !fbContent.trim()) return;
    setFbSubmitting(true);
    const { data, error } = await supabase.from('model_feedbacks').insert({
      model_id: model.id,
      user_id: user.id,
      content: fbContent.trim(),
      rating: fbRating,
    } as any).select().single();

    setFbSubmitting(false);
    if (error) { toast.error('Erreur'); return; }
    const newFb = { ...(data as unknown as Feedback), author_name: profiles[user.id] || 'Vous' };
    setFeedbacks(prev => [newFb, ...prev]);
    setModel(prev => prev ? { ...prev, feedback_count: prev.feedback_count + 1 } : prev);
    setFbContent(''); setFbRating(4); setShowFbForm(false);
    toast.success('Feedback ajouté !');
  };

  const startEditing = () => {
    if (!model) return;
    setEditTitle(model.title);
    setEditDescription(model.description);
    setEditType(model.type as ModelType);
    setEditComplexity(model.complexity);
    setEditTagsInput(model.tags.join(', '));
    setEditVersion(model.version);
    setEditSections((model.sections || {}) as Record<string, string>);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveEditing = async () => {
    if (!model || !editTitle.trim() || !editDescription.trim()) {
      toast.error('Le titre et la description sont requis');
      return;
    }
    setEditSubmitting(true);
    const tags = editTagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from('models').update({
      title: editTitle.trim(),
      description: editDescription.trim(),
      type: editType,
      complexity: editComplexity,
      tags,
      version: editVersion.trim(),
      sections: editSections,
    } as any).eq('id', model.id);

    setEditSubmitting(false);
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
      return;
    }
    setModel({
      ...model,
      title: editTitle.trim(),
      description: editDescription.trim(),
      type: editType,
      complexity: editComplexity,
      tags,
      version: editVersion.trim(),
      sections: editSections,
    });
    setEditing(false);
    toast.success('Modèle mis à jour !');
  };

  const complexityOptions = [
    { value: 'débutant', label: 'Débutant' },
    { value: 'intermédiaire', label: 'Intermédiaire' },
    { value: 'avancé', label: 'Avancé' },
  ];

  const sectionsByType: Record<ModelType, { label: string; key: string; placeholder: string }[]> = {
    problematique: [
      { label: 'Description du phénomène', key: 'description', placeholder: 'Décrivez le phénomène observé...' },
      { label: 'Patterns identifiés', key: 'patterns', placeholder: 'Décrivez les patterns comportementaux observés...' },
      { label: 'Prérequis', key: 'prerequisites', placeholder: 'Connaissances ou compétences nécessaires...' },
    ],
    outil: [
      { label: 'Structure du modèle', key: 'structure', placeholder: 'Décrivez la structure du modèle...' },
      { label: 'Protocole détaillé', key: 'protocol', placeholder: 'Décrivez les étapes du protocole...' },
      { label: 'Prérequis', key: 'prerequisites', placeholder: 'Rapport, état de ressource, calibration...' },
    ],
    approche: [
      { label: 'Philosophie et principes', key: 'philosophy', placeholder: 'Décrivez les fondements philosophiques...' },
      { label: 'Boîte à outils', key: 'toolkit', placeholder: 'Les outils associés à cette approche...' },
      { label: 'Prérequis', key: 'prerequisites', placeholder: 'Formations ou expériences recommandées...' },
    ],
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!model) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Modèle introuvable</p>
        <Link to="/library" className="mt-4 inline-block text-sm text-secondary hover:underline">← Retour à la bibliothèque</Link>
      </div>
    );
  }

  const canManage = isAdmin || (user && user.id === model.user_id);
  const sections = (model.sections || {}) as Record<string, string>;
  const statusFlow = ['brouillon', 'en_revision', 'en_test', 'publie', 'en_evolution'];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bibliothèque
      </Link>

      {/* Admin validation banner */}
      {isAdmin && !model.approved && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          <span className="text-sm text-foreground">Ce modèle est en attente de validation.</span>
          <button onClick={handleApprove} className="ml-auto rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            Valider
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        {!editing ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <TypeBadge type={model.type as any} />
              <StatusBadge status={model.status as any} />
              {!model.approved && (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">En attente</span>
              )}
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">v{model.version}</span>
              {canManage && (
                <button onClick={startEditing}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
              )}
            </div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{model.title}</h1>
            <p className="mb-5 text-muted-foreground leading-relaxed">{model.description}</p>
            <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {authorName || 'Anonyme'}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {new Date(model.updated_at).toLocaleDateString('fr-FR')}</span>
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {model.views_count}</span>
              <span className="flex items-center gap-1.5"><GitBranch className="h-4 w-4" /> {model.variations_count} variations</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> {model.feedback_count} feedbacks</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {model.tags.map(tag => (
                <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Modifier le modèle</h2>
              <button onClick={cancelEditing} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Titre *</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                maxLength={200} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Type</label>
                <select value={editType} onChange={e => setEditType(e.target.value as ModelType)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                  {(Object.entries(MODEL_TYPE_LABELS) as [ModelType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Complexité</label>
                <select value={editComplexity} onChange={e => setEditComplexity(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                  {complexityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Version</label>
                <input type="text" value={editVersion} onChange={e => setEditVersion(e.target.value)}
                  placeholder="1.0.0" maxLength={20}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description *</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                rows={4} maxLength={5000}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>

            {sectionsByType[editType].map(section => (
              <div key={section.key}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{section.label}</label>
                <textarea value={editSections[section.key] || ''} onChange={e => setEditSections(prev => ({ ...prev, [section.key]: e.target.value }))}
                  placeholder={section.placeholder} rows={4} maxLength={3000}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tags (séparés par des virgules)</label>
              <input type="text" value={editTagsInput} onChange={e => setEditTagsInput(e.target.value)}
                placeholder="ancrage, somatique, dissociation" maxLength={200}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button onClick={cancelEditing}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                Annuler
              </button>
              <button onClick={saveEditing} disabled={editSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
                <Save className="h-4 w-4" /> {editSubmitting ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status management */}
      {canManage && model.approved && (
        <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-foreground">Changer le statut :</p>
          <div className="flex flex-wrap gap-2">
            {statusFlow.map(s => (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={model.status === s}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${model.status === s ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'}`}>
                {MODEL_STATUS_LABELS[s as keyof typeof MODEL_STATUS_LABELS]}
              </button>
            ))}
          </div>
        </div>
      )}

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
            Variations ({model.variations_count})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Feedback ({model.feedback_count})
          </TabsTrigger>
        </TabsList>

        {/* Présentation */}
        <TabsContent value="presentation">
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(sections).filter(([_, v]) => v).map(([key, content]) => (
              <SectionBlock key={key} title={sectionLabel(key)} content={content} />
            ))}
            {Object.keys(sections).length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                Le contenu détaillé sera ajouté prochainement.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="historique">
          {model.changelog && model.changelog.length > 0 ? (
            <div className="space-y-4">
              {model.changelog.map((entry, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-secondary">v{entry.version}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="text-sm text-foreground">{entry.changes}</p>
                </div>
              ))}
            </div>
          ) : (
            <Placeholder text="Aucun historique disponible." />
          )}
        </TabsContent>

        {/* Variations */}
        <TabsContent value="variations">
          {user && (
            <div className="mb-6">
              {!showVarForm ? (
                <button onClick={() => setShowVarForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" /> Proposer une variation
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                  <h4 className="font-display text-sm font-semibold text-foreground">Nouvelle variation</h4>
                  <input type="text" value={varTitle} onChange={e => setVarTitle(e.target.value)}
                    placeholder="Titre de la variation" maxLength={200}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
                  <textarea value={varDesc} onChange={e => setVarDesc(e.target.value)}
                    placeholder="Décrivez en quoi cette variation diffère du modèle original..." rows={4} maxLength={3000}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowVarForm(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Annuler</button>
                    <button onClick={submitVariation} disabled={varSubmitting || !varTitle.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-50">
                      <Send className="h-4 w-4" /> {varSubmitting ? 'Envoi...' : 'Soumettre'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {variations.length > 0 ? (
            <div className="space-y-4">
              {variations.map(v => (
                <div key={v.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-display text-base font-semibold text-foreground">{v.title}</h4>
                    <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="mb-2 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                  <span className="text-xs text-muted-foreground">par {v.author_name || 'Anonyme'}</span>
                </div>
              ))}
            </div>
          ) : (
            <Placeholder text="Aucune variation proposée pour le moment. Soyez le premier !" />
          )}
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback">
          {user && (
            <div className="mb-6">
              {!showFbForm ? (
                <button onClick={() => setShowFbForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" /> Donner un feedback
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                  <h4 className="font-display text-sm font-semibold text-foreground">Votre feedback</h4>
                  <div>
                    <label className="mb-1.5 block text-sm text-muted-foreground">Note</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setFbRating(n)}
                          className={`p-1 transition-colors ${n <= fbRating ? 'text-amber-500' : 'text-muted-foreground/30'}`}>
                          <Star className="h-5 w-5" fill={n <= fbRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={fbContent} onChange={e => setFbContent(e.target.value)}
                    placeholder="Partagez votre retour d'expérience avec ce modèle..." rows={4} maxLength={3000}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowFbForm(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Annuler</button>
                    <button onClick={submitFeedback} disabled={fbSubmitting || !fbContent.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-50">
                      <Send className="h-4 w-4" /> {fbSubmitting ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {feedbacks.length > 0 ? (
            <div className="space-y-4">
              {feedbacks.map(f => (
                <div key={f.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{f.author_name || 'Anonyme'}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`h-3.5 w-3.5 ${n <= f.rating ? 'text-amber-500' : 'text-muted-foreground/20'}`}
                            fill={n <= f.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{f.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <Placeholder text="Aucun feedback pour le moment. Partagez votre retour d'expérience !" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const sectionLabel = (key: string) => {
  const labels: Record<string, string> = {
    description: 'Description du phénomène', patterns: 'Patterns identifiés', structure: 'Structure du modèle',
    protocol: 'Protocole détaillé', prerequisites: 'Prérequis', philosophy: 'Philosophie et principes', toolkit: 'Boîte à outils',
  };
  return labels[key] || key;
};

const SectionBlock = ({ title, content }: { title: string; content: string }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <h3 className="mb-3 font-display text-base font-semibold text-foreground">{title}</h3>
    <div className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{content}</div>
  </div>
);

const Placeholder = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{text}</div>
);

export default ModelDetail;
