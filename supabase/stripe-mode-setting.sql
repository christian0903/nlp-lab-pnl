-- Initialiser le mode Stripe à "test" dans app_settings
INSERT INTO app_settings (key, value)
VALUES ('stripe_mode', '"test"')
ON CONFLICT (key) DO NOTHING;
