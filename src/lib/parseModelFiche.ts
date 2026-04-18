/**
 * Parse une fiche modèle PNL au format markdown (frontmatter YAML + description)
 * et retourne un objet prêt à être inséré/mis à jour dans Supabase.
 *
 * Format attendu :
 * ---
 * action: create
 * title: "Nom"
 * type: outil
 * ...
 * author: "Nom de l'auteur"
 * ---
 * ## Summary
 * Résumé court
 *
 * ## Protocole détaillé
 * contenu markdown...
 *
 * ## Points de vigilance
 * contenu markdown...
 *
 * Tout le markdown après Summary est stocké dans description.
 */

export interface ParsedFiche {
  action: 'create' | 'update';
  title: string;
  type: string;
  status: string;
  version: string;
  complexity: string;
  tags: string[];
  author: string;
  summary: string;
  description: string;
}

export function parseModelFiche(markdown: string): ParsedFiche {
  const lines = markdown.trim().split('\n');

  // --- Parse frontmatter ---
  if (lines[0]?.trim() !== '---') {
    throw new Error('Frontmatter manquant : le fichier doit commencer par ---');
  }

  const frontmatterEnd = lines.indexOf('---', 1);
  if (frontmatterEnd === -1) {
    throw new Error('Frontmatter non fermé : il manque le --- de fermeture');
  }

  const frontmatterLines = lines.slice(1, frontmatterEnd);
  const meta: Record<string, string | string[]> = {};
  let currentArrayKey: string | null = null;

  for (const line of frontmatterLines) {
    if (/^\s+-\s+/.test(line) && currentArrayKey) {
      const val = line.replace(/^\s+-\s+/, '').trim();
      if (!Array.isArray(meta[currentArrayKey])) {
        meta[currentArrayKey] = [];
      }
      (meta[currentArrayKey] as string[]).push(val);
      continue;
    }

    const match = line.match(/^(\w+)\s*:\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      const trimmed = value.trim().replace(/^["']|["']$/g, '');
      if (trimmed === '') {
        currentArrayKey = key;
        meta[key] = [];
      } else {
        meta[key] = trimmed;
        currentArrayKey = null;
      }
    }
  }

  // --- Parse body ---
  const body = lines.slice(frontmatterEnd + 1).join('\n');

  // Extract summary (## Summary section only)
  const summaryMatch = body.match(/##\s+Summary\s*\n([\s\S]*?)(?=\n##\s|$)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';

  // Everything after the summary section is the description
  let description = '';
  if (summaryMatch) {
    const afterSummary = body.slice(body.indexOf(summaryMatch[0]) + summaryMatch[0].length).trim();
    description = afterSummary;
  } else {
    // No summary heading — treat entire body as description
    description = body.trim();
  }

  // --- Validate ---
  const action = (meta.action as string) || 'create';
  if (action !== 'create' && action !== 'update') {
    throw new Error(`action invalide : "${action}" (attendu: create ou update)`);
  }

  const title = (meta.title as string) || '';
  if (!title) throw new Error('Le champ "title" est requis dans le frontmatter');

  const type = (meta.type as string) || 'outil';
  const validTypes = ['problematique', 'outil', 'approche'];
  if (!validTypes.includes(type)) {
    throw new Error(`type invalide : "${type}" (attendu: ${validTypes.join(', ')})`);
  }

  const status = (meta.status as string) || 'brouillon';
  const validStatuses = ['brouillon', 'en_revision', 'en_test', 'publie', 'en_evolution'];
  if (!validStatuses.includes(status)) {
    throw new Error(`status invalide : "${status}" (attendu: ${validStatuses.join(', ')})`);
  }

  const complexity = (meta.complexity as string) || 'intermédiaire';
  const validComplexities = ['débutant', 'intermédiaire', 'avancé'];
  if (!validComplexities.includes(complexity)) {
    throw new Error(`complexity invalide : "${complexity}" (attendu: ${validComplexities.join(', ')})`);
  }

  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const author = (meta.author as string) || '';

  if (!summary && !description) {
    throw new Error('Le contenu du modèle est vide (ni summary ni description)');
  }

  return {
    action: action as 'create' | 'update',
    title,
    type,
    status,
    version: (meta.version as string) || '1.0.0',
    complexity,
    tags,
    author,
    summary,
    description,
  };
}
