import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { offlineSyncManager } from '../utils/offlineSync';
import { swManager } from '../utils/swManager';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowStatus(true);
      
      // Trigger sync when coming back online
      try {
        await swManager.triggerSync();
        setSyncStatus('syncing');
      } catch (error) {
        console.error('Failed to trigger sync:', error);
      }
      
      setTimeout(() => {
        if (!syncStatus) {
          setShowStatus(false);
        }
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      setSyncStatus(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to offline sync events
    const unsubscribeSync = offlineSyncManager.addListener((event) => {
      switch (event.type) {
        case 'REQUEST_QUEUED':
          setPendingCount(prev => prev + event.count);
          setShowStatus(true);
          setTimeout(() => setShowStatus(false), 3000);
          break;
          
        case 'SYNC_COMPLETE':
          setSyncStatus('complete');
          setPendingCount(0);
          setShowStatus(true);
          setTimeout(() => {
            setSyncStatus(null);
            setShowStatus(false);
          }, 3000);
          break;
          
        case 'CONFLICT_DETECTED':
          setConflicts(prev => [...prev, event.conflict]);
          setShowStatus(true);
          break;
      }
    });

    // Listen to service worker events
    const unsubscribeSW = swManager.addListener((event) => {
      if (event.type === 'SYNC_COMPLETE') {
        setSyncStatus('complete');
        if (event.results.conflicts > 0) {
          loadConflicts();
        }
      }
    });

    // Load initial pending count and conflicts
    loadPendingCount();
    loadConflicts();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
      unsubscribeSW();
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const requests = await offlineSyncManager.getPendingRequests();
      setPendingCount(requests.length);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  const loadConflicts = async () => {
    try {
      const conflictList = await offlineSyncManager.getConflicts();
      setConflicts(conflictList);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  if (!showStatus && pendingCount === 0 && conflicts.length === 0) return null;

  const getStatusConfig = () => {
    if (conflicts.length > 0) {
      return {
        bg: 'bg-yellow-500',
        icon: <AlertTriangle size={18} />,
        text: `${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''} need resolution`
      };
    }
    
    if (!isOnline) {
      return {
        bg: 'bg-red-500',
        icon: <WifiOff size={18} />,
        text: pendingCount > 0 
          ? `Offline - ${pendingCount} pending` 
          : 'No internet connection'
      };
    }
    
    if (syncStatus === 'syncing') {
      return {
        bg: 'bg-blue-500',
        icon: <RefreshCw size={18} className="animate-spin" />,
        text: 'Syncing data...'
      };
    }
    
    if (syncStatus === 'complete') {
      return {
        bg: 'bg-green-500',
        icon: <Wifi size={18} />,
        text: 'All data synced'
      };
    }
    
    return {
      bg: 'bg-green-500',
      icon: <Wifi size={18} />,
      text: 'Back online'
    };
  };

  const config = getStatusConfig();

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all ${config.bg} text-white`}>
      {config.icon}
      <span className="text-sm font-medium">
        {config.text}
      </span>
    </div>
  );
};

export default NetworkStatus;
