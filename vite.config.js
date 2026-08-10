import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Cambia con il nome del tuo repository GitHub per il deploy su GitHub Pages
  // (es. se il repo è "turni-app", base deve essere "/turni-app/")
  base: "/turni-app/",
})
