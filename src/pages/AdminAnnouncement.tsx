import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Eye, Pencil, Trash2, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AdminAnnouncement = () => {
  const { user } = useAuth();
  const { isAdmin, canManage, loading: adminLoading } = useAdmin();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'announcement').single();
      if (data?.value) {
        const val = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
        setContent(val.replace(/^"|"$/g, ''));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('app_settings').upsert({
      key: 'announcement',
      value: content.trim(),
    } as any);
    setSaving(false);
    if (error) {
      toast.error('Erreur : ' + error.message);
    } else {
      toast.success(content.trim() ? 'Annonce publiée' : 'Annonce supprimée');
    }
  };

  const handleClear = async () => {
    setContent('');
    setSaving(true);
    await supabase.from('app_settings').upsert({
      key: 'announcement',
      value: '',
    } as any);
    setSaving(false);
    toast.success('Annonce supprimée');
  };

  if (adminLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  if (!canManage) return <Navigate to="/" />;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Annonce d'accueil</h1>
        <p className="mt-1 text-muted-foreground">
          Ce message s'affiche en haut de la page d'accueil pour tous les visiteurs. Laissez vide pour masquer.
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Chargement...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Contenu (Markdown)</label>
            <button onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
              {showPreview ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPreview ? 'Éditer' : 'Prévisualiser'}
            </button>
          </div>

          {showPreview ? (
            <div className="min-h-[120px] rounded-xl border border-secondary/30 bg-secondary/5 p-5">
              {content.trim() ? (
                <div className="flex items-start gap-3">
                  <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-foreground prose-a:text-secondary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Aucune annonce — le bandeau ne sera pas affiché.</p>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Ex: Bienvenue sur le Lab R&D ! Ce site est en phase de test. [Donnez votre feedback](/community)."
              rows={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono outline-none ring-ring focus:ring-2"
            />
          )}

          <p className="text-[10px] text-muted-foreground">
            Markdown supporté : **gras**, *italique*, [liens](url), listes. Quelques lignes suffisent.
          </p>

          <div className="flex items-center gap-3 border-t border-border pt-4">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:brightness-110 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Sauvegarde...' : 'Publier l\'annonce'}
            </button>
            {content.trim() && (
              <button onClick={handleClear} disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> Supprimer l'annonce
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncement;
