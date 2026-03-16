import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Eye, GitBranch, MessageSquare, Clock, User, ShieldCheck, Star, Plus, Send, Pencil, X, Save, Trash2, Play, FileText, GraduationCap, ExternalLink, Sparkles, ArrowUpRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { DBModel, MODEL_STATUS_LABELS, MODEL_TYPE_LABELS, ModelType, ModelLink, ModelLinkType, JournalEntry, LegacyChangelogEntry } from '@/types/model';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import StatusBadge from '@/components/lab/StatusBadge';
import TypeBadge from '@/components/lab/TypeBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ImageUploader from '@/components/lab/ImageUploader';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, canManage } = useAdmin();
  const [model, setModel] = useState<DBModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [parentModel, setParentModel] = useState<{ id: string; title: string } | null>(null);
  const [childModels, setChildModels] = useState<{ id: string; title: string; author_name: string; created_at: string }[]>([]);
  const [linkedPosts, setLinkedPosts] = useState<{ id: string; title: string; created_at: string }[]>([]);


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
  const [editLinks, setEditLinks] = useState<ModelLink[]>([]);
  const [editJournalNote, setEditJournalNote] = useState('');
  const [editJournalAuthors, setEditJournalAuthors] = useState<string[]>([]);
  const [editOwnerId, setEditOwnerId] = useState('');
  const [editApprocheId, setEditApprocheId] = useState('');
  const [approches, setApproches] = useState<{ id: string; title: string }[]>([]);
  const [approcheName, setApprocheName] = useState('');
  const [allUsers, setAllUsers] = useState<{ user_id: string; display_name: string }[]>([]);
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

      // Fetch feedbacks and profiles in parallel
      const [fbsRes, profRes] = await Promise.all([
        supabase.from('model_feedbacks').select('*').eq('model_id', id!).order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, display_name').eq('user_id', m.user_id),
      ]);

      if (profRes.data?.[0]) setAuthorName(profRes.data[0].display_name);

      const allUserIds = new Set<string>([m.user_id]);
      const fbs = (fbsRes.data || []) as unknown as Feedback[];
      fbs.forEach(f => allUserIds.add(f.user_id));

      const { data: allProfs } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', [...allUserIds]);

      const profMap: Record<string, string> = {};
      allProfs?.forEach((p: any) => { profMap[p.user_id] = p.display_name; });
      setProfiles(profMap);

      setFeedbacks(fbs.map(f => ({ ...f, author_name: profMap[f.user_id] })));

      // Fetch parent model
      if (m.parent_model_id) {
        const { data: parentData } = await supabase.from('models').select('id, title').eq('id', m.parent_model_id).single();
        if (parentData) setParentModel({ id: parentData.id, title: parentData.title });
      }

      // Fetch child models (derived from this one)
      const { data: childData } = await supabase
        .from('models')
        .select('id, title, user_id, created_at')
        .eq('parent_model_id', id!)
        .order('created_at', { ascending: true });
      if (childData && childData.length > 0) {
        // Fetch author names for children
        const childUserIds = [...new Set(childData.map((c: any) => c.user_id))];
        const { data: childProfs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', childUserIds);
        const childProfMap: Record<string, string> = {};
        childProfs?.forEach((p: any) => { childProfMap[p.user_id] = p.display_name; });
        setChildModels(childData.map((c: any) => ({ id: c.id, title: c.title, author_name: childProfMap[c.user_id] || 'Anonyme', created_at: c.created_at })));
      }

      // Fetch linked forum posts via M:N table
      const { data: linkData } = await supabase
        .from('post_model_links')
        .select('post_id')
        .eq('model_id', id!);
      if (linkData && linkData.length > 0) {
        const postIds = linkData.map((l: any) => l.post_id);
        const { data: postsData } = await supabase
          .from('forum_posts')
          .select('id, title, created_at')
          .in('id', postIds)
          .order('created_at', { ascending: false });
        if (postsData) setLinkedPosts(postsData as any);
      }

      setLoading(false);
    };
    fetchAll();
  }, [id]);

  // Load all users for admin selectors + approches list
  useEffect(() => {
    if (isAdmin) {
      supabase.from('profiles').select('user_id, display_name').order('display_name')
        .then(({ data }) => { if (data) setAllUsers(data as any); });
    }
    supabase.from('models').select('id, title').eq('type', 'approche').eq('approved', true).order('title')
      .then(({ data }) => { if (data) setApproches(data as any); });
  }, [isAdmin]);

  // Load approche name if linked
  useEffect(() => {
    if (model?.approche_id) {
      supabase.from('models').select('title').eq('id', model.approche_id).single()
        .then(({ data }) => { if (data) setApprocheName(data.title); });
    }
  }, [model?.approche_id]);

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

  const handleUnapprove = async () => {
    if (!model) return;
    await supabase.from('models').update({ approved: false } as any).eq('id', model.id);
    setModel({ ...model, approved: false });
    toast.success('Modèle remis en attente');
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
    setEditLinks((model.links || []) as ModelLink[]);
    setEditJournalNote('');
    setEditJournalAuthors([profiles[user?.id || ''] || 'Anonyme']);
    setEditOwnerId(model.user_id);
    setEditApprocheId(model.approche_id || '');
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
    const savedLinks = editLinks.filter(l => l.url.trim() && l.title.trim());

    // Build updated journal/changelog
    const existingChangelog = model.changelog || [];
    let updatedChangelog = existingChangelog;
    if (editJournalNote.trim()) {
      const newEntry: JournalEntry = {
        version: editVersion.trim() || model.version,
        date: new Date().toISOString().split('T')[0],
        authors: editJournalAuthors.filter(a => a.trim()),
        note: editJournalNote.trim(),
      };
      updatedChangelog = [newEntry, ...existingChangelog];
    }

    const updateData: any = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      type: editType,
      complexity: editComplexity,
      tags,
      version: editVersion.trim(),
      sections: editSections,
      links: savedLinks,
      changelog: updatedChangelog,
      approche_id: editApprocheId || null,
    };
    if (isAdmin && editOwnerId && editOwnerId !== model.user_id) {
      updateData.user_id = editOwnerId;
    }

    const { error } = await supabase.from('models').update(updateData).eq('id', model.id);

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
      links: savedLinks,
      changelog: updatedChangelog,
      approche_id: editApprocheId || null,
      user_id: isAdmin && editOwnerId ? editOwnerId : model.user_id,
    });
    if (editApprocheId) {
      const a = approches.find(a => a.id === editApprocheId);
      setApprocheName(a?.title || '');
    } else {
      setApprocheName('');
    }
    if (isAdmin && editOwnerId && editOwnerId !== model.user_id) {
      setAuthorName(allUsers.find(u => u.user_id === editOwnerId)?.display_name || '');
    }
    setEditing(false);
    toast.success('Modèle mis à jour !');
  };

  const handleDelete = async () => {
    if (!model) return;
    const { error } = await supabase.from('models').delete().eq('id', model.id);
    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
      return;
    }
    toast.success('Modèle supprimé');
    navigate('/library');
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
      { label: 'Signaux reconnaissables', key: 'signals', placeholder: 'Quels signaux permettent de repérer cette expérience ? (corporels, verbaux, comportementaux...)' },
      { label: 'Points d\'intervention', key: 'intervention_points', placeholder: 'À quels endroits peut-on intervenir pour modifier l\'expérience ?' },
      { label: 'Prérequis', key: 'prerequisites', placeholder: 'Connaissances ou compétences nécessaires...' },
    ],
    outil: [
      { label: 'Structure du modèle', key: 'structure', placeholder: 'Décrivez la structure du modèle...' },
      { label: 'Protocole détaillé', key: 'protocol', placeholder: 'Décrivez les étapes du protocole...' },
      { label: 'Principe actif', key: 'active_principle', placeholder: 'Quel est le mécanisme central qui produit le changement ?' },
      { label: 'Points de vigilance', key: 'vigilance', placeholder: 'Situations où l\'outil ne fonctionne pas bien, contre-indications, erreurs fréquentes...' },
      { label: 'Variantes connues', key: 'variants', placeholder: 'Adaptations ou variantes de cet outil utilisées par d\'autres praticiens...' },
      { label: 'Prérequis', key: 'prerequisites', placeholder: 'Rapport, état de ressource, calibration...' },
    ],
    approche: [
      { label: 'Philosophie et principes', key: 'philosophy', placeholder: 'Décrivez les fondements philosophiques...' },
      { label: 'Créateurs', key: 'creators', placeholder: 'Qui a créé ou développé cette approche ?' },
      { label: 'Boîte à outils', key: 'toolkit', placeholder: 'Les outils et techniques associés à cette approche...' },
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

  const canEdit = canManage || (user && user.id === model.user_id);
  const sections = (model.sections || {}) as Record<string, string>;
  const statusFlow = ['brouillon', 'en_revision', 'en_test', 'publie', 'en_evolution'];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bibliothèque
      </Link>

      {/* Admin validation banner */}
      {canManage && !model.approved && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          <span className="text-sm text-foreground">Ce modèle est en attente de validation.</span>
          <button onClick={handleApprove} className="ml-auto rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            Valider
          </button>
        </div>
      )}
      {canManage && model.approved && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="text-sm text-foreground">Ce modèle est validé.</span>
          <button onClick={handleUnapprove} className="ml-auto rounded-lg border border-amber-500 px-4 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30">
            Remettre en attente
          </button>
        </div>
      )}

      {/* Parent model banner */}
      {parentModel && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 p-3">
          <GitBranch className="h-4 w-4 text-secondary" />
          <span className="text-sm text-foreground">Dérivé de</span>
          <Link to={`/model/${parentModel.id}`} className="text-sm font-medium text-secondary hover:underline">
            {parentModel.title}
          </Link>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">Supprimer ce modèle ?</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Le modèle <strong>"{model.title}"</strong> sera supprimé définitivement, ainsi que ses variations et feedbacks. Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                Annuler
              </button>
              <button onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                Supprimer définitivement
              </button>
            </div>
          </div>
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
              {canEdit && (
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={startEditing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </button>
                  {isAdmin && (
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors dark:hover:bg-red-950/30">
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{model.title}</h1>
            <div className="mb-5 prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{model.description}</ReactMarkdown>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {authorName || 'Anonyme'}</span>
              {approcheName && (
                <Link to={`/model/${model.approche_id}`} className="flex items-center gap-1.5 text-secondary hover:underline">
                  <Sparkles className="h-4 w-4" /> {approcheName}
                </Link>
              )}
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {new Date(model.updated_at).toLocaleDateString('fr-FR')}</span>
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {model.views_count}</span>
              <span className="flex items-center gap-1.5"><GitBranch className="h-4 w-4" /> {childModels.length} variantes</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> {feedbacks.length} feedbacks</span>
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
              {isAdmin && allUsers.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Propriétaire</label>
                  <select value={editOwnerId} onChange={e => setEditOwnerId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                    {allUsers.map(u => (
                      <option key={u.user_id} value={u.user_id}>{u.display_name}</option>
                    ))}
                  </select>
                </div>
              )}
              {editType !== 'approche' && approches.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Approche associée</label>
                  <select value={editApprocheId} onChange={e => setEditApprocheId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                    <option value="">— Aucune approche —</option>
                    {approches.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <MarkdownField
              label="Description *"
              value={editDescription}
              onChange={setEditDescription}
              maxLength={5000}
              modelId={model?.id}
            />

            {sectionsByType[editType].map(section => (
              <MarkdownField
                key={section.key}
                label={section.label}
                value={editSections[section.key] || ''}
                onChange={v => setEditSections(prev => ({ ...prev, [section.key]: v }))}
                placeholder={section.placeholder}
                maxLength={3000}
                modelId={model?.id}
              />
            ))}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tags (séparés par des virgules)</label>
              <input type="text" value={editTagsInput} onChange={e => setEditTagsInput(e.target.value)}
                placeholder="ancrage, somatique, dissociation" maxLength={200}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>

            {/* Liens */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Liens & ressources</label>
                <button type="button" onClick={() => setEditLinks(prev => [...prev, { type: 'video', title: '', url: '', description: '' }])}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary/10">
                  <Plus className="h-3.5 w-3.5" /> Ajouter un lien
                </button>
              </div>
              {editLinks.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucun lien. Ajoutez des vidéos, documents ou formations liés à ce modèle.</p>
              )}
              <div className="space-y-3">
                {editLinks.map((link, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select value={link.type} onChange={e => setEditLinks(prev => prev.map((l, j) => j === i ? { ...l, type: e.target.value as ModelLinkType } : l))}
                        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-ring focus:ring-2">
                        <option value="video">Video</option>
                        <option value="doc">Document</option>
                        <option value="formation">Formation</option>
                      </select>
                      <input type="text" value={link.title} onChange={e => setEditLinks(prev => prev.map((l, j) => j === i ? { ...l, title: e.target.value } : l))}
                        placeholder="Titre du lien" className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-ring focus:ring-2" />
                      <button type="button" onClick={() => setEditLinks(prev => prev.filter((_, j) => j !== i))}
                        className="rounded p-1 text-muted-foreground hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input type="url" value={link.url} onChange={e => setEditLinks(prev => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                      placeholder="https://..." className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-ring focus:ring-2" />
                    <input type="text" value={link.description || ''} onChange={e => setEditLinks(prev => prev.map((l, j) => j === i ? { ...l, description: e.target.value } : l))}
                      placeholder="Description courte (optionnel)" className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-ring focus:ring-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Journal d'évolution */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <label className="block text-sm font-medium text-foreground">Journal d'évolution</label>
              <p className="text-xs text-muted-foreground">Décrivez ce qui a changé. Cette entrée sera ajoutée au journal avec la version, la date et les contributeurs.</p>
              <textarea value={editJournalNote} onChange={e => setEditJournalNote(e.target.value)}
                placeholder="Ex: Ajout du principe actif, correction des prérequis, variante kinesthésique..."
                rows={2} maxLength={1000}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Contributeurs de cette modification</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editJournalAuthors.map((author, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-xs text-secondary">
                      {author}
                      <button type="button" onClick={() => setEditJournalAuthors(prev => prev.filter((_, j) => j !== i))}
                        className="ml-0.5 text-secondary/60 hover:text-secondary"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                {isAdmin && allUsers.length > 0 ? (
                  <select
                    value=""
                    onChange={e => {
                      const name = e.target.value;
                      if (name && !editJournalAuthors.includes(name)) {
                        setEditJournalAuthors(prev => [...prev, name]);
                      }
                    }}
                    className="rounded border border-input bg-background px-2 py-1.5 text-xs outline-none ring-ring focus:ring-2">
                    <option value="">+ Ajouter un contributeur</option>
                    {allUsers.filter(u => !editJournalAuthors.includes(u.display_name)).map(u => (
                      <option key={u.user_id} value={u.display_name}>{u.display_name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Vous êtes listé comme contributeur de cette modification.</p>
                )}
              </div>
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
      {canEdit && model.approved && (
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
        <TabsList className="mb-6 w-full justify-start overflow-x-auto border-b border-border bg-transparent p-0">
          <TabsTrigger value="presentation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Présentation
          </TabsTrigger>
          <TabsTrigger value="liens" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Liens {(model.links as ModelLink[] || []).length > 0 ? `(${(model.links as ModelLink[]).length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="historique" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Historique
          </TabsTrigger>
          <TabsTrigger value="variations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Variantes ({childModels.length})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            Feedback ({feedbacks.length})
          </TabsTrigger>
        </TabsList>

        {/* Présentation — chaque section dans son propre bloc navigable */}
        <TabsContent value="presentation">
          {(() => {
            const filledSections = Object.entries(sections).filter(([_, v]) => v);
            if (filledSections.length === 0) {
              return (
                <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                  Le contenu détaillé sera ajouté prochainement.
                </div>
              );
            }
            if (filledSections.length <= 2) {
              return (
                <div className="space-y-6">
                  {filledSections.map(([key, content]) => (
                    <SectionBlock key={key} title={sectionLabel(key)} content={content} />
                  ))}
                </div>
              );
            }
            // Plus de 2 sections → sous-tabs pour naviguer
            return (
              <Tabs defaultValue={filledSections[0][0]} className="w-full">
                <TabsList className="mb-4 flex flex-wrap gap-1 bg-transparent p-0">
                  {filledSections.map(([key]) => (
                    <TabsTrigger key={key} value={key}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:border-secondary">
                      {sectionLabel(key)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {filledSections.map(([key, content]) => (
                  <TabsContent key={key} value={key}>
                    <SectionBlock title={sectionLabel(key)} content={content} />
                  </TabsContent>
                ))}
              </Tabs>
            );
          })()}
        </TabsContent>

        {/* Liens & ressources */}
        <TabsContent value="liens">
          {(model.links as ModelLink[] || []).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(model.links as ModelLink[]).map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-secondary/50 hover:bg-secondary/5">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    link.type === 'video' ? 'bg-red-500/10 text-red-500' :
                    link.type === 'formation' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {link.type === 'video' ? <Play className="h-4 w-4" /> :
                     link.type === 'formation' ? <GraduationCap className="h-4 w-4" /> :
                     <FileText className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground group-hover:text-secondary truncate">{link.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {link.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{link.description}</p>
                    )}
                    <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      {link.type === 'video' ? 'Vidéo' : link.type === 'formation' ? 'Formation' : 'Document'}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Aucun lien pour le moment. Cliquez sur <strong>Modifier</strong> pour ajouter des vidéos, documents ou formations.
            </div>
          )}
        </TabsContent>

        {/* Historique */}
        <TabsContent value="historique">
          <div className="space-y-6">
            {/* Discussions liées */}
            {linkedPosts.length > 0 && (
              <div>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Discussions communautaires</h3>
                <div className="space-y-2">
                  {linkedPosts.map(post => (
                    <Link key={post.id} to={`/community`}
                      className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 hover:border-purple-500/40 transition-colors">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Filiation parent */}
            {parentModel && (
              <div>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Origine</h3>
                <Link to={`/model/${parentModel.id}`}
                  className="flex items-center gap-3 rounded-lg border border-secondary/20 bg-secondary/5 p-4 hover:border-secondary/40 transition-colors">
                  <GitBranch className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Dérivé de <span className="text-secondary">{parentModel.title}</span></p>
                    <p className="text-xs text-muted-foreground">Ce modèle a été créé à partir d'une variation du modèle parent</p>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            )}

            {/* Contributeurs */}
            {model.changelog && model.changelog.length > 0 && (() => {
              const allContributors = new Set<string>();
              model.changelog.forEach(entry => {
                if ('authors' in entry && Array.isArray(entry.authors)) {
                  entry.authors.forEach(a => allContributors.add(a));
                } else if ('author' in entry && entry.author) {
                  allContributors.add(entry.author);
                }
              });
              return allContributors.size > 0 ? (
                <div>
                  <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contributeurs</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...allContributors].map(name => (
                      <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1.5 text-sm text-secondary">
                        <User className="h-3.5 w-3.5" /> {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Journal d'évolution */}
            {model.changelog && model.changelog.length > 0 && (
              <div>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Journal d'évolution</h3>
                <div className="space-y-3">
                  {model.changelog.map((entry, i) => {
                    const isJournal = 'authors' in entry && Array.isArray((entry as JournalEntry).authors);
                    const journalEntry = entry as JournalEntry;
                    const legacyEntry = entry as LegacyChangelogEntry;
                    return (
                      <div key={i} className="rounded-lg border border-border bg-card p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-secondary">v{entry.version}</span>
                          <span className="text-xs text-muted-foreground">{entry.date}</span>
                          {isJournal ? (
                            journalEntry.authors.length > 0 && (
                              <span className="text-xs text-muted-foreground">par {journalEntry.authors.join(', ')}</span>
                            )
                          ) : (
                            legacyEntry.author && <span className="text-xs text-muted-foreground">par {legacyEntry.author}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{isJournal ? journalEntry.note : legacyEntry.changes}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modèles dérivés (enfants) */}
            {childModels.length > 0 && (
              <div>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Modèles dérivés</h3>
                <div className="space-y-2">
                  {childModels.map(child => (
                    <Link key={child.id} to={`/model/${child.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-secondary/30 transition-colors">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{child.title}</p>
                        <p className="text-xs text-muted-foreground">par {child.author_name} · {new Date(child.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!parentModel && (!model.changelog || model.changelog.length === 0) && childModels.length === 0 && (
              <Placeholder text="Aucun historique disponible." />
            )}
          </div>
        </TabsContent>

        {/* Variantes (modèles dérivés) */}
        <TabsContent value="variations">
          {user && (
            <div className="mb-6">
              <Link
                to={`/contribute?parent=${model.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Plus className="h-4 w-4" /> Créer une variante
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                Une variante est un modèle complet, dérivé de celui-ci, qui adapte ou enrichit le protocole pour un cas particulier.
              </p>
            </div>
          )}
          {childModels.length > 0 ? (
            <div className="space-y-3">
              {childModels.map(child => (
                <Link key={child.id} to={`/model/${child.id}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 hover:border-secondary/30 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                    <GitBranch className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{child.title}</p>
                    <p className="text-xs text-muted-foreground">par {child.author_name} · {new Date(child.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <Placeholder text="Aucune variante pour le moment. Créez-en une pour adapter ce modèle à un cas particulier." />
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
    signals: 'Signaux reconnaissables', intervention_points: 'Points d\'intervention',
    active_principle: 'Principe actif', vigilance: 'Points de vigilance', variants: 'Variantes connues',
    creators: 'Créateurs',
  };
  return labels[key] || key;
};

const SectionBlock = ({ title, content }: { title: string; content: string }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <h3 className="mb-3 font-display text-base font-semibold text-foreground">{title}</h3>
    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  </div>
);

const Placeholder = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{text}</div>
);

const MarkdownField = ({ label, value, onChange, placeholder, maxLength, modelId }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  modelId?: string;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const handleInsert = useCallback((markdown: string) => {
    const ta = ref.current;
    if (ta) {
      const start = ta.selectionStart ?? value.length;
      const newVal = value.slice(0, start) + '\n' + markdown + '\n' + value.slice(start);
      onChange(newVal);
    } else {
      onChange(value + '\n' + markdown);
    }
  }, [value, onChange]);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={4} maxLength={maxLength}
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
      <div className="mt-1 flex items-center gap-2">
        <ImageUploader modelId={modelId} textareaRef={ref} onInsert={handleInsert} />
        <span className="text-[10px] text-muted-foreground">Markdown supporté</span>
      </div>
    </div>
  );
};

export default ModelDetail;
