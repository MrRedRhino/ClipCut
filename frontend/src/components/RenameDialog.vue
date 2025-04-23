<script setup>
import {ref, watch, watchEffect} from "vue";
import {InputGroup} from "primevue";
import {useRouter} from "vue-router";
import {renameFile} from "@/filelist.js";

const router = useRouter();

const props = defineProps({
  fileHandle: {
    type: FileSystemFileHandle,
    required: true,
  },
  dir: {
    type: FileSystemDirectoryHandle,
    required: true
  },
  mode: {
    type: String,
    required: true
  }
});

const visible = defineModel("visible", {type: Boolean});
const newName = ref();
const extension = ref();
const collision = ref(false);

watchEffect(async () => {
  const name = newName.value + extension.value;
  try {
    await props.dir.getFileHandle(name, {create: false});
    collision.value = true;
  } catch (e) {
    collision.value = e.name !== "NotFoundError";
  }
});

watch(visible, newVal => {
  if (newVal) {
    const filename = props.fileHandle.name;
    const [name, ext] = (filename.match(/(.+)+\.(.+)/) || ['', filename]).slice(1);

    newName.value = name;
    extension.value = `.${ext}`;
  }
});

async function rename() {
  const name = newName.value + extension.value;
  await renameFile(props.dir, props.fileHandle, name, props.mode === "rename");
  if (props.mode === "rename") {
    location.href = "/" + name;
  } else {
    window.open("/" + name, "_blank");
    visible.value = false;
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" :header="mode === 'rename' ? 'Rename' : 'Duplicate'">
    <h3 class="m-1">Rename to:</h3>
    <InputGroup>
      <InputText v-model="newName" @keydown.enter="rename"/>
      <InputText class="max-w-16" :disabled="true" v-model="extension"/>
    </InputGroup>
    <Message class="m-1" :class="{invisible: !collision}" size="small" severity="error" variant="simple">File already exists</Message>

    <div class="flex justify-end gap-2 mt-5">
      <Button type="button" label="Cancel" severity="secondary" @click="visible = false"/>
      <Button type="button" label="OK" :disabled="collision" @click="rename"/>
    </div>
  </Dialog>
</template>

<style scoped>

</style>