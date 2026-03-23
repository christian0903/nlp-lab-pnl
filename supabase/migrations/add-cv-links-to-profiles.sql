-- Ajout du CV et des liens personnels aux profils
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personal_links JSONB DEFAULT '[]';
