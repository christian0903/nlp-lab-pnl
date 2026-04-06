import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, GitBranch, MessageSquare, Clock, User, ShieldCheck, Star, Plus, Send, Pencil, X, Save, Trash2, Play, FileText, GraduationCap, ExternalLink, Sparkles, ArrowUpRight, Globe, Upload, Download } from 'lucide-react';
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
import LangBadge from '@/components/lab/LangBadge';

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
  const { t, i18n } = useTranslation();
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
  const [linkedPosts, setLinkedPosts] = useState<{ id: string; title: string; content: string; user_id: string; created_at: string; category: string }[]>([]);
  const [approcheModels, setApprocheModels] = useState<{ id: string; title: string; type: string; version: string; user_id: string }[]>([]);
  const [translationModel, setTranslationModel] = useState<{ id: string; lang: string } | null>(null);

  // Feedbacks (legacy, displayed in Discussions)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

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
  const [editCreatedAt, setEditCreatedAt] = useState('');
  const [editApprocheId, setEditApprocheId] = useState('');
  const [approches, setApproches] = useState<{ id: string; title: string }[]>([]);
  const [approcheName, setApprocheName] = useState('');
  const [allUsers, setAllUsers] = useState<{ user_id: string; display_name: string }[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editTranslationId, setEditTranslationId] = useState<string>('');
  const [editIsOriginal, setEditIsOriginal] = useState(true);
  const [otherLangModels, setOtherLangModels] = useState<{ id: string; title: string }[]>([]);

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
        setChildModels(childData.map((c: any) => ({ id: c.id, title: c.title, author_name: childProfMap[c.user_id] || t('common.anonymous'), created_at: c.created_at })));
      }

      // Fetch linked forum posts (M:N table + legacy model_id)
      const postIds = new Set<string>();
      const { data: linkData } = await supabase.from('post_model_links').select('post_id').eq('model_id', id!);
      if (linkData) linkData.forEach((l: any) => postIds.add(l.post_id));
      const { data: legacyPosts } = await supabase.from('forum_posts').select('id').eq('model_id', id!);
      if (legacyPosts) legacyPosts.forEach((p: any) => postIds.add(p.id));
      if (postIds.size > 0) {
        const { data: postsData } = await supabase
          .from('forum_posts')
          .select('id, title, content, user_id, created_at, category')
          .in('id', [...postIds])
          .order('created_at', { ascending: false });
        if (postsData) {
          setLinkedPosts(postsData as any);
          postsData.forEach((p: any) => allUserIds.add(p.user_id));
        }
      }

      // If this is an approche, fetch models linked to it
      if (m.type === 'approche') {
        const { data: appModels } = await supabase
          .from('models')
          .select('id, title, type, version, user_id')
          .eq('approche_id', id!)
          .eq('approved', true)
          .order('type')
          .order('title');
        if (appModels) {
          setApprocheModels(appModels as any);
          appModels.forEach((am: any) => allUserIds.add(am.user_id));
        }
      }

      // Fetch all profiles at once
      const { data: allProfs } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', [...allUserIds]);

      const profMap: Record<string, string> = {};
      allProfs?.forEach((p: any) => { profMap[p.user_id] = p.display_name; });
      setProfiles(profMap);

      setFeedbacks(fbs.map(f => ({ ...f, author_name: profMap[f.user_id] })));

      // Find translation: either this model is a translation_of another, or another model points to this one
      const modelLang = m.lang || 'fr';
      if (m.translation_of) {
        // This is a translation — link to the original
        setTranslationModel({ id: m.translation_of, lang: modelLang === 'en' ? 'fr' : 'en' });
      } else {
        // Check if a translation of this model exists
        const { data: translationData } = await supabase
          .from('models')
          .select('id, lang')
          .eq('translation_of', id!)
          .limit(1);
        if (translationData && translationData.length > 0) {
          setTranslationModel({ id: translationData[0].id, lang: translationData[0].lang || 'en' });
        } else {
          setTranslationModel(null);
        }
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
    toast.success(t('modelDetail.statusChanged', { status: t('modelStatuses.' + newStatus, MODEL_STATUS_LABELS[newStatus as keyof typeof MODEL_STATUS_LABELS] || newStatus) }));
  };

  const handleApprove = async () => {
    if (!model) return;
    await supabase.from('models').update({ approved: true } as any).eq('id', model.id);
    setModel({ ...model, approved: true });
    toast.success(t('modelDetail.approveSuccess'));
  };

  const handleUnapprove = async () => {
    if (!model) return;
    await supabase.from('models').update({ approved: false } as any).eq('id', model.id);
    setModel({ ...model, approved: false });
    toast.success(t('modelDetail.unapproveSuccess'));
  };

  const startEditing = async () => {
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
    setEditJournalAuthors([profiles[user?.id || ''] || t('common.anonymous')]);
    setEditOwnerId(model.user_id);
    setEditCreatedAt(model.created_at.split('T')[0]);
    setEditApprocheId(model.approche_id || '');

    // Translation link setup
    const modelLang = model.lang || 'fr';
    const otherLang = modelLang === 'fr' ? 'en' : 'fr';
    const isOriginal = !model.translation_of;
    setEditIsOriginal(isOriginal);

    // Find current linked translation
    if (model.translation_of) {
      setEditTranslationId(model.translation_of);
    } else if (translationModel) {
      setEditTranslationId(translationModel.id);
    } else {
      setEditTranslationId('');
    }

    // Load candidate models in the other language (same type)
    const { data: candidates } = await supabase
      .from('models')
      .select('id, title')
      .eq('type', model.type)
      .eq('lang', otherLang)
      .eq('approved', true)
      .order('title');
    setOtherLangModels(candidates || []);

    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveEditing = async () => {
    if (!model || !editTitle.trim() || !editDescription.trim()) {
      toast.error(t('modelDetail.titleDescRequired'));
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
    if (isAdmin && editCreatedAt) {
      updateData.created_at = new Date(editCreatedAt).toISOString();
    }

    const { error } = await supabase.from('models').update(updateData).eq('id', model.id);

    // Handle translation link changes
    if (canManage) {
      const oldTranslationId = model.translation_of || (translationModel?.id ?? '');
      const newTranslationId = editTranslationId;

      if (newTranslationId !== oldTranslationId) {
        // Unlink old translation if any
        if (oldTranslationId) {
          if (model.translation_of === oldTranslationId) {
            // This model was the translation → clear its translation_of
            await supabase.from('models').update({ translation_of: null } as any).eq('id', model.id);
          } else {
            // The other model pointed to this one → clear its translation_of
            await supabase.from('models').update({ translation_of: null } as any).eq('id', oldTranslationId);
          }
        }

        // Link new translation
        if (newTranslationId) {
          if (editIsOriginal) {
            // This model is the original → the other is the translation
            await supabase.from('models').update({ translation_of: model.id } as any).eq('id', newTranslationId);
            await supabase.from('models').update({ translation_of: null } as any).eq('id', model.id);
          } else {
            // This model is the translation → it points to the other
            await supabase.from('models').update({ translation_of: newTranslationId } as any).eq('id', model.id);
            await supabase.from('models').update({ translation_of: null } as any).eq('id', newTranslationId);
          }
        }

        // Update local translation state
        if (newTranslationId) {
          const otherLang = (model.lang || 'fr') === 'fr' ? 'en' : 'fr';
          setTranslationModel({ id: newTranslationId, lang: otherLang });
        } else {
          setTranslationModel(null);
        }
      }
    }

    setEditSubmitting(false);
    if (error) {
      toast.error(t('modelDetail.saveError'));
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
      translation_of: editIsOriginal ? null : (editTranslationId || null),
      user_id: isAdmin && editOwnerId ? editOwnerId : model.user_id,
      created_at: isAdmin && editCreatedAt ? new Date(editCreatedAt).toISOString() : model.created_at,
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
    toast.success(t('modelDetail.saveSuccess'));
  };

  const handleDelete = async () => {
    if (!model) return;
    const { error } = await supabase.from('models').delete().eq('id', model.id);
    if (error) {
      toast.error(t('modelDetail.deleteError'));
      console.error(error);
      return;
    }
    toast.success(t('modelDetail.deleteSuccess'));
    navigate('/library');
  };

  const handleCreateTranslation = async () => {
    if (!model || !user) return;
    const targetLang = (model.lang || 'fr') === 'fr' ? 'en' : 'fr';
    const { data, error } = await supabase.from('models').insert({
      user_id: user.id,
      title: model.title,
      type: model.type,
      status: 'brouillon',
      version: '1.0.0',
      complexity: model.complexity,
      tags: model.tags,
      description: '',
      sections: {},
      links: [],
      lang: targetLang,
      translation_of: model.id,
      approved: true,
      approche_id: model.approche_id || null,
    } as any).select('id').single();
    if (error) {
      toast.error(t('language.translationError'));
      console.error(error);
      return;
    }
    toast.success(t('language.translationCreated'));
    if (data) navigate(`/model/${data.id}`);
  };

  const handleExport = () => {
    if (!model) return;
    const sections = (model.sections || {}) as Record<string, string>;
    const tags = model.tags.map(t => `  - ${t}`).join('\n');
    let md = `---\naction: update\ntitle: "${model.title}"\ntype: ${model.type}\nstatus: ${model.status}\nversion: "${model.version}"\ncomplexity: ${model.complexity}\ntags:\n${tags}\n---\n\n## Description\n\n${model.description}\n`;
    const filledSections = Object.entries(sections).filter(([_, v]) => v);
    if (filledSections.length > 0) {
      md += '\n## Sections\n';
      for (const [key, content] of filledSections) {
        md += `\n### ${key}\n\n${content}\n`;
      }
    }
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.title.replace(/[^a-zA-Z0-9àâéèêëïîôùûüçÀÂÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '').trim()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportOverwrite = () => {
    if (!model) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const { parseModelFiche } = await import('@/lib/parseModelFiche');
        const result = parseModelFiche(text);
        setEditTitle(result.title);
        setEditDescription(result.description);
        setEditType(result.type as ModelType);
        setEditComplexity(result.complexity);
        setEditVersion(result.version);
        setEditTagsInput(result.tags.join(', '));
        setEditSections(result.sections);
        toast.success('Fiche importée — vérifiez puis sauvegardez');
      } catch (err: any) {
        toast.error('Erreur de parsing : ' + err.message);
      }
    };
    input.click();
  };

  const complexityOptions = [
    { value: 'débutant', label: t('contribute.complexityBeginner') },
    { value: 'intermédiaire', label: t('contribute.complexityIntermediate') },
    { value: 'avancé', label: t('contribute.complexityAdvanced') },
  ];

  const sectionsByType: Record<ModelType, { label: string; key: string; placeholder: string }[]> = {
    problematique: [
      { label: t('modelDetail.sectionLabels.description'), key: 'description', placeholder: t('contribute.sections.patternsPlaceholder') },
      { label: t('contribute.sections.patterns'), key: 'patterns', placeholder: t('contribute.sections.patternsPlaceholder') },
      { label: t('contribute.sections.signals'), key: 'signals', placeholder: t('contribute.sections.signalsPlaceholder') },
      { label: t('contribute.sections.intervention_points'), key: 'intervention_points', placeholder: t('contribute.sections.intervention_pointsPlaceholder') },
      { label: t('contribute.sections.prerequisites'), key: 'prerequisites', placeholder: t('contribute.sections.prerequisitesPlaceholder_problematique') },
    ],
    outil: [
      { label: t('contribute.sections.structure'), key: 'structure', placeholder: t('contribute.sections.structurePlaceholder') },
      { label: t('contribute.sections.protocol'), key: 'protocol', placeholder: t('contribute.sections.protocolPlaceholder') },
      { label: t('contribute.sections.active_principle'), key: 'active_principle', placeholder: t('contribute.sections.active_principlePlaceholder') },
      { label: t('contribute.sections.vigilance'), key: 'vigilance', placeholder: t('contribute.sections.vigilancePlaceholder') },
      { label: t('contribute.sections.variants'), key: 'variants', placeholder: t('contribute.sections.variantsPlaceholder') },
      { label: t('contribute.sections.prerequisites'), key: 'prerequisites', placeholder: t('contribute.sections.prerequisitesPlaceholder_outil') },
    ],
    approche: [
      { label: t('contribute.sections.philosophy'), key: 'philosophy', placeholder: t('contribute.sections.philosophyPlaceholder') },
      { label: t('contribute.sections.creators'), key: 'creators', placeholder: t('contribute.sections.creatorsPlaceholder') },
      { label: t('contribute.sections.structure'), key: 'structure', placeholder: t('contribute.sections.structurePlaceholder') },
      { label: t('contribute.sections.toolkit'), key: 'toolkit', placeholder: t('contribute.sections.toolkitPlaceholder') },
      { label: t('contribute.sections.prerequisites'), key: 'prerequisites', placeholder: t('contribute.sections.prerequisitesPlaceholder_approche') },
    ],
  };

  const sectionLabel = (key: string) => {
    return t(`modelDetail.sectionLabels.${key}`, key);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  }

  if (!model) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{t('modelDetail.notFound')}</p>
        <Link to="/library" className="mt-4 inline-block text-sm text-secondary hover:underline">{t('modelDetail.backToLibrary')}</Link>
      </div>
    );
  }

  const canEdit = canManage || (user && user.id === model.user_id);
  const sections = (model.sections || {}) as Record<string, string>;
  const statusFlow = ['brouillon', 'en_revision', 'en_test', 'publie', 'en_evolution'];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('modelDetail.library')}
      </Link>

      {/* Admin validation banner */}
      {canManage && !model.approved && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          <span className="text-sm text-foreground">{t('modelDetail.pendingValidation')}</span>
          <button onClick={handleApprove} className="ml-auto rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            {t('modelDetail.validate')}
          </button>
        </div>
      )}
      {canManage && model.approved && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="text-sm text-foreground">{t('modelDetail.validated')}</span>
          <button onClick={handleUnapprove} className="ml-auto rounded-lg border border-amber-500 px-4 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30">
            {t('modelDetail.putBack')}
          </button>
        </div>
      )}

      {/* Parent model banner */}
      {parentModel && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 p-3">
          <GitBranch className="h-4 w-4 text-secondary" />
          <span className="text-sm text-foreground">{t('modelDetail.derivedFrom')}</span>
          <Link to={`/model/${parentModel.id}`} className="text-sm font-medium text-secondary hover:underline">
            {parentModel.title}
          </Link>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">{t('modelDetail.deleteTitle')}</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {t('modelDetail.deleteMessage', { title: model.title })}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                {t('common.cancel')}
              </button>
              <button onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                {t('modelDetail.deleteConfirm')}
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
              <LangBadge lang={model.lang || 'fr'} />
              <StatusBadge status={model.status as any} />
              {!model.approved && (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">{t('modelDetail.pending')}</span>
              )}
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">v{model.version}</span>
              {canEdit && (
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={startEditing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
                  </button>
                  {isAdmin && (
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors dark:hover:bg-red-950/30">
                      <Trash2 className="h-3.5 w-3.5" /> {t('common.delete')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <h1 className="mb-2 font-display text-2xl sm:text-3xl font-bold text-foreground">{model.title}</h1>
            <div className="mb-5 prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{model.description}</ReactMarkdown>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-5 text-sm text-muted-foreground">
              <Link to={`/profil/${model.user_id}`} className="flex items-center gap-1.5 hover:text-secondary transition-colors">
                <User className="h-4 w-4" /> {authorName || t('common.anonymous')}
              </Link>
              {approcheName && (
                <Link to={`/model/${model.approche_id}`} className="flex items-center gap-1.5 text-secondary hover:underline">
                  <Sparkles className="h-4 w-4" /> {approcheName}
                </Link>
              )}
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {new Date(model.updated_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}</span>
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {model.views_count}</span>
              <span className="flex items-center gap-1.5"><GitBranch className="h-4 w-4" /> {childModels.length} {t('modelDetail.variants').toLowerCase()}</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> {linkedPosts.length + feedbacks.length} {t('modelDetail.discussions').toLowerCase()}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {model.tags.map(tag => (
                <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
            {/* Translation link or create button */}
            <div className="mt-4 flex items-center gap-2">
              {translationModel ? (
                <Link
                  to={`/model/${translationModel.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-secondary hover:border-secondary/30 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {translationModel.lang === 'en' ? t('language.viewInEnglish') : t('language.viewInFrench')}
                </Link>
              ) : canManage && (
                <button
                  onClick={handleCreateTranslation}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-secondary/40 px-3 py-2 text-xs font-medium text-secondary hover:bg-secondary/5 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {(model.lang || 'fr') === 'fr' ? t('language.translateToEnglish') : t('language.translateToFrench')}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">{t('modelDetail.editModel')}</h2>
              <div className="flex items-center gap-2">
                {!model.approved && (
                  <button onClick={handleImportOverwrite}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="h-3.5 w-3.5" /> {t('language.importOverwrite')}
                  </button>
                )}
                <button onClick={handleExport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="h-3.5 w-3.5" /> {t('language.export')}
                </button>
                <button onClick={cancelEditing}
                  className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                  {t('common.cancel')}
                </button>
                <button onClick={saveEditing} disabled={editSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
                  <Save className="h-4 w-4" /> {editSubmitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t('modelDetail.titleLabel')}</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                maxLength={200} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('modelDetail.typeLabel')}</label>
                <select value={editType} onChange={e => setEditType(e.target.value as ModelType)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                  {(Object.entries(MODEL_TYPE_LABELS) as [ModelType, string][]).map(([k]) => (
                    <option key={k} value={k}>{t('modelTypes.' + k)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('modelDetail.complexityLabel')}</label>
                <select value={editComplexity} onChange={e => setEditComplexity(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                  {complexityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('modelDetail.versionLabel')}</label>
                <input type="text" value={editVersion} onChange={e => setEditVersion(e.target.value)}
                  placeholder="1.0.0" maxLength={20}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              {isAdmin && allUsers.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t('modelDetail.ownerLabel')}</label>
                  <select value={editOwnerId} onChange={e => setEditOwnerId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                    {allUsers.map(u => (
                      <option key={u.user_id} value={u.user_id}>{u.display_name}</option>
                    ))}
                  </select>
                </div>
              )}
              {isAdmin && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t('modelDetail.createdDateLabel')}</label>
                  <input type="date" value={editCreatedAt} onChange={e => setEditCreatedAt(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
                </div>
              )}
              {editType !== 'approche' && approches.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t('modelDetail.associatedApproach')}</label>
                  <select value={editApprocheId} onChange={e => setEditApprocheId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                    <option value="">{t('modelDetail.noApproach')}</option>
                    {approches.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <MarkdownField
              label={t('modelDetail.descriptionLabel')}
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t('modelDetail.tagsLabel')}</label>
              <input type="text" value={editTagsInput} onChange={e => setEditTagsInput(e.target.value)}
                placeholder="ancrage, somatique, dissociation" maxLength={200}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>

            {/* Liens */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{t('modelDetail.linksLabel')}</label>
                <button type="button" onClick={() => setEditLinks(prev => [...prev, { type: 'video', title: '', url: '', description: '' }])}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary/10">
                  <Plus className="h-3.5 w-3.5" /> {t('modelDetail.addLink')}
                </button>
              </div>
              {editLinks.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('modelDetail.noLinks')}</p>
              )}
              <div className="space-y-3">
                {editLinks.map((link, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select value={link.type} onChange={e => setEditLinks(prev => prev.map((l, j) => j === i ? { ...l, type: e.target.value as ModelLinkType } : l))}
                        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-ring focus:ring-2">
                        <option value="video">{t('modelDetail.video')}</option>
                        <option value="doc">{t('modelDetail.document')}</option>
                        <option value="formation">{t('modelDetail.training')}</option>
                      </select>
                      <input type="text" value={link.title} onChange={e => setEditLinks(prev => prev.map((l, j) => j === i ? { ...l, title: e.target.value } : l))}
                        placeholder={t('modelDetail.linkTitle')} className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-ring focus:ring-2" />
                      <button type="button" onClick={() => setEditLinks(prev => prev.filter((_, j) => j !== i))}
                        className="rounded p-1 text-muted-foreground hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input type="url" value={link.url} onChange={e => setEditLinks(prev => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                      placeholder="https://..." className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-ring focus:ring-2" />
                    <input type="text" value={link.description || ''} onChange={e => setEditLinks(prev => prev.map((l, j) => j === i ? { ...l, description: e.target.value } : l))}
                      placeholder={t('modelDetail.linkDescription')} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none ring-ring focus:ring-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Lien traduction (admin only) */}
            {canManage && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                <label className="block text-sm font-medium text-foreground">{t('language.linkedTranslation')}</label>
                <p className="text-xs text-muted-foreground">{t('language.linkedTranslationDesc')}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <select
                      value={editTranslationId}
                      onChange={e => setEditTranslationId(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                    >
                      <option value="">{t('language.noTranslation')}</option>
                      {otherLangModels.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  {editTranslationId && (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition-colors">
                        <input type="radio" name="translation-direction" checked={editIsOriginal}
                          onChange={() => setEditIsOriginal(true)} className="accent-secondary" />
                        <span className="text-xs text-foreground">{t('language.isOriginal')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition-colors">
                        <input type="radio" name="translation-direction" checked={!editIsOriginal}
                          onChange={() => setEditIsOriginal(false)} className="accent-secondary" />
                        <span className="text-xs text-foreground">{t('language.isTranslation')}</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Journal d'évolution */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <label className="block text-sm font-medium text-foreground">{t('modelDetail.journal')}</label>
              <p className="text-xs text-muted-foreground">{t('modelDetail.journalDesc')}</p>
              <textarea value={editJournalNote} onChange={e => setEditJournalNote(e.target.value)}
                placeholder={t('modelDetail.journalPlaceholder')}
                rows={2} maxLength={1000}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('modelDetail.journalContributors')}</label>
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
                    <option value="">{t('modelDetail.addContributor')}</option>
                    {allUsers.filter(u => !editJournalAuthors.includes(u.display_name)).map(u => (
                      <option key={u.user_id} value={u.display_name}>{u.display_name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] text-muted-foreground">{t('modelDetail.youAreContributor')}</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Approche: models list */}
      {model.type === 'approche' && approcheModels.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-display text-base font-semibold text-foreground">
            {t('modelDetail.approacheModels', { count: approcheModels.length })}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {approcheModels.map(m => (
              <Link key={m.id} to={`/model/${m.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-secondary/30 transition-colors">
                <TypeBadge type={m.type as any} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">v{m.version} · {profiles[m.user_id] || t('common.anonymous')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Status management */}
      {canEdit && model.approved && (
        <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-foreground">{t('modelDetail.changeStatus')}</p>
          <div className="flex flex-wrap gap-2">
            {statusFlow.map(s => (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={model.status === s}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${model.status === s ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'}`}>
                {t('modelStatuses.' + s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="presentation" className="w-full">
        <TabsList className="mb-3 w-full justify-start overflow-x-auto border-b border-border bg-transparent p-0">
          <TabsTrigger value="presentation" className="whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            {t('modelDetail.presentation')}
          </TabsTrigger>
          <TabsTrigger value="liens" className="whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            {t('modelDetail.links')} {(model.links as ModelLink[] || []).length > 0 ? `(${(model.links as ModelLink[]).length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="historique" className="whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            {t('modelDetail.history')}
          </TabsTrigger>
          <TabsTrigger value="variations" className="whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            {t('modelDetail.variants')} ({childModels.length})
          </TabsTrigger>
          <TabsTrigger value="discussions" className="whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent data-[state=active]:text-secondary">
            {t('modelDetail.discussions')} ({linkedPosts.length + feedbacks.length})
          </TabsTrigger>
        </TabsList>

        {/* Présentation — chaque section dans son propre bloc navigable */}
        <TabsContent value="presentation">
          {(() => {
            const filledSections = Object.entries(sections).filter(([_, v]) => v);
            if (filledSections.length === 0 && !model.description) {
              return (
                <div className="rounded-lg border border-dashed border-border p-10 text-center">
                  <p className="text-muted-foreground mb-4">{t('modelDetail.noContent')}</p>
                  {canManage && (
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={startEditing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground hover:brightness-110">
                        <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
                      </button>
                      <Link to={`/admin/import?lang=${model.lang || 'fr'}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <Upload className="h-3.5 w-3.5" /> {t('contribute.importSheet')}
                      </Link>
                    </div>
                  )}
                </div>
              );
            }
            if (filledSections.length === 0) {
              return (
                <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                  {t('modelDetail.noContent')}
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
                <TabsList className="mb-4 flex gap-1.5 overflow-x-auto bg-transparent p-0 pb-2">
                  {filledSections.map(([key]) => (
                    <TabsTrigger key={key} value={key}
                      className="shrink-0 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-medium data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:border-secondary">
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
                      {link.type === 'video' ? t('modelDetail.video') : link.type === 'formation' ? t('modelDetail.training') : t('modelDetail.document')}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {t('modelDetail.noLinksYet')}
            </div>
          )}
        </TabsContent>

        {/* Historique */}
        <TabsContent value="historique">
          <div className="space-y-6">
            {/* Discussions liées */}
            {linkedPosts.length > 0 && (
              <div>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('modelDetail.communityDiscussions')}</h3>
                <div className="space-y-2">
                  {linkedPosts.map(post => (
                    <Link key={post.id} to={`/community`}
                      className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 hover:border-purple-500/40 transition-colors">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Filiation parent */}
            {parentModel && (
              <div>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('modelDetail.origin')}</h3>
                <Link to={`/model/${parentModel.id}`}
                  className="flex items-center gap-3 rounded-lg border border-secondary/20 bg-secondary/5 p-4 hover:border-secondary/40 transition-colors">
                  <GitBranch className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('modelDetail.derivedFrom')} <span className="text-secondary">{parentModel.title}</span></p>
                    <p className="text-xs text-muted-foreground">{t('modelDetail.derivedFromParent')}</p>
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
                  <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('modelDetail.contributorsTitle')}</h3>
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
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('modelDetail.journal')}</h3>
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
                              <span className="text-xs text-muted-foreground">{t('modelDetail.by')} {journalEntry.authors.join(', ')}</span>
                            )
                          ) : (
                            legacyEntry.author && <span className="text-xs text-muted-foreground">{t('modelDetail.by')} {legacyEntry.author}</span>
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
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('modelDetail.derivedModels')}</h3>
                <div className="space-y-2">
                  {childModels.map(child => (
                    <Link key={child.id} to={`/model/${child.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-secondary/30 transition-colors">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{child.title}</p>
                        <p className="text-xs text-muted-foreground">{t('modelDetail.by')} {child.author_name} · {new Date(child.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!parentModel && (!model.changelog || model.changelog.length === 0) && childModels.length === 0 && (
              <Placeholder text={t('modelDetail.noHistory')} />
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
                <Plus className="h-4 w-4" /> {t('modelDetail.createVariation')}
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('modelDetail.variantExplanation')}
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
                    <p className="text-xs text-muted-foreground">{t('modelDetail.by')} {child.author_name} · {new Date(child.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <Placeholder text={t('modelDetail.noVariants')} />
          )}
        </TabsContent>

        {/* Discussions */}
        <TabsContent value="discussions">
          {user && (
            <div className="mb-6">
              <Link
                to={`/community?new=1&model=${model.id}&title=${encodeURIComponent('Feedback : ' + model.title)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Plus className="h-4 w-4" /> {t('modelDetail.giveFeedback')}
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('modelDetail.feedbackExplanation')}
              </p>
            </div>
          )}

          {/* Posts liés */}
          {linkedPosts.length > 0 && (
            <div className="mb-6 space-y-3">
              {linkedPosts.map(post => (
                <div key={post.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link to={`/profil/${post.user_id}`} className="text-sm font-medium text-foreground hover:text-secondary">{profiles[post.user_id] || t('common.anonymous')}</Link>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{post.category}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}</span>
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-foreground">{post.title}</h4>
                  <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed line-clamp-4">{post.content}</p>
                  <Link to="/community" className="mt-2 inline-block text-xs text-secondary hover:underline">{t('modelDetail.viewInForum')}</Link>
                </div>
              ))}
            </div>
          )}

          {/* Feedbacks legacy */}
          {feedbacks.length > 0 && (
            <div className="space-y-3">
              {linkedPosts.length > 0 && (
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('modelDetail.feedbackTitle')}</h4>
              )}
              {feedbacks.map(f => (
                <div key={f.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{f.author_name || t('common.anonymous')}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`h-3.5 w-3.5 ${n <= f.rating ? 'text-amber-500' : 'text-muted-foreground/20'}`}
                            fill={n <= f.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR')}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{f.content}</p>
                </div>
              ))}
            </div>
          )}

          {linkedPosts.length === 0 && feedbacks.length === 0 && (
            <Placeholder text={t('modelDetail.noDiscussionsYet')} />
          )}
        </TabsContent>
      </Tabs>

      {/* Donation nudge */}
      <div className="mt-10 rounded-xl border border-border bg-card/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {t('modelDetail.donationNudge')}{' '}
          <Link to="/soutenir" className="font-medium text-secondary hover:underline">
            {t('modelDetail.donationLink')}
          </Link>{' '}
          {t('modelDetail.donationSuffix')}
        </p>
      </div>
    </div>
  );
};

// sectionLabel is now defined inside the component as it needs t()

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
  const { t } = useTranslation();
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
        <span className="text-[10px] text-muted-foreground">{t('common.markdownSupported')}</span>
      </div>
    </div>
  );
};

export default ModelDetail;
