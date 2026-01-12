import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import vueJsxVapor from 'vue-jsx-vapor/vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const packagesDir = path.resolve(root, 'packages');

function autoAliases(scope = '@vc-com') {
  const pkgs = fs.readdirSync(packagesDir).filter((d) => {
    const dir = path.join(packagesDir, d);
    if (!fs.statSync(dir).isDirectory()) return false;
    return fs.existsSync(path.join(dir, 'src/index.ts')) || fs.existsSync(path.join(dir, 'src/index.tsx'));
  });

  return Object.fromEntries(pkgs.map((p) => [`${scope}/${p}`, path.join(packagesDir, p, 'src')]));
}

const vueDocsPlugin = () => ({
  name: 'vue-docs',
  transform(code: string, id: string) {
    if (!/vue&type=docs/.test(id)) return;
    return `export default comp => { comp.__docs = ${JSON.stringify(code)} }`;
  },
});

export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      vueDocsPlugin(),
      vueJsxVapor({
        macros: true,
        interop: true,
        sourceMap: true,
      }),
      tailwindcss(),
      tsconfigPaths(),
    ],
    assetsInclude: ['**/*.md'],
    resolve: {
      alias: {
        ...autoAliases('@vc-com'),
        '@vc-com/util': path.resolve(__dirname, 'packages/util'),
      },
    },
    server: {
      host: true,
      port: 1231,
    },
    css: {},
  };
});
