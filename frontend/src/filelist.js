import {reactive, ref} from "vue";
import {db, getDirHandle, saveDirHandle} from "@/db.js";
import {getSize} from "@/main.js";
import {generateThumbnail} from "@/thumbnails.js";

export const files = ref([]);
export const thumbnails = reactive({});
export const dirSize = ref(null);
const videoFileExtensions = ["mp4", "mov", "avi", "wmv", "mkv", "flv", "webm"];
let observer;

export async function open() {
    const handle = await window.showDirectoryPicker({mode: "read", id: "clips"});
    await saveDirHandle(handle);

    await readFiles(handle);
}

async function readFiles(dirHandle) {
    const newFiles = [];
    for await (const fileHandle of dirHandle.values()) {
        if (!isVideoFile(fileHandle.name)) continue;
        fileHandle.file = await fileHandle.getFile();
        fileHandle.directory = dirHandle;
        getOrCreateThumbnail(fileHandle.file).then(thumbnail => {
            thumbnails[fileHandle.name] = URL.createObjectURL(thumbnail);
        });

        newFiles.push(fileHandle);
    }
    files.value = newFiles.toSorted((a, b) => {
        const c = a.file.lastModified;
        const d = b.file.lastModified;
        if (c === d) return 0;
        return c > d ? 1 : -1;
    });

    observer?.disconnect();
    observer = new FileSystemObserver(async records => {
        records.forEach(record => {
            if (record.type === "moved") {
                const oldName = record.relativePathMovedFrom[0];
                const newName = record.changedHandle.name;
                const store = db.transaction(["thumbnails"], "readwrite").objectStore("thumbnails");
                store.get(oldName).onsuccess = event => {
                    store.delete(oldName);
                    store.add(event.target.result, newName);
                };
            }
        });
        await readFiles(dirHandle);
    });
    observer.observe(dirHandle);

    getSize(dirHandle).then(size => {
        dirSize.value = size;
    });
}

function getOrCreateThumbnail(file) {
    return new Promise(resolve => {
        db.transaction(["thumbnails"], "readonly")
            .objectStore("thumbnails")
            .get(file.name)
            .onsuccess = async event => {
            if (event.target.result !== undefined) {
                resolve(event.target.result);
            } else {
                resolve(await overwriteThumbnail(file.name, URL.createObjectURL(file)));
            }
        }
    });
}

export async function overwriteThumbnail(fileName, fileUrl, time = 1.5) {
    return new Promise(async resolve => {
        const thumbnail = await generateThumbnail(fileUrl, 480, 270, time);
        db.transaction(["thumbnails"], "readwrite")
            .objectStore("thumbnails")
            .put(thumbnail, fileName);
        resolve(thumbnail);
    });
}

getDirHandle().then(handle => {
    if (handle) readFiles(handle).then();
});

function isVideoFile(fileName) {
    const split = fileName.split(".");
    const extension = split[split.length - 1];
    return videoFileExtensions.includes(extension.toLowerCase());
}

export function getReadableFileSizeString(fileSizeInBytes) {
    let i = -1;
    const byteUnits = [' KB', ' MB', ' GB', ' TB'];
    do {
        fileSizeInBytes /= 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}

function copyFileData(oldName, newName, removeOld) {
    const store = db.transaction(["thumbnails"], "readwrite").objectStore("thumbnails");
    store.get(oldName).onsuccess = event => {
        if (removeOld) store.delete(oldName);
        store.add(event.target.result, newName);
    };

    const editDataStore = db.transaction(["editData"], "readwrite").objectStore("editData");
    editDataStore.get(oldName).onsuccess = event => {
        if (removeOld) editDataStore.delete(oldName);
        editDataStore.add(event.target.result, newName);
    };
}

export async function renameFile(dir, oldHandle, newName, removeOld) {
    const handle = await dir.getFileHandle(newName, {create: true});

    const writable = await handle.createWritable();
    await writable.write(await oldHandle.getFile());
    await writable.close();

    if (removeOld) await oldHandle.remove();
    copyFileData(oldHandle.name, newName, removeOld);
}
