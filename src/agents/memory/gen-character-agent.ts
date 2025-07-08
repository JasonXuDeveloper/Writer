import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { NovelConfig } from "../../types/novel-config";
import { CharacterState } from "../../types/memory/character";
import { CHARACTER_STATE_RESPONSE_FORMAT } from "./character-schema";
import { Timeline } from "../../types/memory/timeline";

const CHARACTER_AGENT_CONFIG: AgentConfig = {
  models: ["microsoft/mai-ds-r1:free"],
  temperature: 0,
  max_tokens: 60000,
  stream: false,
};

const GEN_CHARACTER_AGENT_CONFIG: AgentConfig = {
  models: ["microsoft/mai-ds-r1:free"],
  temperature: 0.3,
  max_tokens: 60000,
  stream: false,
};

export interface GenCharacterAgentInput {
  novelConfig: NovelConfig;
  timeline?: Timeline;
}

export class GenCharacterAgent extends LLMBaseAgent<
  GenCharacterAgentInput,
  CharacterState
> {
  name = "GenCharacterAgent";
  category = "memory" as const;

  constructor() {
    super(GEN_CHARACTER_AGENT_CONFIG);
  }

  protected generatePrompt(input: GenCharacterAgentInput): Prompt {
    const { novelConfig, timeline } = input;
    const system = `你是一个角色状态初始化代理。严格按照JSON Schema生成角色数据，不要输出任何解释文字。`;

    const user = `## 小说配置
${JSON.stringify(novelConfig, null, 2)}

## 时间线信息
${timeline ? JSON.stringify(timeline, null, 2) : "无时间线信息"}

## 生成要求
- 生成3-5个主要角色（主角、反派、配角）
- 生成1-2个角色组
- 所有描述要简洁
- 进度值和亲密度范围：0.0-1.0

## ID格式
- 角色ID: char_<拼音>
- 技能ID: skill_<描述>
- 物品ID: item_<描述>

## 字段约束
- 关系类型: [family, mentor, friend, rival, enemy, lover, ally]
- 角色类型: [protagonist, antagonist, supporting, minor]
- 情绪类型: [neutral, angry, joyful, sad, fearful, surprised, anxious]

**只输出JSON，不要任何解释文字。**`;
    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return CHARACTER_STATE_RESPONSE_FORMAT;
  }
}
