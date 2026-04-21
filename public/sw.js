// Service Worker for PWA support
// Strategy:
//   - HTML documents: network-first (so new posts appear without waiting for cache bust)
//   - Static assets: cache-first
// Bump CACHE_NAME when you need all clients to drop their old caches.
const CACHE_NAME = 'typography-theme-v2'

function getBasePath() {
  return globalThis.location.pathname.replace(/\/sw\.js$/, '')
}

const basePath = getBasePath()
const urlsToCache = [
  `${basePath}/`,
  `${basePath}/favicon.svg`,
  `${basePath}/manifest.json`,
  `${basePath}/placeholder.png`,
]

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => globalThis.skipWaiting()),
  )
})

function isHtmlRequest(request) {
  return request.mode === 'navigate'
    || request.destination === 'document'
    || (request.headers.get('accept') || '').includes('text/html')
}

globalThis.addEventListener('fetch', (event) => {
  const { request } = event

  // Never intercept non-GET requests.
  if (request.method !== 'GET')
    return

  if (isHtmlRequest(request)) {
    // network-first for HTML so content updates are visible immediately
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request).then(cached => cached || Response.error())),
    )
    return
  }

  // cache-first for everything else
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached)
        return cached
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic')
          return response
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        return response
      })
    }),
  )
})

globalThis.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName))
            return caches.delete(cacheName)
          return undefined
        }),
      ))
      .then(() => globalThis.clients.claim()),
  )
})
