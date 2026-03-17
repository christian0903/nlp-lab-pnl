import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';

type Theme = 'classic' | 'dark' | 'vivid' | 'vivid-dark';

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'classic', label: 'Classique', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'vivid', label: 'Vivid', icon: Palette },
  { value: 'vivid-dark', label: 'Vivid sombre', icon: Palette },
];

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove('dark', 'theme-vivid');
  if (theme === 'dark') html.classList.add('dark');
  if (theme === 'vivid') html.classList.add('theme-vivid');
  if (theme === 'vivid-dark') { html.classList.add('dark', 'theme-vivid'); }
}

const ThemeSwitcher = () => {
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
        title="Changer le theme"
      >
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="z-50 rounded-lg border border-border bg-card p-1 shadow-lg" style={dropStyle}>
            {THEMES.map(t => {
              const TIcon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => { setTheme(t.value); setOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    theme === t.value
                      ? 'bg-secondary/10 text-secondary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <TIcon className="h-3.5 w-3.5" />
                  {t.label}
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
