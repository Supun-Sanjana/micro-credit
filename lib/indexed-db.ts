import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type OfflineSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface PendingRepaymentRecord {
  id: string; // clientTransactionId (uuid)
  loanId: string;
  scheduleId?: string;
  amount: number;
  method?: string;
  notes?: string;
  collectedAt: string;
  centreId: string;
  memberId?: string;
  memberName?: string;
  centreName?: string;
  synced: boolean;
  status: OfflineSyncStatus;
  retryCount?: number;
  syncError?: string;
  lastAttemptAt?: string;
}

interface SolidaDB extends DBSchema {
  pendingRepayments: {
    key: string; // uuid
    value: PendingRepaymentRecord;
    indexes: {
      'by-centre': string;
      'by-status': string;
    };
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
    dbPromise = openDB<SolidaDB>('solida-offline-db', 2, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        let repaymentStore: any;
        if (oldVersion < 1) {
          repaymentStore = db.createObjectStore('pendingRepayments', { keyPath: 'id' });
          repaymentStore.createIndex('by-centre', 'centreId');
          db.createObjectStore('cachedCollectionSheets', { keyPath: 'centreId' });
        } else {
          repaymentStore = transaction.objectStore('pendingRepayments');
        }

        if (oldVersion < 2 && repaymentStore) {
          if (!repaymentStore.indexNames.contains('by-status')) {
            repaymentStore.createIndex('by-status', 'status');
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function saveRepaymentOffline(data: {
  id: string;
  loanId: string;
  scheduleId?: string;
  amount: number;
  method?: string;
  notes?: string;
  centreId: string;
  memberId?: string;
  memberName?: string;
  centreName?: string;
}) {
  const db = await getDB();
  if (!db) return;
  const record: PendingRepaymentRecord = {
    ...data,
    collectedAt: new Date().toISOString(),
    synced: false,
    status: 'PENDING',
    retryCount: 0,
  };
  await db.put('pendingRepayments', record);
}

/**
 * Returns all repayments that are either PENDING or FAILED (not yet synced).
 */
export async function getPendingRepayments(): Promise<PendingRepaymentRecord[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('pendingRepayments');
  return all
    .filter((r) => !r.synced && r.status !== 'SYNCED')
    .map((r) => ({
      ...r,
      status: r.status || (r.syncError ? 'FAILED' : 'PENDING'),
    }));
}

/**
 * Returns all offline repayments regardless of status (for queue overview).
 */
export async function getAllOfflineRepayments(): Promise<PendingRepaymentRecord[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('pendingRepayments');
  return all.map((r) => ({
    ...r,
    status: r.status || (r.synced ? 'SYNCED' : r.syncError ? 'FAILED' : 'PENDING'),
  }));
}

/**
 * Returns only repayments that failed during a previous sync attempt.
 */
export async function getFailedRepayments(): Promise<PendingRepaymentRecord[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('pendingRepayments');
  return all.filter((r) => !r.synced && (r.status === 'FAILED' || Boolean(r.syncError)));
}

/**
 * Marks an offline repayment as successfully synced.
 */
export async function markRepaymentSynced(id: string) {
  const db = await getDB();
  if (!db) return;
  const record = await db.get('pendingRepayments', id);
  if (record) {
    await db.put('pendingRepayments', {
      ...record,
      synced: true,
      status: 'SYNCED',
      syncError: undefined,
      lastAttemptAt: new Date().toISOString(),
    });
  }
}

/**
 * Marks an offline repayment as failed, recording the error message and incrementing retry count.
 */
export async function markRepaymentFailed(id: string, errorMessage: string) {
  const db = await getDB();
  if (!db) return;
  const record = await db.get('pendingRepayments', id);
  if (record) {
    await db.put('pendingRepayments', {
      ...record,
      synced: false,
      status: 'FAILED',
      syncError: errorMessage,
      retryCount: (record.retryCount || 0) + 1,
      lastAttemptAt: new Date().toISOString(),
    });
  }
}

/**
 * Resets a failed repayment back to PENDING so it can be retried.
 */
export async function retryFailedRepayment(id: string) {
  const db = await getDB();
  if (!db) return;
  const record = await db.get('pendingRepayments', id);
  if (record) {
    await db.put('pendingRepayments', {
      ...record,
      status: 'PENDING',
      syncError: undefined,
    });
  }
}

/**
 * Removes a specific repayment from IndexedDB by id.
 */
export async function removePendingRepayment(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete('pendingRepayments', id);
}

/**
 * Clears all repayments that have already been marked as SYNCED.
 */
export async function clearSyncedRepayments() {
  const db = await getDB();
  if (!db) return;
  const all = await db.getAll('pendingRepayments');
  for (const record of all) {
    if (record.synced || record.status === 'SYNCED') {
      await db.delete('pendingRepayments', record.id);
    }
  }
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

export async function getAllCachedCollectionSheets() {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('cachedCollectionSheets');
  return all.filter((item) => item.centreId !== '__centres_list__');
}

export async function cacheCentresList(centres: any[]) {
  const db = await getDB();
  if (!db) return;
  await db.put('cachedCollectionSheets', {
    centreId: '__centres_list__',
    updatedAt: new Date().toISOString(),
    data: centres,
  });
}

export async function getCachedCentresList(): Promise<any[] | null> {
  const db = await getDB();
  if (!db) return null;
  const entry = await db.get('cachedCollectionSheets', '__centres_list__');
  return entry?.data || null;
}

