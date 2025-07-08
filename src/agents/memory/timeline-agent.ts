import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { Timeline } from "../../types/memory/timeline";
import { TIMELINE_RESPONSE_FORMAT } from "./timeline-schema";
import { TimelineUpdateInput } from "../../memory/layers/timeline-layer";

const TIMELINE_AGENT_CONFIG: AgentConfig = {
  models: ["microsoft/mai-ds-r1:free"],
  temperature: 0,
  max_tokens: 40000,
  stream: false,
};

export class TimelineAgent extends LLMBaseAgent<TimelineUpdateInput, Timeline> {
  name = "TimelineAgent";
  category = "memory" as const;

  constructor() {
    super(TIMELINE_AGENT_CONFIG);
  }

  protected generatePrompt(input: TimelineUpdateInput): Prompt {
    const system = `你是一个时间线代理，负责根据当前时间轴状态和新章节内容生成更新后的时间轴 JSON 对象，请严格遵循给定的 JSON Schema，不要输出任何多余文字。`;
    const user = `# 时间线更新指令

## 当前时间轴状态
${JSON.stringify(input.curTimeline, null, 2)}

## 新章节内容 第${input.newChapter.chapterNumber}章：${input.newChapter.title}
${input.newChapter.text}

## 更新规则
1. 事件添加: 根据章节内容识别新发生的事件，添加到events数组
2. 时间推进: 更新current_story_time以反映故事当前时间点
3. 事件关联: 为新事件设置正确的related_content（不应包含具体章节信息，应描述事件的相关内容、影响或关联元素），标记is_described为true
4. 一致性检查: 确保新事件符合已有的consistency_rules
5. 因果关系: 为有因果关系的事件设置正确的时间顺序
6. 角色关联: 在involved_characters中正确关联角色ID
7. 地点关联: 在locations中记录事件发生地点
8. 影响评估: 在consequences中记录事件的短期和长期影响

## ID 使用规则
- **事件ID**: evt_<类型>_<简短描述>
- **时期ID**: period_<名称>
- **规则ID**: rule_<类型>_<描述>

## 字段约束
- 事件类型: [political, war, natural, personal, magical, cultural, economic, other]
- 重要程度: [critical, major, minor]
- 规则类型: [causality, chronology, character_age, travel_time, other]

## 时间计算原则
- 所有年份都是相对于创世时间点的偏移量
- 月份和日期可选，但如果提供需要符合世界设定的历法规则
- 当前故事时间点应该反映最新章节的时间进度
- 确保时间轴的单调性和逻辑一致性`;
    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return TIMELINE_RESPONSE_FORMAT;
  }
}
