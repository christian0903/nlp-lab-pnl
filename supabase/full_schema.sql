-- ============================================================
-- PNL Lab R&D Collective — Schéma complet
-- Exécuter dans le SQL Editor d'un nouveau projet Supabase
-- ============================================================

-- Migration 1: Profils, Forum (posts, likes, commentaires)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  expertise TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
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

-- Forum posts
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts viewable by everyone" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Auth users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Post likes
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_like_change
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Post comments
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_comment_change
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);
CREATE INDEX idx_forum_posts_category ON public.forum_posts(category);
CREATE INDEX idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_created ON public.post_comments(created_at DESC);

-- Migration 2: Rôles et Modèles
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'outil',
  status text NOT NULL DEFAULT 'brouillon',
  version text NOT NULL DEFAULT '0.1.0',
  description text NOT NULL DEFAULT '',
  complexity text NOT NULL DEFAULT 'intermédiaire',
  tags text[] NOT NULL DEFAULT '{}',
  sections jsonb DEFAULT '{}',
  changelog jsonb DEFAULT '[]',
  approved boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  variations_count integer NOT NULL DEFAULT 0,
  feedback_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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

-- Migration 3: Auto-admin, Variations, Feedbacks
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
CREATE POLICY "Anyone can view variations" ON public.model_variations FOR SELECT USING (true);
CREATE POLICY "Auth users can create variations" ON public.model_variations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own variations" ON public.model_variations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete own variations" ON public.model_variations FOR DELETE TO authenticated USING (auth.uid() = user_id);

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
CREATE POLICY "Anyone can view feedbacks" ON public.model_feedbacks FOR SELECT USING (true);
CREATE POLICY "Auth users can create feedbacks" ON public.model_feedbacks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own feedbacks" ON public.model_feedbacks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete own feedbacks" ON public.model_feedbacks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER model_variations_updated_at BEFORE UPDATE ON public.model_variations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER model_feedbacks_updated_at BEFORE UPDATE ON public.model_feedbacks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER on_variation_change AFTER INSERT OR DELETE ON public.model_variations
FOR EACH ROW EXECUTE FUNCTION public.update_model_variations_count();
CREATE TRIGGER on_feedback_change AFTER INSERT OR DELETE ON public.model_feedbacks
FOR EACH ROW EXECUTE FUNCTION public.update_model_feedbacks_count();

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Migration 4: Lien forum → modèle
-- ============================================================

ALTER TABLE public.forum_posts ADD COLUMN model_id uuid REFERENCES public.models(id) ON DELETE SET NULL DEFAULT NULL;

-- Migration 5: Storage avatars
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public avatar read access" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Migration 6: Événements
-- ============================================================

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  zoom_link text NOT NULL DEFAULT '',
  max_participants integer DEFAULT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
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

CREATE TRIGGER on_events_updated BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration 7: Notifications temps réel
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE public.model_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  actor_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.model_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.model_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.model_notifications FOR UPDATE USING (auth.uid() = user_id);

-- Trigger: notification sur feedback
CREATE OR REPLACE FUNCTION public.notify_model_feedback()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _model record;
BEGIN
  SELECT id, user_id, title INTO _model FROM public.models WHERE id = NEW.model_id;
  IF _model.user_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO public.model_notifications (user_id, model_id, type, message, actor_id)
    VALUES (_model.user_id, NEW.model_id, 'feedback', 'Nouveau feedback sur "' || _model.title || '"', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_model_feedback AFTER INSERT ON public.model_feedbacks
FOR EACH ROW EXECUTE FUNCTION public.notify_model_feedback();

-- Trigger: notification sur variation
CREATE OR REPLACE FUNCTION public.notify_model_variation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _model record;
BEGIN
  SELECT id, user_id, title INTO _model FROM public.models WHERE id = NEW.model_id;
  IF _model.user_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO public.model_notifications (user_id, model_id, type, message, actor_id)
    VALUES (_model.user_id, NEW.model_id, 'variation', 'Nouvelle variation ajoutée sur "' || _model.title || '"', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_model_variation AFTER INSERT ON public.model_variations
FOR EACH ROW EXECUTE FUNCTION public.notify_model_variation();

-- Trigger: notification sur post lié à un modèle
CREATE OR REPLACE FUNCTION public.notify_model_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _model record;
BEGIN
  IF NEW.model_id IS NOT NULL THEN
    SELECT id, user_id, title INTO _model FROM public.models WHERE id = NEW.model_id;
    IF _model.user_id IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.model_notifications (user_id, model_id, type, message, actor_id)
      VALUES (_model.user_id, NEW.model_id, 'post', 'Nouveau post lié à "' || _model.title || '"', NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_model_post AFTER INSERT ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_model_post();

-- Trigger: notification sur changement de statut
CREATE OR REPLACE FUNCTION public.notify_model_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.model_notifications (user_id, model_id, type, message, actor_id)
    VALUES (NEW.user_id, NEW.id, 'status_change', 'Le statut de "' || NEW.title || '" est passé à "' || NEW.status || '"', NULL);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_model_status AFTER UPDATE ON public.models
FOR EACH ROW EXECUTE FUNCTION public.notify_model_status_change();

-- Trigger: envoi email via edge function
CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _base_url text;
  _service_key text;
BEGIN
  SELECT decrypted_secret INTO _base_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO _service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  PERFORM net.http_post(
    url := _base_url || '/functions/v1/send-model-notification',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || _service_key),
    body := jsonb_build_object('notification_id', NEW.id, 'user_id', NEW.user_id, 'model_id', NEW.model_id, 'type', NEW.type, 'message', NEW.message)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_send_notification_email AFTER INSERT ON public.model_notifications
FOR EACH ROW EXECUTE FUNCTION public.send_notification_email();

-- Activer realtime pour les notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.model_notifications;

-- Migration 8: Sécuriser les insertions de notifications
-- ============================================================

CREATE POLICY "No direct inserts" ON public.model_notifications FOR INSERT WITH CHECK (false);
