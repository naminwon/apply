import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // 대형 vendor를 별도 chunk로 분리해 초기 페이지 로드 캐시 효율을 높인다.
        // 함수형 manualChunks로 transitive deps(scheduler 등)까지 캐치.
        manualChunks(id) {
          if (id.includes('node_modules/recharts/')) return 'recharts';
          if (id.includes('node_modules/date-fns/')) return 'date-fns';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
});
