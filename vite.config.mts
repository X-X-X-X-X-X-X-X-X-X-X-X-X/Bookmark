import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import zipPack from 'vite-plugin-zip-pack';
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  let target = process.env.target
  const manifestFileName = ["manifest", target ? `-${target}` : "", ".json"].filter(Boolean).join("");
  return {
    plugins: [
      vue(),
      viteStaticCopy({
        targets: [
          {
            src: `manifest/${manifestFileName}`,
            dest: './',
            rename: "manifest.json"
          }
        ]
      }),
      zipPack({
        inDir: './dist/',
        outDir: './dist',
        outFileName: `dist.zip`,
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: "",
    define: {
      __INTLIFY_JIT_COMPILATION__: true
    }
  }
})
