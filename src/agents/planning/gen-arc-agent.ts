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

    const system = `你是一位资深小说编辑，专精于情节段落设计。你的任务是将卷级蓝图中的关键事件发展为引人入胜的情节段落。

**情节段设计核心原则：**
1. 每个情节段必须是一个微型故事，包含完整的起承转合结构
2. 情节段既要推进主线，又要发展支线，形成丰富的故事层次
3. 角色互动必须自然、生动，通过对话和行动展现性格和关系
4. 场景描写必须具体、鲜活，创造沉浸式阅读体验
5. 情节发展必须符合内在逻辑，角色行为符合其性格和动机
6. 每个情节段都应包含"表层剧情"和"深层主题"双重维度
7. 支线剧情必须与主线有机连接，不能完全脱节
8. 情节段结尾必须留有悬念或情感余韵，引导读者继续阅读
9. 禁止使用概括性描述，必须通过具体场景和细节展现故事
10. 情节段必须明确推进卷级关键事件，但方式可以是直接推进或间接铺垫
11. 情节段内容必须足够丰富，适合拆分成多个章节
12. 每个情节段都应该为角色成长和世界观展现创造机会
13. 情节段必须与前文保持连贯，与整体故事保持一致
14. 情节段必须为后续发展埋下伏笔，创造期待感
15. 情节段目标必须具体、可执行，避免空泛描述
`;

    const user = `# 情节段设计指南

## 小说基本信息
- 小说标题：${novelConfig.basic_settings.title}
- 核心主题：${novelConfig.basic_settings.central_theme}
- 当前进度：${progressPercentage}%（已写${currentWordCount}字，剩余${remainingWords}字）

## 卷级蓝图信息
- 卷标题：${volume.title}
- 核心冲突：${volume.coreConflict}
- 情感弧线：${volume.emotionalArc}
- 本卷关键事件：
${volume.keyEvents.map((event, idx) => `${idx + 1}. ${event}`).join('\n')}

## 当前情节段定位
- 情节段编号：第${arcNumberInVolume}个情节段
- 在卷中的位置：${arcNumberInVolume / volume.keyEvents.length < 0.33 ? '前期' : arcNumberInVolume / volume.keyEvents.length < 0.66 ? '中期' : '后期'}
- 对应关键事件：${volume.keyEvents.slice((arcNumberInVolume - 1) * 3, arcNumberInVolume * 3).map((event, idx) => `${(arcNumberInVolume - 1) * 3 + idx + 1}. ${event}`).join('\n')}

## 角色与世界状态
${characterState ? JSON.stringify(characterState, null, 2) : "无角色状态信息"}
${worldState ? JSON.stringify(worldState, null, 2) : "无世界状态信息"}

## 历史情节段回顾
${previousArcs && previousArcs.length > 0
  ? previousArcs.slice(-3).map((arc, index) => `### 第${arc.arcNumberInVolume}个情节段：${arc.title}\n- 核心事件：${arc.summary.split('。')[0]}\n- 情感变化：${arc.summary.includes('情感') ? arc.summary.match(/情感[^。]+。/)?.[0] : '未明确描述'}`).join('\n')
  : "无历史情节段信息"}

## 情节段设计要求

### 核心结构
设计一个完整的微型故事，包含：
1. **引入场景**（10%）：创建鲜明的场景和氛围
2. **建立冲突**（20%）：引入主要冲突和角色目标
3. **冲突发展**（40%）：冲突升级，角色面临挑战
4. **高潮转折**（20%）：关键时刻的决定性行动或发现
5. **情感余韵**（10%）：事件的直接后果和情感影响

### 情节层次
- **主线层**：推进卷级关键事件，发展核心冲突
- **角色层**：深化角色关系，展现性格成长
- **世界层**：丰富世界设定，展现环境影响
- **主题层**：通过具体事件反映小说核心主题

### 场景与细节要求
- 创建3-5个具体场景，每个场景有明确的地点、时间、氛围
- 通过感官描写（视觉、听觉、嗅觉、触觉、味觉）创造沉浸感
- 角色对话必须自然、生动，反映性格和关系
- 环境描写必须与情节和情感相呼应

### 支线设计
- 设计1-2条支线剧情，丰富故事层次
- 支线必须与主线产生交集或影响
- 支线可以是：角色关系发展、世界设定探索、次要冲突解决等

## 输出要求
请创建一个引人入胜的情节段，包含：
- title: 富有吸引力和暗示性的情节段标题
- summary: 详细的情节段内容（800-1200字），包含完整的微型故事
- goal: 3-5个具体、可执行的情节目标

**创作提示：**
- 想象你正在为一部热门小说系列创作新的情节段落
- 通过具体场景和细节展现故事，避免概括性描述
- 角色对话和行动必须符合其性格和动机
- 情节发展必须符合内在逻辑，避免突兀转变
- 结尾必须留有悬念或情感余韵，引导读者继续阅读
- 明确标注本情节段涉及的关键事件编号和内容
- 如为支线情节段，必须说明与主线的关联和铺垫
`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return ARC_RESPONSE_FORMAT;
  }
} 