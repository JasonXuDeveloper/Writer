import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../db/schema";

export class DatabaseService {
  private static instance: DatabaseService;
  private db: ReturnType<typeof drizzle<typeof schema>>;
  private client: postgres.Sql;

  private constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    this.client = postgres(connectionString);
    this.db = drizzle(this.client, { schema });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getDb() {
    return this.db;
  }

  /**
   * 初始化数据库，创建必要的扩展
   */
  public async initializeDatabase(): Promise<void> {
    try {
      // 启用 pgvector 扩展
      await this.client`CREATE EXTENSION IF NOT EXISTS vector`;
      console.log("Database initialized with pgvector extension");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
    await this.client.end();
  }
}
