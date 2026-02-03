import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { swManager } from './utils/swManager'

// Register Service Worker with enhanced management
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await swManager.register();
      
      // Listen for service worker events
      swManager.addListener((event) => {
        switch (event.type) {
          case 'UPDATE_AVAILABLE':
            console.log('🔄 App update available');
            // You can show a notification to the user here
            break;
          case 'SYNC_COMPLETE':
            console.log('✅ Offline data synced:', event.results);
            break;
          case 'CONFLICT_DETECTED':
            console.warn('⚠️ Data conflict detected:', event.conflict);
            break;
        }
      });
    } catch (error) {
      console.error('Service Worker setup failed:', error);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
