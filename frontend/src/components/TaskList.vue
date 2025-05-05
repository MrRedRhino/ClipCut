<script setup>
import {createTask, tasks} from "@/backend-service.js";

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function download(url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.download = "";
  link.click();
  link.remove();
}

createTask("Test Task").url = "https://storage.googleapis.com/pipehub-1/1f7a3ef3-7209-45c3-919c-57d51fde68ef";
</script>

<template>
  <div class="w-64">
    <h1 class="text-lg mb-2">Tasks</h1>
    <div v-for="task in tasks" class="flex flex-col gap-4">
      <div class="w-full">
        <div class="flex items-center mb-1">
          <h1 class="mr-auto overflow-ellipsis text-nowrap overflow-hidden">{{ task.title }}</h1>
          <Button :disabled="!task.url" text size="small" severity="contrast" icon="pi pi-download"
                  @click="download(task.url)"/>
          <Button :disabled="!task.url" text size="small" severity="contrast" icon="pi pi-clipboard"
                  @click="copyToClipboard(task.url)"/>
        </div>
        <ProgressBar pt:label:class="text-nowrap"
                     :mode="task.progress === -1 && !task.url ? 'indeterminate' : 'determinate'"
                     :value="task.url ? 100 : isNaN(task.progress) ? 0 : task.progress * 100">
          {{ task.url ? 'Completed' : Math.floor(task.progress * 100) + " %" }}
        </ProgressBar>
      </div>
    </div>
    <h1 class="text-zinc-500" v-if="tasks.length === 0">No tasks</h1>
  </div>
</template>

<style scoped>

</style>