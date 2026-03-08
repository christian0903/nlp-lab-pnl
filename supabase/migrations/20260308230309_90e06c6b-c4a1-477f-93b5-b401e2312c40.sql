-- Events table
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

-- Event registrations
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Events: everyone can view
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
-- Events: admins can create
CREATE POLICY "Admins can create events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
-- Events: admins can update
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
-- Events: admins can delete
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Registrations: authenticated can view all (for counts)
CREATE POLICY "Anyone can view registrations" ON public.event_registrations FOR SELECT USING (true);
-- Registrations: auth users can register
CREATE POLICY "Auth users can register" ON public.event_registrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Registrations: users can unregister themselves
CREATE POLICY "Users can unregister" ON public.event_registrations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
-- Admins can delete any registration
CREATE POLICY "Admins can manage registrations" ON public.event_registrations FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Updated_at trigger for events
CREATE TRIGGER on_events_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();