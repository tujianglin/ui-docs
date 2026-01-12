import { createApp, vaporInteropPlugin } from 'vue';
import PreviewApp from './PreviewApp';
import Story from './components/Story';
import Variant from './components/Variant';
import './styles/preview.css';

const app = createApp(PreviewApp);
app.component('Story', Story);
app.component('Variant', Variant);
app.use(vaporInteropPlugin);
app.mount('#app');
