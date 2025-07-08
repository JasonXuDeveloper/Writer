/// <reference types="jest" />
// @ts-nocheck
import { initializeTestEnv, TestEnv } from "./utils/test-env";

jest.setTimeout(1200000);

describe('EmbeddingService', () => {
  let env: TestEnv;
  beforeAll(() => { env = initializeTestEnv(); });
  it('generateEmbedding returns values for various texts', async () => {
    const texts = ['alice', 'bob', '萧瑾宸', '林小月'];
    const embeddings = [];
    
    // 生成所有文本的embedding
    for (const text of texts) {
      const embedding = await env.EMBEDDING_SERVICE.generateEmbedding(text);
      expect(Array.isArray(embedding)).toBe(true);
      expect(Array.isArray(embedding[0].values)).toBe(true);
      expect(typeof embedding[0].values[0]).toBe('number');
      embeddings.push(embedding[0].values);
    }
    
    // 验证不同文本之间的向量相似度很低
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
        expect(similarity).toBeLessThan(0.7); // 相似度应该低于0.8
      }
    }
    
    // 辅助函数：计算余弦相似度
    function cosineSimilarity(vec1: number[], vec2: number[]): number {
      const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
      const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
      return dotProduct / (magnitude1 * magnitude2);
    }
  });
}); 