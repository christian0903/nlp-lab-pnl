export type ModelType = 'problematique' | 'outil' | 'approche';
export type ModelStatus = 'brouillon' | 'en_revision' | 'en_test' | 'publie' | 'en_evolution';

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
  changelog: { version: string; date: string; changes: string; author: string }[] | null;
  approved: boolean;
  views_count: number;
  variations_count: number;
  feedback_count: number;
  created_at: string;
  updated_at: string;
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
