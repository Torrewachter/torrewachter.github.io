// sw.js - maakt van de website een app op gsm, tablet of laptop (Toevoegen aan beginscherm / Installeren).
// Altijd eerst het internet (dus altijd de nieuwste gegevens); zonder verbinding de laatst bekeken versie.
// Gemaakt door Claude voor de Torrewachters; website.ps1 zet dit bestand in de hoofdmap van de website.
const V = 'torrewachters-1';
const sleutel = u => { const x = new URL(u); return x.origin + x.pathname };   // zonder ?v=...: een nieuwe versie vervangt de oude in de opslag
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.add('./index.html')).catch(() => {})) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok && res.type === 'basic') { const c = res.clone(); caches.open(V).then(x => x.put(sleutel(r.url), c)).catch(() => {}) }
    return res;
  }).catch(() => caches.match(sleutel(r.url)).then(m => m || (r.mode === 'navigate' ? caches.match(sleutel(new URL('./index.html', location.href).href)) : undefined)).then(m => m || Response.error())));
});
