import '@/styles/index.css';
import { createVaporApp, vaporInteropPlugin } from 'vue';
import App from './App.tsx';

const bootstrap = () => {
  const app = createVaporApp(App);
  app.use(vaporInteropPlugin);
  app.mount('#app');
};

bootstrap();
