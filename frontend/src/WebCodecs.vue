<script setup>
import {MP4Box, DataStream} from "mp4box/dist/mp4box.all.js";
import {ref} from "vue";

const canvas = ref();
let ctx;

function description(file, track) {
  const trak = file.getTrackById(track.id);
  for (const entry of trak.mdia.minf.stbl.stsd.entries) {
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    if (box) {
      const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
      box.write(stream);
      return new Uint8Array(stream.buffer, 8);  // Remove the box header.
    }
  }
  throw new Error("avcC, hvcC, vpcC, or av1C box not found");
}

async function start() {
  ctx = canvas.value.getContext("2d");

  const [handle] = await window.showOpenFilePicker();
  const file = await handle.getFile();
  const fileContent = await file.arrayBuffer();

  const decoder = new VideoDecoder({
    output(frame) {
      canvas.value.width = frame.displayWidth;
      canvas.value.height = frame.displayHeight;
      ctx.drawImage(frame, 0, 0, frame.displayWidth, frame.displayHeight);
      frame.close();
    },
    error(code) {
      console.log(code);
    }
  });

  const mp4File = MP4Box.createFile();
  mp4File.onReady = info => {
    const track = info.videoTracks[0];

    decoder.configure({
      // Browser doesn't support parsing full vp8 codec (eg: `vp08.00.41.08`),
      // they only support `vp8`.
      codec: track.codec.startsWith('vp08') ? 'vp8' : track.codec,
      codedHeight: track.video.height,
      codedWidth: track.video.width,
      description: description(mp4File, track),
    });

    mp4File.setExtractionOptions(track.id);
    mp4File.start();
  }
  mp4File.onSamples = (trackId, ref, samples) => {
    for (const sample of samples) {
      decoder.decode(new EncodedVideoChunk({
        type: sample.is_sync ? "key" : "delta",
        timestamp: 1e6 * sample.cts / sample.timescale,
        duration: 1e6 * sample.duration / sample.timescale,
        data: sample.data
      }));
    }
  };

  fileContent.fileStart = 0;
  mp4File.appendBuffer(fileContent);
}
</script>

<template>
  <canvas ref="canvas"/>
  <button @click="start">Start</button>
</template>

<style scoped>

</style>