// === 更新版本號 v3，強迫瀏覽器重新下載檔案 ===
const CACHE_NAME = 'hokkaido-trip-v3';

const ASSETS_TO_CACHE = [
    './',                // 對應 start_url: "."
    './index.html',      // 對應實際檔案
    './manifest.json',
    // 外部資源
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap'
];

// 選擇性資源 (圖片)，即使缺少也不會讓 App 當掉
const OPTIONAL_ASSETS = [
    './icon-192.png',
    './icon-512.png'
];

// 安裝
self.addEventListener('install', (event) => {
    self.skipWaiting(); // 強制立即啟用新版本
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 1. 核心檔案 (必須成功)
            await cache.addAll(ASSETS_TO_CACHE);

            // 2. 圖片檔案 (允許失敗)
            for (const asset of OPTIONAL_ASSETS) {
                try {
                    const response = await fetch(asset);
                    if (response.ok) cache.put(asset, response);
                } catch (e) { console.log('圖片快取略過:', asset); }
            }
        })
    );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // 有快取就用快取，沒有就上網抓
            return response || fetch(event.request).then((networkResponse) => {
                // 如果上網抓到了，順便存進快取 (動態快取)
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                }
                return networkResponse;
            });
        })
    );
});

// 清除舊版本
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('刪除舊快取:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});