export const db = await openDB();

function openDB() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open("ClipCut", 1);
        request.onerror = e => reject(e);

        request.onupgradeneeded = e => {
            const db = e.target.result;
            db.createObjectStore("directoryHandles");
            db.createObjectStore("thumbnails");
            db.createObjectStore("editData");
        }

        request.onsuccess = (event) => {
            const newDB = event.target.result;
            newDB.onerror = event => console.error(event);
            resolve(newDB);
        };
    });
}

export function saveDirHandle(handle) {
    return new Promise(resolve => {
        db.transaction(["directoryHandles"], "readwrite")
            .objectStore("directoryHandles")
            .put(handle, "clips")
            .onsuccess = event => resolve(event.target.result);
    });
}

export function getDirHandle() {
    return new Promise(resolve => {
        db.transaction(["directoryHandles"], "readonly")
            .objectStore("directoryHandles")
            .get("clips")
            .onsuccess = event => resolve(event.target.result);
    });
}
