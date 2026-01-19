import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vueJsxVapor from 'vue-jsx-vapor/vite';

export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      vueJsxVapor({
        macros: true,
        interop: true,
        sourceMap: true,
      }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./playground', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 3000,
    },
  };
});
