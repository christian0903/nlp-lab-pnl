import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Send, User, FileText, Lightbulb, GitBranch, MessageSquare, Upload } from 'lucide-react';
import { MODEL_TYPE_LABELS, ModelType } from '@/types/model';
import { useAdmin } from '@/hooks/useAdmin';

const Contribute = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const complexityOptions = [
    { value: 'débutant', label: t('contribute.complexityBeginner') },
    { value: 'intermédiaire', label: t('contribute.complexityIntermediate') },
    { value: 'avancé', label: t('contribute.complexityAdvanced') },
  ];


  const parentId = searchParams.get('parent');
  const fromPostId = searchParams.get('from_post');
  const fromVariationTitle = searchParams.get('title');
  const fromVariationDesc = searchParams.get('description');

  const [title, setTitle] = useState(fromVariationTitle || '');
  const [type, setType] = useState<ModelType>('outil');
  const [complexity, setComplexity] = useState('intermédiaire');
  const [summary, setSummary] = useState(fromVariationDesc || '');
  const [description, setDescription] = useState('');
  const [authorNameInput, setAuthorNameInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [parentTitle, setParentTitle] = useState('');
  const [sourcePostTitle, setSourcePostTitle] = useState('');
  const [approches, setApproches] = useState<{ id: string; title: string }[]>([]);
  const [selectedApproche, setSelectedApproche] = useState('');

  useEffect(() => {
    if (parentId) {
      supabase.from('models').select('title').eq('id', parentId).single()
        .then(({ data }) => { if (data) setParentTitle(data.title); });
    }
    if (fromPostId) {
      supabase.from('forum_posts').select('title').eq('id', fromPostId).single()
        .then(({ data }) => { if (data) setSourcePostTitle(data.title); });
    }
    supabase.from('models').select('id, title').eq('type', 'approche').eq('approved', true).order('title')
      .then(({ data }) => { if (data) setApproches(data as any); });
  }, [parentId, fromPostId]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">{t('contribute.loginTitle')}</h1>
        <p className="mb-6 text-muted-foreground">{t('contribute.loginSubtitle')}</p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
        >
          <User className="h-4 w-4" /> {t('contribute.loginButton')}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedSummary = summary.trim();
    if (!trimmedTitle || !trimmedSummary) {
      toast.error(t('contribute.titleDescRequired'));
      return;
    }

    setSubmitting(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const insertData: any = {
      user_id: user.id,
      title: trimmedTitle,
      type,
      summary: trimmedSummary,
      description: description.trim(),
      author_name: authorNameInput.trim(),
      complexity,
      tags,
      status: 'brouillon',
      approved: false,
    };
    if (parentId) {
      insertData.parent_model_id = parentId;
    }
    if (selectedApproche) {
      insertData.approche_id = selectedApproche;
    }

    const { data: newModel, error } = await supabase.from('models').insert(insertData).select('id').single();

    if (error) {
      setSubmitting(false);
      toast.error(t('contribute.submitError'));
      console.error(error);
      return;
    }

    // Créer le lien post↔modèle si issu d'une discussion forum
    if (fromPostId && newModel) {
      await supabase.from('post_model_links').insert({
        post_id: fromPostId,
        model_id: newModel.id,
      });
    }

    setSubmitting(false);
    toast.success(t('contribute.submitSuccess'));
    navigate('/library');
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t('contribute.title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('contribute.subtitle')}
        </p>
      </div>

      {/* Parent model banner */}
      {parentId && parentTitle && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 p-4">
          <GitBranch className="h-5 w-5 text-secondary" />
          <div className="text-sm">
            <span className="text-foreground">{t('contribute.derivedFrom')} </span>
            <Link to={`/model/${parentId}`} className="font-medium text-secondary hover:underline">{parentTitle}</Link>
          </div>
        </div>
      )}

      {/* Source forum post banner */}
      {fromPostId && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <MessageSquare className="h-5 w-5 text-purple-500" />
          <div className="text-sm">
            <span className="text-foreground">{t('contribute.fromDiscussion')} </span>
            <span className="font-medium text-purple-600">{sourcePostTitle || t('contribute.forumDiscussion')}</span>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-lab-warm" />
        <div className="text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">{t('contribute.workflowTitle')}</p>
          <ol className="list-inside list-decimal space-y-1">
            <li dangerouslySetInnerHTML={{ __html: t('contribute.workflowStep1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('contribute.workflowStep2') }} />
            <li dangerouslySetInnerHTML={{ __html: t('contribute.workflowStep3') }} />
          </ol>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('contribute.modelTitle')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('contribute.modelTitlePlaceholder')}
            maxLength={200}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            required
          />
        </div>

        <div className={`grid gap-4 ${type !== 'approche' && approches.length > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t('contribute.modelType')}</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value as ModelType); if (e.target.value === 'approche') setSelectedApproche(''); }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            >
              {(Object.entries(MODEL_TYPE_LABELS) as [ModelType, string][]).map(([k]) => (
                <option key={k} value={k}>{t('modelTypes.' + k)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t('contribute.complexity')}</label>
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
          {type !== 'approche' && approches.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t('contribute.associatedApproach')}</label>
              <select
                value={selectedApproche}
                onChange={(e) => setSelectedApproche(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              >
                <option value="">{t('contribute.noApproach')}</option>
                {approches.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('contribute.authorName')}</label>
          <input
            type="text"
            value={authorNameInput}
            onChange={(e) => setAuthorNameInput(e.target.value)}
            placeholder={t('contribute.authorNamePlaceholder')}
            maxLength={200}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('contribute.summary')}</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t('contribute.summaryPlaceholder')}
            maxLength={2000}
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('contribute.description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('contribute.descriptionPlaceholder')}
            maxLength={50000}
            rows={20}
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono outline-none ring-ring focus:ring-2"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">{t('common.markdownSupported')}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('contribute.tags')}</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={t('contribute.tagsPlaceholder')}
            maxLength={200}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Link to="/" className="rounded-lg px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">
            {t('common.cancel')}
          </Link>
          {isAdmin && (
            <Link
              to={`/admin/import${parentId ? `?parent=${parentId}` : ''}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {t('contribute.importSheet')}
            </Link>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? t('contribute.submitting') : t('contribute.submitModel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Contribute;
