import { DatabaseService } from "./services/database-service";
import { VectorService } from "./services/vector-service";
import { EmbeddingService } from "./services/embedding-service";
import { NovelConfig } from "./types/novel-config";
import novelConfigJSON from "../novel.config.json";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

export interface Env {
  // 数据库服务
  DATABASE_SERVICE: DatabaseService;
  VECTOR_SERVICE: VectorService;

  // AI 服务
  EMBEDDING_SERVICE: EmbeddingService;

  // 配置
  NOVEL_CONFIG: NovelConfig;

  // 环境变量 - AI 配置
  OPENAI_API_KEY: string;
  OPENAI_EMBEDDING_MODEL: string;
  OPENROUTER_API_KEY: string;
}

/**
 * 初始化环境
 */
async function initializeEnv(): Promise<Env> {
  const env: Env = {} as Env;

  try {
    // 初始化数据库服务
    env.DATABASE_SERVICE = DatabaseService.getInstance();
    await env.DATABASE_SERVICE.initializeDatabase();

    // 初始化向量服务
    env.VECTOR_SERVICE = VectorService.getInstance();

    // 从小说配置中获取章节字数
    const novelConfig = (novelConfigJSON as any).novel_config as NovelConfig;
    const targetChapterWordCount =
      novelConfig.basic_settings.chapter_word_count;

    // 使用 OpenAI 配置初始化 EmbeddingService
    env.EMBEDDING_SERVICE = new EmbeddingService(
      process.env.OPENAI_API_KEY!,
      process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
    );

    env.NOVEL_CONFIG = novelConfig;

    // 设置环境变量
    env.OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
    env.OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
    env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

    console.log(
      `EmbeddingService initialized with target chapter word count: ${targetChapterWordCount}`,
    );
    console.log("All services initialized successfully");

    return env;
  } catch (error) {
    console.error("Failed to initialize services:", error);
    throw error;
  }
}

/**
 * 主函数 - 本地运行入口点
 */
async function main() {
  console.log("🚀 Starting Writer application...");
  
  try {
    const env = await initializeEnv();
    console.log("✅ Application initialized successfully");
    console.log("📝 Writer is ready to generate novel content");
    console.log("⏰ This application is designed to run as a scheduled job");
    console.log("🔧 Use 'pnpm run test:*' to test individual components");
    
    // 保持进程运行（可选）
    // process.on('SIGINT', () => {
    //   console.log('\n👋 Shutting down gracefully...');
    //   process.exit(0);
    // });

    process.exit(0);
    
  } catch (error) {
    console.error("💥 Application failed to start:", error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行main函数
if (require.main === module) {
  main();
}
