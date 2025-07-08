import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { NovelConfig } from "../../types/novel-config";
import { World } from "../../types/memory/world";
import { WORLD_RESPONSE_FORMAT } from "./world-schema";

const GEN_WORLD_STATE_AGENT_CONFIG: AgentConfig = {
  models: ["microsoft/mai-ds-r1:free"],
  temperature: 0.2,
  max_tokens: 40000,
  stream: false,
};

export class GenWorldStateAgent extends LLMBaseAgent<NovelConfig, World> {
  name = "GenWorldStateAgent";
  category = "memory" as const;

  constructor() {
    super(GEN_WORLD_STATE_AGENT_CONFIG);
  }

  protected generatePrompt(config: NovelConfig): Prompt {
    const system = `你是一个世界状态初始化代理。根据小说的整体配置生成初始的世界状态 JSON 对象。请严格遵循给定的 JSON Schema，不要输出任何多余文字。`;
    const user = `小说配置：
${JSON.stringify(config, null, 2)}

请返回完整的世界状态 JSON 对象。`;
    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return WORLD_RESPONSE_FORMAT;
  }
}
