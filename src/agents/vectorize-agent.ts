import { Agent } from "./agent";
import { Env } from "..";

/**
 * VectorizeAgent is used to generate embeddings for a given input text.
 * It uses the EmbeddingService to generate the embeddings.
 */
export class VectorizeAgent implements Agent<string, any[]> {
  name = "VectorizeAgent";
  category = "memory" as const;

  async execute(input: string, env: Env): Promise<any[]> {
    return env.EMBEDDING_SERVICE.generateEmbedding(input);
  }
}
