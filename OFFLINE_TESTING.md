# Offline Functionality Testing Guide

This guide will help you test the offline capabilities of the Upasthit attendance app.

## Features Implemented

### 1. Service Worker
- ✅ Static asset caching
- ✅ API response caching with expiration
- ✅ Background sync for offline requests
- ✅ Cache versioning and cleanup
- ✅ Update detection and notification

### 2. Offline Sync Manager
- ✅ Request queuing when offline
- ✅ Automatic sync when back online
- ✅ Retry logic with exponential backoff
- ✅ Conflict detection and resolution
- ✅ Event-based notifications

### 3. UI Components
- ✅ Network status indicator
- ✅ Sync progress display
- ✅ Conflict resolution interface
- ✅ Pending request counter

## Testing Methods

### Method 1: Using Browser DevTools

1. **Open DevTools** (F12 or Right-click → Inspect)
2. **Go to Network tab**
3. **Enable "Offline" mode** (checkbox at top)
4. **Test offline behavior:**
   - Try to submit attendance
   - Navigate between pages
   - Check that requests are queued

5. **Disable offline mode** to trigger sync
6. **Check Application tab → Service Workers** to see SW status

### Method 2: Using Built-in Test Utility

Open the browser console and run:

```javascript
// Run all tests
await offlineTester.runAllTests()

// Or run individual tests
await offlineTester.testOfflineQueue()
await offlineTester.testSync()
await offlineTester.testCache()
await offlineTester.testConflict()

// Get diagnostics
await offlineTester.getDiagnostics()

// Manual control
offlineTester.goOffline()  // Simulate offline
offlineTester.goOnline()   // Simulate online
offlineTester.reset()      // Reset to actual state
```

### Method 3: Real Network Disconnection

1. **Disconnect from WiFi/Ethernet**
2. **Use the app normally:**
   - Mark attendance
   - View timetables
   - Check announcements
3. **Reconnect to network**
4. **Verify sync happens automatically**

## Test Scenarios

### Scenario 1: Basic Offline Queue
```
1. Go offline (DevTools or disconnect)
2. Try to mark attendance
3. See "Request queued" notification
4. Go back online
5. See "Syncing data..." notification
6. Verify attendance was saved
```

### Scenario 2: Multiple Offline Actions
```
1. Go offline
2. Mark attendance for multiple students
3. Create an announcement
4. Update profile
5. Go online
6. All actions should sync in order
```

### Scenario 3: Conflict Resolution
```
1. Go offline on Device A
2. Mark student as "Present"
3. On Device B (online), mark same student as "Absent"
4. Bring Device A online
5. Conflict dialog should appear
6. Choose which version to keep
```

### Scenario 4: Cache Validation
```
1. Load the app while online
2. Go offline
3. Navigate to previously visited pages
4. Pages should load from cache
5. API data should show cached version
```

### Scenario 5: Background Sync
```
1. Go offline
2. Queue several requests
3. Close the browser tab
4. Go online
5. Reopen the app
6. Requests should sync automatically
```

## Checking Service Worker Status

### In Chrome DevTools:
1. **Application tab → Service Workers**
   - Status should be "activated and running"
   - Check "Update on reload" for development

2. **Application tab → Cache Storage**
   - Should see: upasthit-v1.0.0, upasthit-runtime-v1.0.0, upasthit-api-v1.0.0

3. **Application tab → IndexedDB → UpasthitDB**
   - pendingRequests: Queued offline requests
   - conflicts: Unresolved conflicts

### Console Commands:
```javascript
// Check SW registration
navigator.serviceWorker.getRegistration()

// Check cache size
await swManager.getCacheSize()

// Check pending requests
await offlineSyncManager.getPendingRequests()

// Check conflicts
await offlineSyncManager.getConflicts()

// Clear all caches
await swManager.clearCache()

// Trigger manual sync
await swManager.triggerSync()
```

## Expected Behaviors

### When Going Offline:
- ❌ Red notification: "No internet connection"
- 📋 Requests are queued in IndexedDB
- 💾 Previously loaded pages work from cache
- ⚠️ New API requests show queued message

### When Coming Online:
- ✅ Green notification: "Back online"
- 🔄 Blue notification: "Syncing data..."
- ✅ Green notification: "All data synced"
- 📊 Pending counter decreases to 0

### When Conflicts Occur:
- ⚠️ Yellow notification: "X conflicts need resolution"
- 🔔 Conflict dialog appears
- 👤 User chooses local or server version
- ✅ Conflict resolved and synced

## Troubleshooting

### Service Worker Not Registering
```javascript
// Check if SW is supported
console.log('SW supported:', 'serviceWorker' in navigator)

// Check registration
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Registration:', reg)
})
```

### Requests Not Syncing
```javascript
// Check pending requests
const pending = await offlineSyncManager.getPendingRequests()
console.log('Pending:', pending)

// Manually trigger sync
await offlineSyncManager.syncPendingRequests(api)
```

### Cache Issues
```javascript
// Clear all caches
await swManager.clearCache()

// Unregister SW and reload
await swManager.unregister()
location.reload()
```

### IndexedDB Issues
```javascript
// Clear all offline data
await offlineSyncManager.clearAll()

// Check DB version
indexedDB.databases().then(console.log)
```

## Performance Metrics

Monitor these in DevTools:

1. **Cache Hit Rate**: Application → Cache Storage
2. **Sync Time**: Console logs show sync duration
3. **Queue Size**: Check pending requests count
4. **Network Requests**: Network tab shows cached vs network

## Best Practices for Testing

1. **Always test in incognito mode** to avoid cache pollution
2. **Clear storage between tests** for consistent results
3. **Test on mobile devices** for real-world scenarios
4. **Test with slow 3G** to simulate poor connections
5. **Test with multiple tabs** to verify sync across instances

## Development Tips

### Enable Verbose Logging
The service worker logs all operations. Check the console for:
- `[SW]` prefix for service worker logs
- `[SW Manager]` for manager operations
- Sync results and conflict notifications

### Force Update Service Worker
```javascript
// Skip waiting and activate new SW
await swManager.skipWaiting()
location.reload()
```

### Reset Everything
```javascript
// Complete reset
await swManager.clearCache()
await swManager.unregister()
await offlineSyncManager.clearAll()
localStorage.clear()
sessionStorage.clear()
location.reload()
```

## Production Checklist

Before deploying:
- [ ] Service worker registers successfully
- [ ] Static assets are cached
- [ ] API responses cache with expiration
- [ ] Offline requests queue properly
- [ ] Sync works when back online
- [ ] Conflicts are detected and resolvable
- [ ] Network status shows correctly
- [ ] Background sync is registered
- [ ] Cache cleanup works on updates
- [ ] No console errors in offline mode

## Support

If you encounter issues:
1. Check browser console for errors
2. Run diagnostics: `offlineTester.getDiagnostics()`
3. Check service worker status in DevTools
4. Verify IndexedDB has correct stores
5. Test in different browsers (Chrome, Firefox, Safari)
