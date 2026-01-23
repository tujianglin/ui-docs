// import '@/styles/index.css';
import { createApp } from 'vue';
import App from './App.tsx';

const bootstrap = () => {
  const app = createApp(App);
  app.mount('#app');
};

bootstrap();
