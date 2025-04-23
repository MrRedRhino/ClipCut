<script setup>
import {drawTimeline, drawTimelinePreviews} from "@/thumbnails.js";
import {computed, nextTick, onMounted, onUnmounted, ref} from "vue";
import Draggable from "@/components/Draggable.vue";
import {ButtonGroup, useConfirm, useDialog} from "primevue";
import {db} from "@/db.js";
import {trim} from "@/ffmpeg-integration.js";
import {overwriteThumbnail, thumbnails} from "@/filelist.js";
import {useRouter} from "vue-router";
import RenameDialog from "@/components/RenameDialog.vue";
import ShareDialog from "@/components/ShareDialog.vue";
import TaskList from "@/components/TaskList.vue";

const confirm = useConfirm();
const dialog = useDialog();
const router = useRouter();

const renameVisible = ref(false);
const duplicatedVisible = ref(false);
const popover = ref();

const props = defineProps({
  file: {
    required: true,
    type: File
  },
  handle: {
    required: true,
    type: FileSystemFileHandle
  },
  dir: {
    required: true,
    type: FileSystemDirectoryHandle
  }
});

const menuItems = [
  {
    label: "File",
    items: [
      {label: "Rename", command: () => renameVisible.value = true},
      {label: "Duplicate", command: () => duplicatedVisible.value = true},
      {label: "Delete", command: confirmDelete}
    ]
  },
  {
    label: "Trim",
    items: [
      {label: "Replace Original", command: confirmReplace},
      {label: "Save Copy"},
    ]
  },
  {
    label: "Share",
    items: [
      {label: "Share Original", command: () => openShareDialog()},
      {label: "Share Trimmed", command: () => openShareDialog(startTime.value, endTime.value)},
    ]
  }
];

const url = ref(URL.createObjectURL(props.file));
let mounted = false;
let thumbnailUpdateTask = null;
let showHours = false;
let startedAfterEnd = false;
const startTime = ref();
const endTime = ref();
const startPos = computed({
  get: () => (startTime.value / videoDuration.value) * (timelineWidth.value) || 0,
  set: v => startTime.value = (v * videoDuration.value) / timelineWidth.value
});
const endPos = computed({
  get: () => (endTime.value / videoDuration.value) * (timelineWidth.value) || 0,
  set: v => endTime.value = (v * videoDuration.value) / timelineWidth.value
});
const playHead = ref();
const playHeadPos = ref();
const video = ref();
const thumbnailsCanvas = ref();
const timelineWrapper = ref();
const timelineThumbnails = ref();
const timelineWidth = ref(0);
const videoDuration = ref();
const timeline = ref();

onMounted(() => {
  mounted = true;
  rerenderCanvas();
  updatePlayHead();

  window.addEventListener("resize", rerenderCanvas);
  window.addEventListener("beforeunload", saveEditData);
  video.value.addEventListener("pause", onVideoPaused);
  video.value.addEventListener("play", onVideoPlayed);
});

onUnmounted(async () => {
  mounted = false;
  window.removeEventListener("resize", rerenderCanvas);
  window.removeEventListener("beforeunload", saveEditData);
  await saveEditData();
});

function onVideoPaused() {
  startedAfterEnd = video.value.currentTime >= endTime.value;
}

function onVideoPlayed() {
  startedAfterEnd = video.value.currentTime >= endTime.value;
}

function rerenderCanvas() {
  timeline.value.style.minWidth = (videoDuration.value * 6 - 5) + "px";

  timelineWidth.value = timeline.value.offsetWidth;
  setCanvasSize(thumbnailsCanvas.value, timelineWidth.value, 100);
  setCanvasSize(timelineThumbnails.value, timelineWidth.value, 18);

  drawTimeline(videoDuration.value, timelineThumbnails.value);

  clearTimeout(thumbnailUpdateTask);
  thumbnailUpdateTask = setTimeout(() => {
    drawTimelinePreviews(url.value, thumbnailsCanvas.value);
  }, 100);
}

// FFDF63
let lastPlayHeadPos;

function updatePlayHead() {
  if (!mounted) return;
  if (playHead.value.dragging) {
    if (playHeadPos.value !== lastPlayHeadPos) {
      video.value.currentTime = (playHeadPos.value * videoDuration.value) / timelineWidth.value;
    }
    lastPlayHeadPos = playHeadPos.value;
  } else {
    if (video.value.currentTime >= endTime.value && !startedAfterEnd) {
      video.value.pause();
    }
    playHeadPos.value = video.value.currentTime * timelineWidth.value / videoDuration.value;
  }

  if (playHead.value.dragging || !video.value.paused) {
    const toScrollRight = playHeadPos.value - timelineWrapper.value.scrollLeft + 20 - timelineWrapper.value.offsetWidth;
    if (toScrollRight > 0) {
      timelineWrapper.value.scrollLeft += toScrollRight;
    }
    const toScrollLeft = playHeadPos.value - timelineWrapper.value.scrollLeft - 20;
    if (toScrollLeft < 0) {
      timelineWrapper.value.scrollLeft += toScrollLeft;
    }
  }

  requestAnimationFrame(updatePlayHead);
}

function setCanvasSize(canvas, width, height) {
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}

async function videoLoaded() {
  const editData = await loadEditData();
  videoDuration.value = video.value.duration;
  const duration = videoDuration.value;
  startTime.value = Math.min(editData?.startTime || 0, duration);
  endTime.value = Math.min(editData?.endTime || duration, duration);
  video.value.currentTime = editData?.startTime || 0;

  showHours = videoDuration >= 3600;
  rerenderCanvas();
}

function timelineClicked(e) {
  playHeadPos.value = e.offsetX;
  nextTick(() => playHead.value.startDragging(e));
}

function togglePlaying() {
  video.value.paused ? video.value.play() : video.value.pause();
}

function formatTime(includeHours, duration) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor(duration / 60).toString().padStart(2, "0");
  const seconds = (duration % 60).toFixed(2).toString().padStart(5, "0");
  return includeHours ? `${hours}:` : "" + `${minutes}:${seconds}`;
}

async function saveEditData(updateThumbnail = true) {
  await new Promise(resolve => {
    const newData = {
      startTime: startTime.value,
      endTime: endTime.value,
    };

    db.transaction(["editData"], "readwrite")
        .objectStore("editData")
        .put(newData, props.file.name)
        .onsuccess = () => resolve();
  });

  if (updateThumbnail) {
    const newThumbnail = await overwriteThumbnail(props.file.name, url.value, startTime.value);
    thumbnails[props.file.name] = URL.createObjectURL(newThumbnail);
  }
}

async function loadEditData() {
  return new Promise(resolve => {
    db.transaction(["editData"], "readwrite")
        .objectStore("editData")
        .get(props.file.name)
        .onsuccess = e => resolve(e.target.result);
  });
}

async function saveTrimmed() {
  const outputHandle = await props.dir.getFileHandle(props.file.name, {create: false});
  const output = await trim(props.file, startTime.value, endTime.value);

  const writable = await outputHandle.createWritable({keepExistingData: false});
  await writable.write(output);
  await writable.close();

  startTime.value = 0;
  endTime.value = endTime.value - startTime.value;
  await saveEditData(false);

  const newFile = await outputHandle.getFile();
  url.value = URL.createObjectURL(newFile);
  await overwriteThumbnail(newFile.name, url.value);
}

function confirmDelete() {
  confirm.require({
    message: "Are you sure you want to delete this clip?",
    header: "Delete",
    rejectProps: {
      label: "Cancel",
      severity: "secondary"
    },
    acceptProps: {
      label: "OK"
    },
    accept: async () => {
      await props.handle.remove();
      await router.push("/");
    }
  });
}

function confirmReplace() {
  confirm.require({
    message: "Are you sure you want to trim this clip and replace the original?\nThe uncut version will be lost.",
    header: "Trim and Replace",
    rejectProps: {
      label: "Cancel",
      severity: "secondary"
    },
    acceptProps: {
      label: "OK"
    },
    accept: async () => {
      await saveTrimmed();
    }
  });
}

function openShareDialog(startTime, endTime) {
  dialog.open(ShareDialog, {
        props: {
          header: "Share",
          style: {
            maxWidth: "450px",
            width: "100%",
          },
          contentStyle: {
            height: "260px"
          }
        },
        data: {
          file: props.file,
          start: startTime,
          end: endTime
        }
      }
  );
}
</script>

<template>
  <RenameDialog :file-handle="props.handle" :dir="props.dir" v-model:visible="renameVisible" mode="rename"/>
  <RenameDialog :file-handle="props.handle" :dir="props.dir" v-model:visible="duplicatedVisible" mode="duplicate"/>
  <Popover ref="popover">
    <TaskList/>
  </Popover>

  <div class="w-full h-screen flex flex-col" @keydown.space.prevent="togglePlaying">
    <div class="flex">
      <Button icon="pi pi-chevron-left" text severity="contrast" @click="$router.push('/')"/>
      <Menubar :model="menuItems" breakpoint="0" class="w-full"/>
      <Button icon="pi pi-angle-down" text severity="contrast" @click="popover.toggle($event)"/>
    </div>

    <Splitter class="h-[calc(100%-50px)]" layout="vertical">
      <SplitterPanel class="flex justify-center">
        <video class="max-h-[100%]" ref="video" :src="url" @loadedmetadata="videoLoaded"/>
      </SplitterPanel>
      <SplitterPanel class="pl-4 pr-4" :size="15">
        <div class="flex justify-center items-center p-2">
          <div class="w-full">
            <h2 class="ml-auto w-20">{{ formatTime(showHours, video?.currentTime) }}</h2>
          </div>
          <ButtonGroup>
            <Button text @click="" icon="pi pi-step-backward"/>
            <Button text @click="togglePlaying" :icon="`pi pi-${video?.paused ? 'play' : 'pause'}`"/>
            <Button text @click="" icon="pi pi-step-forward"/>
          </ButtonGroup>
          <div class="w-full"></div>
        </div>
        <div ref="timelineWrapper" class="overflow-x-scroll">
          <div ref="timeline" class="relative w-full border-t border-zinc-600">
            <canvas ref="timelineThumbnails" @pointerdown="timelineClicked" class="cursor-[ew-resize] touch-none"/>
            <div class="relative">
              <div class="absolute w-5 h-full border-2 border-[#ffdf63] rounded-lg"
                   :style="{left: startPos + 'px', width: endPos - startPos + 'px'}"/>
              <Draggable class="h-full w-[2px] cursor-[ew-resize] touch-none"
                         :scrolling-parent="timelineWrapper"
                         v-model:x="startPos"
                         :horizontal="true"
                         :snaps="[{x: playHeadPos, y: 0}]"/>
              <Draggable class="h-full w-[2px] cursor-[ew-resize] touch-none"
                         :scrolling-parent="timelineWrapper"
                         v-model:x="endPos"
                         :horizontal="true"
                         :snaps="[{x: playHeadPos, y: 0}]"/>
              <canvas ref="thumbnailsCanvas" class="w-full mb-2"/>
            </div>

            <Draggable ref="playHead" class="border-x h-full cursor-[ew-resize] touch-none"
                       :scrolling-parent="timelineWrapper"
                       v-model:x="playHeadPos"
                       :horizontal="true"
                       :snaps="[{x: startPos, y: 0}, {x: endPos, y: 0}]"/>
          </div>
        </div>
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<style scoped>

</style>