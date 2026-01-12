import vue from '@vitejs/plugin-vue';
import fg from 'fast-glob';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import vueJsxVapor from 'vue-jsx-vapor/vite';

const externalDeps = (id: string) => id === 'vue' || id.startsWith('@vc-com/');
const entry = fg.sync(['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.test.ts', '!src/**/*.test.tsx', '!src/**/tests']);

export default defineConfig({
  plugins: [
    vue(),
    vueJsxVapor({
      macros: true,
      interop: true,
      sourceMap: true,
    }),
    dts({ entryRoot: 'src', root: process.cwd(), outDir: 'lib' }),
  ],
  build: {
    minify: false,
    lib: { entry },
    rolldownOptions: {
      external: externalDeps,
      output: [
        {
          format: 'es',
          dir: 'lib',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
          exports: 'named',
        },
        {
          format: 'cjs',
          dir: 'lib',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].cjs',
          exports: 'named',
        },
      ],
    },
  },
});
