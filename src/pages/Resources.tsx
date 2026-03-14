import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import ImageUploader from '@/components/lab/ImageUploader';

interface Resource {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'guide', label: 'Guide' },
  { value: 'glossaire', label: 'Glossaire' },
  { value: 'technique', label: 'Technique' },
  { value: 'article', label: 'Article' },
];

const Resources = () => {
  const { user } = useAuth();
  const { canManage } = useAdmin();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string>('all');

  // Edit / Create
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('article');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editPublished, setEditPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const handleImageInsert = useCallback((markdown: string) => {
    const ta = contentRef.current;
    if (ta) {
      const start = ta.selectionStart ?? editContent.length;
      setEditContent(editContent.slice(0, start) + '\n' + markdown + '\n' + editContent.slice(start));
    } else {
      setEditContent(editContent + '\n' + markdown);
    }
  }, [editContent]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      const items = (data || []) as unknown as Resource[];
      setResources(items);
      if (items.length > 0 && !selectedId) setSelectedId(items[0].id);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = resources.filter(r => {
    if (!canManage && !r.published) return false;
    if (catFilter !== 'all' && r.category !== catFilter) return false;
    return true;
  });

  const selected = resources.find(r => r.id === selectedId);

  const slugify = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);

  const startCreate = () => {
    setEditTitle('');
    setEditSlug('');
    setEditContent('');
    setEditCategory('article');
    setEditSortOrder(resources.length);
    setEditPublished(true);
    setShowPreview(false);
    setCreating(true);
    setEditing(false);
  };

  const startEdit = (r: Resource) => {
    setEditTitle(r.title);
    setEditSlug(r.slug);
    setEditContent(r.content);
    setEditCategory(r.category);
    setEditSortOrder(r.sort_order);
    setEditPublished(r.published);
    setShowPreview(false);
    setEditing(true);
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Le titre et le contenu sont requis');
      return;
    }
    setSaving(true);
    const slug = editSlug.trim() || slugify(editTitle);

    if (creating) {
      const { data, error } = await supabase.from('resources').insert({
        title: editTitle.trim(),
        slug,
        content: editContent,
        category: editCategory,
        sort_order: editSortOrder,
        published: editPublished,
        created_by: user?.id,
      } as any).select().single();
      setSaving(false);
      if (error) { toast.error('Erreur : ' + error.message); return; }
      const newRes = data as unknown as Resource;
      setResources(prev => [...prev, newRes]);
      setSelectedId(newRes.id);
      setCreating(false);
      toast.success('Article créé');
    } else if (editing && selected) {
      const { error } = await supabase.from('resources').update({
        title: editTitle.trim(),
        slug,
        content: editContent,
        category: editCategory,
        sort_order: editSortOrder,
        published: editPublished,
      } as any).eq('id', selected.id);
      setSaving(false);
      if (error) { toast.error('Erreur : ' + error.message); return; }
      setResources(prev => prev.map(r => r.id === selected.id ? {
        ...r, title: editTitle.trim(), slug, content: editContent,
        category: editCategory, sort_order: editSortOrder, published: editPublished,
      } : r));
      setEditing(false);
      toast.success('Article mis à jour');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('resources').delete().eq('id', deleteId);
    if (error) { toast.error('Erreur'); return; }
    setResources(prev => prev.filter(r => r.id !== deleteId));
    if (selectedId === deleteId) setSelectedId(resources.find(r => r.id !== deleteId)?.id || null);
    setDeleteId(null);
    toast.success('Article supprimé');
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  }

  // Edit/Create form
  if (editing || creating) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {creating ? 'Nouvel article' : `Modifier : ${selected?.title}`}
          </h1>
          <button onClick={cancelEdit} className="rounded-lg p-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Titre *</label>
              <input type="text" value={editTitle} onChange={e => { setEditTitle(e.target.value); if (creating) setEditSlug(slugify(e.target.value)); }}
                maxLength={200} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Slug (URL)</label>
              <input type="text" value={editSlug} onChange={e => setEditSlug(e.target.value)}
                maxLength={100} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Catégorie</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Ordre d'affichage</label>
              <input type="number" value={editSortOrder} onChange={e => setEditSortOrder(Number(e.target.value))}
                min={0} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editPublished} onChange={e => setEditPublished(e.target.checked)}
                  className="rounded border-input" />
                <span className="text-sm text-foreground">{editPublished ? 'Publié' : 'Brouillon'}</span>
              </label>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Contenu (Markdown) *</label>
              <button onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                {showPreview ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPreview ? 'Éditer' : 'Prévisualiser'}
              </button>
            </div>
            {showPreview ? (
              <div className="min-h-[300px] rounded-lg border border-border bg-card p-5 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{editContent}</ReactMarkdown>
              </div>
            ) : (
              <>
                <textarea ref={contentRef} value={editContent} onChange={e => setEditContent(e.target.value)}
                  rows={20} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono outline-none ring-ring focus:ring-2" />
                <div className="mt-1 flex items-center gap-2">
                  <ImageUploader modelId="resources" textareaRef={contentRef} onInsert={handleImageInsert} />
                  <span className="text-[10px] text-muted-foreground">Markdown supporté</span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button onClick={cancelEdit} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Sauvegarde...' : creating ? 'Créer l\'article' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">Supprimer cet article ?</h3>
            <p className="mb-6 text-sm text-muted-foreground">Cette action est irréversible.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Annuler</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Ressources</h1>
          <p className="mt-1 text-muted-foreground">Guides, méthodologie et base de connaissances PNL</p>
        </div>
        {canManage && (
          <button onClick={startCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground hover:brightness-110 transition-all">
            <Plus className="h-3.5 w-3.5" /> Nouvel article
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setCatFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${catFilter === 'all' ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'}`}>
          Tout
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCatFilter(c.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${catFilter === c.value ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Article list */}
        <div className="w-full space-y-2 lg:w-72 lg:shrink-0">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucun article</p>
          ) : (
            filtered.map(r => (
              <button key={r.id} onClick={() => setSelectedId(r.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedId === r.id
                    ? 'border-secondary bg-secondary/5'
                    : 'border-border bg-card hover:border-secondary/30'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{r.title}</span>
                  {!r.published && <EyeOff className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
                </div>
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  {CATEGORIES.find(c => c.value === r.category)?.label || r.category}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Article content */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              {canManage && (
                <div className="mb-4 flex items-center gap-2 justify-end">
                  <button onClick={() => startEdit(selected)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3 w-3" /> Modifier
                  </button>
                  <button onClick={() => setDeleteId(selected.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </button>
                </div>
              )}
              <article className="prose prose-sm dark:prose-invert max-w-none
                prose-headings:font-display prose-headings:text-foreground
                prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4
                prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-li:text-muted-foreground
                prose-strong:text-foreground
                prose-a:text-secondary hover:prose-a:underline
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
              </article>
              <div className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
                Mis à jour le {new Date(selected.updated_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
              Sélectionnez un article
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resources;
