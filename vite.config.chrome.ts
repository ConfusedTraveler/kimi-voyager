import { defineConfig } from 'vite';
import path from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';

// 递归复制目录的函数
function copyDir(src: string, dest: string) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/chrome',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content/content.js'),
        background: path.resolve(__dirname, 'src/background/background.js'),
        popup: path.resolve(__dirname, 'src/popup/popup.html'),
        options: path.resolve(__dirname, 'src/options/options.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'src/background/background.js';
          }
          if (chunkInfo.name === 'content') {
            return 'src/content/content.js';
          }
          return 'src/[name].js';
        },
        chunkFileNames: 'src/[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|ico)$/i.test(assetInfo.name)) {
            return 'src/assets/[name][extname]';
          }
          if (/\.css$/i.test(assetInfo.name)) {
            const name = assetInfo.name.replace('.css', '');
            if (name === 'popup') return 'src/popup/popup.css';
            if (name === 'options') return 'src/options/options.css';
            if (name === 'content') return 'src/styles/content.css';
            return 'src/styles/[name][extname]';
          }
          return 'src/[name][extname]';
        },
      },
    },
  },
  plugins: [
    {
      name: 'copy-static-files',
      closeBundle() {
        // 确保目录存在
        if (!existsSync('dist/chrome')) {
          mkdirSync('dist/chrome', { recursive: true });
        }
        
        // 复制 manifest.json
        copyFileSync('manifest.json', 'dist/chrome/manifest.json');
        console.log('✅ Manifest copied to dist/chrome/');
        
        // 复制静态样式文件
        if (existsSync('src/styles')) {
          copyDir('src/styles', 'dist/chrome/src/styles');
          console.log('✅ Styles copied to dist/chrome/src/styles/');
        }
        
        // 复制图标文件（如果有的话）
        if (existsSync('src/assets')) {
          copyDir('src/assets', 'dist/chrome/src/assets');
          console.log('✅ Assets copied to dist/chrome/src/assets/');
        }
        
        // 复制本地化文件
        if (existsSync('_locales')) {
          copyDir('_locales', 'dist/chrome/_locales');
          console.log('✅ Locales copied to dist/chrome/_locales/');
        }
      },
    },
  ],
});
