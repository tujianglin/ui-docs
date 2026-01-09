import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vueJsxVapor from 'vue-jsx-vapor/vite';

const vueDocsPlugin = () => ({
  name: 'vue-docs',
  transform(code: string, id: string) {
    if (!/vue&type=docs/.test(id)) return;
    return `export default comp => { comp.__docs = ${JSON.stringify(code)} }`;
  },
});

export default defineConfig(() => {
  return {
    base: './', // Use relative paths for GitHub Pages or custom domains
    plugins: [
      vue(),
      vueDocsPlugin(),
      vueJsxVapor({
        macros: true,
        interop: true,
        sourceMap: true,
      }),
      tailwindcss(),
    ],
    assetsInclude: ['**/*.md'],
    resolve: {
      alias: {
        '@vc-com/portal': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist-docs',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
        },
      },
    },
  };
});
