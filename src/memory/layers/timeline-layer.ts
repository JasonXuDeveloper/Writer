import { MemoryLayer } from "../memory-layer";
import { Env } from "../..";
import {
  timelines,
  TimelineState as DBTimeline,
  NewTimelineState,
  NewChapter,
} from "../../db/schema";
import { Timeline } from "../../types/memory/timeline";
import { eq, desc } from "drizzle-orm";

import { TimelineAgent } from "../../agents/memory/timeline-agent";
import { GenTimelineAgent } from "../../agents/memory/gen-timeline-agent";

export interface TimelineFetchInput {
  currentChapter: number;
}

export type TimelineFetchOutput = DBTimeline;

export interface TimelineUpdateInput {
  curTimeline: Timeline;
  newChapter: NewChapter;
}

/**
 * TimelineLayer - 时间线记忆层，用于维护严格的事件时间轴
 *
 * **Fetch**
 * - Input: {@link TimelineFetchInput}
 * - 返回指定章节的最新时间轴记录
 * - 如果是第0章，自动生成初始时间轴状态
 *
 * **Update**
 * - Input: {@link TimelineUpdateInput}
 * - 根据新章节内容更新时间轴，添加新事件，维护时间一致性
 *
 * @public
 */
export class TimelineLayer extends MemoryLayer<
  TimelineFetchInput,
  TimelineFetchOutput,
  TimelineUpdateInput
> {
  type = "timeline" as const;
  weight = 1.3;

  public constructor() {
    super();
  }

  async fetch(
    query: TimelineFetchInput,
    env: Env,
  ): Promise<TimelineFetchOutput> {
    const db = env.DATABASE_SERVICE.getDb();
    const result = await db
      .select()
      .from(timelines)
      .where(eq(timelines.current_chapter, query.currentChapter))
      .orderBy(desc(timelines.last_updated))
      .limit(1);

    if (result.length === 0) {
      if (query.currentChapter === 0) {
        // 初始时间轴状态，由 LLM 生成
        const agent = GenTimelineAgent.getInstance();
        const newTimeline = await agent.execute(env.NOVEL_CONFIG, env);
        const now = new Date();
        const newRecord: NewTimelineState = {
          current_chapter: 0,
          last_updated: now,
          timeline: newTimeline,
        };
        await db.insert(timelines).values(newRecord);
        return newRecord as TimelineFetchOutput;
      }
      throw new Error(`No timeline found for chapter ${query.currentChapter}`);
    }
    return result[0];
  }

  async update(content: TimelineUpdateInput, env: Env): Promise<void> {
    const db = env.DATABASE_SERVICE.getDb();
    const agent = TimelineAgent.getInstance();
    const newTimeline = await agent.execute(content, env);
    const now = new Date();
    const newRecord: NewTimelineState = {
      current_chapter: content.newChapter.chapterNumber,
      last_updated: now,
      timeline: newTimeline,
    };
    await db.insert(timelines).values(newRecord);
  }
}
