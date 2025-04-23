<script setup>
import {dirSize, files, getReadableFileSizeString, open, thumbnails} from "@/filelist.js";
</script>

<template>
  <div class="flex gap-2">
    <h1>Total size: {{ getReadableFileSizeString(dirSize) }}</h1>
    <router-link :to="file.name" v-for="file in files" class="w-80 p-3 rounded-2xl bg-zinc-800 cursor-pointer">
      <img class="rounded-xl" :src="thumbnails[file.name]" alt="Thumbnail"/>
      <h1 class="mt-2 whitespace-nowrap overflow-hidden overflow-ellipsis">{{ file.name }}</h1>
    </router-link>
  </div>
  <Button @click="open" label="Open File"/>
</template>

<style scoped>

</style>