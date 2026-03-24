# Contributing to Kimi Voyager

感谢您对 Kimi Voyager 的贡献！

## 开发流程

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 代码规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 提交信息遵循 Conventional Commits 规范

## 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型包括：
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建过程或辅助工具的变动

## 开发设置

```bash
# 克隆仓库
git clone https://github.com/yourusername/kimi-voyager.git
cd kimi-voyager

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build:chrome
npm run build:firefox
```

## 报告 Bug

请使用 GitHub Issues 报告 Bug，并包含以下信息：
- 浏览器版本
- 扩展版本
- 问题描述
- 复现步骤
- 期望行为
- 实际行为

## 功能建议

欢迎提出功能建议！请使用 GitHub Issues 并标记为 `enhancement`。
