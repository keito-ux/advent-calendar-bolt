import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👇 GitHubリポジトリ名をここに書く！
export default defineConfig({
  plugins: [react()],
  base: '/advent-calendar/',
})
