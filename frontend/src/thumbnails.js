export function drawTimelinePreviews(videoUrl, canvas) {
    const ctx = canvas.getContext("2d");
    const video = document.createElement("video");
    video.src = videoUrl;

    video.addEventListener("loadedmetadata", () => {
        const aspect = video.videoWidth / video.videoHeight;
        const imgWidth = aspect * canvas.height;
        const nImages = Math.ceil(canvas.width / imgWidth);
        const durationPerImage = imgWidth / canvas.width * video.duration;

        let i = 0;
        video.onseeked = () => {
            ctx.drawImage(video, i * imgWidth, 0, imgWidth, canvas.height);
            if (i++ < nImages) {
                video.currentTime = durationPerImage * i;
            } else {
                video.remove();
            }
        }
        video.currentTime = 2;
    });
}

export async function generateThumbnail(videoUrl, width, height, time) {
    return new Promise(resolve => {
        const video = document.createElement("video");
        video.src = videoUrl;
        video.currentTime = time;

        video.addEventListener("seeked", () => {
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext("2d");

            ctx.drawImage(video, 0, 0, width, height);

            canvas.convertToBlob({type: "image/webp"})
                .then(blob => resolve(blob));
        });
    });
}

export function drawTimeline(videoDuration, canvas) {
    const ctx = canvas.getContext("2d");
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "12px " + window.getComputedStyle(canvas).fontFamily;

    const pxPerSecond = canvas.offsetWidth / videoDuration;
    for (let i = 0; i < videoDuration; i++) {
        const big = i % 15 === 0;
        ctx.fillStyle = big ? "white" : "gray";
        ctx.fillRect(i * pxPerSecond, 0, big ? 1 : 0.5, big ? 18 : 4);
        if (big) {
            ctx.fillText(formatSeconds(i), i * pxPerSecond + 4, 15);
        }
    }
}

function formatSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secondsLeft = seconds % 60;
    return `${minutes}:${secondsLeft.toString().padStart(2, "0")}`;
}
