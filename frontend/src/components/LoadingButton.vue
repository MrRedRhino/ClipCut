<script setup>
import {ref} from "vue";

const loading = ref(false);

async function callback(action) {
  loading.value = true;
  try {
    await action();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <slot :loading="loading" :callback="callback"></slot>
</template>

<style scoped>

</style>