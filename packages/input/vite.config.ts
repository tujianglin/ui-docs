import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vueJsxVapor from 'vue-jsx-vapor/vite';

const externalDeps = (id: string) => id === 'vue' || id.startsWith('@vc-com/');

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
    build: {
      minify: false,
      lib: {
        entry: 'src/index.ts',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rolldownOptions: {
        external: externalDeps,
        output: {
          assetFileNames: 'style.[ext]',
          exports: 'named',
        },
      },
    },
  };
});
