import { MemoryLayer } from "../memory-layer";
import { Env } from "../..";
import { plots, NewPlot, Plot } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { NewChapter } from "../../db/schema";
import { PlotConfig } from "../../types/memory/plot";
import { PlotAgent } from "../../agents/memory/plot-agent";

export interface PlotFetchInput {
  currentChapter: number;
}

export type PlotFetchOutput = Plot;

export interface PlotUpdateInput {
  curPlot: PlotConfig;
  newChapter: NewChapter;
}

/**
 * PlotMemoryLayer - a memory layer for recording foreshadowings, conflicts, and character goals.
 *
 * **Fetch**
 * - Input: {@link PlotFetchInput}
 * - Returns the latest plot memory record for the given chapter.
 *
 * **Update**
 * - Input: {@link PlotMemoryUpdateInput}
 * - Inserts a new plot memory record generated after a valid chapter.
 */
export class PlotLayer extends MemoryLayer<
  PlotFetchInput,
  PlotFetchOutput,
  PlotUpdateInput
> {
  type = "plot" as const;
  weight = 1.3;

  public constructor() {
    super();
  }

  async fetch(query: PlotFetchInput, env: Env): Promise<PlotFetchOutput> {
    const db = env.DATABASE_SERVICE.getDb();
    const result = await db
      .select()
      .from(plots)
      .where(eq(plots.current_chapter, query.currentChapter))
      .orderBy(desc(plots.last_updated))
      .limit(1);
    if (result.length === 0) {
      if (query.currentChapter === 0) {
        // initial empty plot memory
        const initial: PlotFetchOutput = {
          current_chapter: 0,
          last_updated: new Date(),
          plot: {
            foreshadowings: [],
            conflicts: [],
            character_goals: [],
          },
        };
        await db.insert(plots).values(initial);
        return initial;
      }
      throw new Error(
        `No plot memory found for chapter ${query.currentChapter}`,
      );
    }
    return result[0];
  }

  async update(content: PlotUpdateInput, env: Env): Promise<void> {
    const db = env.DATABASE_SERVICE.getDb();
    const agent = PlotAgent.getInstance();
    // Generate only the world object via LLM
    const newPlot = await agent.execute(content, env);
    // Build and insert new world state record
    const now = new Date();
    const newState: NewPlot = {
      last_updated: now,
      current_chapter: content.newChapter.chapterNumber,
      plot: newPlot,
    };
    await db.insert(plots).values(newState);
  }
}
