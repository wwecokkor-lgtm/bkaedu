// This utility simulates a Local Server File System using IndexedDB.
// It allows the app to store large binary files directly in the browser,
// mimicking a robust backend storage solution.

const DB_NAME = 'BKAcademy_FileSystem';
const STORE_NAME = 'files';
const DB_VERSION = 1;

// 200GB Capacity Simulation (Browser limits apply, but logic mimics server limits)
const MAX_CAPACITY_BYTES = 200 * 1024 * 1024 * 1024; 

interface StoredFile {
  path: string; // Unique Key
  blob: Blob;
  createdAt: number;
}

// Open DB Connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
};

export const mediaStorage = {
  // Save a file (blob) to "Disk"
  save: async (path: string, blob: Blob): Promise<string> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const fileData: StoredFile = {
        path,
        blob,
        createdAt: Date.now()
      };

      const request = store.put(fileData);

      request.onsuccess = () => {
        // Create a local URL for immediate display
        resolve(URL.createObjectURL(blob));
      };
      request.onerror = () => reject(request.error);
    });
  },

  // Get a file URL from "Disk"
  get: async (path: string): Promise<string | null> => {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(path);

      request.onsuccess = () => {
        const result = request.result as StoredFile;
        if (result && result.blob) {
          resolve(URL.createObjectURL(result.blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  },

  // Delete a file from "Disk"
  delete: async (path: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(path);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Calculate Storage Usage
  getStats: async (): Promise<{ used: number; count: number }> => {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      let used = 0;
      let count = 0;

      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const file = cursor.value as StoredFile;
          used += file.blob.size;
          count++;
          cursor.continue();
        } else {
          resolve({ used, count });
        }
      };
    });
  },
  
  maxCapacity: MAX_CAPACITY_BYTES
};