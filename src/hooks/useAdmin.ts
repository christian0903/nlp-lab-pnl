import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'moderator' | 'user';

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole('user');
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roles = (data || []).map((r: any) => r.role as AppRole);
      if (roles.includes('admin')) {
        setRole('admin');
      } else if (roles.includes('moderator')) {
        setRole('moderator');
      } else {
        setRole('user');
      }
      setLoading(false);
    };

    check();
  }, [user]);

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator';
  const canManage = isAdmin || isModerator;

  return { isAdmin, isModerator, canManage, role, loading };
};

// Backward compatibility
export const useAdmin = useRole;
