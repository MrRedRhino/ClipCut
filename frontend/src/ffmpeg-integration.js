import {FFmpeg} from "@ffmpeg/ffmpeg";
import {toBlobURL} from "@ffmpeg/util";

const ffmpeg = new FFmpeg();
let loaded;

async function loadFfmpeg() {
    if (loaded === undefined) {
        loaded = new Promise(async resolve => {
            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
            ffmpeg.on("log", ({message}) => {
                console.log(message);
            });
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            resolve();
        });
    }

    await loaded;
}

export async function trim(file, startSeconds, endSeconds) {
    await loadFfmpeg();

    const outFile = `trimmed-${file.name}`;
    await ffmpeg.writeFile(file.name, new Uint8Array(await file.arrayBuffer()));
    await ffmpeg.exec(["-i", file.name, "-c", "copy", "-ss", `${startSeconds}`, "-t", `${endSeconds - startSeconds}`, outFile]);
    const output = await ffmpeg.readFile(outFile);

    await ffmpeg.deleteFile(file.name);
    await ffmpeg.deleteFile(outFile);

    return output;
}

export class compress {
}