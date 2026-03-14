-- Ajouter le lien de filiation parent/dérivé entre modèles
ALTER TABLE models ADD COLUMN IF NOT EXISTS parent_model_id uuid REFERENCES models(id) ON DELETE SET NULL;
