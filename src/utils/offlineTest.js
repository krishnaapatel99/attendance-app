// Offline functionality testing utilities

import { offlineSyncManager } from './offlineSync';
import { swManager } from './swManager';
import api from './api';

class OfflineTester {
  constructor() {
    this.originalOnLine = navigator.onLine;
  }

  // Simulate going offline
  goOffline() {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    window.dispatchEvent(new Event('offline'));
    console.log('📴 Simulated offline mode');
  }

  // Simulate going online
  goOnline() {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    window.dispatchEvent(new Event('online'));
    console.log('📶 Simulated online mode');
  }

  // Reset to actual network state
  reset() {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: this.originalOnLine
    });
    console.log('🔄 Reset to actual network state');
  }

  // Test offline request queuing
  async testOfflineQueue() {
    console.log('🧪 Testing offline queue...');
    
    this.goOffline();
    
    try {
      // Try to make a request while offline
      await api.post('/test/attendance', {
        studentId: 'TEST123',
        status: 'present',
        timestamp: Date.now()
      });
    } catch (error) {
      if (error.isOffline) {
        console.log('✅ Request queued successfully');
      } else {
        console.error('❌ Unexpected error:', error);
      }
    }
    
    // Check pending requests
    const pending = await offlineSyncManager.getPendingRequests();
    console.log(`📋 Pending requests: ${pending.length}`);
    
    this.goOnline();
    
    return pending.length > 0;
  }

  // Test sync functionality
  async testSync() {
    console.log('🧪 Testing sync...');
    
    const pendingBefore = await offlineSyncManager.getPendingRequests();
    console.log(`📋 Pending before sync: ${pendingBefore.length}`);
    
    if (pendingBefore.length === 0) {
      console.log('⚠️ No pending requests to sync');
      return false;
    }
    
    try {
      const results = await offlineSyncManager.syncPendingRequests(api);
      console.log('✅ Sync results:', results);
      
      const pendingAfter = await offlineSyncManager.getPendingRequests();
      console.log(`📋 Pending after sync: ${pendingAfter.length}`);
      
      return results.success > 0;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return false;
    }
  }

  // Test cache functionality
  async testCache() {
    console.log('🧪 Testing cache...');
    
    try {
      const cacheSize = await swManager.getCacheSize();
      console.log(`💾 Cache size: ${cacheSize} items`);
      
      // Test cache clear
      await swManager.clearCache();
      console.log('✅ Cache cleared');
      
      const newSize = await swManager.getCacheSize();
      console.log(`💾 New cache size: ${newSize} items`);
      
      return true;
    } catch (error) {
      console.error('❌ Cache test failed:', error);
      return false;
    }
  }

  // Test conflict creation
  async testConflict() {
    console.log('🧪 Testing conflict handling...');
    
    const testConflict = {
      url: '/api/test/conflict',
      method: 'POST',
      localData: { value: 'local' },
      serverData: { value: 'server' }
    };
    
    try {
      await offlineSyncManager.handleConflict(
        { id: 999, ...testConflict },
        testConflict.serverData
      );
      
      const conflicts = await offlineSyncManager.getConflicts();
      console.log(`⚠️ Conflicts: ${conflicts.length}`);
      
      return conflicts.length > 0;
    } catch (error) {
      console.error('❌ Conflict test failed:', error);
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all offline tests...\n');
    
    const results = {
      queue: await this.testOfflineQueue(),
      sync: await this.testSync(),
      cache: await this.testCache(),
      conflict: await this.testConflict()
    };
    
    console.log('\n📊 Test Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    this.reset();
    
    return results;
  }

  // Get diagnostic info
  async getDiagnostics() {
    const pending = await offlineSyncManager.getPendingRequests();
    const conflicts = await offlineSyncManager.getConflicts();
    const cacheSize = await swManager.getCacheSize();
    const swState = swManager.getState();
    
    const diagnostics = {
      network: {
        online: navigator.onLine,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || 'unknown'
      },
      serviceWorker: {
        supported: 'serviceWorker' in navigator,
        state: swState,
        registration: !!swManager.registration
      },
      storage: {
        pendingRequests: pending.length,
        conflicts: conflicts.length,
        cacheSize: cacheSize
      },
      features: {
        backgroundSync: 'sync' in (swManager.registration || {}),
        notifications: 'Notification' in window,
        indexedDB: 'indexedDB' in window
      }
    };
    
    console.log('🔍 Offline Diagnostics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(diagnostics, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return diagnostics;
  }
}

export const offlineTester = new OfflineTester();

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  window.offlineTester = offlineTester;
  console.log('💡 Offline tester available at window.offlineTester');
  console.log('   Try: offlineTester.runAllTests()');
  console.log('   Or:  offlineTester.getDiagnostics()');
}
