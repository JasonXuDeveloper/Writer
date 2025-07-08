import { MemoryLayer } from "../memory-layer";
import { Env } from "../..";
import {
  world_states,
  NewWorldState,
  WorldState,
  NewChapter,
} from "../../db/schema";
import { WorldStateAgent } from "../../agents/memory/world-state-agent";
import { desc, eq } from "drizzle-orm";
import { GenWorldStateAgent } from "../../agents/memory/gen-world-state-agent";

export interface WorldStateFetchInput {
  currentChapter: number;
}

export interface WorldStateUpdateInput {
  newChapter: NewChapter;
  curWorldState: WorldState;
}

export type WorldStateFetchOutput = Omit<WorldState, "id">;

/**
 * WorldStateLayer - a memory layer for storing and retrieving world state settings.
 *
 * **Fetch**
 * - Input: {@link WorldStateFetchInput}
 * - Returns the latest world state record.
 *
 * **Update**
 * - Input: {@link NewWorldState}
 * - Inserts a new world state record into the database.
 *
 * @public
 */
export class WorldStateLayer extends MemoryLayer<
  WorldStateFetchInput,
  WorldStateFetchOutput,
  WorldStateUpdateInput
> {
  type = "worldState" as const;
  weight = 1.2;

  public constructor() {
    super();
  }

  async fetch(
    query: WorldStateFetchInput,
    env: Env,
  ): Promise<WorldStateFetchOutput> {
    const db = env.DATABASE_SERVICE.getDb();
    const result: WorldState[] = await db
      .select()
      .from(world_states)
      .where(eq(world_states.current_chapter, query.currentChapter))
      .orderBy(desc(world_states.last_updated))
      .limit(1);
    if (result.length === 0) {
      // 0 is the initial world state
      if (query.currentChapter === 0) {
        // Generate the initial world state
        const agent = GenWorldStateAgent.getInstance();
        const newWorld = await agent.execute(env.NOVEL_CONFIG, env);
        const newState: NewWorldState = {
          last_updated: new Date(),
          current_chapter: 0,
          world: newWorld,
        };
        await db.insert(world_states).values(newState);
        return newState as WorldStateFetchOutput;
      }
      // If the current chapter is not 0, it means the world state is not initialized
      throw new Error(
        `No world state found in database for chapter ${query.currentChapter}`,
      );
    }
    return result[0];
  }

  async update(content: WorldStateUpdateInput, env: Env): Promise<void> {
    const db = env.DATABASE_SERVICE.getDb();
    const agent = WorldStateAgent.getInstance();
    // Generate only the world object via LLM
    const newWorld = await agent.execute(content, env);
    // Build and insert new world state record
    const now = new Date();
    const newState: NewWorldState = {
      last_updated: now,
      current_chapter: content.newChapter.chapterNumber,
      world: newWorld,
    };
    await db.insert(world_states).values(newState);
  }
}
