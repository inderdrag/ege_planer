// SERVICE WORKER
// Нужен для двух вещей: 1) чтобы браузер вообще предлагал "Установить
// приложение" (это одно из условий PWA), 2) чтобы план работал офлайн —
// все файлы приложения кэшируются один раз и дальше берутся из кэша.
//
// Работает только когда страница открыта по http(s) — например, после
// публикации на GitHub Pages. При открытии index.html напрямую с диска
// (file://) браузер service worker не регистрирует, и это нормально:
// просто офлайн-режим и "Установить" будут недоступны, а само приложение
// как обычно работает через localStorage.

const CACHE_NAME = 'ege-planner-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/dates.js',
  './js/schedule.js',
  './js/render.js',
  './js/templates.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((resp) => {
        // кэшируем только свои файлы — шрифты Google и т.п. не трогаем
        if (resp.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
