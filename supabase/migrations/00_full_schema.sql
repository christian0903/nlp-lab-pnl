-- ============================================================
-- PNL Lab R&D — Schema complet pour nouveau projet Supabase
-- Executer dans le SQL Editor d'un nouveau projet Supabase
-- Version: 1.5.1
-- ============================================================

-- ============================================================
-- 1. FONCTIONS UTILITAIRES
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 2. PROFILS UTILISATEURS
-- ============================================================

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  cv TEXT DEFAULT '',
  personal_links JSONB DEFAULT '[]',
  expertise TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-creation du profil a l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. ROLES (RBAC)
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION has_any_role(_user_id UUID, _roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles::app_role[])
  );
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Premier utilisateur = admin
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_first_admin();

-- Fonctions admin pour gerer les utilisateurs
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  user_id UUID, email TEXT, display_name TEXT, bio TEXT,
  avatar_url TEXT, expertise TEXT[], created_at TIMESTAMPTZ, last_sign_in_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT p.user_id, a.email::text, p.display_name, p.bio, p.avatar_url, p.expertise, p.created_at, a.last_sign_in_at
  FROM profiles p JOIN auth.users a ON a.id = p.user_id
  WHERE has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION admin_update_user_email(_user_id UUID, _new_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE auth.users SET email = _new_email, updated_at = now() WHERE id = _user_id;
END;
$$;

-- ============================================================
-- 4. MODELES PNL
-- ============================================================

CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'outil',
  status TEXT NOT NULL DEFAULT 'brouillon',
  version TEXT NOT NULL DEFAULT '0.1.0',
  description TEXT NOT NULL DEFAULT '',
  complexity TEXT NOT NULL DEFAULT 'intermediaire',
  tags TEXT[] NOT NULL DEFAULT '{}',
  sections JSONB DEFAULT '{}',
  links JSONB DEFAULT '[]',
  changelog JSONB DEFAULT '[]',
  approved BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  variations_count INTEGER NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  parent_model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  approche_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  lang TEXT NOT NULL DEFAULT 'fr',
  translation_of UUID REFERENCES public.models(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved models" ON public.models FOR SELECT USING (approved = true);
CREATE POLICY "Owners can view own models" ON public.models FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all models" ON public.models FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create models" ON public.models FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own models" ON public.models FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any model" ON public.models FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any model" ON public.models FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete own models" ON public.models FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER models_updated_at BEFORE UPDATE ON public.models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_models_approche ON public.models(approche_id);
CREATE INDEX idx_models_lang ON public.models(lang);
CREATE INDEX idx_models_translation ON public.models(translation_of);

-- ============================================================
-- 5. VARIATIONS ET FEEDBACKS
-- ============================================================

CREATE TABLE public.model_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.model_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view variations" ON public.model_variations FOR SELECT USING (true);
CREATE POLICY "Auth users can create variations" ON public.model_variations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own variations" ON public.model_variations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete own variations" ON public.model_variations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.variation_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id UUID NOT NULL REFERENCES public.model_variations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.variation_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read variation replies" ON public.variation_replies FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert variation replies" ON public.variation_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own or admin delete variation replies" ON public.variation_replies FOR DELETE TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE TABLE public.model_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.model_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feedbacks" ON public.model_feedbacks FOR SELECT USING (true);
CREATE POLICY "Auth users can create feedbacks" ON public.model_feedbacks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own feedbacks" ON public.model_feedbacks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete own feedbacks" ON public.model_feedbacks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER model_variations_updated_at BEFORE UPDATE ON public.model_variations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER model_feedbacks_updated_at BEFORE UPDATE ON public.model_feedbacks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_model_variations_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.models SET variations_count = variations_count + 1 WHERE id = NEW.model_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.models SET variations_count = variations_count - 1 WHERE id = OLD.model_id; RETURN OLD;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_model_feedbacks_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.models SET feedback_count = feedback_count + 1 WHERE id = NEW.model_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.models SET feedback_count = feedback_count - 1 WHERE id = OLD.model_id; RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_variation_change AFTER INSERT OR DELETE ON public.model_variations FOR EACH ROW EXECUTE FUNCTION public.update_model_variations_count();
CREATE TRIGGER on_feedback_change AFTER INSERT OR DELETE ON public.model_feedbacks FOR EACH ROW EXECUTE FUNCTION public.update_model_feedbacks_count();

-- ============================================================
-- 6. FORUM COMMUNAUTAIRE
-- ============================================================

CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts viewable by everyone" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Auth users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.forum_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id; RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_like_change AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.forum_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.forum_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id; RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_comment_change AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Table M:N posts <-> modeles
CREATE TABLE public.post_model_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, model_id)
);

ALTER TABLE public.post_model_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique post_model_links" ON public.post_model_links FOR SELECT USING (true);
CREATE POLICY "Insertion authentifiee post_model_links" ON public.post_model_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Suppression admin post_model_links" ON public.post_model_links FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);
CREATE INDEX idx_forum_posts_category ON public.forum_posts(category);
CREATE INDEX idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_created ON public.post_comments(created_at DESC);
CREATE INDEX idx_post_model_links_post ON public.post_model_links(post_id);
CREATE INDEX idx_post_model_links_model ON public.post_model_links(model_id);

-- ============================================================
-- 7. EVENEMENTS
-- ============================================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  zoom_link TEXT NOT NULL DEFAULT '',
  max_participants INTEGER DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Auth users can register" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister" ON public.event_registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage registrations" ON public.event_registrations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER on_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. RESSOURCES (ARTICLES MARKDOWN)
-- ============================================================

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'article',
  sort_order INT DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_by UUID,
  lang TEXT NOT NULL DEFAULT 'fr',
  translation_of UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published resources" ON public.resources FOR SELECT TO public USING (published = true);
CREATE POLICY "Manager read all resources" ON public.resources FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Manager insert resources" ON public.resources FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Manager update resources" ON public.resources FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Manager delete resources" ON public.resources FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- ============================================================
-- 9. NOTIFICATIONS (TEMPS REEL)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE public.model_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.model_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.model_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.model_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "No direct inserts" ON public.model_notifications FOR INSERT WITH CHECK (false);

ALTER PUBLICATION supabase_realtime ADD TABLE public.model_notifications;

-- Triggers de notification (feedback, variation, post, status change)
CREATE OR REPLACE FUNCTION public.notify_model_feedback()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE model_owner UUID;
BEGIN
  SELECT user_id INTO model_owner FROM models WHERE id = NEW.model_id;
  IF model_owner IS NOT NULL AND model_owner != NEW.user_id THEN
    INSERT INTO model_notifications (user_id, model_id, type, message, actor_id)
    VALUES (model_owner, NEW.model_id, 'feedback', 'Nouveau feedback sur votre modele', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_model_variation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE model_owner UUID;
BEGIN
  SELECT user_id INTO model_owner FROM models WHERE id = NEW.model_id;
  IF model_owner IS NOT NULL AND model_owner != NEW.user_id THEN
    INSERT INTO model_notifications (user_id, model_id, type, message, actor_id)
    VALUES (model_owner, NEW.model_id, 'variation', 'Nouvelle variation proposee sur votre modele', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_model_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE model_owner UUID;
BEGIN
  IF NEW.model_id IS NOT NULL THEN
    SELECT user_id INTO model_owner FROM models WHERE id = NEW.model_id;
    IF model_owner IS NOT NULL AND model_owner != NEW.user_id THEN
      INSERT INTO model_notifications (user_id, model_id, type, message, actor_id)
      VALUES (model_owner, NEW.model_id, 'post', 'Un post a ete lie a votre modele', NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_model_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO model_notifications (user_id, model_id, type, message)
    VALUES (NEW.user_id, NEW.id, 'status_change', 'Le statut de votre modele a change en ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_model_feedback AFTER INSERT ON public.model_feedbacks FOR EACH ROW EXECUTE FUNCTION public.notify_model_feedback();
CREATE TRIGGER trg_notify_model_variation AFTER INSERT ON public.model_variations FOR EACH ROW EXECUTE FUNCTION public.notify_model_variation();
CREATE TRIGGER trg_notify_model_post AFTER INSERT ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.notify_model_post();
CREATE TRIGGER trg_notify_model_status AFTER UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.notify_model_status_change();

-- ============================================================
-- 10. PARAMETRES ET STOCKAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read app_settings" ON public.app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admin update app_settings" ON public.app_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert app_settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Parametres par defaut
INSERT INTO public.app_settings (key, value) VALUES ('max_image_size_mb', '2'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('stripe_mode', '"test"') ON CONFLICT (key) DO NOTHING;

-- Storage: avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public avatar read access" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Storage: model-images
INSERT INTO storage.buckets (id, name, public) VALUES ('model-images', 'model-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read model images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'model-images');
CREATE POLICY "Admin upload model images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'model-images' AND (SELECT has_role(auth.uid(), 'admin')));
CREATE POLICY "Admin update model images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'model-images' AND (SELECT has_role(auth.uid(), 'admin')));
CREATE POLICY "Admin delete model images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'model-images' AND (SELECT has_role(auth.uid(), 'admin')));
