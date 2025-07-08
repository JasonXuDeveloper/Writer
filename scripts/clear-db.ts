import { DatabaseService } from "../src/services/database-service";
import { VectorService } from "../src/services/vector-service";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

async function clearDatabase() {
  try {
    console.log("Starting database cleanup...");

    // 初始化数据库服务
    const dbService = DatabaseService.getInstance();
    const vectorService = VectorService.getInstance();

    // 清空所有表
    const db = dbService.getDb();

    console.log("Clearing character_states...");
    await db.execute("DELETE FROM character_states");

    console.log("Clearing plots...");
    await db.execute("DELETE FROM plots");

    console.log("Clearing timelines...");
    await db.execute("DELETE FROM timelines");

    console.log("Clearing world_states...");
    await db.execute("DELETE FROM world_states");

    console.log("Clearing chapters...");
    await db.execute("DELETE FROM chapters");

    console.log("Clearing semantic_chunks...");
    await vectorService.clear();

    console.log("Database cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Database cleanup failed:", error);
    process.exit(1);
  }
}

clearDatabase();
