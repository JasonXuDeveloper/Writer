import { Env } from "../..";
import { MemoryLayer } from "../memory-layer";
import { VectorService, VectorMatch } from "../../services/vector-service";

export enum SemanticLayerType {
  VOLUME = "volume",
  ARC = "arc",
  CHAPTER_SUMMARY = "chapter_summary",
  CHAPTER_CONTENT = "chapter_content",
}

// Metadata shape for semantic memory entries
export interface SemanticLayerMetadata {
  id: string;
  type: SemanticLayerType;
  segment: number;
  timestamp: number;
  chunkSize: number;
  content?: string;
  [key: string]: any;
}

export interface SemanticLayerFetchInput {
  query: string;
  type: SemanticLayerType;
  maxResults?: number;
}

export interface SemanticLayerFetchOutput {
  results: { id: string; metadata: SemanticLayerMetadata; score: number }[];
}

export interface SemanticLayerUpdateInput {
  type: SemanticLayerType;
  content: string;
  metadata: { id: string; [key: string]: any };
}

/**
 * SemanticLayer - a semantic memory layer enabling advanced Retrieval-Augmented Generation (RAG).
 *
 * @remarks
 * **Fetch**
 * - Input: {@link SemanticLayerFetchInput}
 * - Embeds the query into chunk vectors.
 * - Queries the vector database with retry/backoff and type filter.
 * - Flattens all matches, deduplicates by `metadata.id` (highest score),
 *   sorts by `metadata.timestamp` (newest → oldest), and applies `maxResults` limit.
 * - Returns: {@link SemanticLayerFetchOutput}
 *
 * **Update**
 * - Input: {@link SemanticLayerUpdateInput}
 * - Embeds content into chunk vectors using chapter-aware chunking.
 * - Augments metadata with `segment` index, `timestamp`, and `chunkSize`.
 * - Batch upserts all chunks with retry/backoff.
 *
 * @example
 * ```ts
 * import { SemanticLayer, SemanticLayerType } from './semantic-layer';
 *
 * const layer = SemanticLayer.getInstance();
 * // Retrieve context
 * const { results } = await layer.fetch({
 *   query: llmGeneratedText,
 *   type: SemanticLayerType.VOLUME,
 *   maxResults: 20
 * }, env);
 *
 * for (const { id, metadata, score } of results) {
 *   // Use metadata (id, segment, timestamp, chunkSize) to build your prompt
 * }
 *
 * // Update after LLM generation
 * await layer.update({
 *   type: SemanticLayerType.VOLUME,
 *   content: 'Generated chapter text...',
 *   metadata: { id: 'chapter-1' }
 * }, env);
 * ```
 *
 * @public
 */
export class SemanticLayer extends MemoryLayer<
  SemanticLayerFetchInput,
  SemanticLayerFetchOutput,
  SemanticLayerUpdateInput
> {
  type = "semantic" as const;
  weight = 1.0;

  // Default global limit for fetch results
  private static readonly DEFAULT_MAX_RESULTS = 50;

  // Retry helper with exponential backoff
  private static async retryOperation<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 100,
  ): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      if (retries <= 0) throw err;
      await new Promise((res) => setTimeout(res, delay));
      return this.retryOperation(operation, retries - 1, delay * 2);
    }
  }

  async fetch(
    query: SemanticLayerFetchInput,
    env: Env,
  ): Promise<SemanticLayerFetchOutput> {
    // Embed the query into chunk vectors
    const embeddings = await env.EMBEDDING_SERVICE.generateEmbedding(
      query.query,
    );
    const filter = { type: query.type };

    // Perform concurrent searches with retry and collect matches
    const vectorService = VectorService.getInstance();
    const matchesArrays = await Promise.all(
      embeddings.map((vec) => {
        const vector = vec.values;
        if (!vector || vector.length === 0)
          return Promise.resolve([] as VectorMatch[]);
        return SemanticLayer.retryOperation(() =>
          vectorService.query(vector, { filter, returnMetadata: "all" }),
        )
          .then((res) => res.matches ?? [])
          .catch((err) => {
            console.error("Vector query failed", err);
            return [];
          });
      }),
    );

    // Stage 1: flatten all matches
    const coarseMatches = matchesArrays.flat() as VectorMatch[];

    // Stage 2: group by original doc ID to pick best per document
    const grouped = new Map<string, VectorMatch>();
    coarseMatches.forEach((m) => {
      const meta = m.metadata as SemanticLayerMetadata;
      const docId = meta.id;
      if (!docId) return;
      const existing = grouped.get(docId);
      if (!existing || m.score > existing.score) grouped.set(docId, m);
    });

    // Refined matches
    const fused = Array.from(grouped.values());

    // Sort newest to oldest by timestamp
    fused.sort((a, b) => {
      const ta = (a.metadata as SemanticLayerMetadata).timestamp ?? 0;
      const tb = (b.metadata as SemanticLayerMetadata).timestamp ?? 0;
      return tb - ta;
    });

    // Apply global limit
    const max = query.maxResults ?? SemanticLayer.DEFAULT_MAX_RESULTS;
    const limited = fused.slice(0, max);

    // Map to output
    const results = limited.map((m) => ({
      id: m.id,
      metadata: m.metadata as SemanticLayerMetadata,
      score: m.score,
    }));

    return { results };
  }

  async update(content: SemanticLayerUpdateInput, env: Env): Promise<void> {
    // Get chunking info for metadata
    const chunkingInfo = env.EMBEDDING_SERVICE.getChunkingInfo();

    // Embed content and build docs array with timestamped metadata
    const embeddings = await env.EMBEDDING_SERVICE.generateEmbedding(
      content.content,
    );
    const vectorService = VectorService.getInstance();

    const vectors = embeddings
      .filter((e) => {
        const vector = e.values;
        return vector && vector.length > 0;
      })
      .map((e, idx) => ({
        id: content.metadata.id
          ? `${content.metadata.id}-${idx}`
          : `${content.type}-${Date.now()}-${idx}`,
        values: e.values!,
        metadata: {
          ...content.metadata,
          type: content.type,
          segment: idx,
          timestamp: Date.now(),
          chunkSize: chunkingInfo.chunkSize,
          content: content.content, // 存储原始内容
        },
      }));

    // Batch upsert all chunks with retry
    if (vectors.length > 0) {
      console.log(
        `Upserting ${vectors.length} semantic chunks for ${content.type} with chunk size ${chunkingInfo.chunkSize}`,
      );
      await SemanticLayer.retryOperation(() => vectorService.upsert(vectors));
    }
  }
}
