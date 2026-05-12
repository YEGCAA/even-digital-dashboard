import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // Base path (Relative for portability)
    server: {
      port: 8888,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
      'process.env.META_ACCESS_TOKEN': JSON.stringify(env.META_ACCESS_TOKEN),
      'process.env.PIPEDRIVE_PEDROSA_TOKEN': JSON.stringify(env.PIPEDRIVE_PEDROSA_TOKEN),
      'process.env.PIPEDRIVE_PEDROSA_DOMAIN': JSON.stringify(env.PIPEDRIVE_PEDROSA_DOMAIN),
      'process.env.PIPEDRIVE_PEDROSA_PIPELINE_ID': JSON.stringify(env.PIPEDRIVE_PEDROSA_PIPELINE_ID),
      'process.env.PIPEDRIVE_OPUS_TOKEN': JSON.stringify(env.PIPEDRIVE_OPUS_TOKEN),
      'process.env.PIPEDRIVE_OPUS_DOMAIN': JSON.stringify(env.PIPEDRIVE_OPUS_DOMAIN),
      'process.env.PIPEDRIVE_OPUS_PIPELINE_ID': JSON.stringify(env.PIPEDRIVE_OPUS_PIPELINE_ID),
      'process.env.PIPEDRIVE_VILLAGGIO_TOKEN': JSON.stringify(env.PIPEDRIVE_VILLAGGIO_TOKEN),
      'process.env.PIPEDRIVE_VILLAGGIO_DOMAIN': JSON.stringify(env.PIPEDRIVE_VILLAGGIO_DOMAIN),
      'process.env.PIPEDRIVE_VILLAGGIO_PIPELINE_ID': JSON.stringify(env.PIPEDRIVE_VILLAGGIO_PIPELINE_ID)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        }
      }
    }
  };
});
