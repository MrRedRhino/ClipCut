import {reactive} from "vue";

export const tasks = reactive([]);

export async function upload(file, progressCallback) {
    const uploadDataResponse = await fetch("/api/upload-url");
    const uploadData = await uploadDataResponse.json();

    const xhr = new XMLHttpRequest();
    return new Promise(resolve => {
        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
                progressCallback(event.loaded / event.total);
            } else {
                progressCallback(-1);
            }
        });
        xhr.addEventListener("loadend", () => {
            resolve({fileId: uploadData.fileId, downloadUrl: uploadData.downloadUrl});
        });
        xhr.open("PUT", uploadData.url, true);
        xhr.setRequestHeader("Content-Type", "video/mp4");
        xhr.send(file);
    });
}

export async function compressUploadedFile(fileId, bitrate) {
    const jobResponse = await fetch("/api/compress/" + fileId, {
        method: "POST",
        body: JSON.stringify({
            bitrate: Math.floor(bitrate)
        })
    });
    const jobName = (await jobResponse.json()).job;

    return new Promise(resolve => {
        const interval = setInterval(async () => {
            const statusResponse = await fetch("/api/status?job=" + jobName);
            const status = await statusResponse.json();
            if (status.done) {
                clearInterval(interval);
                resolve(status.url);
            }
        }, 2000);
    });
}

export function createTask(title) {
    tasks.push({
        title: title,
        progress: -1,
        url: null
    });
    return tasks[tasks.length - 1];
}
