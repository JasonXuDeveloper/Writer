import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// OpenAI 模型的默认维度
const OPENAI_MODEL_DIMENSIONS: { [key: string]: number } = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 1536, // DB only support up to 2000
  "text-embedding-ada-002": 1536,
};

// 1. 读取 .env
const envPath = path.resolve(process.cwd(), ".env");
let embeddingDim: string | undefined = undefined;
if (fs.existsSync(envPath)) {
  const env = dotenv.parse(fs.readFileSync(envPath));
  embeddingDim = env.OPENAI_EMBEDDING_DIMENSIONS;
}

// 2. 如果没有明确设置维度，根据模型推断
if (!embeddingDim) {
  const env = dotenv.parse(fs.readFileSync(envPath, "utf-8"));
  const model = env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  
  if (OPENAI_MODEL_DIMENSIONS[model]) {
    embeddingDim = OPENAI_MODEL_DIMENSIONS[model].toString();
    console.log(`根据模型 ${model} 推断维度为 ${embeddingDim}`);
  }
}

// 3. fallback 到 novel.config.json
if (!embeddingDim) {
  const configPath = path.resolve(process.cwd(), "novel.config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    embeddingDim = config?.novel_config?.embedding_dimensions?.toString();
  }
}

// 4. 最后的 fallback
if (!embeddingDim) {
  embeddingDim = "1536"; // OpenAI 的默认维度
  console.log("使用 OpenAI 默认维度: 1536");
}

// 5. 替换 schema.ts
const schemaPath = path.resolve(process.cwd(), "src/db/schema.ts");
let schema = fs.readFileSync(schemaPath, "utf-8");
const replaced = schema.replace(
  /vector\("embedding", \{ dimensions: (\d+) \}\)/,
  `vector("embedding", { dimensions: ${embeddingDim} })`
);
if (schema !== replaced) {
  fs.writeFileSync(schemaPath, replaced, "utf-8");
  console.log(`已将 embedding 维度自动同步为 ${embeddingDim}`);
} else {
  console.log("embedding 维度未变化，无需同步。");
} 

process.exit(0);