import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'BelysiumWidget',
      fileName: 'belysium-widget',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Inline all assets so widget is a single file
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
    minify: true,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
