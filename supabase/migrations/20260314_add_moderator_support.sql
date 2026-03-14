-- Le rôle 'moderator' existe déjà dans l'enum app_role.
-- Cette migration documente simplement son activation fonctionnelle.
-- Aucune modification de schéma nécessaire.

-- Optionnel : fonction utilitaire pour vérifier plusieurs rôles
CREATE OR REPLACE FUNCTION has_any_role(_user_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles::app_role[])
  );
$$;
