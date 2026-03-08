import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setValid(true);
    } else {
      // Also check if we have a session (user clicked the link and was auto-logged in)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setValid(true);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe');
      return;
    }

    toast.success('Mot de passe mis à jour avec succès !');
    navigate('/');
  };

  if (!valid) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <KeyRound className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
          <h1 className="mb-2 font-display text-xl font-bold text-foreground">Lien invalide ou expiré</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Ce lien de réinitialisation n'est plus valide. Veuillez en demander un nouveau.
          </p>
          <button onClick={() => navigate('/auth')}
            className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:brightness-110">
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <KeyRound className="mx-auto mb-3 h-8 w-8 text-secondary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choisissez un nouveau mot de passe pour votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Nouveau mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              placeholder="••••••••" minLength={6} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Confirmer le mot de passe</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              placeholder="••••••••" minLength={6} required />
          </div>
          <button type="submit" disabled={loading}
            className="mt-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50">
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
