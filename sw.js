/* ============================================================
   Musalingo — Service Worker
   - Caches the app shell for offline use
   - Network-first for HTML, cache-first for static assets
   - Never caches API calls (/api/*)
   - Falls back to /offline.html when a page isn't cached
   - Bump CACHE_VERSION to invalidate old caches on deploy
   ============================================================ */

const CACHE_VERSION = 'musalingo-v2';

const APP_SHELL = [
    '/',
    '/index.html',
    '/started.html',
    '/signin.html',
    '/dashboard.html',
    '/catalog.html',
    '/course.html',
    '/sections.html',
    '/lesson.html',
    '/guidebook.html',
    '/quest.html',
    '/shop.html',
    '/profile.html',
    '/settings.html',
    '/streak.html',
    '/friends.html',
    '/offline.html',
    '/course.js',
    '/course-curriculum.js',
    '/sections.js',
    '/lesson.js',
    '/theme.js',
    '/bloat.js',
    '/firebase.js',
    '/settings.json',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-192.png',
    '/icons/icon-maskable-512.png'
];

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => {
                // addAll fails entirely if ANY file 404s.
                // Cache each file individually so a single missing icon
                // doesn't prevent the whole shell from installing.
                return Promise.all(
                    APP_SHELL.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn('[sw] Could not cache:', url, err);
                        })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key !== CACHE_VERSION)
                    .map((key) => {
                        console.log('[sw] Deleting old cache:', key);
                        return caches.delete(key);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

// ---------- FETCH ----------
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== 'GET') return;

    // Only handle same-origin requests
    if (url.origin !== self.location.origin) return;

    // Never cache API calls — always go to network
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // ---------- HTML ----------
    // Network-first: try the network, fall back to cache,
    // then fall back to /offline.html if nothing matches.
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the fresh copy for next time
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_VERSION)
                            .then((cache) => cache.put(request, clone))
                            .catch(() => { });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed — try the cache
                    return caches.match(request).then((cached) => {
                        if (cached) return cached;
                        // Nothing cached for this page — show offline screen
                        return caches.match('/offline.html');
                    });
                })
        );
        return;
    }

    // ---------- Static assets ----------
    // Cache-first: serve from cache, fall back to network,
    // and store the network response for next time.
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request)
                .then((response) => {
                    // Only cache successful, basic (same-origin) responses
                    if (response && response.status === 200 && response.type === 'basic') {
                        const clone = response.clone();
                        caches.open(CACHE_VERSION)
                            .then((cache) => cache.put(request, clone))
                            .catch(() => { });
                    }
                    return response;
                })
                .catch((err) => {
                    console.warn('[sw] Fetch failed for:', request.url, err);

                    // If an image fails, return an empty response
                    if (request.destination === 'image') {
                        return new Response('', {
                            status: 200,
                            headers: { 'Content-Type': 'image/png' }
                        });
                    }

                    // Otherwise re-throw so the browser handles it
                    throw err;
                });
        })
    );
});

// ---------- MESSAGE ----------
// Allow the page to trigger skipWaiting() for immediate updates.
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});