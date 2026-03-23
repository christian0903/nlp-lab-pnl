// Service Worker — PNL Lab R&D
// Cache les ressources statiques pour un accès rapide
// Ne modifie pas le comportement en ligne de l'app

const CACHE_NAME = 'pnl-lab-v1';
const STATIC_ASSETS = [
  '/',
  '/images/logo-lab-atelierpnl.png',
];

// Install : cache les assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate : nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : network-first, fallback sur le cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes API (Supabase, Stripe, Umami)
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('stripe.com') ||
    event.request.url.includes('umami.is')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache les réponses réussies pour les GET
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Hors-ligne : servir depuis le cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Pour les navigations, retourner la page d'accueil (SPA)
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Hors ligne', { status: 503 });
        });
      })
  );
});
