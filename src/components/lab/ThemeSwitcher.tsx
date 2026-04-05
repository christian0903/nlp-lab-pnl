import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Theme = 'classic' | 'dark' | 'vivid' | 'vivid-dark';

const THEME_KEYS: { value: Theme; key: string; icon: typeof Sun }[] = [
  { value: 'classic', key: 'themes.classic', icon: Sun },
  { value: 'dark', key: 'themes.dark', icon: Moon },
  { value: 'vivid', key: 'themes.vivid', icon: Palette },
  { value: 'vivid-dark', key: 'themes.vividDark', icon: Palette },
];

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove('dark', 'theme-vivid');
  if (theme === 'dark') html.classList.add('dark');
  if (theme === 'vivid') html.classList.add('theme-vivid');
  if (theme === 'vivid-dark') { html.classList.add('dark', 'theme-vivid'); }
}

const ThemeSwitcher = () => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('pnl-theme') as Theme | null;
    return saved || 'classic';
  });
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('pnl-theme', theme);
  }, [theme]);

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Mobile: ouvre vers le haut, bord gauche a 0
        setDropStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + 8,
          left: 8,
          right: 8,
        });
      } else {
        // Desktop: ouvre vers le bas, aligne a droite du bouton
        setDropStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: Math.max(8, rect.right - 160),
        });
      }
    }
    setOpen(!open);
  };

  const currentIcon = theme.includes('dark') ? Moon : theme.includes('vivid') ? Palette : Sun;
  const Icon = currentIcon;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
        title={t('themes.changeTheme')}
      >
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="z-50 rounded-lg border border-border bg-card p-1 shadow-lg" style={dropStyle}>
            {THEME_KEYS.map(th => {
              const TIcon = th.icon;
              return (
                <button
                  key={th.value}
                  onClick={() => { setTheme(th.value); setOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    theme === th.value
                      ? 'bg-secondary/10 text-secondary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <TIcon className="h-3.5 w-3.5" />
                  {t(th.key)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
