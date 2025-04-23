import './assets/main.css';

import {createApp} from 'vue';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import {
    Button,
    ButtonGroup,
    ConfirmationService,
    ConfirmDialog, Dialog, DialogService, DynamicDialog, Fieldset,
    InputGroup, InputGroupAddon, InputNumber, InputText,
    Menubar, Message, Popover, ProgressBar, RadioButton,
    Splitter,
    SplitterPanel, ToggleSwitch
} from "primevue";
import {createRouter, createWebHistory} from "vue-router";
import FileListView from "@/views/FileListView.vue";
import EditorView from "@/views/EditorView.vue";

const routes = [
    {path: "/", component: FileListView},
    {path: "/:filename", component: EditorView}
]

export async function getSize(dirHandle) {
    let size = 0;
    for await (const fileHandle of dirHandle.values()) {
        const file = await fileHandle.getFile();
        size += file.size;
    }
    return size;
}

createApp(App)
    .use(createRouter({
        history: createWebHistory(),
        routes: routes
    }))
    .use(PrimeVue, {
        theme: {
            preset: Aura
        }
    })
    .use(ConfirmationService)
    .use(DialogService)
    .component("InputGroup", InputGroup)
    .component("InputGroupAddon", InputGroupAddon)
    .component("Fieldset", Fieldset)
    .component("InputText", InputText)
    .component("InputNumber", InputNumber)
    .component("ToggleSwitch", ToggleSwitch)
    .component("RadioButton", RadioButton)
    .component("ButtonGroup", ButtonGroup)
    .component("Button", Button)
    .component("Splitter", Splitter)
    .component("SplitterPanel", SplitterPanel)
    .component("Menubar", Menubar)
    .component("Dialog", Dialog)
    .component("ConfirmDialog", ConfirmDialog)
    .component("DynamicDialog", DynamicDialog)
    .component("Popover", Popover)
    .component("Message", Message)
    .component("ProgressBar", ProgressBar)
    .mount('#app');
