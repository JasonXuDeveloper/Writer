# Writer - AI 小说生成器

一个基于 AI 的智能小说生成系统，使用 Neon/Postgres + pgvector 作为数据库，支持长期记忆和语义搜索。

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/Writer.git
cd Writer
```

### 2. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 3. 环境配置

复制环境变量模板并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，填写以下配置：

```bash
# OpenAI Embedding 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# OpenRouter LLM 配置
OPENROUTER_API_KEY=your_openrouter_api_key

# 数据库配置
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]
```

### 4. 数据库设置

#### 创建 Neon 数据库

1. 访问 [Neon](https://neon.tech) 并创建新项目

#### 向量维度自动同步

> **注意：**
> 
> 项目使用 OpenAI Text Embeddings，支持自动同步 embedding 维度，无需手动修改 schema。只需在 `.env` 中设置 `OPENAI_EMBEDDING_DIMENSIONS`，然后运行：
>
> ```bash
> pnpm run sync-embedding-dim
> ```
>
> 该命令会自动将 `src/db/schema.ts` 里的 embedding 维度同步为最新配置。

#### 运行数据库迁移

```bash
# 生成迁移文件
pnpm run db:generate

# 应用迁移到数据库
pnpm run db:migrate
```

### 5. 本地运行

```bash
# 启动开发服务器
pnpm run dev

# 或使用 npm
npm run dev
```

### 6. embedding 维度变更开发流程

1. 修改 `.env` 或 `novel.config.json` 的 `OPENAI_EMBEDDING_DIMENSIONS`
2. 运行 `pnpm run sync-embedding-dim`
3. 重新生成并应用数据库迁移

### 7. 本地测试

```bash
# 运行所有测试
pnpm run test:all

# 运行单个测试
pnpm run test:character    # 测试角色层
pnpm run test:plot         # 测试情节层
pnpm run test:timeline     # 测试时间线层
pnpm run test:world-state  # 测试世界观层
pnpm run test:theme        # 测试主题层
pnpm run test:semantic     # 测试语义层
pnpm run test:episodic     # 测试情节层

# 或者直接使用 tsx
tsx tests/local-test.ts [test-type]
```

## 🛠️ 开发指南

### 项目结构

```
Writer/
├── src/
│   ├── agents/          # AI 代理模块
│   ├── db/             # 数据库配置
│   ├── memory/         # 记忆系统
│   ├── services/       # 核心服务
│   └── types/          # TypeScript 类型定义
├── drizzle/            # 数据库迁移文件
├── tests/              # 测试文件
└── scripts/            # 工具脚本
```

### 数据库管理

```bash
# 生成新的迁移文件
pnpm run db:generate

# 应用迁移
pnpm run db:migrate

# 打开数据库管理界面
pnpm run db:studio

# 清空数据库 (谨慎使用)
pnpm run db:clear
```

### 代码质量

```bash
# 类型检查
npx tsc --noEmit

# 代码格式化 (需要安装 prettier)
npx prettier --write .

# 代码检查 (需要安装 eslint)
npx eslint .
```

## 📊 性能与成本

### 存储需求

- **关系型数据**: 约 29MB (1364 章节)
- **向量数据**: 约 21MB (3410 个向量)
- **总需求**: 约 50MB

### 成本估算

- **Neon**: 0 美元 (免费版)
- **OpenAI**: 约 5-10 美元/月 (取决于使用量)
- **OpenRouter**: 约 10-20 美元/月 (取决于使用量)
- **总成本**: 约 15-30 美元/月

## 🏗️ 架构

- **数据库**: Neon/Postgres + pgvector 扩展
- **向量搜索**: pgvector (PostgreSQL 向量扩展)
- **AI 服务**: OpenAI (嵌入) + OpenRouter (LLM)
- **部署**: GitHub Actions (支持 6 小时执行时间)

## ✨ 特性

- **智能分块**: 基于章节字数的自适应文本分块
- **语义搜索**: 使用 pgvector 进行高效的向量相似度搜索
- **长期记忆**: 多层级记忆系统 (角色、情节、时间线、世界观)
- **RAG 增强**: 检索增强生成，确保内容一致性

## 🛠️ 技术栈

- **数据库**: PostgreSQL + pgvector
- **ORM**: Drizzle ORM
- **向量搜索**: pgvector
- **AI**: OpenAI + OpenRouter
- **部署**: GitHub Actions
- **语言**: TypeScript
- **包管理**: pnpm

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 配置文件

项目需要一个配置文件来定义小说生成参数。请从示例文件复制并重命名：

```bash
cp novel.config.example.json novel.config.json
```

然后根据需要编辑 `novel.config.json`。

示例文件包含所有默认配置选项。

## 🆘 常见问题

### Q: 如何获取 OpenAI API Key？

A: 访问 [OpenAI Platform](https://platform.openai.com/api-keys) 创建 API Key。

### Q: 如何获取 OpenRouter API Key？

A: 访问 [OpenRouter](https://openrouter.ai/keys) 注册并获取 API Key。

### Q: 数据库迁移失败怎么办？

A: 检查 DATABASE_URL 配置，确保 Neon 项目已启用 pgvector 扩展。

### Q: 如何监控应用性能？

A: 使用 Neon Dashboard 查看数据库性能，或集成第三方监控服务。

### Q: 为什么使用 OpenRouter？

A: OpenRouter 提供了对多种大语言模型的访问，方便切换和测试，并且通常比直接使用原始模型更具成本效益。

### Q: 如何重置数据库？

A: 运行 `pnpm run db:clear`，此命令会删除所有表并重新运行迁移。**请谨慎操作！**
