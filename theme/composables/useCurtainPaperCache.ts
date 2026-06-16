// IndexedDB-backed persistent cache for the opening curtain's xuan-paper
// texture (the ×3 gold-fleck "洒金" surface shown on the closed curtain).
//
// Why a dedicated IndexedDB store instead of reusing the localStorage path
// that backs the page background (see useXuanPaperTexture):
//   - The curtain paper carries ×3 gold-fleck density and is the heaviest
//     texture of the set (~2-3MB as a dataURL). localStorage's ~5MB origin
//     quota cannot hold it alongside the page paper without one evicting the
//     other (saveToLocalStorage purges same-prefix entries on quota errors),
//     which would break the page paper's "instant on refresh" bootstrap.
//   - IndexedDB has a far larger quota and is physically isolated from the
//     localStorage budget, so caching the curtain paper here never competes
//     with the page paper — and the curtain keeps its full resolution and
//     gold density, with no shrink-to-fit visual compromise.
//
// Values are stored as dataURL strings (not Blobs / blob URLs): the consumer
// (App.vue setCurtainPaperUrl) feeds them straight into background-image, and
// dataURLs carry no revoke lifecycle — sidestepping the blob-URL pitfalls that
// bite the shared LRU paths elsewhere. Every operation degrades silently to a
// cache miss when IndexedDB is unavailable (SSR, private mode), so the caller
// transparently falls back to worker generation — i.e. the previous behaviour.

const DB_NAME = 'shuimo-curtain-paper'
const STORE = 'paper'
const DB_VERSION = 1

function canUseIDB(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function openDB(): Promise<IDBDatabase | null> {
  if (!canUseIDB())
    return Promise.resolve(null)
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION)
    }
    catch {
      resolve(null)
      return
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE))
        db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
    // Private-mode browsers can block open() indefinitely; treat as a miss.
    req.onblocked = () => resolve(null)
  })
}

export async function getCurtainPaper(key: string): Promise<string | null> {
  const db = await openDB()
  if (!db)
    return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => {
        const v = req.result
        resolve(typeof v === 'string' && v.startsWith('data:image/') ? v : null)
      }
      req.onerror = () => resolve(null)
      tx.oncomplete = () => db.close()
    }
    catch {
      db.close()
      resolve(null)
    }
  })
}

export async function putCurtainPaper(key: string, dataUrl: string): Promise<void> {
  const db = await openDB()
  if (!db)
    return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(dataUrl, key)
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      // Quota exceeded / abort: just resolve — the curtain still rendered from
      // the in-memory dataURL this session, only the cross-session cache misses.
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    }
    catch {
      db.close()
      resolve()
    }
  })
}
