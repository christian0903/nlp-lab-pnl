
-- Fix: replace overly permissive insert policy with a restrictive one
-- Triggers use SECURITY DEFINER so they bypass RLS; no public insert needed
drop policy "System can insert notifications" on public.model_notifications;
create policy "No direct inserts" on public.model_notifications for insert with check (false);
