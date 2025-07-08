import { MemoryLayer } from "../memory-layer";
import { Env } from "../..";
import {
  character_states,
  timelines,
  CharacterState as DBCharacterState,
  NewCharacterState,
  NewChapter,
} from "../../db/schema";
import { CharacterState as CharacterStateType } from "../../types/memory/character";
import { Timeline } from "../../types/memory/timeline";
import { eq, desc } from "drizzle-orm";

import { CharacterAgent } from "../../agents/memory/character-agent";
import { GenCharacterAgent } from "../../agents/memory/gen-character-agent";
import { TimelineLayer } from "./timeline-layer";

export interface CharacterFetchInput {
  currentChapter: number;
}

export type CharacterFetchOutput = DBCharacterState;

export interface CharacterUpdateInput {
  curState: CharacterStateType;
  newChapterInvolved: CharacterStateType;
  newChapter: NewChapter;
}

export class CharacterLayer extends MemoryLayer<
  CharacterFetchInput,
  CharacterFetchOutput,
  CharacterUpdateInput
> {
  type = "character" as const;
  weight = 1.4;

  public constructor() {
    super();
  }

  /**
   * 获取指定章节的角色状态
   * 
   * 该函数会返回前一章完整的角色状态。处理流程如下：
   * 1. 从数据库查询指定章节的角色状态
   * 2. 如果状态不存在且为第0章，则生成初始角色状态
   * 3. 如果状态不存在且非第0章，则抛出错误
   * 4. 对于已存在的状态，使用extract-agent提取角色信息
   * 5. 使用embedding匹配角色和角色组
   * 6. 将匹配结果通过prompt传递给LLM进行生成
   * 7. 对生成结果进行提取->匹配->替换->更新操作
   * 
   * @param query - 查询参数，包含当前章节号
   * @param env - 环境配置
   * @returns 角色状态记录
   */
  async fetch(
    query: CharacterFetchInput,
    env: Env,
  ): Promise<CharacterFetchOutput> {
    const db = env.DATABASE_SERVICE.getDb();
    const result = await db
      .select()
      .from(character_states)
      .where(eq(character_states.current_chapter, query.currentChapter))
      .orderBy(desc(character_states.last_updated))
      .limit(1);
    if (result.length === 0) {
      if (query.currentChapter === 0) {
        // 先获取时间线初始状态
        const timelineLayer = TimelineLayer.getInstance();
        const timelineResult = await timelineLayer.fetch({ currentChapter: 0 }, env);
        const timeline = timelineResult.timeline;
        // 初始角色状态，由 LLM 生成，并传递timeline
        const agent = GenCharacterAgent.getInstance();
        const newState = await agent.execute({ novelConfig: env.NOVEL_CONFIG, timeline }, env);
        const now = new Date();
        const newRecord: NewCharacterState = {
          current_chapter: 0,
          last_updated: now,
          state: newState,
        };
        await db.insert(character_states).values(newRecord);
        return newRecord as CharacterFetchOutput;
      }
      throw new Error(
        `No character state found for chapter ${query.currentChapter}`,
      );
    }
    return result[0];
  }

  async update(content: CharacterUpdateInput, env: Env): Promise<void> {
    const db = env.DATABASE_SERVICE.getDb();
    const agent = CharacterAgent.getInstance();

    // 使用 timeline-layer 获取上一章的时间轴
    let timeline: Timeline | undefined;
    try {
      const previousChapter = content.newChapter.chapterNumber - 1;
      const timelineLayer = TimelineLayer.getInstance();
      const timelineResult = await timelineLayer.fetch({ currentChapter: previousChapter }, env);
      timeline = timelineResult.timeline;
    } catch (error) {
      console.warn("无法获取上一章时间轴信息，将使用默认值");
    }

    const newState = await agent.execute({
      curState: content.newChapterInvolved,
      currentTimeline: timeline,
      newChapter: content.newChapter,
    }, env);

    // 将新状态中的角色和角色组按ID替换当前状态中的对应元素
    const updatedState = { ...content.curState };
    
    // 更新角色列表
    updatedState.characters = updatedState.characters.map(existingChar => {
      const newChar = newState.characters.find(c => c.character_id === existingChar.character_id);
      return newChar || existingChar;
    });
    
    // 添加新角色（不在当前状态中的）
    const existingCharIds = new Set(updatedState.characters.map(c => c.character_id));
    const newCharacters = newState.characters.filter(c => !existingCharIds.has(c.character_id));
    updatedState.characters.push(...newCharacters);
    
    // 更新角色组列表
    updatedState.character_groups = updatedState.character_groups.map(existingGroup => {
      const newGroup = newState.character_groups.find(g => g.group_id === existingGroup.group_id);
      return newGroup || existingGroup;
    });
    
    // 添加新角色组（不在当前状态中的）
    const existingGroupIds = new Set(updatedState.character_groups.map(g => g.group_id));
    const newGroups = newState.character_groups.filter(g => !existingGroupIds.has(g.group_id));
    updatedState.character_groups.push(...newGroups);
    
    // 使用更新后的状态
    const finalState = updatedState;

    const now = new Date();
    const newRecord: NewCharacterState = {
      current_chapter: content.newChapter.chapterNumber,
      last_updated: now,
      state: finalState,
    };
    await db.insert(character_states).values(newRecord);
  }
}
