import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft, Loader2, CheckCircle, Coffee, Server, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AMOUNTS = [5, 10, 20, 50];
const DEFAULT_AMOUNT = 10;

const Soutenir = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : amount;

  const handleDonate = async () => {
    if (effectiveAmount < 1) {
      toast.error('Le montant minimum est de 1€');
      return;
    }
    if (effectiveAmount > 1000) {
      toast.error('Le montant maximum est de 1000€');
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('create-donation', {
        body: { amount: effectiveAmount, recurring },
      });

      console.log('Stripe response:', response);

      if (response.error) throw response.error;

      const data = response.data;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Pas de lien de paiement reçu');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur lors de la création du paiement. Réessayez.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
        <h1 className="mb-3 font-display text-3xl font-bold text-foreground">Merci pour votre soutien !</h1>
        <p className="mb-8 text-muted-foreground leading-relaxed">
          Votre don contribue directement au maintien et à l'évolution de cette plateforme.
          Chaque contribution compte et nous permet de garder ce Lab ouvert et gratuit pour tous les praticiens PNL.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:brightness-110"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Accueil
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Soutenir le Lab</h1>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Le PNL Lab R&D Collective est un projet ouvert et gratuit. Votre don nous aide à couvrir les frais
          et à continuer de développer cette plateforme.
        </p>
      </div>

      {canceled && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600">
          Le paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.
        </div>
      )}

      {/* Pourquoi donner */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Server className="mx-auto mb-2 h-6 w-6 text-secondary" />
          <p className="text-sm font-medium text-foreground">Hébergement</p>
          <p className="mt-1 text-xs text-muted-foreground">Serveur, base de données, nom de domaine</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Clock className="mx-auto mb-2 h-6 w-6 text-secondary" />
          <p className="text-sm font-medium text-foreground">Développement</p>
          <p className="mt-1 text-xs text-muted-foreground">Nouvelles fonctionnalités et améliorations</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Coffee className="mx-auto mb-2 h-6 w-6 text-secondary" />
          <p className="text-sm font-medium text-foreground">Café</p>
          <p className="mt-1 text-xs text-muted-foreground">Le carburant derrière chaque ligne de code</p>
        </div>
      </div>

      {/* Donation form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Choisissez un montant</h2>

        {/* Amount buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setAmount(a); setIsCustom(false); }}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                !isCustom && amount === a
                  ? 'bg-secondary text-secondary-foreground'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {a}€
            </button>
          ))}
          <button
            onClick={() => { setIsCustom(true); setCustomAmount(''); }}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
              isCustom
                ? 'bg-secondary text-secondary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            Autre
          </button>
        </div>

        {/* Custom amount input */}
        {isCustom && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Montant en €"
                min={1}
                max={1000}
                className="w-40 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                autoFocus
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          </div>
        )}

        {/* Recurring toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-sm text-foreground">Faire ce don chaque mois</span>
            {recurring && (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
                {effectiveAmount}€/mois
              </span>
            )}
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={handleDonate}
          disabled={loading || effectiveAmount < 1}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Redirection vers Stripe...</>
          ) : (
            <><Heart className="h-4 w-4" /> Donner {effectiveAmount > 0 ? `${effectiveAmount}€` : ''}{recurring ? '/mois' : ''}</>
          )}
        </button>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Paiement sécurisé via Stripe. Aucune donnée bancaire n'est stockée sur nos serveurs.
        </p>
      </div>
    </div>
  );
};

export default Soutenir;
