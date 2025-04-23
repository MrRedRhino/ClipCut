<script setup>
import {tasks} from "@/backend-service.js";
</script>

<template>
  <div class="w-64">
    <h1 class="text-lg mb-2">Tasks</h1>
    <div v-for="task in tasks" class="flex flex-col gap-4">
      <div class="w-full">
        <div class="flex items-center mb-1">
          <h1 class="mr-auto overflow-ellipsis text-nowrap overflow-hidden">{{ task.title }}</h1>
          <Button :disabled="!task.done" text size="small" severity="contrast" icon="pi pi-download"/>
          <Button :disabled="!task.done" text size="small" severity="contrast" icon="pi pi-clipboard"/>
        </div>
        <ProgressBar pt:label:class="text-nowrap"
                     :mode="task.progress === -1 && !task.done ? 'indeterminate' : 'determinate'"
                     :value="task.done ? 100 : isNaN(task.progress) ? 0 : task.progress * 100">
          {{ task.done ? 'Completed' : Math.floor(task.progress * 100) + " %" }}
        </ProgressBar>
      </div>
    </div>
    <h1 class="text-zinc-500" v-if="tasks.length === 0">No tasks</h1>
  </div>
</template>

<style scoped>

</style>