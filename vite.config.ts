import vue from '@vitejs/plugin-vue';
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
    ],
    server: {
      host: true,
      port: 1231,
    },
    build: {
      minify: false,
      lib: {
        entry: 'src/index.ts',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rolldownOptions: {
        external: ['vue'],
        output: {
          assetFileNames: 'style.[ext]',
          exports: 'named',
        },
      },
    },
  };
});
