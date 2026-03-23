import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2, RefreshCw, ToggleLeft, ToggleRight, CreditCard, Repeat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

interface Donation {
  id: string;
  amount: number;
  currency: string;
  email: string;
  date: string;
  mode: string;
  status: string;
}

interface Subscription {
  id: string;
  amount: number;
  currency: string;
  email: string;
  start_date: string;
  status: string;
}

const AdminDonations = () => {
  const { user, session } = useAuth();
  const { isAdmin, canManage, loading: adminLoading } = useAdmin();
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    // Fetch stripe mode
    const { data: modeData } = await supabase.from('app_settings').select('value').eq('key', 'stripe_mode').single();
    const rawValue = typeof modeData?.value === 'string' ? modeData.value : JSON.stringify(modeData?.value || '');
    const mode = rawValue.replace(/"/g, '') === 'live' ? 'live' : 'test';
    setStripeMode(mode);

    // Fetch donations from edge function
    try {
      const { data, error } = await supabase.functions.invoke('list-donations');
      if (error) throw error;
      if (data?.donations) setDonations(data.donations);
      if (data?.subscriptions) setSubscriptions(data.subscriptions);
    } catch (err: any) {
      console.error('Fetch donations error:', err);
      toast.error('Erreur chargement des dons');
    }

    setLoading(false);
  };

  useEffect(() => {
    if (canManage) fetchData();
  }, [canManage]);

  const toggleMode = async () => {
    const newMode = stripeMode === 'test' ? 'live' : 'test';

    if (newMode === 'live') {
      const confirmed = window.confirm(
        'Passer en mode LIVE ? Les paiements seront réels. Assurez-vous que la clé live est configurée.'
      );
      if (!confirmed) return;
    }

    setToggling(true);
    const { error } = await supabase.from('app_settings').upsert({
      key: 'stripe_mode',
      value: newMode,
    } as any);

    if (error) {
      toast.error('Erreur : ' + error.message);
    } else {
      setStripeMode(newMode);
      toast.success(`Mode Stripe : ${newMode.toUpperCase()}`);
      fetchData();
    }
    setToggling(false);
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return date; }
  };

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  if (adminLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  if (!canManage) return <Navigate to="/" />;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Donations</h1>
          <p className="mt-1 text-muted-foreground">Gestion des paiements Stripe</p>
        </div>
        <button onClick={() => fetchData()} disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      {/* Mode toggle */}
      <div className={`mb-8 rounded-xl border p-5 shadow-sm ${
        stripeMode === 'live'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-amber-500/30 bg-amber-500/5'
      }`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Mode Stripe : <span className={stripeMode === 'live' ? 'text-emerald-600' : 'text-amber-600'}>
                {stripeMode === 'live' ? 'LIVE' : 'TEST'}
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {stripeMode === 'live'
                ? 'Les paiements sont réels. Les dons sont encaissés.'
                : 'Mode test. Utilisez la carte 4242 4242 4242 4242 pour simuler.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={toggleMode}
              disabled={toggling}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                stripeMode === 'test'
                  ? <ToggleLeft className="h-5 w-5 text-amber-500" />
                  : <ToggleRight className="h-5 w-5 text-emerald-500" />
              )}
              {stripeMode === 'test' ? 'Passer en LIVE' : 'Passer en TEST'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center shadow-sm">
          <CreditCard className="mx-auto mb-1 h-5 w-5 text-secondary" />
          <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{donations.length}</p>
          <p className="text-xs text-muted-foreground">Paiements</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center shadow-sm">
          <Heart className="mx-auto mb-1 h-5 w-5 text-secondary" />
          <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{totalDonations.toFixed(0)}€</p>
          <p className="text-xs text-muted-foreground">Total reçu</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center shadow-sm">
          <Repeat className="mx-auto mb-1 h-5 w-5 text-secondary" />
          <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{subscriptions.length}</p>
          <p className="text-xs text-muted-foreground">Abonnements actifs</p>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Chargement...</div>
      ) : (
        <div className="space-y-8">
          {/* Donations table */}
          <div>
            <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Journal des dons</h3>
            {donations.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {donations.map(d => (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-foreground">{formatDate(d.date)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.email}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{d.amount.toFixed(2)}€</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            d.mode === 'mensuel'
                              ? 'bg-purple-500/10 text-purple-600'
                              : 'bg-secondary/10 text-secondary'
                          }`}>
                            {d.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Aucun don reçu pour le moment
              </div>
            )}
          </div>

          {/* Active subscriptions */}
          {subscriptions.length > 0 && (
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Abonnements mensuels actifs</h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Depuis</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant/mois</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subscriptions.map(s => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-foreground">{formatDate(s.start_date)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{s.amount.toFixed(2)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDonations;
