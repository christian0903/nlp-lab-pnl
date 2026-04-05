import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft, Loader2, CheckCircle, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AMOUNTS = [5, 10, 20, 50];
const DEFAULT_AMOUNT = 10;

const Soutenir = () => {
  const { t } = useTranslation();
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
      toast.error(t('soutenir.minAmount'));
      return;
    }
    if (donationAmount > 1000) {
      toast.error(t('soutenir.maxAmount'));
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
        throw new Error(t('soutenir.noPaymentLink'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t('soutenir.paymentError'));
      setLoad(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
        <h1 className="mb-3 font-display text-3xl font-bold text-foreground">{t('soutenir.thankYouTitle')}</h1>
        <p className="mb-8 text-muted-foreground leading-relaxed">
          {t('soutenir.thankYouMessage')}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:brightness-110"
        >
          {t('common.backHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('common.home')}
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">{t('soutenir.title')}</h1>
      </div>

      {canceled && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600">
          {t('soutenir.canceled')}
        </div>
      )}

      {/* Pourquoi donner — texte descriptif */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">{t('soutenir.whyTitle')}</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p dangerouslySetInnerHTML={{ __html: t('soutenir.whyP1') }} />
          <p dangerouslySetInnerHTML={{ __html: t('soutenir.whyP2') }} />
          <p dangerouslySetInnerHTML={{ __html: t('soutenir.whyP3') }} />
        </div>
      </div>

      {/* Offrez-moi un café — bouton rapide */}
      <div className="mb-8">
        <button
          onClick={() => setShowCoffee(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm font-semibold text-foreground transition-colors hover:border-amber-500/50 hover:bg-amber-500/10"
        >
          <Coffee className="h-5 w-5 text-amber-600" />
          {t('soutenir.coffeeButton')}
        </button>
      </div>

      {/* Coffee modal */}
      {showCoffee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCoffee(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="mb-4 text-center">
              <Coffee className="mx-auto mb-2 h-10 w-10 text-amber-500" />
              <h3 className="font-display text-lg font-bold text-foreground">{t('soutenir.coffeeTitle')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('soutenir.coffeeSubtitle')}</p>
            </div>

            <div className="mb-5 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <input type="radio" name="coffee-freq" checked={coffeeRecurring === ''} onChange={() => setCoffeeRecurring('')}
                  className="accent-secondary" />
                <span className="text-sm text-foreground">{t('soutenir.justOnce')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <input type="radio" name="coffee-freq" checked={coffeeRecurring === 'week'} onChange={() => setCoffeeRecurring('week')}
                  className="accent-secondary" />
                <span className="text-sm text-foreground">{t('soutenir.everyWeek')}</span>
                <span className="ml-auto rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">~20€/mois</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <input type="radio" name="coffee-freq" checked={coffeeRecurring === 'month'} onChange={() => setCoffeeRecurring('month')}
                  className="accent-secondary" />
                <span className="text-sm text-foreground">{t('soutenir.everyMonth')}</span>
                <span className="ml-auto rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">5€/mois</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCoffee(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDonate(5, coffeeRecurring !== '', coffeeRecurring || 'month')}
                disabled={coffeeLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {coffeeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coffee className="h-4 w-4" />}
                {coffeeLoading ? t('soutenir.redirecting') : t('soutenir.offerCoffee')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation form — montant libre */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t('soutenir.chooseAmount')}</h2>

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
            {t('soutenir.other')}
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
                placeholder={t('soutenir.amountPlaceholder')}
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
            <span className="text-sm text-foreground">{t('soutenir.recurringDonation')}</span>
          </label>
          {recurring && (
            <div className="ml-7 flex flex-wrap gap-2">
              <button
                onClick={() => setRecurrenceType('week')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  recurrenceType === 'week' ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground'
                }`}
              >
                {t('soutenir.everyWeek')}
              </button>
              <button
                onClick={() => setRecurrenceType('month')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  recurrenceType === 'month' ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground'
                }`}
              >
                {t('soutenir.everyMonth')}
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
            <><Loader2 className="h-4 w-4 animate-spin" /> {t('soutenir.redirecting')}</>
          ) : (
            <><Heart className="h-4 w-4" /> {t('soutenir.donateButton')} {effectiveAmount > 0 ? `${effectiveAmount}€` : ''}{recurring ? (recurrenceType === 'week' ? t('soutenir.perWeek') : t('soutenir.perMonth')) : ''}</>
          )}
        </button>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          {t('soutenir.securePayment')}
        </p>
      </div>
    </div>
  );
};

export default Soutenir;
