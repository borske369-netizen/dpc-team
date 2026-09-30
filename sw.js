const CACHE_PREFIX = 'dpc-team-edition-';
const CACHE_NAME = `${CACHE_PREFIX}v6`;

const APP_SHELL = [
  './index.html',
  './style.css',
  './store.js',
  './model.js',
  './app.js',
  './view-rep.js',
  './view-manager.js',
  './view-board.js',
  './recruiting.js',
  './nudge.js',
  './control.js',
  './control-corpus.js',
  './nudge.css',
  './reports.js',
  './cloud.js',
  './cloud-ui.js',
  './edition.js',
  './dialog.js',
  './offline.js',
  './sw.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(APP_SHELL.map(async (url) => {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn(`Could not precache ${url}`, error);
        }
      }));
    } catch (error) {
      console.warn('Could not open the app shell cache', error);
    }

    try {
      await self.skipWaiting();
    } catch (error) {
      console.warn('Could not activate the service worker immediately', error);
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.all(names.map(async (name) => {
        if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) {
          try {
            await caches.delete(name);
          } catch (error) {
            console.warn(`Could not remove old cache ${name}`, error);
          }
        }
      }));
    } catch (error) {
      console.warn('Could not inspect old caches', error);
    }

    try {
      await self.clients.claim();
    } catch (error) {
      console.warn('Could not claim open app windows', error);
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(request.url);
  } catch (error) {
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  /* Network first, cache as the fallback. The old cache first strategy meant
     a phone that installed the app once never received a fix again. With
     signal the rep always gets the latest version; without it the saved copy
     still opens. */
  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: 'no-cache' });
      if (response && response.ok && response.type === 'basic') {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch (error) {
          console.warn('Could not cache a network response', error);
        }
      }
      return response;
    } catch (error) {
      try {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
      } catch (cacheError) {
        console.warn('Could not read from cache', cacheError);
      }
      return new Response('Offline', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
