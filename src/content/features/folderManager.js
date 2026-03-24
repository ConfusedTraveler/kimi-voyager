/**
 * Folder Manager - 文件夹管理功能
 * 提供对话的组织、分类和管理功能
 */

import { sendMessage } from '../../utils/messaging.js';
import { createElement, showToast, createModal } from '../../utils/dom.js';

export class FolderManager {
  constructor() {
    this.folders = [];
    this.container = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('📁 Initializing Folder Manager...');
    
    await this.loadFolders();
    this.createUI();
    this.injectStyles();
    this.setupDragAndDrop();
    
    this.isInitialized = true;
  }

  async loadFolders() {
    try {
      const response = await sendMessage('getFolders');
      this.folders = response.data || [];
    } catch (error) {
      console.error('Failed to load folders:', error);
      this.folders = [];
    }
  }

  async saveFolders() {
    try {
      await sendMessage('saveFolders', { data: this.folders });
    } catch (error) {
      console.error('Failed to save folders:', error);
    }
  }

  createUI() {
    // 查找 Kimi 的侧边栏（尝试多种选择器）
    const sidebarSelectors = [
      '[data-testid="conversation-list"]',
      '.sidebar',
      'aside',
      '[class*="sidebar"]',
      '[class*="SideBar"]',
      'nav'
    ];
    
    let sidebar = null;
    for (const selector of sidebarSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        sidebar = el.parentElement || el;
        console.log(`📁 FolderManager: Found sidebar with selector: ${selector}`);
        break;
      }
    }
    
    if (!sidebar) {
      console.warn('📁 FolderManager: Could not find sidebar');
      return;
    }

    // 创建 Voyager 文件夹容器
    this.container = createElement('div', {
      className: 'kimi-voyager-folders',
      children: [
        this.createHeader(),
        this.createFolderList()
      ]
    });

    // 插入到侧边栏顶部
    sidebar.insertBefore(this.container, sidebar.firstChild);
  }

  createHeader() {
    return createElement('div', {
      className: 'kimi-voyager-folders-header',
      children: [
        createElement('span', {
          className: 'kimi-voyager-folders-title',
          text: '📁 我的文件夹'
        }),
        createElement('button', {
          className: 'kimi-voyager-folders-add-btn',
          text: '+',
          events: {
            click: () => this.showCreateFolderDialog()
          }
        })
      ]
    });
  }

  createFolderList() {
    const list = createElement('div', {
      className: 'kimi-voyager-folders-list'
    });

    if (this.folders.length === 0) {
      list.appendChild(createElement('div', {
        className: 'kimi-voyager-folders-empty',
        text: '暂无文件夹，点击 + 创建'
      }));
    } else {
      this.folders.forEach(folder => {
        list.appendChild(this.createFolderItem(folder));
      });
    }

    return list;
  }

  createFolderItem(folder) {
    const item = createElement('div', {
      className: 'kimi-voyager-folder-item',
      attributes: {
        'data-folder-id': folder.id,
        draggable: 'true'
      },
      events: {
        dragstart: (e) => this.handleDragStart(e, folder),
        dragover: (e) => this.handleDragOver(e),
        drop: (e) => this.handleDrop(e, folder),
        click: () => this.openFolder(folder)
      }
    });

    // 文件夹图标和名称
    const header = createElement('div', {
      className: 'kimi-voyager-folder-header',
      children: [
        createElement('span', {
          className: 'kimi-voyager-folder-icon',
          text: folder.icon || '📁',
          styles: { color: folder.color || '#4f46e5' }
        }),
        createElement('span', {
          className: 'kimi-voyager-folder-name',
          text: folder.name
        }),
        createElement('span', {
          className: 'kimi-voyager-folder-count',
          text: `(${folder.conversations?.length || 0})`
        }),
        this.createFolderActions(folder)
      ]
    });

    item.appendChild(header);

    // 子文件夹或对话列表
    if (folder.children?.length > 0 || folder.conversations?.length > 0) {
      const content = createElement('div', {
        className: 'kimi-voyager-folder-content',
        children: [
          ...folder.children?.map(child => this.createFolderItem(child)) || [],
          ...folder.conversations?.map(conv => this.createConversationItem(conv, folder)) || []
        ]
      });
      item.appendChild(content);
    }

    return item;
  }

  createConversationItem(conv, folder) {
    return createElement('div', {
      className: 'kimi-voyager-conversation-item',
      attributes: { 'data-conv-id': conv.id },
      events: {
        click: (e) => {
          e.stopPropagation();
          this.openConversation(conv);
        }
      },
      children: [
        createElement('span', { text: '💬 ' }),
        createElement('span', {
          className: 'kimi-voyager-conversation-title',
          text: conv.title || '未命名对话'
        })
      ]
    });
  }

  createFolderActions(folder) {
    return createElement('div', {
      className: 'kimi-voyager-folder-actions',
      children: [
        createElement('button', {
          className: 'kimi-voyager-folder-action-btn',
          text: '⋮',
          events: {
            click: (e) => {
              e.stopPropagation();
              this.showFolderMenu(e, folder);
            }
          }
        })
      ]
    });
  }

  showCreateFolderDialog(parentId = null) {
    const colors = [
      { name: '默认', value: '#4f46e5' },
      { name: '红色', value: '#ef4444' },
      { name: '橙色', value: '#f97316' },
      { name: '绿色', value: '#10b981' },
      { name: '蓝色', value: '#3b82f6' },
      { name: '紫色', value: '#8b5cf6' }
    ];

    const icons = ['📁', '📂', '🗂️', '📋', '📝', '🔖', '🏷️', '⭐'];

    let selectedColor = colors[0].value;
    let selectedIcon = icons[0];

    const modal = createModal({
      title: '创建文件夹',
      content: `
        <div class="kimi-voyager-form">
          <div class="form-group">
            <label>文件夹名称</label>
            <input type="text" id="folder-name" placeholder="输入文件夹名称" autofocus>
          </div>
          <div class="form-group">
            <label>图标</label>
            <div class="icon-selector">
              ${icons.map(icon => `
                <button class="icon-btn ${icon === selectedIcon ? 'selected' : ''}" data-icon="${icon}">${icon}</button>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>颜色</label>
            <div class="color-selector">
              ${colors.map(color => `
                <button class="color-btn ${color.value === selectedColor ? 'selected' : ''}" 
                        data-color="${color.value}" 
                        style="background: ${color.value}"></button>
              `).join('')}
            </div>
          </div>
        </div>
      `,
      buttons: [
        { text: '取消', close: true },
        {
          text: '创建',
          primary: true,
          onClick: () => {
            const name = document.getElementById('folder-name').value.trim();
            if (name) {
              this.createFolder(name, selectedIcon, selectedColor, parentId);
            }
          }
        }
      ]
    });

    // 图标选择
    modal.element.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.element.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedIcon = btn.dataset.icon;
      });
    });

    // 颜色选择
    modal.element.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.element.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedColor = btn.dataset.color;
      });
    });
  }

  async createFolder(name, icon, color, parentId = null) {
    const newFolder = {
      id: Date.now().toString(),
      name,
      icon,
      color,
      conversations: [],
      children: [],
      createdAt: Date.now()
    };

    if (parentId) {
      // 添加到子文件夹
      const parent = this.findFolder(parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(newFolder);
      }
    } else {
      this.folders.push(newFolder);
    }

    await this.saveFolders();
    this.refreshUI();
    showToast('文件夹创建成功！', 'success');
  }

  findFolder(id, folders = this.folders) {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      if (folder.children) {
        const found = this.findFolder(id, folder.children);
        if (found) return found;
      }
    }
    return null;
  }

  showFolderMenu(event, folder) {
    // 移除现有的菜单
    document.querySelectorAll('.kimi-voyager-context-menu').forEach(m => m.remove());

    const menu = createElement('div', {
      className: 'kimi-voyager-context-menu',
      styles: {
        position: 'fixed',
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
        zIndex: '999999'
      },
      children: [
        this.createMenuItem('重命名', () => this.renameFolder(folder)),
        this.createMenuItem('更改颜色', () => this.changeFolderColor(folder)),
        this.createMenuItem('添加子文件夹', () => this.showCreateFolderDialog(folder.id)),
        this.createMenuItem('删除', () => this.deleteFolder(folder), true)
      ]
    });

    document.body.appendChild(menu);

    // 点击其他地方关闭菜单
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }

  createMenuItem(label, onClick, isDanger = false) {
    return createElement('div', {
      className: `kimi-voyager-menu-item ${isDanger ? 'danger' : ''}`,
      text: label,
      events: { click: onClick }
    });
  }

  async renameFolder(folder) {
    const newName = prompt('输入新名称:', folder.name);
    if (newName && newName !== folder.name) {
      folder.name = newName;
      await this.saveFolders();
      this.refreshUI();
    }
  }

  async changeFolderColor(folder) {
    const colors = ['#4f46e5', '#ef4444', '#f97316', '#10b981', '#3b82f6', '#8b5cf6'];
    const color = colors.find(c => c !== folder.color) || colors[0];
    folder.color = color;
    await this.saveFolders();
    this.refreshUI();
  }

  async deleteFolder(folder) {
    if (confirm(`确定要删除文件夹 "${folder.name}" 吗？`)) {
      this.folders = this.folders.filter(f => f.id !== folder.id);
      await this.saveFolders();
      this.refreshUI();
      showToast('文件夹已删除', 'success');
    }
  }

  setupDragAndDrop() {
    // 使 Kimi 的对话列表项可拖拽
    const observer = new MutationObserver(() => {
      document.querySelectorAll('[data-testid="conversation-item"]').forEach(item => {
        if (!item.dataset.voyagerDraggable) {
          item.dataset.voyagerDraggable = 'true';
          item.draggable = true;
          
          item.addEventListener('dragstart', (e) => {
            const convId = item.getAttribute('data-conversation-id');
            const title = item.textContent;
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'conversation',
              id: convId,
              title
            }));
            item.style.opacity = '0.5';
          });
          
          item.addEventListener('dragend', () => {
            item.style.opacity = '1';
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  handleDragStart(e, folder) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'folder',
      id: folder.id
    }));
    e.target.style.opacity = '0.5';
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async handleDrop(e, targetFolder) {
    e.preventDefault();
    e.stopPropagation();

    const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
    
    if (data.type === 'conversation') {
      // 添加对话到文件夹
      if (!targetFolder.conversations.find(c => c.id === data.id)) {
        targetFolder.conversations.push({
          id: data.id,
          title: data.title,
          addedAt: Date.now()
        });
        await this.saveFolders();
        this.refreshUI();
        showToast('已添加到文件夹', 'success');
      }
    }
  }

  openFolder(folder) {
    // 展开/折叠文件夹
    const element = document.querySelector(`[data-folder-id="${folder.id}"]`);
    if (element) {
      element.classList.toggle('expanded');
    }
  }

  openConversation(conv) {
    // 导航到对话
    const convElement = document.querySelector(`[data-conversation-id="${conv.id}"]`);
    if (convElement) {
      convElement.click();
    }
  }

  refreshUI() {
    if (this.container) {
      this.container.remove();
      this.createUI();
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .kimi-voyager-folders {
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .kimi-voyager-folders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .kimi-voyager-folders-title {
        font-weight: 600;
        font-size: 14px;
        color: #e5e7eb;
      }
      
      .kimi-voyager-folders-add-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: #4f46e5;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: all 0.2s;
      }
      
      .kimi-voyager-folders-add-btn:hover {
        background: #4338ca;
        transform: scale(1.1);
      }
      
      .kimi-voyager-folders-empty {
        text-align: center;
        color: #9ca3af;
        font-size: 13px;
        padding: 16px;
      }
      
      .kimi-voyager-folder-item {
        margin-bottom: 4px;
        border-radius: 8px;
        transition: all 0.2s;
      }
      
      .kimi-voyager-folder-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .kimi-voyager-folder-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        cursor: pointer;
        border-radius: 8px;
      }
      
      .kimi-voyager-folder-icon {
        font-size: 16px;
      }
      
      .kimi-voyager-folder-name {
        flex: 1;
        font-size: 14px;
        color: #e5e7eb;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .kimi-voyager-folder-count {
        font-size: 12px;
        color: #6b7280;
      }
      
      .kimi-voyager-folder-actions {
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      .kimi-voyager-folder-item:hover .kimi-voyager-folder-actions {
        opacity: 1;
      }
      
      .kimi-voyager-folder-action-btn {
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
      }
      
      .kimi-voyager-folder-action-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #e5e7eb;
      }
      
      .kimi-voyager-folder-content {
        margin-left: 24px;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        padding-left: 8px;
      }
      
      .kimi-voyager-conversation-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        font-size: 13px;
        color: #9ca3af;
        cursor: pointer;
        border-radius: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .kimi-voyager-conversation-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #e5e7eb;
      }
      
      .kimi-voyager-context-menu {
        background: #374151;
        border-radius: 8px;
        padding: 4px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        min-width: 150px;
      }
      
      .kimi-voyager-menu-item {
        padding: 8px 12px;
        font-size: 14px;
        color: #e5e7eb;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
      }
      
      .kimi-voyager-menu-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .kimi-voyager-menu-item.danger {
        color: #ef4444;
      }
      
      .kimi-voyager-menu-item.danger:hover {
        background: rgba(239, 68, 68, 0.1);
      }
      
      /* 表单样式 */
      .kimi-voyager-form .form-group {
        margin-bottom: 16px;
      }
      
      .kimi-voyager-form label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 8px;
      }
      
      .kimi-voyager-form input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
      }
      
      .kimi-voyager-form input:focus {
        outline: none;
        border-color: #4f46e5;
      }
      
      .icon-selector, .color-selector {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .icon-btn, .color-btn {
        width: 36px;
        height: 36px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .icon-btn.selected, .color-btn.selected {
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
      }
      
      .icon-btn {
        font-size: 18px;
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    if (this.container) {
      this.container.remove();
    }
    this.isInitialized = false;
  }
}
