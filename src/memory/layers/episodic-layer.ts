import { and, gte, lte, max } from "drizzle-orm";
import { Env } from "../..";
import { chapters } from "../../db/schema";
import { MemoryLayer } from "../memory-layer";

export interface EpisodicLayerFetchInput {
  chapterNumber: number; // 章节编号，会返回比该章节编号小的几个章节
  windowSize: number; // 返回的章节数量
}

export interface EpisodicLayerFetchOutput {
  chapters: string[];
}

/**
 * EpisodicLayer - a memory layer for retrieving recent chapters in sequence.
 *
 * @remarks
 * **Fetch**
 * - Input: {@link EpisodicLayerFetchInput}
 *   - `chapterNumber`: current chapter index
 *   - `windowSize`: number of preceding chapters to fetch
 * - Queries the database via {@link Env.DATABASE_SERVICE} for chapters with numbers < `chapterNumber`.
 * - Throws an error if `chapterNumber` exceeds the maximum stored chapter number.
 * - Returns: {@link EpisodicLayerFetchOutput} containing an array of chapter texts.
 *
 * **Update**
 * - Input: {@link NewChapter}
 * - No action required: new chapters are persisted directly to the database.
 *
 * @example
 * ```ts
 * import { EpisodicLayer } from './semantic-layer';
 * import { Env } from '../..';
 *
 * const layer = EpisodicLayer.getInstance();
 * const { chapters } = await layer.fetch({ chapterNumber: 10, windowSize: 3 }, env);
 * console.log(chapters);
 * // e.g., ['Chapter 7 text', 'Chapter 8 text', 'Chapter 9 text']
 *
 * // After a new chapter is added elsewhere:
 * await layer.update(newChapter, env);
 * ```
 *
 * @public
 */
export class EpisodicLayer extends MemoryLayer<
  EpisodicLayerFetchInput,
  EpisodicLayerFetchOutput,
  any
> {
  type = "episodic" as const;
  weight = 1.5;

  constructor() {
    super();
  }

  async fetch(
    query: EpisodicLayerFetchInput,
    env: Env,
  ): Promise<EpisodicLayerFetchOutput> {
    const db = env.DATABASE_SERVICE.getDb();
    // 获取比chapterNumber小的windowSize个章节（比如如果chapterNumber是10，windowSize是3，则返回第7、8、9章节）
    // 如果chapterNumber是10，但是db里最大的章节编号是3，则返回第1、2、3章节
    // 如果chapterNumber是1，但是db里最大的章节编号是3，则报错
    const maxChapterNumberResult = await db
      .select({ max: max(chapters.chapterNumber) })
      .from(chapters);
    const maxChapterNumber = maxChapterNumberResult[0]?.max || 0;

    if (query.chapterNumber > maxChapterNumber) {
      return {
        chapters: [],
      };
    }

    // 计算起始章节编号
    const startChapterNumber = Math.max(
      1,
      query.chapterNumber - query.windowSize,
    );
    const endChapterNumber = query.chapterNumber - 1;

    // 获取指定范围内的章节
    const recent = await db
      .select()
      .from(chapters)
      .where(
        and(
          gte(chapters.chapterNumber, startChapterNumber),
          lte(chapters.chapterNumber, endChapterNumber),
        ),
      )
      .orderBy(chapters.chapterNumber);

    return {
      chapters: recent.map((c) => c.text),
    };
  }

  update(content: any, env: Env): Promise<void> {
    // 什么也不用做，章节更新时会直接存到数据库中
    return Promise.resolve();
  }
}
