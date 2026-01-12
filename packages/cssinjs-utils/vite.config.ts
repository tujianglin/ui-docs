import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import vueJsxVapor from 'vue-jsx-vapor/vite';

const externalDeps = (id: string) => id === 'vue' || id.startsWith('@vc-com/');

export default defineConfig({
  plugins: [
    vue(),
    vueJsxVapor({
      macros: true,
      interop: true,
      sourceMap: true,
    }),
    dts({ entryRoot: 'src', root: process.cwd() }),
  ],
  build: {
    minify: false,
    lib: { entry: 'src/index.ts' },
    rolldownOptions: {
      external: externalDeps,
      output: [
        {
          format: 'es',
          dir: 'dist',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          exports: 'named',
        },
        {
          format: 'cjs',
          dir: 'dist',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].cjs',
          exports: 'named',
        },
      ],
    },
  },
});
