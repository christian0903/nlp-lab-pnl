import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft, Loader2, CheckCircle, Coffee } from 'lucide-react';
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
  const [recurrenceType, setRecurrenceType] = useState<'month' | 'week'>('month');
  const [loading, setLoading] = useState(false);
  const [coffeeLoading, setCoffeeLoading] = useState(false);

  // Coffee modal
  const [showCoffee, setShowCoffee] = useState(false);
  const [coffeeRecurring, setCoffeeRecurring] = useState<'' | 'week' | 'month'>('');

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : amount;

  const handleDonate = async (donationAmount: number, isRecurring: boolean, interval: string = 'month') => {
    if (donationAmount < 1) {
      toast.error('Le montant minimum est de 1€');
      return;
    }
    if (donationAmount > 1000) {
      toast.error('Le montant maximum est de 1000€');
      return;
    }

    const setLoad = donationAmount === 5 && showCoffee ? setCoffeeLoading : setLoading;
    setLoad(true);
    try {
      const response = await supabase.functions.invoke('create-donation', {
        body: { amount: donationAmount, recurring: isRecurring, interval },
      });

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
      setLoad(false);
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
      </div>

      {canceled && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600">
          Le paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.
        </div>
      )}

      {/* Pourquoi donner — texte descriptif */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Pourquoi soutenir ce projet ?</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Le <strong className="text-foreground">PNL Lab R&D Collective</strong> est un projet indépendant, ouvert et gratuit.
            Pas de publicité, pas de paywall, pas de revente de données. Juste un espace de travail au service des praticiens PNL.
          </p>
          <p>
            Maintenir cette plateforme a un coût : serveur, base de données, nom de domaine, outils de développement,
            et surtout le temps consacré à développer de nouvelles fonctionnalités, corriger les bugs et accompagner la communauté.
          </p>
          <p>
            Votre don — même modeste — nous aide à garder ce Lab vivant et à le faire évoluer selon les besoins
            de la communauté. <strong className="text-foreground">Chaque contribution fait une vraie différence.</strong>
          </p>
        </div>
      </div>

      {/* Offrez-moi un café — bouton rapide */}
      <div className="mb-8">
        <button
          onClick={() => setShowCoffee(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm font-semibold text-foreground transition-colors hover:border-amber-500/50 hover:bg-amber-500/10"
        >
          <Coffee className="h-5 w-5 text-amber-600" />
          Offrez-moi un café — 5€
        </button>
      </div>

      {/* Coffee modal */}
      {showCoffee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCoffee(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="mb-4 text-center">
              <Coffee className="mx-auto mb-2 h-10 w-10 text-amber-500" />
              <h3 className="font-display text-lg font-bold text-foreground">Un café pour le Lab</h3>
              <p className="mt-1 text-sm text-muted-foreground">5€ — le prix d'un bon espresso</p>
            </div>

            <div className="mb-5 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <input type="radio" name="coffee-freq" checked={coffeeRecurring === ''} onChange={() => setCoffeeRecurring('')}
                  className="accent-secondary" />
                <span className="text-sm text-foreground">Juste une fois</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <input type="radio" name="coffee-freq" checked={coffeeRecurring === 'week'} onChange={() => setCoffeeRecurring('week')}
                  className="accent-secondary" />
                <span className="text-sm text-foreground">Chaque semaine</span>
                <span className="ml-auto rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">~20€/mois</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <input type="radio" name="coffee-freq" checked={coffeeRecurring === 'month'} onChange={() => setCoffeeRecurring('month')}
                  className="accent-secondary" />
                <span className="text-sm text-foreground">Chaque mois</span>
                <span className="ml-auto rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">5€/mois</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCoffee(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                Annuler
              </button>
              <button
                onClick={() => handleDonate(5, coffeeRecurring !== '', coffeeRecurring || 'month')}
                disabled={coffeeLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {coffeeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coffee className="h-4 w-4" />}
                {coffeeLoading ? 'Redirection...' : 'Offrir le café'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation form — montant libre */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Ou choisissez un montant</h2>

        {/* Amount buttons */}
        <div className="mb-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
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
                className="w-full sm:w-40 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
                autoFocus
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          </div>
        )}

        {/* Recurring toggle */}
        <div className="mb-6 space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-sm text-foreground">Faire ce don régulièrement</span>
          </label>
          {recurring && (
            <div className="ml-7 flex flex-wrap gap-2">
              <button
                onClick={() => setRecurrenceType('week')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  recurrenceType === 'week' ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground'
                }`}
              >
                Chaque semaine
              </button>
              <button
                onClick={() => setRecurrenceType('month')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  recurrenceType === 'month' ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground'
                }`}
              >
                Chaque mois
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={() => handleDonate(effectiveAmount, recurring, recurrenceType)}
          disabled={loading || effectiveAmount < 1}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Redirection vers Stripe...</>
          ) : (
            <><Heart className="h-4 w-4" /> Donner {effectiveAmount > 0 ? `${effectiveAmount}€` : ''}{recurring ? `/${recurrenceType === 'week' ? 'semaine' : 'mois'}` : ''}</>
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
