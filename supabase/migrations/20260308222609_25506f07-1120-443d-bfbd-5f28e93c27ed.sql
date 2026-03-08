
-- Auto-assign admin to first registered user
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_first_admin();

-- Model variations table
CREATE TABLE public.model_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.model_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variations" ON public.model_variations
  FOR SELECT USING (true);

CREATE POLICY "Auth users can create variations" ON public.model_variations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own variations" ON public.model_variations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete own variations" ON public.model_variations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Model feedbacks table
CREATE TABLE public.model_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  rating integer NOT NULL DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.model_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedbacks" ON public.model_feedbacks
  FOR SELECT USING (true);

CREATE POLICY "Auth users can create feedbacks" ON public.model_feedbacks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own feedbacks" ON public.model_feedbacks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete own feedbacks" ON public.model_feedbacks
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER model_variations_updated_at
  BEFORE UPDATE ON public.model_variations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER model_feedbacks_updated_at
  BEFORE UPDATE ON public.model_feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers to update counts on models
CREATE OR REPLACE FUNCTION public.update_model_variations_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.models SET variations_count = variations_count + 1 WHERE id = NEW.model_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.models SET variations_count = variations_count - 1 WHERE id = OLD.model_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_model_feedbacks_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.models SET feedback_count = feedback_count + 1 WHERE id = NEW.model_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.models SET feedback_count = feedback_count - 1 WHERE id = OLD.model_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_variation_change
  AFTER INSERT OR DELETE ON public.model_variations
  FOR EACH ROW EXECUTE FUNCTION public.update_model_variations_count();

CREATE TRIGGER on_feedback_change
  AFTER INSERT OR DELETE ON public.model_feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_model_feedbacks_count();

-- Allow users to view own roles (needed for useAdmin hook)
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
