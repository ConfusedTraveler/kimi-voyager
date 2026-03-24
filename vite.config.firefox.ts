import { defineConfig } from 'vite';
import path from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';

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
    outDir: 'dist/firefox',
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
      name: 'copy-and-modify-manifest',
      closeBundle() {
        // 确保目录存在
        if (!existsSync('dist/firefox')) {
          mkdirSync('dist/firefox', { recursive: true });
        }
        
        // 读取原始 manifest
        const manifest = JSON.parse(readFileSync('manifest.json', 'utf-8'));
        
        // 修改 Firefox 兼容的字段
        // Firefox 使用 browser_specific_settings
        manifest.browser_specific_settings = {
          gecko: {
            id: 'kimi-voyager@example.com',
            strict_min_version: '109.0'
          }
        };
        
        // Firefox 使用 background.scripts 而不是 service_worker
        if (manifest.background && manifest.background.service_worker) {
          manifest.background.scripts = [manifest.background.service_worker];
          delete manifest.background.service_worker;
          manifest.background.type = 'module';
        }
        
        // 写入修改后的 manifest
        writeFileSync('dist/firefox/manifest.json', JSON.stringify(manifest, null, 2));
        console.log('✅ Firefox manifest created in dist/firefox/');
        
        // 复制静态样式文件
        if (existsSync('src/styles')) {
          copyDir('src/styles', 'dist/firefox/src/styles');
          console.log('✅ Styles copied to dist/firefox/src/styles/');
        }
        
        // 复制图标文件（如果有的话）
        if (existsSync('src/assets')) {
          copyDir('src/assets', 'dist/firefox/src/assets');
          console.log('✅ Assets copied to dist/firefox/src/assets/');
        }
      },
    },
  ],
});
