const CACHE = 'corona-de-ceniza-v2.36';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './content.js',
  './cards-core.js',
  './cards-arcs.js',
  './audio.js',
  './fx.js',
  './game.js',
  './manifest.webmanifest',
  './icon.png',
  './icon.svg',
  './img/software-society.png',
  './img/hall.jpg',
  './img/card-back.jpg',
  './img/scene-death.jpg',
  './img/scene-coronation.jpg',
  './img/climax-cup.jpg',
  './img/climax-left-seat.jpg',
  './img/climax-midnight.jpg',
  './img/advisor-ines.jpg',
  './img/advisor-bruno.jpg',
  './img/advisor-tala.jpg',
  './img/advisor-roldan.jpg',
  './img/advisor-elian.jpg',
  './img/advisor-mara.jpg',
  './img/advisor-odon.jpg',
  './img/advisor-soraya.jpg',
  './img/advisor-naia.jpg',
  './img/advisor-garrik.jpg',
  './img/advisor-lupo.jpg',
  './img/advisor-ferran.jpg',
  './musica/court.opus',
  './musica/winter.opus',
  './musica/plague.opus',
  './musica/war.opus',
  './musica/void.opus',
  './musica/plot.opus',
  './musica/death.opus',
  './musica/coronation.opus'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
