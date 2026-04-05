/**
 * Parse une fiche modèle PNL au format markdown (frontmatter YAML + sections)
 * et retourne un objet prêt à être inséré/mis à jour dans Supabase.
 *
 * Supporte deux formats de sections :
 * 1. Format structuré : ## Sections / ### clé_technique
 * 2. Format libre : ## Titre lisible (mappé automatiquement à la clé technique)
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

// Mapping des titres lisibles vers les clés techniques
const SECTION_TITLE_MAP: Record<string, string> = {
  // Clés techniques (déjà valides)
  'structure': 'structure',
  'protocol': 'protocol',
  'active_principle': 'active_principle',
  'patterns': 'patterns',
  'signals': 'signals',
  'intervention_points': 'intervention_points',
  'vigilance': 'vigilance',
  'variants': 'variants',
  'philosophy': 'philosophy',
  'creators': 'creators',
  'prerequisites': 'prerequisites',
  'toolkit': 'toolkit',
  // Titres lisibles français
  'structure du modèle': 'structure',
  'protocole détaillé': 'protocol',
  'protocole': 'protocol',
  'principe actif': 'active_principle',
  'patterns identifiés': 'patterns',
  'signaux reconnaissables': 'signals',
  'signaux': 'signals',
  "points d'intervention": 'intervention_points',
  'points de vigilance': 'vigilance',
  'variantes connues': 'variants',
  'variantes': 'variants',
  'philosophie et principes': 'philosophy',
  'philosophie': 'philosophy',
  'créateurs': 'creators',
  'prérequis': 'prerequisites',
  'boîte à outils': 'toolkit',
  'boite à outils': 'toolkit',
  'boite a outils': 'toolkit',
};

function normalizeSectionKey(title: string): string {
  const lower = title.toLowerCase().trim();
  return SECTION_TITLE_MAP[lower] || lower.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
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

  const sections: Record<string, string> = {};

  // Try Format 1: ## Sections / ### key
  const sectionsMatch = body.match(/##\s+Sections\s*\n([\s\S]*?)$/);

  if (sectionsMatch) {
    const sectionsBlock = sectionsMatch[1];
    const sectionRegex = /###\s+(.+?)\s*\n([\s\S]*?)(?=\n###\s|\s*$)/g;
    let m: RegExpExecArray | null;
    while ((m = sectionRegex.exec(sectionsBlock)) !== null) {
      const key = normalizeSectionKey(m[1]);
      const content = m[2].trim();
      if (content) {
        sections[key] = content;
      }
    }
  }

  // Format 2: All ## headings (except Description and Sections) are treated as sections
  if (Object.keys(sections).length === 0) {
    const h2Regex = /\n##\s+(.+?)\s*\n([\s\S]*?)(?=\n##\s|$)/g;
    let m: RegExpExecArray | null;
    const bodyWithLeadingNewline = '\n' + body;
    while ((m = h2Regex.exec(bodyWithLeadingNewline)) !== null) {
      const title = m[1].trim();
      if (title.toLowerCase() === 'description' || title.toLowerCase() === 'sections') continue;
      const key = normalizeSectionKey(title);
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
