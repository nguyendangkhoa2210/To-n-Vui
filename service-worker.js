const CACHE_NAME = 'mathuniverse-cache-v21';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './svg-shapes.js',
    './mascot.js',
    './forest-friends.js',
    './practice-engine.js',
    './curriculum.js',
    './app-core.js',
    './quiz.js',
    './extras.js',
    './db-sync.js',
    './auth-ui.js',
    './usage-guard.js',
    './style.css',
    './manifest.json',
    './icon.svg',
    './parent.html',
    './parent.css',
    './parent.js'
];

// Cài đặt: lưu toàn bộ tài nguyên tĩnh vào cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Kích hoạt: xóa các cache phiên bản cũ
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});


self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    // Không cache API — luôn phải là dữ liệu tươi từ MySQL
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});