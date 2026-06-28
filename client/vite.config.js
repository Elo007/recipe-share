import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  console.log('DEBUG VITE_API_URL at build time:', JSON.stringify(env.VITE_API_URL));

  return {
    plugins: [react()],
  };
})