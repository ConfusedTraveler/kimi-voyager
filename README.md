# 🚀 Kimi Voyager

<p align="center">
  <img src="docs/assets/logo.png" alt="Kimi Voyager Logo" width="128">
</p>

<p align="center">
  <strong>让 Kimi AI 体验更上一层楼 ✨</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Chrome-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome"></a>
  <a href="#"><img src="https://img.shields.io/badge/Edge-0078D7?style=flat-square&logo=microsoftedge&logoColor=white" alt="Edge"></a>
  <a href="#"><img src="https://img.shields.io/badge/Firefox-FF7139?style=flat-square&logo=firefox&logoColor=white" alt="Firefox"></a>
  <a href="#"><img src="https://img.shields.io/badge/Safari-000000?style=flat-square&logo=safari&logoColor=white" alt="Safari"></a>
</p>

<p align="center">
  <a href="https://github.com/ConfusedTraveler/kimi-voyager/stargazers"><img src="https://img.shields.io/github/stars/ConfusedTraveler/kimi-voyager?style=flat-square&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/ConfusedTraveler/kimi-voyager/releases"><img src="https://img.shields.io/github/v/release/ConfusedTraveler/kimi-voyager?style=flat-square&logo=github" alt="Latest version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/ConfusedTraveler/kimi-voyager?style=flat-square" alt="License"></a>
</p>

---

## 🌟 简介

**Kimi Voyager** 是一个专为 [Kimi AI](https://kimi.moonshot.cn) 打造的全能增强浏览器扩展。它集成了文件夹管理、时间轴导航、提示词库、聊天记录导出等众多实用功能，让你的 AI 对话体验更加高效、有序。

> 💡 灵感来源于 [Gemini Voyager](https://github.com/Nagi-ovo/gemini-voyager)，专门为 Kimi AI 用户量身定制。

---

## ✨ 功能特性

### 📂 文件夹管理
- 支持两级文件夹层级结构
- 拖拽式聊天会话组织
- 自定义文件夹颜色和图标
- 跨会话持久化存储

### 🕐 时间轴导航
- 可视化消息节点跳转
- 星标重要对话片段
- 快速定位历史消息
- 支持对话分支管理

### 💡 提示词库
- 保存常用提示词模板
- 支持变量替换
- 快速插入到输入框
- 导入/导出提示词集合

### 💾 聊天导出
- 支持多种格式：JSON、Markdown、HTML、PDF
- 保留对话格式和图片
- 批量导出功能
- 自定义导出模板

### 🛠️ 增强工具
- **批量删除**：一键清理多个对话
- **引用回复**：选择文本快速引用
- **标签页标题同步**：自动同步浏览器标签标题
- **输入框增强**：可折叠输入区域
- **防自动滚动**：发送消息时防止页面自动跳转

### 🎨 个性化
- 多种视觉特效（雪花、樱花、雨滴）
- 深色/浅色主题适配
- 自定义 CSS 样式

---

## 📦 安装

### 应用商店安装（推荐）

- [Chrome Web Store](https://chrome.google.com/webstore) ⏳ 审核中
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons) ⏳ 审核中
- [Firefox Add-ons](https://addons.mozilla.org) ⏳ 审核中

### 手动安装

#### Chrome / Edge / 其他 Chromium 浏览器

1. 下载最新版本的 [kimi-voyager-chrome.zip](https://github.com/ConfusedTraveler/kimi-voyager/releases/latest)
2. 解压下载的文件
3. 打开浏览器，进入 `chrome://extensions/`
4. 开启右上角的「开发者模式」
5. 点击「加载已解压的扩展程序」
6. 选择解压后的文件夹

#### Firefox

1. 下载最新版本的 [kimi-voyager-firefox.zip](https://github.com/ConfusedTraveler/kimi-voyager/releases/latest)
2. 打开 Firefox，进入 `about:addons`
3. 点击齿轮图标，选择「从文件安装附加组件」
4. 选择下载的 `.zip` 文件

---

## 🚀 使用方法

### 基本使用

1. 安装扩展后，访问 [Kimi AI](https://kimi.moonshot.cn)
2. 点击浏览器工具栏的 Kimi Voyager 图标打开设置面板
3. 根据需要启用各项功能

### 文件夹管理

1. 点击 Kimi 侧边栏的「新建文件夹」按钮
2. 将对话拖拽到文件夹中进行组织
3. 右键文件夹可进行重命名、删除等操作

### 提示词库

1. 在输入框中编写提示词
2. 点击输入框右侧的「保存到提示词库」按钮
3. 在需要时点击「提示词库」按钮快速插入

### 导出对话

1. 打开需要导出的对话
2. 点击 Kimi Voyager 面板中的「导出」按钮
3. 选择导出格式和目标位置

---

## 🛠️ 开发

### 环境要求

- Node.js >= 18
- npm 或 yarn

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/ConfusedTraveler/kimi-voyager.git
cd kimi-voyager

# 安装依赖
npm install

# 开发模式（Chrome）
npm run dev

# 构建 Chrome 版本
npm run build:chrome

# 构建 Firefox 版本
npm run build:firefox
```

### 项目结构

```
kimi-voyager/
├── manifest.json          # 扩展清单文件
├── package.json           # 项目配置
├── src/
│   ├── content/          # 内容脚本（注入到 Kimi 页面）
│   ├── background/       # 后台服务脚本
│   ├── popup/            # 弹出窗口
│   ├── options/          # 选项页面
│   ├── components/       # 共享组件
│   ├── utils/            # 工具函数
│   ├── styles/           # 样式文件
│   └── assets/           # 静态资源
└── docs/                 # 文档
```

---

## 🤝 贡献

我们欢迎各种形式的贡献！

- 🐛 提交 Bug 报告
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复或新功能

请查看 [CONTRIBUTING.md](.github/CONTRIBUTING.md) 了解详细的贡献指南。

---

## 📄 许可证

本项目采用 [GPL-3.0](LICENSE) 许可证开源。

---

## 🙏 致谢

- 灵感来源于 [Gemini Voyager](https://github.com/Nagi-ovo/gemini-voyager) by [@Nagi-ovo](https://github.com/Nagi-ovo)
- 感谢 [Moonshot AI](https://moonshot.cn) 提供优秀的 Kimi AI 服务
- 感谢所有贡献者和用户 ❤️

---

<p align="center">
  Made with ❤️ for Kimi AI users
</p>
