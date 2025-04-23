<script setup>
import {onMounted, ref} from "vue";

const props = defineProps({
  horizontal: {
    type: Boolean,
    default: false
  },
  vertical: {
    type: Boolean,
    default: false
  },
  snaps: {
    type: Array,
    default: [],
  },
  scrollingParent: {
    type: Element,
    default: null
  }
});

let offset = null;
let startMouse = null;
let startScroll = null;
let dragging = defineModel("dragging", {default: false});
const x = defineModel("x", {default: 0});
const y = defineModel("y", {default: 0});
const element = ref();

defineExpose({
  dragging,
  startDragging
});

onMounted(() => {
  document.addEventListener("pointermove", mouseMove);
  document.addEventListener("pointerup", endDragging);
});

function startDragging(e) {
  console.log(e);
  offset = {x: x.value, y: y.value};
  startMouse = {x: e.x, y: e.y};
  startScroll = getScroll();
  dragging.value = true;
}

function getScroll() {
  return {x: props.scrollingParent?.scrollLeft || 0, y: props.scrollingParent?.scrollTop || 0};
}

function mouseMove(e) {
  if (!dragging.value) return;
  const scroll = getScroll();

  if (props.horizontal) x.value = snap(offset.x - (startScroll.x - scroll.x) + (e.x - startMouse.x));
  if (props.vertical) y.value = snap(offset.y - (startScroll.x - scroll.x) + (e.y - startMouse.y));
}

function snap(targetPos) {
  for (let snap of props.snaps) {
    if (Math.abs(snap.x - targetPos) < 3) {
      return snap.x;
    }
  }
  return Math.min(element.value.parentElement.clientWidth, Math.max(0, targetPos));
}

function endDragging() {
  dragging.value = false;
}
</script>

<template>
  <div ref="element" class="absolute" :style="{left: `${x}px`, top: `${y}px`}" @pointerdown="startDragging">

  </div>
</template>

<style scoped>

</style>