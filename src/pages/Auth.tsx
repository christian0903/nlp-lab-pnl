import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr';
  const pnlQuestion = t('auth.pnlQuestion');
  const pnlAnswers = lang === 'en' ? ['territory', 'the territory'] : ['territoire', 'territoir', 'le territoire'];
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pnlAnswer, setPnlAnswer] = useState('');
  const [honeypot, setHoneypot] = useState(''); // champ invisible piège
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.from || '/';

  const validateSignup = (): boolean => {
    // 1. Honeypot : si rempli, c'est un bot
    if (honeypot) {
      // Simuler un succès pour ne pas alerter le bot
      toast.success(t('auth.fakeSuccess'));
      return false;
    }

    // 2. Nom d'affichage : validation
    const name = displayName.trim();
    if (!name || name.length < 2) {
      toast.error(t('auth.displayNameRequired'));
      return false;
    }
    // Rejeter les noms suspects (que des chiffres, caractères spéciaux excessifs, URLs)
    if (/^[\d\s]+$/.test(name) || /https?:\/\//.test(name) || /[<>{}]/.test(name)) {
      toast.error(t('auth.displayNameInvalid'));
      return false;
    }

    // 3. Question PNL
    const answer = pnlAnswer.trim().toLowerCase();
    if (!pnlAnswers.includes(answer)) {
      toast.error(t('auth.pnlAnswerWrong'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success(t('auth.resetEmailSent'));
        setMode('login');
      } else if (mode === 'login') {
        await signIn(email, password);
        toast.success(t('auth.loginSuccess'));
        navigate(returnTo);
      } else {
        if (!validateSignup()) {
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName.trim());
        toast.success(t('auth.signupSuccess'));
      }
    } catch (err: any) {
      toast.error(err.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthMode, string> = {
    login: t('auth.loginTitle'),
    signup: t('auth.signupTitle'),
    forgot: t('auth.forgotTitle'),
  };

  const subtitles: Record<AuthMode, string> = {
    login: t('auth.loginSubtitle'),
    signup: t('auth.signupSubtitle'),
    forgot: t('auth.forgotSubtitle'),
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-1 font-display text-2xl font-bold text-foreground">{titles[mode]}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{subtitles[mode]}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t('auth.displayName')}</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                placeholder={t('auth.displayNamePlaceholder')} minLength={2} maxLength={100} required />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">{t('auth.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              placeholder={t('auth.emailPlaceholder')} required />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t('auth.password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                placeholder="••••••••" minLength={6} required />
            </div>
          )}

          {/* Question PNL anti-bot */}
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t('auth.verificationQuestion')}</label>
              <p className="mb-1.5 text-xs text-muted-foreground">{pnlQuestion}</p>
              <input type="text" value={pnlAnswer} onChange={(e) => setPnlAnswer(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                placeholder={t('auth.answerPlaceholder')} maxLength={50} required />
            </div>
          )}

          {/* Honeypot : champ invisible piège pour bots */}
          <div className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
            />
          </div>

          {mode === 'login' && (
            <button type="button" onClick={() => setMode('forgot')}
              className="self-end text-xs text-muted-foreground hover:text-secondary hover:underline">
              {t('auth.forgotPassword')}
            </button>
          )}

          <button type="submit" disabled={loading}
            className="mt-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
            {loading ? '...' : mode === 'login' ? t('auth.loginButton') : mode === 'signup' ? t('auth.signupButton') : t('auth.sendLink')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login' && (
            <>{t('auth.noAccount')}{' '}
              <button onClick={() => setMode('signup')} className="font-medium text-secondary hover:underline">{t('auth.signup')}</button>
            </>
          )}
          {mode === 'signup' && (
            <>{t('auth.hasAccount')}{' '}
              <button onClick={() => setMode('login')} className="font-medium text-secondary hover:underline">{t('auth.loginButton')}</button>
            </>
          )}
          {mode === 'forgot' && (
            <button onClick={() => setMode('login')} className="font-medium text-secondary hover:underline">
              {t('auth.backToLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
