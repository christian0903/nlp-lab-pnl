-- Ajout du champ approche_id pour lier un outil/problématique à une approche
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS approche_id UUID REFERENCES public.models(id) ON DELETE SET NULL DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_models_approche ON public.models(approche_id);
