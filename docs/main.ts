import { createApp, vaporInteropPlugin } from 'vue';
import App from './App';
import Story from './components/Story';
import Variant from './components/Variant';
import './styles/index.css';

const app = createApp(App);
app.component('Story', Story);
app.component('Variant', Variant);
app.use(vaporInteropPlugin);
app.mount('#app');
