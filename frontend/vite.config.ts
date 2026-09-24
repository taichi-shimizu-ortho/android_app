import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// 各アプリを別ディレクトリ (/android_app/<app>/) で配信し、Android で別 PWA として
// 同時インストールできるようにする。中身は同じ SPA なので index.html をコピーするだけ。
const APPS = ['home', 'msc', 'ihc', 'ish', 'prompter']

function perAppEntries(): Plugin {
  return {
    name: 'per-app-entries',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(__dirname, '../docs')
      for (const app of APPS) {
        mkdirSync(resolve(outDir, app), { recursive: true })
        copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, app, 'index.html'))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), perAppEntries()],
  base: '/android_app/', // 絶対パスにして、どのサブディレクトリの index.html からでも assets を参照できるようにする
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
})
