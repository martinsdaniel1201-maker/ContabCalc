// sw.js — ContabCalc AI
// Cache-first para o app shell, para funcionar offline (o motor de cálculo é 100% local,
// não depende de rede — só a fonte do Google Fonts precisa de conexão na 1ª visita).
const CACHE_NAME = "contabcalc-v9";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes.filter((nome) => nome !== CACHE_NAME).map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Só interceptamos requisições GET do mesmo domínio (app shell).
  // Fontes do Google Fonts seguem direto para a rede (cross-origin).
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resposta) => {
          if (event.request.url.startsWith(self.location.origin)) {
            const copia = resposta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return resposta;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

// Permite que o app force a atualização imediata quando uma nova versão for detectada
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
