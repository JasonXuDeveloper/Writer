import { DatabaseService } from "./database-service";
import { semantic_chunks } from "../db/schema";
import { eq, and, desc, sql, cosineDistance } from "drizzle-orm";

export interface VectorMatch {
  id: string;
  score: number;
  metadata: any;
}

export interface VectorSearchOptions {
  filter?: Record<string, any>;
  maxResults?: number;
  returnMetadata?: "all" | "none";
}

export class VectorService {
  private static instance: VectorService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): VectorService {
    if (!VectorService.instance) {
      VectorService.instance = new VectorService();
    }
    return VectorService.instance;
  }

  /**
   * 向量相似度搜索
   */
  async query(
    vector: number[],
    options: VectorSearchOptions = {},
  ): Promise<{ matches: VectorMatch[] }> {
    const db = this.dbService.getDb();
    const { filter, maxResults = 50, returnMetadata = "all" } = options;

    try {
      // 构建查询条件
      let whereConditions = [];

      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          whereConditions.push(sql`metadata->>${key} = ${value}`);
        }
      }

      // 计算相似度分数
      const similarity = sql<number>`1 - (${cosineDistance(semantic_chunks.embedding, vector)})`;

      // 执行向量相似度搜索
      let result;
      if (whereConditions.length === 0) {
        result = await db
          .select({
            id: semantic_chunks.id,
            content: semantic_chunks.content,
            metadata: semantic_chunks.metadata,
            similarity,
          })
          .from(semantic_chunks)
          .orderBy(desc(similarity))
          .limit(maxResults);
      } else if (whereConditions.length === 1) {
        result = await db
          .select({
            id: semantic_chunks.id,
            content: semantic_chunks.content,
            metadata: semantic_chunks.metadata,
            similarity,
          })
          .from(semantic_chunks)
          .where(whereConditions[0])
          .orderBy(desc(similarity))
          .limit(maxResults);
      } else {
        result = await db
          .select({
            id: semantic_chunks.id,
            content: semantic_chunks.content,
            metadata: semantic_chunks.metadata,
            similarity,
          })
          .from(semantic_chunks)
          .where(and(...whereConditions))
          .orderBy(desc(similarity))
          .limit(maxResults);
      }

      // 转换结果格式
      const matches: VectorMatch[] = result.map((row) => ({
        id: row.id,
        score: row.similarity,
        metadata: returnMetadata === "all" ? row.metadata : undefined,
      }));

      return { matches };
    } catch (error) {
      console.error("Vector search failed:", error);
      return { matches: [] };
    }
  }

  /**
   * 批量插入向量
   */
  async upsert(
    vectors: Array<{
      id: string;
      values: number[];
      metadata: any;
    }>,
  ): Promise<void> {
    const db = this.dbService.getDb();

    try {
      // 批量插入或更新向量
      const values = vectors.map((v) => ({
        id: v.id,
        content: v.metadata.content || "",
        embedding: v.values, // 直接使用 number[] 数组
        metadata: v.metadata,
      }));

      await db
        .insert(semantic_chunks)
        .values(values)
        .onConflictDoUpdate({
          target: semantic_chunks.id,
          set: {
            content: sql`EXCLUDED.content`,
            embedding: sql`EXCLUDED.embedding`,
            metadata: sql`EXCLUDED.metadata`,
          },
        });

      console.log(`Upserted ${vectors.length} vectors successfully`);
    } catch (error) {
      console.error("Vector upsert failed:", error);
      throw error;
    }
  }

  /**
   * 删除向量
   */
  async delete(id: string): Promise<void> {
    const db = this.dbService.getDb();

    try {
      await db.delete(semantic_chunks).where(eq(semantic_chunks.id, id));
    } catch (error) {
      console.error("Vector delete failed:", error);
      throw error;
    }
  }

  /**
   * 清空所有向量
   */
  async clear(): Promise<void> {
    const db = this.dbService.getDb();

    try {
      await db.delete(semantic_chunks);
      console.log("All vectors cleared successfully");
    } catch (error) {
      console.error("Vector clear failed:", error);
      throw error;
    }
  }
}
