const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `upasthit-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `upasthit-runtime-v${CACHE_VERSION}`;
const API_CACHE = `upasthit-api-v${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo1.png',
  '/Upashit_logo.png',
  '/Profile.png'
];

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  API: 5 * 60 * 1000, // 5 minutes
  RUNTIME: 24 * 60 * 60 * 1000, // 24 hours
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error);
        throw error;
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== API_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => {
      console.log('[SW] Activation complete, claiming clients');
      return self.clients.claim();
    })
    .then(() => {
      // Notify all clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first with cache fallback and timestamp
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(API_CACHE).then(cache => {
              // Add timestamp to cached response
              const headers = new Headers(clonedResponse.headers);
              headers.set('sw-cached-at', Date.now().toString());
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            const cachedAt = cachedResponse.headers.get('sw-cached-at');
            const age = cachedAt ? Date.now() - parseInt(cachedAt) : Infinity;
            
            // Return cached data with stale indicator if expired
            if (age > CACHE_EXPIRATION.API) {
              const headers = new Headers(cachedResponse.headers);
              headers.set('sw-cache-stale', 'true');
              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers
              });
            }
            return cachedResponse;
          }
          // Return offline response
          return new Response(
            JSON.stringify({ 
              error: 'Offline', 
              message: 'No cached data available' 
            }),
            { 
              status: 503, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
  );
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendanceData());
  }
});

async function syncAttendanceData() {
  try {
    const db = await openDB();
    const pendingRequests = await getAllPendingRequests(db);
    
    console.log(`[SW] Syncing ${pendingRequests.length} pending requests`);
    
    const results = {
      success: 0,
      failed: 0,
      conflicts: []
    };
    
    for (const req of pendingRequests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
          credentials: 'include'
        });
        
        if (response.ok) {
          await deletePendingRequest(db, req.id);
          results.success++;
          console.log('[SW] Synced request:', req.id);
        } else if (response.status === 409) {
          // Conflict detected
          results.conflicts.push({
            id: req.id,
            url: req.url,
            data: JSON.parse(req.body)
          });
          results.failed++;
          console.warn('[SW] Conflict detected for request:', req.id);
        } else {
          results.failed++;
          console.error('[SW] Sync failed for request:', req.id, response.status);
        }
      } catch (error) {
        results.failed++;
        console.error('[SW] Sync error for request:', req.id, error);
      }
    }
    
    // Notify clients about sync results
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        results
      });
    });
    
    console.log('[SW] Sync complete:', results);
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error;
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UpasthitDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingRequests')) {
        db.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRequests'], 'readonly');
    const store = transaction.objectStore('pendingRequests');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deletePendingRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRequests'], 'readwrite');
    const store = transaction.objectStore('pendingRequests');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then(size => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}
