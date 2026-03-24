/**
 * Kimi Voyager - Content Script
 * 注入到 Kimi 页面，提供增强功能
 */

import { FolderManager } from './features/folderManager.js';
import { Timeline } from './features/timeline.js';
import { PromptLibrary } from './features/promptLibrary.js';
import { ExportManager } from './features/exportManager.js';
import { VisualEffects } from './features/visualEffects.js';
import { waitForElement, showToast } from '../utils/dom.js';

class KimiVoyager {
  constructor() {
    this.initialized = false;
    this.features = {};
    this.settings = {};
  }

  async init() {
    if (this.initialized) return;
    
    console.log('🚀 Kimi Voyager initializing...');
    console.log('📍 Current URL:', window.location.href);
    
    // 调试：检查页面元素
    const debugElements = () => {
      console.log('🔍 Debug: Looking for sidebar elements...');
      console.log('  - [data-testid="conversation-list"]:', document.querySelector('[data-testid="conversation-list"]'));
      console.log('  - .sidebar:', document.querySelector('.sidebar'));
      console.log('  - aside:', document.querySelector('aside'));
      console.log('  - nav:', document.querySelector('nav'));
    };
    
    try {
      // 等待页面加载完成（使用多种选择器尝试）
      let sidebar = null;
      const selectors = [
        '[data-testid="conversation-list"]',
        '.sidebar',
        'aside',
        '[class*="sidebar"]',
        'nav'
      ];
      
      for (let i = 0; i < 10; i++) {
        for (const selector of selectors) {
          sidebar = document.querySelector(selector);
          if (sidebar) {
            console.log(`✅ Found sidebar with selector: ${selector}`);
            break;
          }
        }
        if (sidebar) break;
        await new Promise(r => setTimeout(r, 500));
      }
      
      if (!sidebar) {
        console.warn('⚠️ Could not find sidebar, retrying in 2s...');
        debugElements();
        await new Promise(r => setTimeout(r, 2000));
      }
      
      // 加载设置
      await this.loadSettings();
      
      // 初始化各个功能模块
      await this.initFeatures();
      
      // 添加 Voyager 样式
      this.injectStyles();
      
      // 监听设置变化
      this.setupMessageListeners();
      
      this.initialized = true;
      console.log('✅ Kimi Voyager initialized successfully');
      showToast('Kimi Voyager 已启动', 'success', 2000);
      
    } catch (error) {
      console.error('❌ Kimi Voyager initialization failed:', error);
    }
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response.success) {
        this.settings = response.data;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      enableFolderManagement: true,
      enableTimeline: true,
      enablePromptLibrary: true,
      enableExport: true,
      enableVisualEffects: false,
      visualEffect: 'none',
      theme: 'auto'
    };
  }

  async initFeatures() {
    // 文件夹管理
    if (this.settings.enableFolderManagement !== false) {
      this.features.folderManager = new FolderManager();
      await this.features.folderManager.init();
    }

    // 时间轴导航
    if (this.settings.enableTimeline !== false) {
      this.features.timeline = new Timeline();
      await this.features.timeline.init();
    }

    // 提示词库
    if (this.settings.enablePromptLibrary !== false) {
      this.features.promptLibrary = new PromptLibrary();
      await this.features.promptLibrary.init();
    }

    // 导出功能
    if (this.settings.enableExport !== false) {
      this.features.exportManager = new ExportManager();
      await this.features.exportManager.init();
    }

    // 视觉效果
    if (this.settings.enableVisualEffects && this.settings.visualEffect !== 'none') {
      this.features.visualEffects = new VisualEffects(this.settings.visualEffect);
      await this.features.visualEffects.init();
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .kimi-voyager-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .kimi-voyager-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: #fff;
        color: #374151;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .kimi-voyager-btn:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }
      
      .kimi-voyager-btn-primary {
        background: #4f46e5;
        color: #fff;
        border-color: #4f46e5;
      }
      
      .kimi-voyager-btn-primary:hover {
        background: #4338ca;
      }
      
      .kimi-voyager-icon {
        width: 16px;
        height: 16px;
      }
      
      /* 暗色模式适配 */
      @media (prefers-color-scheme: dark) {
        .kimi-voyager-btn {
          background: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
        
        .kimi-voyager-btn:hover {
          background: #4b5563;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'toggleFeature':
          await this.toggleFeature(request.feature, request.enabled);
          sendResponse({ success: true });
          break;
          
        case 'exportConversation':
          if (this.features.exportManager) {
            await this.features.exportManager.exportCurrentConversation(request.format);
          }
          sendResponse({ success: true });
          break;
          
        case 'getConversationData':
          const data = this.getConversationData();
          sendResponse({ success: true, data });
          break;
          
        case 'applyVisualEffect':
          if (this.features.visualEffects) {
            this.features.visualEffects.setEffect(request.effect);
          }
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async toggleFeature(feature, enabled) {
    this.settings[`enable${feature.charAt(0).toUpperCase() + feature.slice(1)}`] = enabled;
    
    if (enabled && !this.features[feature]) {
      // 启用功能
      switch (feature) {
        case 'folderManagement':
          this.features.folderManager = new FolderManager();
          await this.features.folderManager.init();
          break;
        case 'timeline':
          this.features.timeline = new Timeline();
          await this.features.timeline.init();
          break;
        case 'promptLibrary':
          this.features.promptLibrary = new PromptLibrary();
          await this.features.promptLibrary.init();
          break;
        case 'export':
          this.features.exportManager = new ExportManager();
          await this.features.exportManager.init();
          break;
      }
    } else if (!enabled && this.features[feature]) {
      // 禁用功能
      if (this.features[feature].destroy) {
        this.features[feature].destroy();
      }
      delete this.features[feature];
    }
    
    // 保存设置
    await chrome.runtime.sendMessage({ 
      action: 'saveSettings', 
      data: this.settings 
    });
  }

  getConversationData() {
    const messages = [];
    const messageElements = document.querySelectorAll('[data-testid="conversation-turn"]');
    
    messageElements.forEach(el => {
      const isUser = el.querySelector('[data-testid="user-message"]') !== null;
      const contentEl = el.querySelector('[data-testid="message-content"]');
      
      messages.push({
        role: isUser ? 'user' : 'assistant',
        content: contentEl ? contentEl.innerHTML : '',
        textContent: contentEl ? contentEl.textContent : ''
      });
    });

    return {
      title: document.title.replace(' - Kimi', ''),
      url: window.location.href,
      messages,
      timestamp: Date.now()
    };
  }
}

// 初始化
const voyager = new KimiVoyager();

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => voyager.init());
} else {
  voyager.init();
}

// 监听页面变化（SPA 路由变化）
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('URL changed to:', url);
    // 重新初始化
    setTimeout(() => voyager.init(), 1000);
  }
}).observe(document, { subtree: true, childList: true });

// 导出实例供全局访问
window.kimiVoyager = voyager;
