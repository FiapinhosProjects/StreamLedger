// ============================================
// sw.js - Service Worker para StreamLedger PWA
// Cache-first para assets, network-first para páginas
// ============================================

const CACHE_NAME = "streamledger-v1";
const STATIC_CACHE = "streamledger-static-v1";
const DYNAMIC_CACHE = "streamledger-dynamic-v1";

// Assets que são cacheados imediatamente na instalação
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/receitas",
  "/despesas",
  "/manifest.json",
  "/assets/favicon.png",
];

// ============================================
// Install — faz precache dos assets essenciais
// ============================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SW] Falha no precache:", err);
        return self.skipWaiting();
      })
  );
});

// ============================================
// Activate — limpa caches antigos
// ============================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith("streamledger-") &&
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE
            )
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// Fetch — estratégia por tipo de recurso
// ============================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET e requisições cross-origin que não são assets
  if (request.method !== "GET") return;

  //跳过 chrome-extension, telemetry, etc
  if (
    url.protocol === "chrome-extension:" ||
    url.hostname !== self.location.hostname
  ) {
    // Para assets externos (fonts.googleapis.com, fonts.gstatic.com), usa cache-first
    if (
      url.hostname === "fonts.googleapis.com" ||
      url.hostname === "fonts.gstatic.com"
    ) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    return;
  }

  // ==========================================
  // Estratégia: páginas HTML (network-first)
  // ==========================================
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // ==========================================
  // Estratégia: assets estáticos (cache-first)
  // ==========================================
  const STATIC_EXTENSIONS = [
    ".js",
    ".css",
    ".woff",
    ".woff2",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".ico",
    ".webp",
    ".mp4",
    ".webm",
    ".json",
  ];
  if (STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ==========================================
  // Estratégia: API calls (network-first, falha offline)
  // ==========================================
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Para tudo mais: network-first com fallback offline
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ============================================
// Estratégia: Cache-First
// Tenta cache primeiro, depois rede
// ============================================
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Offline — recurso não cacheado.", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// ============================================
// Estratégia: Network-First
// Tenta rede primeiro, fallback para cache
// ============================================
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Fallback offline para páginas HTML
    if (request.headers.get("accept")?.includes("text/html")) {
      const offlinePage = await caches.match("/");
      return (
        offlinePage ||
        new Response(
          `<!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>StreamLedger — Offline</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                background: #0a0a0a; color: #ffffff;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                min-height: 100vh; text-align: center; padding: 2rem;
              }
              .card {
                background: #111; border: 1px solid #222;
                border-radius: 1rem; padding: 2.5rem; max-width: 400px;
              }
              h1 { color: #5dff9b; font-size: 1.75rem; margin-bottom: 0.5rem; }
              p { color: #888; line-height: 1.6; margin-bottom: 1.5rem; }
              button {
                background: #5dff9b; color: #0a0a0a;
                border: none; padding: 0.75rem 1.5rem;
                border-radius: 0.5rem; font-weight: 600;
                cursor: pointer; font-size: 1rem;
              }
              button:hover { opacity: 0.85; }
              .icon { font-size: 3rem; margin-bottom: 1rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">📡</div>
              <h1>Você está offline</h1>
              <p>Sem conexão no momento. Suas transações estão salvas localmente e continuarão funcionando quando a conexão voltar.</p>
              <button onclick="window.location.reload()">Tentar novamente</button>
            </div>
          </body>
          </html>`,
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        )
      );
    }

    return new Response("Offline", { status: 503 });
  }
}

// ============================================
// Mensagem: forçar update de caches (opcional)
// ============================================
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data === "CLEAR_CACHES") {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
    );
  }
});
