# 热水的茶壶 🫖

一个优雅的LLM对话网站,支持管理员管理prompt模板,用户可以选择模板进行AI对话。

## 特性

- ✨ **优雅的茶文化主题设计** - 温暖的配色方案,营造舒适的对话氛围
- 🎯 **Prompt模板管理** - 管理员可以创建、编辑、删除prompt模板
- 📝 **Markdown文件上传** - 支持通过上传Markdown文件来设置prompt内容
- 💬 **流畅的对话体验** - 基于Gemini 2.0 Flash的AI对话功能
- 📥 **对话导出** - 每条AI回复都可以导出为高清图片
- 🌐 **游客访问** - 无需登录即可使用对话功能
- 📱 **移动端优化** - 完美支持移动设备触摸操作

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS 4
- **后端**: Express 4 + tRPC 11
- **数据库**: MySQL/TiDB (Drizzle ORM)
- **AI模型**: Gemini 2.0 Flash
- **认证**: Manus OAuth

## 快速开始

### 环境要求

- Node.js 22+
- pnpm 10+
- MySQL 或 TiDB 数据库

### 安装

```bash
# 克隆仓库
git clone https://github.com/rbqbbq929-svg/hot-teapot.git
cd hot-teapot

# 安装依赖
pnpm install
```

### 配置环境变量

创建 `.env` 文件并配置以下变量:

```env
# 数据库
DATABASE_URL=mysql://user:password@host:port/database

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# JWT密钥
JWT_SECRET=your_jwt_secret

# OAuth配置
OAUTH_SERVER_URL=your_oauth_server_url
VITE_OAUTH_PORTAL_URL=your_oauth_portal_url
VITE_APP_ID=your_app_id

# 网站配置
VITE_APP_TITLE=热水的茶壶
VITE_APP_LOGO=/teapot.png
```

### 数据库迁移

```bash
pnpm db:push
```

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看网站。

## 使用说明

### 普通用户

1. 访问首页,浏览可用的prompt模板
2. 点击模板卡片的"开始对话"按钮
3. 在对话页面输入问题,与AI进行交流
4. 点击AI回复下方的"导出为图片"按钮可以保存对话内容

### 管理员

1. 登录后点击顶部导航栏的"管理"按钮
2. 创建新的prompt模板,设置标题、描述和内容
3. 支持直接编辑或上传Markdown文件
4. 可以编辑或删除现有模板

## 项目结构

```
hot-teapot/
├── client/              # 前端代码
│   ├── public/         # 静态资源
│   └── src/
│       ├── pages/      # 页面组件
│       ├── components/ # UI组件
│       └── lib/        # 工具库
├── server/             # 后端代码
│   ├── _core/         # 核心功能
│   ├── db.ts          # 数据库查询
│   └── routers.ts     # API路由
├── drizzle/           # 数据库schema
└── shared/            # 共享代码
```

## 开发指南

### 添加新的prompt模板

管理员可以通过管理页面添加新模板,或者直接在数据库中插入:

```sql
INSERT INTO prompt_templates (title, description, content, created_by)
VALUES ('模板标题', '模板描述', '模板内容', 管理员用户ID);
```

### 自定义主题

编辑 `client/src/index.css` 文件中的CSS变量来自定义配色方案。

## 部署

项目支持部署到任何支持Node.js的平台。推荐使用Manus平台一键部署。

## 贡献

欢迎提交Issue和Pull Request!

## 许可证

MIT License

## 作者

今天要喝点热水吗

## 致谢

- 感谢Manus平台提供的开发环境
- 感谢Google Gemini提供的AI能力
