// Service Worker Manager with enhanced registration and lifecycle management

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.listeners = new Set();
  }

  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ Service Worker registered:', this.registration.scope);

      // Setup update detection
      this.setupUpdateDetection();
      
      // Setup message listener
      this.setupMessageListener();

      // Check for updates periodically
      this.startUpdateCheck();

      // Request background sync permission
      await this.requestBackgroundSync();

      return this.registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  }

  setupUpdateDetection() {
    if (!this.registration) return;

    // New service worker installing
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      console.log('🔄 New service worker found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          this.updateAvailable = true;
          this.notifyListeners({
            type: 'UPDATE_AVAILABLE',
            registration: this.registration
          });
        }
      });
    });

    // Controller changed (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service worker controller changed');
      this.notifyListeners({
        type: 'CONTROLLER_CHANGED'
      });
    });
  }

  setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW Manager] Message from SW:', event.data);
      
      switch (event.data.type) {
        case 'SW_ACTIVATED':
          this.notifyListeners({
            type: 'SW_ACTIVATED',
            version: event.data.version
          });
          break;
          
        case 'SYNC_COMPLETE':
          this.notifyListeners({
            type: 'SYNC_COMPLETE',
            results: event.data.results
          });
          break;
          
        case 'CONFLICT_DETECTED':
          this.notifyListeners({
            type: 'CONFLICT_DETECTED',
            conflict: event.data.conflict
          });
          break;
      }
    });
  }

  startUpdateCheck() {
    // Check for updates every hour
    setInterval(() => {
      if (this.registration) {
        this.registration.update();
      }
    }, 60 * 60 * 1000);
  }

  async requestBackgroundSync() {
    if (!this.registration) return;

    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync'
      });
      
      if (status.state === 'granted') {
        console.log('✅ Background sync permission granted');
      }
    } catch (error) {
      // Permission not supported or denied
      console.log('Background sync permission not available');
    }
  }

  async triggerSync() {
    if (!this.registration || !this.registration.sync) {
      console.warn('Background Sync not supported');
      return false;
    }

    try {
      await this.registration.sync.register('sync-attendance');
      console.log('✅ Background sync registered');
      return true;
    } catch (error) {
      console.error('❌ Background sync registration failed:', error);
      return false;
    }
  }

  async skipWaiting() {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  async clearCache() {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve();
        } else {
          reject(new Error('Failed to clear cache'));
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  async getCacheSize() {
    if (!navigator.serviceWorker.controller) {
      return 0;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size || 0);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  }

  async unregister() {
    if (!this.registration) return false;

    try {
      const success = await this.registration.unregister();
      if (success) {
        console.log('✅ Service Worker unregistered');
        this.registration = null;
      }
      return success;
    } catch (error) {
      console.error('❌ Service Worker unregistration failed:', error);
      return false;
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('SW Manager listener error:', error);
      }
    });
  }

  getState() {
    if (!this.registration) {
      return 'unregistered';
    }

    if (this.registration.installing) return 'installing';
    if (this.registration.waiting) return 'waiting';
    if (this.registration.active) return 'active';
    
    return 'unknown';
  }
}

export const swManager = new ServiceWorkerManager();
