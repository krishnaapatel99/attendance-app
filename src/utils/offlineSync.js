// Offline sync manager for queuing requests when offline
class OfflineSyncManager {
  constructor() {
    this.dbName = 'UpasthitDB';
    this.storeName = 'pendingRequests';
    this.conflictStoreName = 'conflicts';
    this.db = null;
    this.syncInProgress = false;
    this.listeners = new Set();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Pending requests store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('url', 'url', { unique: false });
        }
        
        // Conflicts store
        if (!db.objectStoreNames.contains(this.conflictStoreName)) {
          const conflictStore = db.createObjectStore(this.conflictStoreName, { keyPath: 'id', autoIncrement: true });
          conflictStore.createIndex('timestamp', 'timestamp', { unique: false });
          conflictStore.createIndex('resolved', 'resolved', { unique: false });
        }
      };
    });
  }

  async addPendingRequest(url, method, headers, body) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.add({
        url,
        method,
        headers,
        body,
        timestamp: Date.now(),
        retryCount: 0,
        lastError: null
      });

      request.onsuccess = () => {
        this.notifyListeners({ type: 'REQUEST_QUEUED', count: 1 });
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingRequests() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePendingRequest(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async syncPendingRequests(apiInstance) {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.syncInProgress = true;
    const pendingRequests = await this.getPendingRequests();
    
    const results = {
      success: 0,
      failed: 0,
      conflicts: 0,
      errors: []
    };

    for (const req of pendingRequests) {
      try {
        const response = await apiInstance({
          url: req.url,
          method: req.method,
          headers: req.headers,
          data: req.body ? JSON.parse(req.body) : undefined
        });

        await this.deletePendingRequest(req.id);
        results.success++;
        
      } catch (error) {
        // Handle conflict (409)
        if (error.response?.status === 409) {
          await this.handleConflict(req, error.response.data);
          results.conflicts++;
        } 
        // Retry on temporary errors (5xx, network issues)
        else if (this.shouldRetry(error, req.retryCount)) {
          await this.updateRetryCount(req.id, req.retryCount + 1, error.message);
          results.failed++;
        }
        // Permanent failure - remove from queue
        else {
          await this.deletePendingRequest(req.id);
          results.failed++;
          results.errors.push({
            url: req.url,
            error: error.message
          });
        }
      }
    }

    this.syncInProgress = false;
    this.notifyListeners({ type: 'SYNC_COMPLETE', results });
    
    return results;
  }

  shouldRetry(error, retryCount) {
    const maxRetries = 3;
    if (retryCount >= maxRetries) return false;
    
    // Retry on network errors or 5xx server errors
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  async updateRetryCount(id, retryCount, errorMessage) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.retryCount = retryCount;
          record.lastError = errorMessage;
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async handleConflict(request, serverData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.conflictStoreName], 'readwrite');
      const store = transaction.objectStore(this.conflictStoreName);
      
      const conflict = {
        requestId: request.id,
        url: request.url,
        method: request.method,
        localData: request.body ? JSON.parse(request.body) : null,
        serverData: serverData,
        timestamp: Date.now(),
        resolved: false
      };

      const addRequest = store.add(conflict);
      addRequest.onsuccess = () => {
        this.notifyListeners({ 
          type: 'CONFLICT_DETECTED', 
          conflict: { ...conflict, id: addRequest.result }
        });
        resolve(addRequest.result);
      };
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  async getConflicts() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.conflictStoreName], 'readonly');
      const store = transaction.objectStore(this.conflictStoreName);
      const index = store.index('resolved');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async resolveConflict(conflictId, resolution, apiInstance) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([this.conflictStoreName], 'readwrite');
    const store = transaction.objectStore(this.conflictStoreName);
    const getRequest = store.get(conflictId);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = async () => {
        const conflict = getRequest.result;
        if (!conflict) {
          reject(new Error('Conflict not found'));
          return;
        }

        try {
          // Apply resolution
          const dataToSend = resolution === 'local' 
            ? conflict.localData 
            : conflict.serverData;

          await apiInstance({
            url: conflict.url,
            method: conflict.method,
            data: dataToSend
          });

          // Mark as resolved
          conflict.resolved = true;
          conflict.resolvedAt = Date.now();
          conflict.resolution = resolution;
          
          const updateRequest = store.put(conflict);
          updateRequest.onsuccess = () => {
            this.notifyListeners({ type: 'CONFLICT_RESOLVED', conflictId });
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
          
        } catch (error) {
          reject(error);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Event listener system
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  async clearAll() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineSyncManager = new OfflineSyncManager();

// Network status helpers
export const isOnline = () => navigator.onLine;

export const onNetworkChange = (callback) => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
  
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};
