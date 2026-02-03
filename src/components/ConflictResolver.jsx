import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { offlineSyncManager } from '../utils/offlineSync';
import api from '../utils/api';

const ConflictResolver = () => {
  const [conflicts, setConflicts] = useState([]);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadConflicts();

    const unsubscribe = offlineSyncManager.addListener((event) => {
      if (event.type === 'CONFLICT_DETECTED') {
        loadConflicts();
      }
    });

    return unsubscribe;
  }, []);

  const loadConflicts = async () => {
    try {
      const conflictList = await offlineSyncManager.getConflicts();
      setConflicts(conflictList);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const handleResolve = async (conflictId, resolution) => {
    setResolving(true);
    try {
      await offlineSyncManager.resolveConflict(conflictId, resolution, api);
      await loadConflicts();
      setSelectedConflict(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    } finally {
      setResolving(false);
    }
  };

  if (conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-yellow-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-bold">Data Conflicts Detected</h2>
          </div>
          <span className="bg-white text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold">
            {conflicts.length}
          </span>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!selectedConflict ? (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                The following changes were made offline and conflict with server data. 
                Please review and choose which version to keep.
              </p>
              
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-yellow-400 cursor-pointer transition"
                  onClick={() => setSelectedConflict(conflict)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {conflict.method} {conflict.url}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(conflict.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button className="text-yellow-600 hover:text-yellow-700 font-medium text-sm">
                      Resolve →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedConflict(null)}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                ← Back to list
              </button>

              <div>
                <h3 className="font-semibold text-lg mb-2">Conflict Details</h3>
                <p className="text-sm text-gray-600">
                  {selectedConflict.method} {selectedConflict.url}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedConflict.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2">Your Changes (Local)</h4>
                  <pre className="text-xs bg-blue-50 p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(selectedConflict.localData, null, 2)}
                  </pre>
                  <button
                    onClick={() => handleResolve(selectedConflict.id, 'local')}
                    disabled={resolving}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving ? 'Resolving...' : 'Keep My Changes'}
                  </button>
                </div>

                <div className="border-2 border-green-300 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-2">Server Version</h4>
                  <pre className="text-xs bg-green-50 p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(selectedConflict.serverData, null, 2)}
                  </pre>
                  <button
                    onClick={() => handleResolve(selectedConflict.id, 'server')}
                    disabled={resolving}
                    className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving ? 'Resolving...' : 'Keep Server Version'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictResolver;
