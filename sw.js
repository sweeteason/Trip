const CACHE_NAME = 'hokkaido-trip-v2'; // 更新版本號
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    // 外部資源通常比較穩定，保留
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap'
];

// 選擇性快取的資源 (如果這些檔案不存在，不會導致 PWA 安裝失敗)
const OPTIONAL_ASSETS = [
    './icon-192.png',
    './icon-512.png'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 1. 先快取核心檔案 (必須成功)
            await cache.addAll(ASSETS_TO_CACHE);

            // 2. 嘗試快取選擇性檔案 (允許失敗)
            for (const asset of OPTIONAL_ASSETS) {
                try {
                    const response = await fetch(asset);
                    if (response.ok) {
                        await cache.put(asset, response);
                    } else {
                        console.warn(`[SW] 找不到選擇性檔案: ${asset}，已略過。`);
                    }
                } catch (error) {
                    console.warn(`[SW] 下載失敗: ${asset}，已略過。`);
                }
            }
        })
    );
    // 強制讓新的 Service Worker 立即接管頁面
    self.skipWaiting();
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // 離線且沒有快取時的處理 (可選)
                // return caches.match('./offline.html');
            });
        })
    );
});

// 清除舊快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] 刪除舊快取:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // 讓 Service Worker 立即控制所有頁面
    return self.clients.claim();
});