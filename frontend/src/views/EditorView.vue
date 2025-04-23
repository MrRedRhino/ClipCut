<script setup>
import VideoEditor from "@/components/VideoEditor.vue";
import {useRoute} from "vue-router";
import {files} from "@/filelist.js";
import {computed} from "vue";

const filename = useRoute().params.filename;
const file = computed(() => files.value.find(f => f.name === filename));
</script>

<template>
  <VideoEditor v-if="file?.file" :file="file.file" :handle="file" :dir="file.directory"/>
</template>

<style scoped>

</style>