import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import NotificationBell from './NotificationBell';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';

const navKeys = [
  { key: 'nav.home', path: '/' },
  { key: 'nav.library', path: '/library' },
  { key: 'nav.events', path: '/events' },
  { key: 'nav.contribute', path: '/contribute' },
  { key: 'nav.community', path: '/community' },
  { key: 'nav.resources', path: '/resources' },
  { key: 'nav.contributors', path: '/contributeurs' },
  { key: 'nav.help', path: '/aide' },
];

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, canManage } = useAdmin();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/logo-lab-atelierpnl.png" alt="Lab R&D Atelier PNL" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-display text-lg font-bold leading-tight text-foreground">Lab R&D</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navKeys.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-secondary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(item.key)}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-1 -bottom-[13px] h-0.5 rounded-full bg-secondary"
                  />
                )}
              </Link>
            );
          })}
          <div className="ml-3 flex items-center gap-2 border-l border-border pl-3">
            <LanguageSwitcher />
            <ThemeSwitcher />
            {user ? (
              <>
                <NotificationBell />
                {canManage && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      location.pathname.startsWith('/admin') ? 'text-secondary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" /> {t('nav.admin')}
                  </Link>
                )}
                <Link
                  to="/profile"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/profile' ? 'text-secondary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="h-4 w-4" /> {t('nav.profile')}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
              >
                <User className="h-4 w-4" /> {t('nav.login')}
              </Link>
            )}
          </div>
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <nav className="flex flex-col gap-1 p-3">
              {navKeys.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-muted text-secondary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {t(item.key)}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-3 border-t border-border pt-3 px-3">
                <LanguageSwitcher />
                <ThemeSwitcher />
                {user ? (
                  <>
                    <NotificationBell />
                    {canManage && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" /> {t('nav.admin')}
                      </Link>
                    )}
                    <Link to="/profile" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" /> {t('nav.profile')}
                    </Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
                    <User className="h-4 w-4" /> {t('nav.login')}
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
