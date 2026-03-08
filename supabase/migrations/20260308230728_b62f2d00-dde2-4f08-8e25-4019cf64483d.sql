
-- Enable pg_net for HTTP calls from triggers
create extension if not exists pg_net with schema extensions;

-- Notifications table
create table public.model_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  model_id uuid not null references public.models(id) on delete cascade,
  type text not null,
  message text not null,
  actor_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.model_notifications enable row level security;

create policy "Users can view own notifications" on public.model_notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.model_notifications for update using (auth.uid() = user_id);
create policy "System can insert notifications" on public.model_notifications for insert with check (true);

-- Trigger: on feedback insert
create or replace function public.notify_model_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _model record;
begin
  select id, user_id, title into _model from public.models where id = NEW.model_id;
  if _model.user_id is distinct from NEW.user_id then
    insert into public.model_notifications (user_id, model_id, type, message, actor_id)
    values (_model.user_id, NEW.model_id, 'feedback', 'Nouveau feedback sur "' || _model.title || '"', NEW.user_id);
  end if;
  return NEW;
end;
$$;

create trigger trg_notify_model_feedback after insert on public.model_feedbacks
for each row execute function public.notify_model_feedback();

-- Trigger: on variation insert
create or replace function public.notify_model_variation()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _model record;
begin
  select id, user_id, title into _model from public.models where id = NEW.model_id;
  if _model.user_id is distinct from NEW.user_id then
    insert into public.model_notifications (user_id, model_id, type, message, actor_id)
    values (_model.user_id, NEW.model_id, 'variation', 'Nouvelle variation ajoutée sur "' || _model.title || '"', NEW.user_id);
  end if;
  return NEW;
end;
$$;

create trigger trg_notify_model_variation after insert on public.model_variations
for each row execute function public.notify_model_variation();

-- Trigger: on forum post linked to model
create or replace function public.notify_model_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _model record;
begin
  if NEW.model_id is not null then
    select id, user_id, title into _model from public.models where id = NEW.model_id;
    if _model.user_id is distinct from NEW.user_id then
      insert into public.model_notifications (user_id, model_id, type, message, actor_id)
      values (_model.user_id, NEW.model_id, 'post', 'Nouveau post lié à "' || _model.title || '"', NEW.user_id);
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_notify_model_post after insert on public.forum_posts
for each row execute function public.notify_model_post();

-- Trigger: on model status change
create or replace function public.notify_model_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if OLD.status is distinct from NEW.status then
    insert into public.model_notifications (user_id, model_id, type, message, actor_id)
    values (NEW.user_id, NEW.id, 'status_change', 'Le statut de "' || NEW.title || '" est passé à "' || NEW.status || '"', null);
  end if;
  return NEW;
end;
$$;

create trigger trg_notify_model_status after update on public.models
for each row execute function public.notify_model_status_change();

-- Trigger: send email via edge function on notification insert
create or replace function public.send_notification_email()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _base_url text;
  _service_key text;
begin
  select decrypted_secret into _base_url from vault.decrypted_secrets where name = 'SUPABASE_URL' limit 1;
  select decrypted_secret into _service_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY' limit 1;
  
  perform net.http_post(
    url := _base_url || '/functions/v1/send-model-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body := jsonb_build_object(
      'notification_id', NEW.id,
      'user_id', NEW.user_id,
      'model_id', NEW.model_id,
      'type', NEW.type,
      'message', NEW.message
    )
  );
  return NEW;
end;
$$;

create trigger trg_send_notification_email after insert on public.model_notifications
for each row execute function public.send_notification_email();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.model_notifications;
