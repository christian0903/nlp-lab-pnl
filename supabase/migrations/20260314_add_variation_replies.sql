CREATE TABLE IF NOT EXISTS variation_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id uuid NOT NULL REFERENCES model_variations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE variation_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read variation replies" ON variation_replies FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert variation replies" ON variation_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own or admin delete variation replies" ON variation_replies FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role('admin', auth.uid()));
