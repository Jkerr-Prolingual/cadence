const DB_NAME = 'cadence';
const DB_VERSION = 3;

const STORES = {
  srsCards: { keyPath: 'word' },
  reviewLog: { keyPath: 'id', autoIncrement: true },
  translationCache: { keyPath: 'word' },
  enDefinitions: { keyPath: 'word' },
  texts: { keyPath: 'id' },
  curatedTexts: { keyPath: 'id' },
  encounters: { keyPath: 'id', autoIncrement: true },
  flagEvents: { keyPath: 'id', autoIncrement: true },
  readingSessions: { keyPath: 'id', autoIncrement: true },
  recordings: { keyPath: 'id', autoIncrement: true },
  fluencySessions: { keyPath: 'id', autoIncrement: true },
  sets: { keyPath: 'id', autoIncrement: true },
  cards: { keyPath: 'id', autoIncrement: true },
  studentRecordings: { keyPath: 'textId' },
  classes: { keyPath: 'id' },
  assignments: { keyPath: 'id' },
  assignmentProgress: { keyPath: 'id' },
};

let dbPromise = null;

export function getDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      for (const [name, opts] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, opts);
          if (name === 'srsCards') {
            store.createIndex('nextReviewDate', 'nextReviewDate');
          }
          if (name === 'encounters') {
            store.createIndex('headword', 'headword');
            store.createIndex('sessionId', 'sessionId');
          }
          if (name === 'flagEvents') {
            store.createIndex('headword', 'headword');
            store.createIndex('sessionId', 'sessionId');
            store.createIndex('source', 'source');
          }
          if (name === 'readingSessions') {
            store.createIndex('textId', 'textId');
          }
          if (name === 'cards') {
            store.createIndex('setId', 'setId');
          }
          if (name === 'assignments') {
            store.createIndex('classId', 'classId');
          }
          if (name === 'assignmentProgress') {
            store.createIndex('assignmentId', 'assignmentId');
            store.createIndex('studentId', 'studentId');
          }
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function dbGet(storeName, key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(storeName, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetAll(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(storeName, key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbAdd(storeName, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).add(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetByIndex(storeName, indexName, key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const idx = tx.objectStore(storeName).index(indexName);
    const req = idx.getAll(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
