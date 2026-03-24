import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content/content.js'),
        background: path.resolve(__dirname, 'src/background/background.js'),
        popup: path.resolve(__dirname, 'src/popup/popup.html'),
        options: path.resolve(__dirname, 'src/options/options.html'),
      },
      output: {
        entryFileNames: 'src/[name]/[name].js',
        chunkFileNames: 'src/[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|ico)$/i.test(assetInfo.name)) {
            return 'src/assets/[name][extname]';
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return 'src/styles/[name][extname]';
          }
          return 'src/[name][extname]';
        },
      },
    },
  },
});
