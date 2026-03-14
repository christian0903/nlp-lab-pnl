-- Fonction RPC pour lister les utilisateurs avec email (admin only)
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  bio text,
  avatar_url text,
  expertise text[],
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.user_id,
    a.email::text,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.expertise,
    p.created_at,
    a.last_sign_in_at
  FROM profiles p
  JOIN auth.users a ON a.id = p.user_id
  WHERE has_role('admin', auth.uid())
  ORDER BY p.created_at DESC;
$$;

-- Fonction RPC pour mettre à jour l'email d'un user (admin only)
CREATE OR REPLACE FUNCTION admin_update_user_email(_user_id uuid, _new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT has_role('admin', auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE auth.users SET email = _new_email, updated_at = now() WHERE id = _user_id;
END;
$$;
