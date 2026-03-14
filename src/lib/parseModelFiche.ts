/**
 * Parse une fiche modèle PNL au format markdown (frontmatter YAML + sections)
 * et retourne un objet prêt à être inséré/mis à jour dans Supabase.
 */

export interface ParsedFiche {
  action: 'create' | 'update';
  title: string;
  type: string;
  status: string;
  version: string;
  complexity: string;
  tags: string[];
  description: string;
  sections: Record<string, string>;
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

  // --- Parse body (description + sections) ---
  const body = lines.slice(frontmatterEnd + 1).join('\n');

  // Extract description
  const descMatch = body.match(/##\s+Description\s*\n([\s\S]*?)(?=\n##\s|$)/);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract sections block
  const sectionsMatch = body.match(/##\s+Sections\s*\n([\s\S]*?)$/);
  const sections: Record<string, string> = {};

  if (sectionsMatch) {
    const sectionsBlock = sectionsMatch[1];
    const sectionRegex = /###\s+(\w+)\s*\n([\s\S]*?)(?=\n###\s|\s*$)/g;
    let m: RegExpExecArray | null;
    while ((m = sectionRegex.exec(sectionsBlock)) !== null) {
      const key = m[1].trim();
      const content = m[2].trim();
      if (content) {
        sections[key] = content;
      }
    }
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

  if (!description) {
    throw new Error('La section "## Description" est requise');
  }

  return {
    action: action as 'create' | 'update',
    title,
    type,
    status,
    version: (meta.version as string) || '1.0.0',
    complexity,
    tags,
    description,
    sections,
  };
}
