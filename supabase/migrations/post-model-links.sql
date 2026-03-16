-- Table d'association M:N entre forum_posts et models
CREATE TABLE IF NOT EXISTS post_model_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, model_id)
);

-- Index pour les requêtes dans les deux sens
CREATE INDEX idx_post_model_links_post ON post_model_links(post_id);
CREATE INDEX idx_post_model_links_model ON post_model_links(model_id);

-- RLS
ALTER TABLE post_model_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique post_model_links"
  ON post_model_links FOR SELECT
  USING (true);

CREATE POLICY "Insertion authentifiée post_model_links"
  ON post_model_links FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Suppression admin post_model_links"
  ON post_model_links FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Migration : copier les model_id existants de forum_posts
INSERT INTO post_model_links (post_id, model_id)
SELECT id, model_id FROM forum_posts WHERE model_id IS NOT NULL
ON CONFLICT DO NOTHING;
