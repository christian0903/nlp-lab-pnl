-- Ajouter le champ links (JSONB) à la table models
ALTER TABLE models ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;
