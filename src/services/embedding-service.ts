import OpenAI from "openai";

export class EmbeddingService {
  private client: OpenAI;
  private modelName: string;
  private dimensions?: number;

  constructor(
    apiKey: string,
    modelName: string = "text-embedding-3-small",
    dimensions?: number,
  ) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required.");
    }
    this.client = new OpenAI({ apiKey });
    this.modelName = modelName;
    this.dimensions = dimensions;
  }

  /**
   * 使用智能分块策略
   * 确保每个块都有足够的上下文和语义完整性
   */
  private chunkTextWithChapterAwareness(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;
    const chunkSize = 2048; // 固定分块大小

    while (start < text.length) {
      let end = start + chunkSize;

      // 如果这不是最后一个块，尝试在语义边界分割
      if (end < text.length) {
        // 优先在段落边界分割
        const paragraphEnd = text.lastIndexOf("\n\n", end);
        // 其次在句子边界分割
        const sentenceEnd = text.lastIndexOf("。", end);
        const questionEnd = text.lastIndexOf("？", end);
        const exclamationEnd = text.lastIndexOf("！", end);
        const bestSentenceEnd = Math.max(
          sentenceEnd,
          questionEnd,
          exclamationEnd,
        );

        // 选择最佳分割点
        let bestEnd = end;
        if (paragraphEnd > start + chunkSize * 0.6) {
          bestEnd = paragraphEnd + 2; // 包含换行符
        } else if (bestSentenceEnd > start + chunkSize * 0.7) {
          bestEnd = bestSentenceEnd + 1; // 包含标点符号
        }

        end = bestEnd;
      }

      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // 计算下一个块的起始位置，确保有重叠
      const overlapSize = Math.floor(chunkSize * 0.15);
      start = end - overlapSize;
      if (start >= text.length) break;
    }

    return chunks;
  }

  /**
   * 获取当前分块配置信息
   */
  getChunkingInfo(): {
    chunkSize: number;
    overlapSize: number;
    maxTokens: number;
  } {
    return {
      chunkSize: 2048,
      overlapSize: Math.floor(2048 * 0.15),
      maxTokens: 8191, // text-embedding-ada-002 and text-embedding-3-small limit
    };
  }

  async generateEmbedding(text: string): Promise<any[]> {
    const contents: string[] = this.chunkTextWithChapterAwareness(text);
    const minChunkSize = Math.floor(2048 * 0.1);
    let validContents: string[];
    if (contents.length === 1 && contents[0].trim().length > 0) {
      validContents = contents;
    } else {
      validContents = contents.filter(
        (chunk) => chunk.length >= minChunkSize && chunk.trim().length > 0,
      );
    }
    if (validContents.length === 0) {
      throw new Error("No valid text chunks found");
    }
    try {
      const response = await this.client.embeddings.create({
        model: this.modelName,
        input: validContents,
        dimensions: this.dimensions,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("No embeddings returned from OpenAI");
      }

      const embeddings = response.data.map((embedding) => ({
        values: embedding.embedding,
      }));

      return embeddings;

    } catch (error) {
      console.error("OpenAI Embedding API error:", error);
      console.error("Model name:", this.modelName);
      throw error;
    }
  }
}
