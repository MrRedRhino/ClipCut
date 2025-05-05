<script setup>
import {inject, onMounted, ref} from "vue";
import {trim} from "@/ffmpeg-integration.js";
import {getReadableFileSizeString} from "../filelist.js";
import {ToggleSwitch} from "primevue";
import {compressUploadedFile, createTask, upload} from "@/backend-service.js";

const dialogRef = inject("dialogRef");
const trimmed = ref(false);
const compress = ref(false);
const targetSize = ref(8);
let file;

onMounted(async () => {
  const data = dialogRef.value.data;

  if (data.start !== undefined && data.end !== undefined) {
    const [name, ext] = (data.file.name.match(/(.+)+\.(.+)/) || ['', data.file.name]).slice(1);
    file = new File([await trim(data.file, data.start, data.end)], name + ` - ${Math.floor(data.end - data.start)}s.${ext}`);
  } else {
    file = data.file;
  }
  trimmed.value = true;
});

async function submit() {
  const data = dialogRef.value.data;

  dialogRef.value.close();

  const task = createTask(`Upload ${file.name}`);
  const {fileId, downloadUrl} = await upload(file, progress => task.progress = progress);
  task.url = downloadUrl;

  if (compress.value) {
    const compressionTask = createTask(`Compress ${file.name}`);
    compressionTask.url = await compressUploadedFile(fileId, targetSize.value * 1_048_576 / (data.end - data.start) * 8);
  }
  // compressionTask.url = await compressUploadedFile(fileId, targetSize.value * 1_048_576);
}
</script>

<template>
  <div class="flex flex-col h-full">
    <h1 v-if="trimmed">{{ file.name }}</h1>
    <h1 class="mb-2">Size: {{ trimmed ? getReadableFileSizeString(file.size) : 'Preparing...' }}</h1>

    <Fieldset legend="Compression">
      <div class="flex gap-2 items-center mb-2">
        <ToggleSwitch v-model="compress"/>
        <h1>Compress</h1>
      </div>

      <template v-if="compress">
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <RadioButton v-model="targetSize" inputId="8" name="Target Size" :value="8"/>
            <label for="8">8 MB</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton v-model="targetSize" inputId="25" name="Target Size" :value="25"/>
            <label for="25">25 MB</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton v-model="targetSize" inputId="50" name="Target Size" :value="50"/>
            <label for="50">50 MB</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton v-model="targetSize" inputId="100" name="Target Size" :value="100"/>
            <label for="100">100 MB</label>
          </div>
        </div>

        <InputGroup class="mt-2">
          <InputNumber v-model="targetSize"/>
          <InputGroupAddon>MB</InputGroupAddon>
        </InputGroup>
        <Message v-if="targetSize > file?.size / 1_048_576" size="small" severity="error" variant="simple">Target size
          is
          larger than original
        </Message>
      </template>
    </Fieldset>

    <div class="flex justify-end gap-2 mt-auto">
      <Button type="button" label="Cancel" severity="secondary" @click="dialogRef.close()"/>
      <Button type="button" label="OK" @click="submit"/>
    </div>
  </div>
</template>

<style scoped>

</style>