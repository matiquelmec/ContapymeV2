// Service Worker de Alto Rendimiento - ContaPymePUQ Desktop & Offline First 2026
const CACHE_NAME = 'contapymepuq-v2-cache';
const STATIC_CACHE_NAME = 'contapymepuq-static-v2';

const PRECACHE_ASSETS = [
  '/',
  '/calculadora',
  '/manifest.json',
  '/logo-contapyme.png',
  '/icon.png',
  '/branding/job-ad-prompt-spec.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-cacheando recursos clave de escritorio...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== STATIC_CACHE_NAME) {
            console.log('[ServiceWorker] Limpiando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;
  
  // Excluir pasarelas de pago y autenticación para seguridad estricta
  if (request.url.includes('/api/checkout') || request.url.includes('/auth/v1')) {
    return;
  }

  const url = new URL(request.url);

  // ESTRATEGIA 1: Cache-First / Stale-While-Revalidate para chunks estáticos de Next.js, fuentes e imágenes
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|avif|woff2|woff|css|js)$/i)) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        // Retornar caché inmediatamente si existe, o esperar a la red
        return cachedResponse || fetchPromise || new Response('', { status: 404 });
      })
    );
    return;
  }

  // ESTRATEGIA 2: Network-First con Fallback para páginas y rutas dinámicas
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
          return new Response('Sin conexión a internet (Modo Offline ContaPymePUQ)', {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
