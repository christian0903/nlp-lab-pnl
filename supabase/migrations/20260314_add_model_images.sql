-- Table app_settings (clé/valeur pour paramètres applicatifs)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Valeur par défaut : taille max images 2 Mo
INSERT INTO app_settings (key, value) VALUES ('max_image_size_mb', '2'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS sur app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_settings" ON app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admin update app_settings" ON app_settings FOR UPDATE TO authenticated
  USING (has_role('admin', auth.uid()));
CREATE POLICY "Admin insert app_settings" ON app_settings FOR INSERT TO authenticated
  WITH CHECK (has_role('admin', auth.uid()));

-- Bucket Storage model-images (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('model-images', 'model-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies Storage
CREATE POLICY "Public read model images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'model-images');
CREATE POLICY "Admin upload model images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'model-images' AND (SELECT has_role('admin', auth.uid())));
CREATE POLICY "Admin update model images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'model-images' AND (SELECT has_role('admin', auth.uid())));
CREATE POLICY "Admin delete model images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'model-images' AND (SELECT has_role('admin', auth.uid())));
