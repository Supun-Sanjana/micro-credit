import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SolidaDB extends DBSchema {
  pendingRepayments: {
    key: string; // uuid
    value: {
      id: string;
      loanId: string;
      amount: number;
      collectedAt: string;
      centreId: string;
      memberId: string;
      synced: boolean;
    };
    indexes: { 'by-centre': string };
  };
  cachedCollectionSheets: {
    key: string; // centreId
    value: {
      centreId: string;
      updatedAt: string;
      data: any;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<SolidaDB>> | null = null;

export function getDB() {
  if (typeof window === 'undefined') return null; // Only run on client
  if (!dbPromise) {
    dbPromise = openDB<SolidaDB>('solida-offline-db', 1, {
      upgrade(db) {
        const repaymentStore = db.createObjectStore('pendingRepayments', { keyPath: 'id' });
        repaymentStore.createIndex('by-centre', 'centreId');
        
        db.createObjectStore('cachedCollectionSheets', { keyPath: 'centreId' });
      },
    });
  }
  return dbPromise;
}

export async function saveRepaymentOffline(data: { id: string; loanId: string; amount: number; centreId: string; memberId: string }) {
  const db = await getDB();
  if (!db) return;
  await db.put('pendingRepayments', {
    ...data,
    collectedAt: new Date().toISOString(),
    synced: false
  });
}

export async function getPendingRepayments() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('pendingRepayments');
}

export async function removePendingRepayment(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete('pendingRepayments', id);
}

export async function cacheCollectionSheet(centreId: string, data: any) {
  const db = await getDB();
  if (!db) return;
  await db.put('cachedCollectionSheets', {
    centreId,
    updatedAt: new Date().toISOString(),
    data
  });
}

export async function getCachedCollectionSheet(centreId: string) {
  const db = await getDB();
  if (!db) return null;
  return db.get('cachedCollectionSheets', centreId);
}
