/**
 * Timeline - 时间轴导航功能
 * 提供对话消息的可视化导航
 */

import { createElement, scrollToElement, throttle } from '../../utils/dom.js';

export class Timeline {
  constructor() {
    this.container = null;
    this.messages = [];
    this.currentIndex = 0;
    this.isVisible = false;
    this.observer = null;
  }

  async init() {
    console.log('🕐 Initializing Timeline...');
    
    this.createUI();
    this.injectStyles();
    this.setupMessageObserver();
    this.setupScrollHandler();
  }

  createUI() {
    this.container = createElement('div', {
      className: 'kimi-voyager-timeline',
      children: [
        createElement('div', {
          className: 'kimi-voyager-timeline-header',
          children: [
            createElement('span', { text: '时间轴' }),
            createElement('button', {
              className: 'kimi-voyager-timeline-toggle',
              text: '−',
              events: {
                click: () => this.toggleVisibility()
              }
            })
          ]
        }),
        createElement('div', {
          className: 'kimi-voyager-timeline-content'
        })
      ]
    });

    document.body.appendChild(this.container);
  }

  setupMessageObserver() {
    // 观察消息变化
    this.observer = new MutationObserver(() => {
      this.updateMessages();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 初始更新
    setTimeout(() => this.updateMessages(), 1000);
  }

  updateMessages() {
    const messageElements = document.querySelectorAll('[data-testid="conversation-turn"]');
    if (messageElements.length === this.messages.length) return;

    this.messages = Array.from(messageElements).map((el, index) => ({
      index,
      element: el,
      role: el.querySelector('[data-testid="user-message"]') ? 'user' : 'assistant',
      isStarred: el.dataset.starred === 'true'
    }));

    this.renderTimeline();
  }

  renderTimeline() {
    const content = this.container.querySelector('.kimi-voyager-timeline-content');
    content.innerHTML = '';

    if (this.messages.length === 0) {
      content.appendChild(createElement('div', {
        className: 'kimi-voyager-timeline-empty',
        text: '暂无消息'
      }));
      return;
    }

    // 按角色分组显示
    let lastRole = null;
    let groupIndex = 0;

    this.messages.forEach((msg, index) => {
      if (msg.role !== lastRole) {
        groupIndex++;
        lastRole = msg.role;
      }

      const node = createElement('div', {
        className: `kimi-voyager-timeline-node ${msg.role} ${index === this.currentIndex ? 'active' : ''} ${msg.isStarred ? 'starred' : ''}`,
        attributes: { 'data-index': index },
        events: {
          click: () => this.navigateToMessage(index),
          contextmenu: (e) => this.showNodeContextMenu(e, index)
        },
        children: [
          createElement('span', {
            className: 'node-indicator',
            text: msg.role === 'user' ? '👤' : '🤖'
          }),
          createElement('span', {
            className: 'node-number',
            text: groupIndex.toString()
          })
        ]
      });

      content.appendChild(node);
    });

    // 添加统计信息
    const stats = createElement('div', {
      className: 'kimi-voyager-timeline-stats',
      text: `共 ${this.messages.length} 条消息`
    });
    content.appendChild(stats);
  }

  setupScrollHandler() {
    // 节流处理滚动事件
    const handleScroll = throttle(() => {
      this.updateCurrentIndex();
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  updateCurrentIndex() {
    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    this.messages.forEach((msg, index) => {
      const rect = msg.element.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== this.currentIndex) {
      this.currentIndex = closestIndex;
      this.highlightCurrentNode();
    }
  }

  highlightCurrentNode() {
    this.container.querySelectorAll('.kimi-voyager-timeline-node').forEach((node, index) => {
      node.classList.toggle('active', index === this.currentIndex);
    });
  }

  navigateToMessage(index) {
    if (index >= 0 && index < this.messages.length) {
      const message = this.messages[index];
      scrollToElement(message.element);
      this.currentIndex = index;
      this.highlightCurrentNode();
    }
  }

  showNodeContextMenu(event, index) {
    event.preventDefault();

    // 移除现有菜单
    document.querySelectorAll('.kimi-voyager-timeline-menu').forEach(m => m.remove());

    const isStarred = this.messages[index].isStarred;

    const menu = createElement('div', {
      className: 'kimi-voyager-timeline-menu',
      styles: {
        position: 'fixed',
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
        zIndex: '999999'
      },
      children: [
        createElement('div', {
          className: 'menu-item',
          text: isStarred ? '取消星标' : '添加星标',
          events: {
            click: () => {
              this.toggleStar(index);
              menu.remove();
            }
          }
        }),
        createElement('div', {
          className: 'menu-item',
          text: '复制内容',
          events: {
            click: () => {
              this.copyMessageContent(index);
              menu.remove();
            }
          }
        }),
        createElement('div', {
          className: 'menu-item divider'
        }),
        createElement('div', {
          className: 'menu-item',
          text: '跳转到顶部',
          events: {
            click: () => {
              this.navigateToMessage(0);
              menu.remove();
            }
          }
        }),
        createElement('div', {
          className: 'menu-item',
          text: '跳转到底部',
          events: {
            click: () => {
              this.navigateToMessage(this.messages.length - 1);
              menu.remove();
            }
          }
        })
      ]
    });

    document.body.appendChild(menu);

    // 点击关闭
    setTimeout(() => {
      document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      });
    }, 0);
  }

  toggleStar(index) {
    const message = this.messages[index];
    message.isStarred = !message.isStarred;
    message.element.dataset.starred = message.isStarred;
    this.renderTimeline();
  }

  async copyMessageContent(index) {
    const message = this.messages[index];
    const contentEl = message.element.querySelector('[data-testid="message-content"]');
    if (contentEl) {
      const text = contentEl.textContent;
      try {
        await navigator.clipboard.writeText(text);
        // 显示提示
        const toast = createElement('div', {
          className: 'kimi-voyager-toast',
          text: '已复制到剪贴板',
          styles: {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#10b981',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            zIndex: '999999'
          }
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.container.classList.toggle('minimized', !this.isVisible);
    const toggleBtn = this.container.querySelector('.kimi-voyager-timeline-toggle');
    toggleBtn.textContent = this.isVisible ? '−' : '+';
  }

  injectStyles() {
    const style = createElement('style', {
      text: `
        .kimi-voyager-timeline {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 60px;
          background: rgba(31, 41, 55, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 12px 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          z-index: 9999;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        
        .kimi-voyager-timeline.minimized {
          width: auto;
        }
        
        .kimi-voyager-timeline.minimized .kimi-voyager-timeline-content {
          display: none;
        }
        
        .kimi-voyager-timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .kimi-voyager-timeline-header span {
          font-size: 12px;
          font-weight: 600;
          color: #e5e7eb;
        }
        
        .kimi-voyager-timeline-toggle {
          width: 20px;
          height: 20px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          transition: all 0.2s;
        }
        
        .kimi-voyager-timeline-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .kimi-voyager-timeline-content {
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .kimi-voyager-timeline-empty {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          padding: 20px 0;
        }
        
        .kimi-voyager-timeline-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        
        .kimi-voyager-timeline-node:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .kimi-voyager-timeline-node.active {
          background: rgba(79, 70, 229, 0.3);
        }
        
        .kimi-voyager-timeline-node.active::before {
          content: '';
          position: absolute;
          left: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: #4f46e5;
          border-radius: 2px;
        }
        
        .kimi-voyager-timeline-node.starred .node-indicator::after {
          content: '⭐';
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 8px;
        }
        
        .node-indicator {
          font-size: 14px;
          position: relative;
        }
        
        .node-number {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 500;
        }
        
        .kimi-voyager-timeline-node.active .node-number {
          color: #4f46e5;
          font-weight: 600;
        }
        
        .kimi-voyager-timeline-stats {
          font-size: 10px;
          color: #6b7280;
          text-align: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .kimi-voyager-timeline-menu {
          background: #374151;
          border-radius: 8px;
          padding: 4px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          min-width: 120px;
        }
        
        .kimi-voyager-timeline-menu .menu-item {
          padding: 8px 12px;
          font-size: 13px;
          color: #e5e7eb;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .kimi-voyager-timeline-menu .menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .kimi-voyager-timeline-menu .menu-item.divider {
          height: 1px;
          padding: 0;
          margin: 4px 0;
          background: rgba(255, 255, 255, 0.1);
          pointer-events: none;
        }
        
        /* 滚动条样式 */
        .kimi-voyager-timeline-content::-webkit-scrollbar {
          width: 4px;
        }
        
        .kimi-voyager-timeline-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .kimi-voyager-timeline-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
      `
    });
    document.head.appendChild(style);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.container) {
      this.container.remove();
    }
  }
}
