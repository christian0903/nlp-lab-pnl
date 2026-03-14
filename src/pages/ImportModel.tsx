import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { parseModelFiche, ParsedFiche } from '@/lib/parseModelFiche';
import { MODEL_TYPE_LABELS, MODEL_STATUS_LABELS } from '@/types/model';
import { toast } from 'sonner';
import TypeBadge from '@/components/lab/TypeBadge';
import StatusBadge from '@/components/lab/StatusBadge';

const EXAMPLE_FICHE = `---
action: create
title: "Nom du modèle"
type: outil
status: brouillon
version: "1.0.0"
complexity: intermédiaire
tags:
  - tag1
  - tag2
---

## Description

Description concise du modèle en 1 à 3 phrases.

## Sections

### structure

Structure et composants du modèle.

### protocol

1. Étape 1
2. Étape 2

### prerequisites

Prérequis pour utiliser ce modèle.`;

const ImportModel = () => {
  const { user } = useAuth();
  const { canManage } = useAdmin();
  const navigate = useNavigate();

  const [markdown, setMarkdown] = useState('');
  const [parsed, setParsed] = useState<ParsedFiche | null>(null);
  const [parseError, setParseError] = useState('');
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [matchedModelId, setMatchedModelId] = useState<string | null>(null);
  const [matchedModelTitle, setMatchedModelTitle] = useState('');

  if (!user || !canManage) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-secondary hover:underline">← Retour</Link>
      </div>
    );
  }

  const handleParse = async () => {
    setParseError('');
    setWarning('');
    setParsed(null);
    setMatchedModelId(null);
    setMatchedModelTitle('');

    try {
      const result = parseModelFiche(markdown);
      setParsed(result);

      // Toujours vérifier si un modèle avec ce titre existe déjà
      const { data } = await supabase
        .from('models')
        .select('id, title')
        .ilike('title', result.title)
        .limit(1);

      const exists = data && data.length > 0;

      if (exists) {
        setMatchedModelId(data[0].id);
        setMatchedModelTitle(data[0].title);
      }

      if (result.action === 'create' && exists) {
        setWarning(`Un modèle "${data![0].title}" existe déjà. L'import va le METTRE À JOUR au lieu de créer un doublon.`);
        // Basculer automatiquement en mode update
        result.action = 'update';
      } else if (result.action === 'update' && !exists) {
        setWarning(`Aucun modèle "${result.title}" trouvé. L'import va CRÉER un nouveau modèle.`);
        // Basculer automatiquement en mode create
        result.action = 'create';
      }

      // Re-set parsed avec l'action potentiellement corrigée
      setParsed({ ...result });
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const handleSubmit = async () => {
    if (!parsed || !user) return;
    setSubmitting(true);

    const payload = {
      title: parsed.title,
      type: parsed.type,
      status: parsed.status,
      version: parsed.version,
      complexity: parsed.complexity,
      tags: parsed.tags,
      description: parsed.description,
      sections: parsed.sections,
    };

    let error: any = null;
    let modelId: string | null = null;

    if (parsed.action === 'create') {
      const res = await supabase.from('models').insert({
        ...payload,
        user_id: user.id,
        approved: true,
      } as any).select('id').single();
      error = res.error;
      modelId = res.data?.id || null;
    } else if (matchedModelId) {
      const res = await supabase.from('models')
        .update(payload as any)
        .eq('id', matchedModelId)
        .select('id')
        .single();
      error = res.error;
      modelId = matchedModelId;
    }

    setSubmitting(false);

    if (error) {
      toast.error('Erreur : ' + error.message);
      console.error(error);
      return;
    }

    toast.success(parsed.action === 'create' ? 'Modèle créé !' : 'Modèle mis à jour !');
    if (modelId) {
      navigate(`/model/${modelId}`);
    } else {
      navigate('/library');
    }
  };

  const loadExample = () => {
    setMarkdown(EXAMPLE_FICHE);
    setParsed(null);
    setParseError('');
    setWarning('');
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Importer un modèle</h1>
        <p className="mt-1 text-muted-foreground">
          Collez une fiche modèle au format markdown pour créer ou mettre à jour un modèle.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Fiche Markdown</label>
            <button onClick={loadExample} className="text-xs text-secondary hover:underline">
              Charger l'exemple
            </button>
          </div>
          <textarea
            value={markdown}
            onChange={e => { setMarkdown(e.target.value); setParsed(null); setParseError(''); }}
            placeholder="Collez votre fiche modèle ici..."
            rows={24}
            className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none ring-ring focus:ring-2"
          />
          <div className="flex gap-3">
            <button onClick={handleParse} disabled={!markdown.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
              <Eye className="h-4 w-4" /> Prévisualiser
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          {parseError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-600">Erreur de parsing</p>
                  <p className="mt-1 text-sm text-red-500/80">{parseError}</p>
                </div>
              </div>
            </div>
          )}

          {warning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-600">Attention</p>
                  <p className="mt-1 text-sm text-amber-600/80">{warning}</p>
                </div>
              </div>
            </div>
          )}

          {parsed && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    parsed.action === 'create'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-blue-500/10 text-blue-600'
                  }`}>
                    {parsed.action === 'create' ? 'Création' : 'Mise à jour'}
                  </span>
                  {matchedModelId && (
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-600">
                      Modèle existant trouvé : "{matchedModelTitle}"
                    </span>
                  )}
                  {!matchedModelId && parsed.action === 'create' && (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600">
                      Aucun modèle existant — nouveau modèle
                    </span>
                  )}
                </div>

                <h2 className="mb-2 font-display text-xl font-bold text-foreground">{parsed.title}</h2>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <TypeBadge type={parsed.type as any} />
                  <StatusBadge status={parsed.status as any} />
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                    v{parsed.version}
                  </span>
                  <span className="text-xs text-muted-foreground">{parsed.complexity}</span>
                </div>

                <p className="mb-3 text-sm text-muted-foreground leading-relaxed">{parsed.description}</p>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {parsed.tags.map(tag => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
                  ))}
                </div>

                {Object.entries(parsed.sections).length > 0 && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
                    {Object.entries(parsed.sections).map(([key, content]) => (
                      <div key={key} className="rounded-lg bg-muted/50 p-3">
                        <p className="mb-1 text-xs font-semibold text-foreground">{key}</p>
                        <p className="whitespace-pre-line text-xs text-muted-foreground leading-relaxed">{content.slice(0, 200)}{content.length > 200 ? '...' : ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleSubmit} disabled={submitting || (parsed.action === 'update' && !matchedModelId)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50">
                <Upload className="h-4 w-4" />
                {submitting
                  ? 'Envoi...'
                  : parsed.action === 'create'
                    ? 'Créer le modèle'
                    : 'Mettre à jour le modèle'}
              </button>
            </div>
          )}

          {!parsed && !parseError && (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-10">
              <div className="text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Collez une fiche et cliquez sur "Prévisualiser"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModel;
