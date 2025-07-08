import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { CharacterState } from "../../types/memory/character";
import { Timeline } from "../../types/memory/timeline";
import { CharacterUpdateInput } from "../../memory/layers/character-layer";
import { CHARACTER_STATE_RESPONSE_FORMAT } from "./character-schema";
import { NewChapter } from "../../db/schema";

const CHARACTER_AGENT_CONFIG: AgentConfig = {
  models: ["deepseek/deepseek-r1-0528-qwen3-8b:free", "microsoft/mai-ds-r1:free"],
  temperature: 0,
  max_tokens: 60000,
  stream: false,
};

interface CharacterAgentInput {
  curState: CharacterState;
  newChapter: NewChapter;
  currentTimeline?: Timeline;
}

export class CharacterAgent extends LLMBaseAgent<
  CharacterAgentInput,
  CharacterState
> {
  name = "CharacterAgent";
  category = "memory" as const;

  constructor() {
    super(CHARACTER_AGENT_CONFIG);
  }

  protected generatePrompt(input: CharacterAgentInput): Prompt {
    const system = `你是一个角色状态更新代理。严格按照JSON Schema更新角色数据，不要输出任何解释文字。`;
    const user = `## 当前角色状态
${JSON.stringify({ characters: input.curState.characters, character_groups: input.curState.character_groups }, null, 2)}

## 时间轴信息
${input.currentTimeline ? JSON.stringify(input.currentTimeline, null, 2) : "无时间轴信息"}

## 新章节内容 第${input.newChapter.chapterNumber}章：${input.newChapter.title}
${input.newChapter.text}

## 更新规则
- 情感状态: 根据事件调整情绪和强度(0-1)
- 技能: 根据使用情况增加进度(0-1)
- 物品: 添加新物品，移除丢失物品
- 关系: 根据互动调整亲密度(0-1)
- 语音: 记录新口头禅和对话特征

## 字段约束
- 情绪类型: [neutral, angry, joyful, sad, fearful, surprised, anxious]
- 关系类型: [family, mentor, friend, rival, enemy, lover, ally]
- 角色类型: [protagonist, antagonist, supporting, minor]

**只输出JSON，不要任何解释文字。**`;
    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return CHARACTER_STATE_RESPONSE_FORMAT;
  }
}
