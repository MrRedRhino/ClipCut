import {reactive} from "vue";

export const tasks = reactive([]);

export async function upload(file, progressCallback) {
    const uploadDataResponse = await fetch("/api/upload-url");
    const uploadData = await uploadDataResponse.json();

    const xhr = new XMLHttpRequest();
    await new Promise(resolve => {
        xhr.upload.addEventListener("progress", (event) => {
            console.log(event);
            if (event.lengthComputable) {
                progressCallback(event.loaded / event.total);
            } else {
                progressCallback(-1);
            }
        });
        xhr.addEventListener("loadend", () => {
            resolve(uploadData.fileId);
        });
        xhr.open("PUT", uploadData.url, true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.send(file);
    });
}

export async function compressUploadedFile(fileId) {
    await new Promise(resolve => {
        setTimeout(resolve, 2000);
    });
}

export function createTask(title) {
    tasks.push({
        title: title,
        progress: -1,
        done: false
    });
    return tasks[tasks.length - 1];
}
