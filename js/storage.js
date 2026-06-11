const ImageStorage = (() => {
    const DB_NAME = 'LithoPalletGen';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';
    const THUMB_WIDTH = 150;

    let db = null;

    function open() {
        return new Promise((resolve, reject) => {
            if (db) { resolve(db); return; }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('date', 'date', { unique: false });
                }
            };
            request.onsuccess = (e) => {
                db = e.target.result;
                resolve(db);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function generateThumbnail(blob) {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            img.onload = () => {
                const ratio = THUMB_WIDTH / img.width;
                const height = img.height * ratio;
                const canvas = document.createElement('canvas');
                canvas.width = THUMB_WIDTH;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, THUMB_WIDTH, height);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };
            img.src = url;
        });
    }

    async function add(blob, filename) {
        const database = await open();
        const thumbnail = await generateThumbnail(blob);
        const record = {
            id: generateId(),
            filename: filename || 'image',
            blob: blob,
            thumbnail: thumbnail,
            date: Date.now()
        };
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).add(record);
            tx.oncomplete = () => resolve(record);
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    async function getAll() {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('date');
            const request = index.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function get(id) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function remove(id) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    async function removeMultiple(ids) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            ids.forEach(id => store.delete(id));
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    async function clear() {
        const database = await open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    return { open, add, getAll, get, remove, removeMultiple, clear };
})();
