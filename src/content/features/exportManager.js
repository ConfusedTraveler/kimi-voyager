/**
 * Export Manager - 导出管理功能
 * 提供对话的多种格式导出
 */

import { createElement, showToast, createModal } from '../../utils/dom.js';

export class ExportManager {
  constructor() {
    this.exportButton = null;
  }

  async init() {
    console.log('💾 Initializing Export Manager...');
    
    this.injectStyles();
    this.addExportButton();
  }

  addExportButton() {
    // 在 Kimi 界面中添加导出按钮
    const observer = new MutationObserver(() => {
      const header = document.querySelector('[data-testid="chat-header"]') || 
                     document.querySelector('header');
      
      if (header && !header.querySelector('.kimi-voyager-export-btn')) {
        const button = createElement('button', {
          className: 'kimi-voyager-export-btn',
          title: '导出对话',
          events: {
            click: () => this.showExportDialog()
          },
          children: [
            createElement('span', { text: '💾' }),
            createElement('span', { text: '导出', className: 'export-text' })
          ]
        });
        
        header.appendChild(button);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  showExportDialog() {
    const conversation = this.parseConversation();
    
    if (!conversation.messages.length) {
      showToast('当前对话为空', 'error');
      return;
    }

    createModal({
      title: '导出对话',
      content: `
        <div class="kimi-voyager-export-options">
          <p>选择导出格式：</p>
          <div class="export-formats">
            <button class="export-format-card" data-format="json">
              <span class="format-icon">📄</span>
              <span class="format-name">JSON</span>
              <span class="format-desc">完整数据结构，可重新导入</span>
            </button>
            <button class="export-format-card" data-format="markdown">
              <span class="format-icon">📝</span>
              <span class="format-name">Markdown</span>
              <span class="format-desc">纯文本格式，易于阅读</span>
            </button>
            <button class="export-format-card" data-format="html">
              <span class="format-icon">🌐</span>
              <span class="format-name">HTML</span>
              <span class="format-desc">保留格式，可在浏览器中查看</span>
            </button>
            <button class="export-format-card" data-format="txt">
              <span class="format-icon">📃</span>
              <span class="format-name">纯文本</span>
              <span class="format-desc">最简单的文本格式</span>
            </button>
          </div>
          <div class="export-options">
            <label class="checkbox-label">
              <input type="checkbox" id="include-timestamp" checked>
              包含时间戳
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="include-metadata">
              包含元数据
            </label>
          </div>
        </div>
      `,
      buttons: [
        { text: '取消', close: true }
      ],
      closeOnOverlay: true
    });

    // 绑定格式选择事件
    document.querySelectorAll('.export-format-card').forEach(card => {
      card.addEventListener('click', () => {
        const format = card.dataset.format;
        const includeTimestamp = document.getElementById('include-timestamp').checked;
        const includeMetadata = document.getElementById('include-metadata').checked;
        
        this.exportConversation(conversation, format, { includeTimestamp, includeMetadata });
        
        // 关闭模态框
        document.querySelector('.kimi-voyager-modal-overlay')?.closest('.kimi-voyager-modal')?.remove();
      });
    });
  }

  parseConversation() {
    const messages = [];
    // 使用 Kimi 实际的选择器（参考 Kimi-Polaris）
    const messageElements = document.querySelectorAll('.chat-content-item');
    
    messageElements.forEach(el => {
      const isUser = el.classList.contains('chat-content-item-user');
      // 尝试多种内容选择器
      const contentEl = el.querySelector('.user-content') || 
                        el.querySelector('.markdown') ||
                        el.querySelector('.message-content');
      
      if (contentEl) {
        messages.push({
          role: isUser ? 'user' : 'assistant',
          content: contentEl.textContent,
          htmlContent: contentEl.innerHTML,
          timestamp: null
        });
      }
    });

    return {
      title: document.title.replace(' - Kimi', ''),
      url: window.location.href,
      exportedAt: new Date().toISOString(),
      messages
    };
  }

  async exportConversation(conversation, format, options = {}) {
    try {
      let content, filename, mimeType;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const safeTitle = conversation.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').slice(0, 50);

      switch (format) {
        case 'json':
          content = JSON.stringify({
            ...conversation,
            exportOptions: options
          }, null, 2);
          filename = `${safeTitle}_${timestamp}.json`;
          mimeType = 'application/json';
          break;

        case 'markdown':
          content = this.convertToMarkdown(conversation, options);
          filename = `${safeTitle}_${timestamp}.md`;
          mimeType = 'text/markdown';
          break;

        case 'html':
          content = this.convertToHTML(conversation, options);
          filename = `${safeTitle}_${timestamp}.html`;
          mimeType = 'text/html';
          break;

        case 'txt':
          content = this.convertToText(conversation, options);
          filename = `${safeTitle}_${timestamp}.txt`;
          mimeType = 'text/plain';
          break;

        default:
          throw new Error('Unsupported format');
      }

      // 下载文件
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      showToast(`已导出为 ${format.toUpperCase()} 格式`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('导出失败', 'error');
    }
  }

  convertToMarkdown(conversation, options) {
    let md = `# ${conversation.title}\n\n`;
    
    if (options.includeMetadata) {
      md += `**导出时间:** ${new Date(conversation.exportedAt).toLocaleString()}\n`;
      md += `**对话链接:** ${conversation.url}\n\n`;
    }
    
    md += `---\n\n`;
    
    conversation.messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 Kimi';
      md += `### ${role}`;
      
      if (options.includeTimestamp && msg.timestamp) {
        md += ` \`${msg.timestamp}\``;
      }
      
      md += `\n\n${msg.content}\n\n`;
      
      if (index < conversation.messages.length - 1) {
        md += `---\n\n`;
      }
    });
    
    return md;
  }

  convertToHTML(conversation, options) {
    const messagesHtml = conversation.messages.map((msg, index) => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 Kimi';
      const roleClass = msg.role;
      
      return `
        <div class="message ${roleClass}">
          <div class="message-header">
            <span class="role">${role}</span>
            ${options.includeTimestamp && msg.timestamp ? `<span class="timestamp">${msg.timestamp}</span>` : ''}
          </div>
          <div class="message-content">${msg.htmlContent}</div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${conversation.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { font-size: 24px; margin-bottom: 10px; color: #1a1a1a; }
    .meta { color: #666; font-size: 14px; }
    .meta a { color: #4f46e5; }
    .message {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }
    .role { font-weight: 600; font-size: 14px; }
    .user .role { color: #4f46e5; }
    .assistant .role { color: #059669; }
    .timestamp { color: #999; font-size: 12px; }
    .message-content { line-height: 1.8; }
    .message-content p { margin-bottom: 12px; }
    .message-content pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;
    }
    .message-content code {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${conversation.title}</h1>
    ${options.includeMetadata ? `
      <div class="meta">
        <p>导出时间: ${new Date(conversation.exportedAt).toLocaleString()}</p>
        <p>对话链接: <a href="${conversation.url}" target="_blank">${conversation.url}</a></p>
      </div>
    ` : ''}
  </div>
  ${messagesHtml}
  <div class="footer">
    使用 Kimi Voyager 导出
  </div>
</body>
</html>`;
  }

  convertToText(conversation, options) {
    let text = `${conversation.title}\n`;
    text += `${'='.repeat(conversation.title.length)}\n\n`;
    
    if (options.includeMetadata) {
      text += `导出时间: ${new Date(conversation.exportedAt).toLocaleString()}\n`;
      text += `对话链接: ${conversation.url}\n\n`;
    }
    
    conversation.messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '[用户]' : '[Kimi]';
      text += `${role}\n`;
      
      if (options.includeTimestamp && msg.timestamp) {
        text += `时间: ${msg.timestamp}\n`;
      }
      
      text += `${'-'.repeat(40)}\n`;
      text += `${msg.content}\n\n`;
    });
    
    return text;
  }

  injectStyles() {
    const style = createElement('style', {
      text: `
        .kimi-voyager-export-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          margin-left: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .kimi-voyager-export-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        .kimi-voyager-export-options {
          padding: 10px 0;
        }
        
        .kimi-voyager-export-options > p {
          margin-bottom: 16px;
          color: #6b7280;
          font-size: 14px;
        }
        
        .export-formats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .export-format-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .export-format-card:hover {
          border-color: #4f46e5;
          background: #f5f3ff;
          transform: translateY(-2px);
        }
        
        .export-format-card .format-icon {
          font-size: 32px;
        }
        
        .export-format-card .format-name {
          font-weight: 600;
          font-size: 14px;
          color: #374151;
        }
        
        .export-format-card .format-desc {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        
        .export-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }
        
        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #4f46e5;
        }
      `
    });
    document.head.appendChild(style);
  }

  destroy() {
    if (this.exportButton) {
      this.exportButton.remove();
    }
  }
}
