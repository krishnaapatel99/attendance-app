import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdatePrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-w-sm">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${needRefresh ? 'bg-blue-100' : 'bg-green-100'}`}>
              <RefreshCw size={20} className={needRefresh ? 'text-blue-600' : 'text-green-600'} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {needRefresh ? 'Update Available' : 'App Ready'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {needRefresh 
                  ? 'New version available. Reload to update.' 
                  : 'App is ready to work offline'}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reload Now
          </button>
        )}
        
        {offlineReady && (
          <button
            onClick={close}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
