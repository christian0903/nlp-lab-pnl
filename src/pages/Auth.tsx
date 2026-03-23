import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot';

// Question anti-bot : seul un PNListe connaît la réponse
const PNL_QUESTION = 'En PNL, on dit que « la carte n\'est pas le ... »';
const PNL_ANSWERS = ['territoire', 'territoir', 'le territoire'];

const Auth = () => {
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
      toast.success('Compte créé ! Vérifiez votre email.');
      return false;
    }

    // 2. Nom d'affichage : validation
    const name = displayName.trim();
    if (!name || name.length < 2) {
      toast.error('Le nom d\'affichage est requis (minimum 2 caractères)');
      return false;
    }
    // Rejeter les noms suspects (que des chiffres, caractères spéciaux excessifs, URLs)
    if (/^[\d\s]+$/.test(name) || /https?:\/\//.test(name) || /[<>{}]/.test(name)) {
      toast.error('Le nom d\'affichage n\'est pas valide');
      return false;
    }

    // 3. Question PNL
    const answer = pnlAnswer.trim().toLowerCase();
    if (!PNL_ANSWERS.includes(answer)) {
      toast.error('La réponse à la question PNL n\'est pas correcte');
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
        toast.success('Email envoyé ! Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.');
        setMode('login');
      } else if (mode === 'login') {
        await signIn(email, password);
        toast.success('Connexion réussie');
        navigate(returnTo);
      } else {
        if (!validateSignup()) {
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName.trim());
        toast.success('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthMode, string> = {
    login: 'Connexion',
    signup: 'Créer un compte',
    forgot: 'Mot de passe oublié',
  };

  const subtitles: Record<AuthMode, string> = {
    login: 'Accédez à la communauté Lab R&D PNL',
    signup: 'Rejoignez la communauté de recherche',
    forgot: 'Entrez votre email pour recevoir un lien de réinitialisation',
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-1 font-display text-2xl font-bold text-foreground">{titles[mode]}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{subtitles[mode]}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nom d'affichage *</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                placeholder="Votre nom ou pseudonyme" minLength={2} maxLength={100} required />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              placeholder="vous@exemple.com" required />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Mot de passe *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                placeholder="••••••••" minLength={6} required />
            </div>
          )}

          {/* Question PNL anti-bot */}
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Question de vérification *</label>
              <p className="mb-1.5 text-xs text-muted-foreground">{PNL_QUESTION}</p>
              <input type="text" value={pnlAnswer} onChange={(e) => setPnlAnswer(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                placeholder="Votre réponse" maxLength={50} required />
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
              Mot de passe oublié ?
            </button>
          )}

          <button type="submit" disabled={loading}
            className="mt-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
            {loading ? '...' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer le compte' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login' && (
            <>Pas encore de compte ?{' '}
              <button onClick={() => setMode('signup')} className="font-medium text-secondary hover:underline">S'inscrire</button>
            </>
          )}
          {mode === 'signup' && (
            <>Déjà un compte ?{' '}
              <button onClick={() => setMode('login')} className="font-medium text-secondary hover:underline">Se connecter</button>
            </>
          )}
          {mode === 'forgot' && (
            <button onClick={() => setMode('login')} className="font-medium text-secondary hover:underline">
              ← Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
