import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { CreativeElements, NovelConfig } from "../../types/novel-config";
import { NewVolume } from "../../db/schema";

// 定义LLM生成的卷级蓝图类型（不包含volumeNumber）
export interface VolumeBlueprint {
  title: string;
  coreConflict: string;
  emotionalArc: string;
  keyEvents: string[];
}
import { VOLUME_RESPONSE_FORMAT } from "./volume-schema";
import { CharacterState } from "../../types/memory/character";
import { Timeline } from "../../types/memory/timeline";
import { World } from "../../types/memory/world";
import { PlotConfig } from "../../types/memory/plot";

const GEN_VOLUME_AGENT_CONFIG: AgentConfig = {
  models: ["deepseek/deepseek-r1-0528-qwen3-8b:free", "microsoft/mai-ds-r1:free"],
  temperature: 0.3,
  max_tokens: 60000,
  stream: false,
};

export interface GenVolumeInput {
  novelConfig: NovelConfig;
  currentWordCount: number;
  targetWordCount: number;
  characterState?: CharacterState;
  timeline?: Timeline;
  worldState?: World;
  plotConfig?: PlotConfig;
  theme?: {
    theme: string;
    creative_elements: CreativeElements;
  };
  previousVolumes?: NewVolume[];
}

export class GenVolumeAgent extends LLMBaseAgent<
  GenVolumeInput,
  VolumeBlueprint
> {
  name = "GenVolumeAgent";
  category = "planning" as const;

  constructor() {
    super(GEN_VOLUME_AGENT_CONFIG);
  }

  protected generatePrompt(input: GenVolumeInput): Prompt {
    const {
      novelConfig,
      currentWordCount,
      targetWordCount,
      characterState,
      timeline,
      worldState,
      plotConfig,
      theme,
      previousVolumes,
    } = input;

    const progressPercentage = Math.round((currentWordCount / targetWordCount) * 100);
    const remainingWords = targetWordCount - currentWordCount;
    const isFirstVolume = !previousVolumes || previousVolumes.length === 0;

    const system = `你是一个卷级蓝图生成代理，负责根据小说的整体进度和核心设定，生成新一卷的详细规划。

**重要原则：**
1. 根据当前进度（${progressPercentage}%）和剩余字数（${remainingWords}字）合理规划本卷内容
2. 确保本卷的核心冲突与整体故事主线保持一致
3. 设计合理的情感弧线，符合三幕剧结构
4. 关键事件要具体、可执行，避免空泛描述
5. 关键事件之间必须有因果关系，前一个事件要为后一个事件做铺垫
6. 考虑角色发展、世界设定和时间线的一致性
${isFirstVolume ? '7. **本卷为第一卷，前三个关键事件必须严格遵循黄金三章原则（见下方说明）**' : ''}
8. 为后续卷留有悬念和发展空间，每卷有独立高潮，但主线冲突和最终结局要循序渐进，分布在多卷之间。`;

    const goldenThreeChapters = `## 黄金三章原则（仅第一卷适用）\n**第一章（吸引眼球）**：开篇要有强烈的吸引力，快速展现主角特色，让读者立即被吸引  \n**第二章（建立悬念）**：在第一章基础上建立悬念，埋下伏笔，让读者产生强烈的好奇心  \n**第三章（引爆冲突）**：在第三章引爆核心冲突，让读者看到主角的能力和故事的精彩程度  \n**如为第一卷，前三个关键事件必须严格对应上述三章原则。**`;

    const user = `# 卷级蓝图生成指令

## 小说基本信息
- 小说标题：${novelConfig.basic_settings.title}
- 核心主题：${novelConfig.basic_settings.central_theme}
- 目标字数：${targetWordCount}字
- 当前字数：${currentWordCount}字
- 完成进度：${progressPercentage}%
- 剩余字数：${remainingWords}字

## 小说设定
### 基本设定
${JSON.stringify(novelConfig.basic_settings, null, 2)}

### 创意元素
${JSON.stringify(novelConfig.creative_elements, null, 2)}

### 发布设定
${JSON.stringify(novelConfig.publication_settings, null, 2)}

## 当前状态信息
### 角色状态
${characterState ? JSON.stringify(characterState, null, 2) : "无角色状态信息"}

### 时间线信息
${timeline ? JSON.stringify(timeline, null, 2) : "无时间线信息"}

### 世界状态
${worldState ? JSON.stringify(worldState, null, 2) : "无世界状态信息"}

### 情节配置
${plotConfig ? JSON.stringify(plotConfig, null, 2) : "无情节配置信息"}

### 主题信息
${theme ? `- 核心主题：${theme.theme}\n- 创意元素：${JSON.stringify(theme.creative_elements, null, 2)}` : "无主题信息"}

## 历史卷信息
${previousVolumes && previousVolumes.length > 0
        ? previousVolumes.map((vol, index) => `### 第${vol.volumeNumber}卷：${vol.title}\n- 核心冲突：${vol.coreConflict}\n- 情感弧线：${vol.emotionalArc}\n- 关键事件：${vol.keyEvents.length}个`).join('\n')
        : "无历史卷信息"}

${isFirstVolume ? goldenThreeChapters + '\n' : ''}

## 生成要求

### 1. 进度规划
- 根据剩余字数合理分配本卷内容，确保与整体进度相匹配
- 考虑后续卷的规划空间
${isFirstVolume ? '- **本卷为第一卷，前三个关键事件必须严格对应黄金三章原则**' : ''}

### 2. 核心冲突设计
- 冲突要具体明确，有明确的对抗双方
- 推动故事发展，体现小说核心主题
- 与创意元素、主题层保持一致

### 3. 情感弧线设计
- 遵循三幕剧结构：建立→发展→高潮→解决
- 情感变化要合理，符合角色发展，与核心冲突呼应

### 4. 关键事件规划
- 不要为事件标记章节号或序号，只描述事件本身
- 事件要具体可执行，避免空泛描述
- 事件之间有连贯性和因果关系，形成完整故事链条
- 推动核心冲突发展，体现角色成长和世界设定
- 数量30-50个，内容充实
${isFirstVolume ? '- **本卷为第一卷，前三个关键事件必须严格对应黄金三章原则**' : ''}

### 5. 一致性要求
- 与角色状态、时间线、世界设定、情节配置、主题层创意元素、历史卷内容保持一致

## 输出格式
请严格按照JSON Schema生成卷级蓝图，包含：
- title: 卷标题
- coreConflict: 核心冲突
- emotionalArc: 情感弧线
- keyEvents: 关键事件数组（每个事件为字符串描述）

**重要要求：**
1. 所有内容必须具体、可执行，不要使用空泛的描述
2. 关键事件、核心冲突、情感弧线均不得包含章节号或序号
3. 关键事件数量30-50个，形成完整故事链条
4. 不得提前写出最终结局或主线终极高潮，必须为后续卷留有悬念和发展空间
`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return VOLUME_RESPONSE_FORMAT;
  }
} 