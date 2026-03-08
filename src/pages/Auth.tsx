import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

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
        navigate('/community');
      } else {
        if (!displayName.trim()) {
          toast.error('Le nom est requis');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName.trim());
        toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
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
              <label className="mb-1 block text-sm font-medium text-foreground">Nom d'affichage</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                placeholder="Dr. Marie Laurent" maxLength={100} required />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              placeholder="vous@exemple.com" required />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                placeholder="••••••••" minLength={6} required />
            </div>
          )}

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
