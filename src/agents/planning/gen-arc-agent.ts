import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { CreativeElements, NovelConfig } from "../../types/novel-config";
import { NewVolume, NewArc } from "../../db/schema";
import { ARC_RESPONSE_FORMAT } from "./arc-schema";
import { CharacterState } from "../../types/memory/character";
import { Timeline } from "../../types/memory/timeline";
import { World } from "../../types/memory/world";
import { PlotConfig } from "../../types/memory/plot";

// 定义LLM生成的情节段类型（不包含arcNumberInVolume和volumeNumber）
export interface ArcBlueprint {
  title: string;
  summary: string;
  goal: string[];
}

const GEN_ARC_AGENT_CONFIG: AgentConfig = {
  models: ["deepseek/deepseek-r1-0528-qwen3-8b:free", "microsoft/mai-ds-r1:free"],
  temperature: 0.7,
  max_tokens: 30000,
  stream: false,
};

export interface GenArcInput {
  novelConfig: NovelConfig;
  volume: NewVolume;
  arcNumberInVolume: number;
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
  previousArcs?: NewArc[];
}

export class GenArcAgent extends LLMBaseAgent<
  GenArcInput,
  ArcBlueprint
> {
  name = "GenArcAgent";
  category = "planning" as const;

  constructor() {
    super(GEN_ARC_AGENT_CONFIG);
  }

  protected generatePrompt(input: GenArcInput): Prompt {
    const {
      novelConfig,
      volume,
      arcNumberInVolume,
      currentWordCount,
      targetWordCount,
      characterState,
      timeline,
      worldState,
      plotConfig,
      theme,
      previousArcs,
    } = input;

    const progressPercentage = Math.round((currentWordCount / targetWordCount) * 100);
    const remainingWords = targetWordCount - currentWordCount;

    const system = `你是一个情节段（arc）生成代理，负责根据卷级蓝图和小说整体进度，生成具体的情节段规划。

**重要原则：**
1. volume的keyEvents是主线推进的核心，arc内容必须围绕keyEvents推进，但arc既可以是主线推进，也可以是为主线服务的过渡支线。
2. arc的summary必须详细展开，内容丰富，适合拆分成多个章节，不能只写一场主事件。
3. arc的summary要明确列出本arc所覆盖的keyEvents（用编号和内容），并详细描述这些事件如何推进。
4. 如果arc为支线，也要说明与主线keyEvents的关联和铺垫。
5. 禁止只写主线事件的简要描述，必须有丰富的过程、细节、角色互动、支线穿插。
6. summary要有"章节级"丰富度，不能只有一场戏或一句话。
7. arc分配可灵活：如五个arc共同推进前两条keyEvents，第一个和第五个arc为主线推进，中间三个为支线过渡，但支线要与主线产生联系。
8. arc内容要有主线推进感，支线剧情不能脱离主线。
9. arc内容要足够丰富，适合拆分成多个章节，不能过于简短。
10. 在主线推进的同时，鼓励穿插支线剧情、角色互动、世界观细节、日常生活等，由你自由发挥，提升故事层次和可读性。
11. arc要有完整的小故事链条，包含起承转合，主线与支线自然交织。
12. arc目标要与keyEvents推进和支线目标对应，具体可执行，避免空泛描述。
13. 保持与卷蓝图、主题、记忆层一致。
14. 禁止只写主线或流水账，必须有丰富细节和过渡剧情。
15. arc内容要为后续章节和情节段埋下伏笔。
`;

    const user = `# 情节段（arc）生成指令

## 小说基本信息
- 小说标题：${novelConfig.basic_settings.title}
- 核心主题：${novelConfig.basic_settings.central_theme}
- 目标字数：${targetWordCount}字
- 当前字数：${currentWordCount}字
- 完成进度：${progressPercentage}%
- 剩余字数：${remainingWords}字

## 卷级蓝图信息
- 卷标题：${volume.title}
- 核心冲突：${volume.coreConflict}
- 情感弧线：${volume.emotionalArc}
- 关键事件数量：${volume.keyEvents.length}个
- 关键事件列表（主线推进核心，arc可为主线或支线，但支线必须与主线有关联）：
${volume.keyEvents.map((event, idx) => `${idx + 1}. ${event}`).join('\n')}

## 当前情节段信息
- 情节段编号：${arcNumberInVolume}
- 在卷中的位置：第${arcNumberInVolume}个情节段

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

## 历史情节段信息
${previousArcs && previousArcs.length > 0
        ? previousArcs.map((arc, index) => `### 第${arc.arcNumberInVolume}个情节段：${arc.title}\n- 概要：${arc.summary}\n- 目标：${Array.isArray(arc.goal) ? arc.goal.map((g, i) => `${i + 1}. ${g}`).join("\n") : arc.goal}`).join('\n')
        : "无历史情节段信息"}

## 生成要求
- arc内容必须推进volume的keyEvents（主线），但arc既可以是主线推进，也可以是为主线服务的支线过渡
- arc的summary必须详细展开，内容丰富，适合拆分成多个章节，不能只写一场主事件
- arc的summary要明确列出本arc所覆盖的keyEvents（用编号和内容），并详细描述这些事件如何推进
- 如果arc为支线，也要说明与主线keyEvents的关联和铺垫
- 禁止只写主线事件的简要描述，必须有丰富的过程、细节、角色互动、支线穿插
- summary要有"章节级"丰富度，不能只有一场戏或一句话
- arc分配可灵活：如五个arc共同推进前两条keyEvents，第一个和第五个arc为主线推进，中间三个为支线过渡，但支线要与主线产生联系
- arc内容要有主线推进感，支线剧情不能脱离主线
- arc内容要足够丰富，适合拆分成多个章节
- 鼓励穿插支线剧情、角色互动、世界观细节、日常生活等，由你自由发挥
- arc要有完整的小故事链条，主线与支线自然交织
- arc目标要与keyEvents推进和支线目标对应，具体可执行
- 禁止只写主线或流水账，必须有丰富细节和过渡剧情
- arc内容要为后续章节和情节段埋下伏笔
- 输出格式：title, summary, goal（目标为数组，每项为一项）
- 只输出真实内容，不要返回空字符串
`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return ARC_RESPONSE_FORMAT;
  }
} 