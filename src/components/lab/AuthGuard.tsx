import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

// Pages accessibles sans connexion
const PUBLIC_PATHS = ['/', '/auth', '/reset-password', '/soutenir'];

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  // Pages publiques : pas de restriction
  if (PUBLIC_PATHS.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Chargement en cours
  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">{t('common.loading')}</div>;
  }

  // Non connecté : rediriger vers login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
