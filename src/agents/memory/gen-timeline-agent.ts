import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { NovelConfig } from "../../types/novel-config";
import { Timeline } from "../../types/memory/timeline";
import { TIMELINE_RESPONSE_FORMAT } from "./timeline-schema";

const GEN_TIMELINE_AGENT_CONFIG: AgentConfig = {
  models: ["microsoft/mai-ds-r1:free"],
  temperature: 0.2,
  max_tokens: 60000,
  stream: false,
};

export class GenTimelineAgent extends LLMBaseAgent<NovelConfig, Timeline> {
  name = "GenTimelineAgent";
  category = "memory" as const;

  constructor() {
    super(GEN_TIMELINE_AGENT_CONFIG);
  }

  protected generatePrompt(config: NovelConfig): Prompt {
    const system = `你是一个时间线初始化代理，负责根据小说的整体配置生成初始的时间轴 JSON 对象，请严格遵循给定的 JSON Schema，不要输出任何多余文字。`;
    const user = `# 时间线初始化指令

## 小说配置
${JSON.stringify(config, null, 2)}

## 初始化规则
1. 根据小说背景设定确定创世时间点和历法规则
2. 建立基础的时间单位定义（年、月、日、时辰）
3. 创建历史时期划分，为后续事件提供时代背景
4. 设置基本的时间线一致性规则
5. 初始化当前故事时间点（通常从故事开始时间）
6. 建立必要的历史事件作为背景锚点
7. 为事件设置related_content时不应包含具体章节信息，应描述事件的相关内容、影响或关联元素

## ID 使用规则
- **事件ID**: evt_<类型>_<简短描述>
- **时期ID**: period_<名称>
- **规则ID**: rule_<类型>_<描述>

## 字段约束
- 事件类型: [political, war, natural, personal, magical, cultural, economic, other]
- 重要程度: [critical, major, minor]
- 规则类型: [causality, chronology, character_age, travel_time, other]

## 时间设定原则
- 创世时间点应该是一个重要的历史标志事件
- 历法规则应该符合世界设定的文化背景
- 初始事件应该为后续剧情发展提供历史背景
- 时间线规则应该确保逻辑一致性`;
    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return TIMELINE_RESPONSE_FORMAT;
  }
}
