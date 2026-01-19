// import '@/styles/index.css';
import { createApp, vaporInteropPlugin } from 'vue';
import App from './App.tsx';

const bootstrap = () => {
  const app = createApp(App);
  app.use(vaporInteropPlugin);
  app.mount('#app');
};

bootstrap();
