import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import ReactivityTransform from '@vue-macros/reactivity-transform/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vueJsxVapor from 'vue-jsx-vapor/vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const packagesDir = path.resolve(root, 'packages');

function autoAliases(scope = '@vc-com') {
  const pkgs = fs.readdirSync(packagesDir).filter((d) => {
    const dir = path.join(packagesDir, d);
    if (!fs.statSync(dir).isDirectory()) return false;
    return fs.existsSync(path.join(dir, 'src/index.ts')) || fs.existsSync(path.join(dir, 'src/index.tsx'));
  });

  return Object.fromEntries(pkgs.filter((i) => i !== 'util').map((p) => [`${scope}/${p}`, path.join(packagesDir, p, 'src')]));
}

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
      ReactivityTransform(),
    ],
    resolve: {
      alias: {
        ...autoAliases('@vc-com'),
        '@vc-com/util/lib': fileURLToPath(new URL('./packages/util/src', import.meta.url)),
        '@': fileURLToPath(new URL('./playground', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 3000,
    },
    css: {
      preprocessorOptions: {
        less: {},
      },
    },
  };
});
