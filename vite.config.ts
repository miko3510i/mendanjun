import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages で `https://<user>.github.io/mendanjun/` のように配信する場合、
  // ビルド済みファイルの参照パスが正しくなるよう base を設定する。
  // 別名で公開するなら、この値を `/公開ディレクトリ名/` に変更してください。
  base: '/mendanjun/',
  plugins: [react()],
})
