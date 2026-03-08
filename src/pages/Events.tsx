import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Video, Plus, Check, X, UserPlus, UserMinus, Mail, Send } from 'lucide-react';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EventRow {
  id: string;
  title: string;
  description: string;
  event_date: string;
  duration_minutes: number;
  zoom_link: string;
  max_participants: number | null;
  created_by: string;
  created_at: string;
}

interface Registration {
  event_id: string;
  user_id: string;
}

const Events = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('19:00');
  const [duration, setDuration] = useState(60);
  const [zoomLink, setZoomLink] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    const { data: regsData } = await supabase
      .from('event_registrations')
      .select('event_id, user_id');

    setEvents((eventsData || []) as EventRow[]);
    setRegistrations((regsData || []) as Registration[]);

    if (user) {
      const myRegs = new Set((regsData || []).filter((r: any) => r.user_id === user.id).map((r: any) => r.event_id));
      setMyRegistrations(myRegs);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const getRegCount = (eventId: string) => registrations.filter(r => r.event_id === eventId).length;

  const handleRegister = async (eventId: string) => {
    if (!user) { toast.error('Connectez-vous pour vous inscrire'); return; }
    const { error } = await supabase.from('event_registrations').insert({ event_id: eventId, user_id: user.id } as any);
    if (error) { toast.error('Erreur lors de l\'inscription'); return; }
    setMyRegistrations(prev => new Set(prev).add(eventId));
    setRegistrations(prev => [...prev, { event_id: eventId, user_id: user.id }]);
    toast.success('Inscrit ! Vous recevrez les détails par email.');
  };

  const handleUnregister = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from('event_registrations').delete().eq('event_id', eventId).eq('user_id', user.id);
    if (error) { toast.error('Erreur'); return; }
    setMyRegistrations(prev => { const n = new Set(prev); n.delete(eventId); return n; });
    setRegistrations(prev => prev.filter(r => !(r.event_id === eventId && r.user_id === user.id)));
    toast.success('Inscription annulée');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const dateTime = new Date(`${eventDate}T${eventTime}`).toISOString();
    setSubmitting(true);

    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      description: description.trim(),
      event_date: dateTime,
      duration_minutes: duration,
      zoom_link: zoomLink.trim(),
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      created_by: user.id,
    } as any);

    setSubmitting(false);
    if (error) { toast.error('Erreur création événement'); console.error(error); return; }

    setTitle(''); setDescription(''); setEventDate(''); setEventTime('19:00');
    setDuration(60); setZoomLink(''); setMaxParticipants('');
    setShowForm(false);
    toast.success('Événement créé !');
    fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Supprimer cet événement ?')) return;
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) { toast.error('Erreur'); return; }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success('Événement supprimé');
  };

  const handleSendEmail = async (eventId: string) => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error('Sujet et message requis');
      return;
    }
    setSendingEmail(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-event-email', {
        body: { event_id: eventId, subject: emailSubject.trim(), body: emailBody.trim() },
      });

      if (error) throw error;
      toast.success(data?.message || 'Emails envoyés !');
      setShowEmailForm(null);
      setEmailSubject('');
      setEmailBody('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur envoi email. Vérifiez que la clé Resend est configurée.');
    } finally {
      setSendingEmail(false);
    }
  };

  const upcomingEvents = events.filter(e => !isPast(new Date(e.event_date)));
  const pastEvents = events.filter(e => isPast(new Date(e.event_date)));

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Événements</h1>
          <p className="mt-1 text-muted-foreground">Sessions de travail, meetings et ateliers PNL</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:brightness-110">
            <Plus className="h-4 w-4" /> Créer un événement
          </button>
        )}
      </div>

      {/* Create event form (admin only) */}
      {showForm && isAdmin && (
        <form onSubmit={handleCreateEvent} className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Nouvel événement</h3>
          <div className="space-y-3">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Titre de l'événement" maxLength={200} required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Description, objectifs, programme..." maxLength={2000} rows={3} required
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Heure</label>
                <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Durée (min)</label>
                <input type="number" value={duration} onChange={e => setDuration(+e.target.value)} min={15} max={480}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Lien Zoom</label>
                <input type="url" value={zoomLink} onChange={e => setZoomLink(e.target.value)}
                  placeholder="https://zoom.us/j/..." required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Places max (optionnel)</label>
                <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)}
                  placeholder="Illimité" min={1}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Annuler</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:brightness-110 disabled:opacity-50">
              {submitting ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun événement programmé pour le moment.</p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-4 font-display text-xl font-bold text-foreground">📅 À venir</h2>
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} regCount={getRegCount(event.id)}
                    isRegistered={myRegistrations.has(event.id)} isAdmin={isAdmin} user={user}
                    onRegister={handleRegister} onUnregister={handleUnregister} onDelete={handleDeleteEvent}
                    showEmailForm={showEmailForm} setShowEmailForm={setShowEmailForm}
                    emailSubject={emailSubject} setEmailSubject={setEmailSubject}
                    emailBody={emailBody} setEmailBody={setEmailBody}
                    sendingEmail={sendingEmail} onSendEmail={handleSendEmail} />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="mb-4 font-display text-xl font-bold text-foreground text-muted-foreground">Passés</h2>
              <div className="space-y-3 opacity-60">
                {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} regCount={getRegCount(event.id)}
                    isRegistered={myRegistrations.has(event.id)} isAdmin={isAdmin} user={user}
                    onRegister={handleRegister} onUnregister={handleUnregister} onDelete={handleDeleteEvent}
                    showEmailForm={showEmailForm} setShowEmailForm={setShowEmailForm}
                    emailSubject={emailSubject} setEmailSubject={setEmailSubject}
                    emailBody={emailBody} setEmailBody={setEmailBody}
                    sendingEmail={sendingEmail} onSendEmail={handleSendEmail} past />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface EventCardProps {
  event: EventRow;
  regCount: number;
  isRegistered: boolean;
  isAdmin: boolean;
  user: any;
  onRegister: (id: string) => void;
  onUnregister: (id: string) => void;
  onDelete: (id: string) => void;
  showEmailForm: string | null;
  setShowEmailForm: (id: string | null) => void;
  emailSubject: string;
  setEmailSubject: (s: string) => void;
  emailBody: string;
  setEmailBody: (s: string) => void;
  sendingEmail: boolean;
  onSendEmail: (eventId: string) => void;
  past?: boolean;
}

const EventCard = ({
  event, regCount, isRegistered, isAdmin, user,
  onRegister, onUnregister, onDelete,
  showEmailForm, setShowEmailForm, emailSubject, setEmailSubject, emailBody, setEmailBody,
  sendingEmail, onSendEmail, past,
}: EventCardProps) => {
  const date = new Date(event.event_date);
  const isFull = event.max_participants !== null && regCount >= event.max_participants;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-foreground">{event.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{event.description}</p>
        </div>
        {isRegistered && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
            <Check className="h-3 w-3" /> Inscrit
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {format(date, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {event.duration_minutes} min
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" /> {regCount}{event.max_participants ? `/${event.max_participants}` : ''} inscrits
        </span>
        {(isRegistered || isAdmin) && event.zoom_link && (
          <a href={event.zoom_link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-secondary hover:underline">
            <Video className="h-4 w-4" /> Rejoindre Zoom
          </a>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {!past && user && (
          isRegistered ? (
            <button onClick={() => onUnregister(event.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5">
              <UserMinus className="h-3.5 w-3.5" /> Se désinscrire
            </button>
          ) : (
            <button onClick={() => onRegister(event.id)} disabled={isFull}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:brightness-110 disabled:opacity-50">
              <UserPlus className="h-3.5 w-3.5" /> {isFull ? 'Complet' : 'S\'inscrire'}
            </button>
          )
        )}
        {!past && !user && (
          <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <UserPlus className="h-3.5 w-3.5" /> Connectez-vous pour vous inscrire
          </Link>
        )}

        {isAdmin && (
          <>
            <button onClick={() => setShowEmailForm(showEmailForm === event.id ? null : event.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Mail className="h-3.5 w-3.5" /> Emailer les inscrits ({regCount})
            </button>
            <button onClick={() => onDelete(event.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5">
              <X className="h-3.5 w-3.5" /> Supprimer
            </button>
          </>
        )}
      </div>

      {/* Email form */}
      {showEmailForm === event.id && isAdmin && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">Envoyer un email aux inscrits</h4>
          <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
            placeholder="Sujet de l'email" maxLength={200}
            className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
          <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)}
            placeholder="Contenu du message..." maxLength={5000} rows={4}
            className="mb-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowEmailForm(null)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Annuler</button>
            <button onClick={() => onSendEmail(event.id)} disabled={sendingEmail}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:brightness-110 disabled:opacity-50">
              <Send className="h-3.5 w-3.5" /> {sendingEmail ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
