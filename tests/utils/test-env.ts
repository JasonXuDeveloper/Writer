// tests/utils/test-env.ts
// 提供测试环境初始化函数，所有测试共用
import { DatabaseService } from "../../src/services/database-service";
import { VectorService } from "../../src/services/vector-service";
import { EmbeddingService } from "../../src/services/embedding-service";
import novelConfigJSON from "../../novel.config.json";
import dotenv from "dotenv";

dotenv.config();

export interface TestEnv {
  DATABASE_SERVICE: DatabaseService;
  VECTOR_SERVICE: VectorService;
  EMBEDDING_SERVICE: EmbeddingService;
  NOVEL_CONFIG: any;
  OPENROUTER_API_KEY: string;
  OPENAI_API_KEY: string;
  OPENAI_EMBEDDING_MODEL: string;
}

export function initializeTestEnv(): TestEnv {
  const databaseService = DatabaseService.getInstance();
  const vectorService = VectorService.getInstance();
  const embeddingService = new EmbeddingService(
    process.env.OPENAI_API_KEY!,
    process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
  );

  return {
    DATABASE_SERVICE: databaseService,
    VECTOR_SERVICE: vectorService,
    EMBEDDING_SERVICE: embeddingService,
    NOVEL_CONFIG: (novelConfigJSON as any).novel_config,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  };
} 