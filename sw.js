const VERSION = "ef61c9ff6d";
const CACHE = "pathmates-" + VERSION;
const ASSETS = ["./","index.html","style.css","app.js","data.json","manifest.json","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","icons/apple-touch-icon.png","icons/favicon.ico","icons/favicon-32.png","icons/logo-header.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const NET_FIRST = /(\/|index\.html|app\.js|style\.css|data\.json|manifest\.json)$/;
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === "navigate" || NET_FIRST.test(url.pathname)) { // network-first, cache fallback
    e.respondWith(fetch(e.request, {cache: "no-store"}).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request)));
});
self.addEventListener("message", e => { if (e.data === "version") e.source.postMessage({version: VERSION}); });
