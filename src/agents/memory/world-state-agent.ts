import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { WORLD_RESPONSE_FORMAT } from "./world-schema";
import { WorldStateUpdateInput } from "../../memory/layers/world-state-layer";
import { World } from "../../types/memory/world";

// LLM configuration for world state generation
const WORLD_STATE_AGENT_CONFIG: AgentConfig = {
  models: ["deepseek/deepseek-r1-0528-qwen3-8b:free", "microsoft/mai-ds-r1:free"],
  temperature: 0,
  max_tokens: 40000,
  stream: false,
};

export class WorldStateAgent extends LLMBaseAgent<
  WorldStateUpdateInput,
  World
> {
  name = "WorldStateAgent";
  category = "memory" as const;

  constructor() {
    super(WORLD_STATE_AGENT_CONFIG);
  }

  protected generatePrompt(input: WorldStateUpdateInput): Prompt {
    const system = `你是一个世界状态代理。根据当前的世界状态和新生成的章节内容，生成一个新的完整世界状态的 JSON 对象。请严格遵循给定的 JSON Schema，不要输出任何多余文字。`;
    const user = `当前世界状态：
${JSON.stringify(input.curWorldState, null, 2)}

新章节内容：
章节 ${input.newChapter.chapterNumber} 标题：${input.newChapter.title}
${input.newChapter.text}

请返回新的世界状态 JSON 对象。`;
    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return WORLD_RESPONSE_FORMAT;
  }
}
