import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import { createApp } from 'vue';
import App from './App.vue';
import './components/pixel-ui.css';
import './components/touch-ui.css';
import { startServiceWorker } from './game/pwa/index.ts';

createApp(App).mount('#app');
startServiceWorker();
