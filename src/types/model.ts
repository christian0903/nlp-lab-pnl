export type ModelType = 'problematique' | 'outil' | 'approche';
export type ModelStatus = 'brouillon' | 'en_revision' | 'en_test' | 'publie' | 'en_evolution';
export type ModelLinkType = 'video' | 'doc' | 'formation';

export interface ModelLink {
  type: ModelLinkType;
  title: string;
  url: string;
  description?: string;
}

/** Entrée du journal d'évolution collaboratif */
export interface JournalEntry {
  version: string;
  date: string;
  authors: string[];   // noms des auteurs (display_name)
  note: string;
}

/** Ancien format changelog (rétro-compatibilité) */
export interface LegacyChangelogEntry {
  version: string;
  date: string;
  changes: string;
  author: string;
}

export interface DBModel {
  id: string;
  user_id: string;
  title: string;
  type: string;
  status: string;
  version: string;
  description: string;
  complexity: string;
  tags: string[];
  sections: Record<string, string> | null;
  links: ModelLink[] | null;
  parent_model_id: string | null;
  approche_id: string | null;
  changelog: (JournalEntry | LegacyChangelogEntry)[] | null;
  approved: boolean;
  views_count: number;
  variations_count: number;
  feedback_count: number;
  created_at: string;
  updated_at: string;
  lang: string;
  translation_of: string | null;
  // joined
  author_name?: string;
}

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  problematique: 'Problématique',
  outil: 'Outil',
  approche: 'Approche',
};

export const MODEL_STATUS_LABELS: Record<ModelStatus, string> = {
  brouillon: 'Brouillon',
  en_revision: 'En révision',
  en_test: 'En test',
  publie: 'Publié',
  en_evolution: 'En évolution',
};
