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

    const system = `你是一位经验丰富的小说策划编辑，负责为畅销长篇小说设计卷级结构。你的任务是创建一个引人入胜、结构严谨的卷级蓝图。

**核心创作原则：**
1. 每一卷都必须有独特的主题色彩和情感基调，同时与整体故事形成有机统一
2. 设计具有强烈戏剧冲突的核心事件，确保读者持续投入
3. 情感弧线必须遵循"起-承-转-合"的经典结构，但要避免公式化
4. 关键事件必须具体、生动、富有画面感，能在读者脑海中形成清晰影像
5. 每个关键事件都应包含"外部冲突"和"内心冲突"双重维度
6. 角色成长必须通过具体事件和选择体现，而非简单陈述
7. 世界设定的展现必须融入情节，避免生硬的信息灌输
8. 为后续卷埋下精妙伏笔，但本卷故事必须有相对完整的情感闭环
${isFirstVolume ? '9. **本卷为第一卷，必须遵循"三重吸引力法则"：视觉冲击→情感共鸣→核心悬念**' : ''}
10. 每个关键事件都应该是一个微型故事，包含场景、冲突、转折和结果`;

    const goldenThreeChapters = `## 黄金三章原则（仅第一卷适用）\n**第一章（吸引眼球）**：开篇要有强烈的吸引力，快速展现主角特色，让读者立即被吸引  \n**第二章（建立悬念）**：在第一章基础上建立悬念，埋下伏笔，让读者产生强烈的好奇心  \n**第三章（引爆冲突）**：在第三章引爆核心冲突，让读者看到主角的能力和故事的精彩程度  \n**如为第一卷，前三个关键事件必须严格对应上述三章原则。**`;

    const user = `# 卷级蓝图设计指南

## 小说基础信息
- 小说标题：${novelConfig.basic_settings.title}
- 核心主题：${novelConfig.basic_settings.central_theme}
- 目标字数：${targetWordCount}字
- 当前进度：${progressPercentage}%（已写${currentWordCount}字，剩余${remainingWords}字）

## 小说世界观与设定
${JSON.stringify(novelConfig.basic_settings, null, 2)}
${JSON.stringify(novelConfig.world_building, null, 2)}
${JSON.stringify(novelConfig.creative_elements, null, 2)}

## 当前世界状态
${worldState ? JSON.stringify(worldState, null, 2) : "世界状态尚未建立"}

## 角色发展轨迹
${characterState ? JSON.stringify(characterState, null, 2) : "角色状态尚未建立"}

## 历史卷总结
${previousVolumes && previousVolumes.length > 0
        ? previousVolumes.map((vol, index) => `### 第${vol.volumeNumber}卷：${vol.title}\n- 核心冲突：${vol.coreConflict}\n- 情感弧线：${vol.emotionalArc}\n- 关键转折点：${vol.keyEvents.slice(0, 3).join('→')}`).join('\n')
        : "这是第一卷，开启全新故事"}

${isFirstVolume ? `## 开篇三重吸引力法则
1. **视觉冲击**：创造令人难忘的开场景象，通过独特视觉元素立即抓住读者
2. **情感共鸣**：迅速建立读者与主角的情感连接，引发认同或好奇
3. **核心悬念**：设置一个强有力的谜题或冲突，驱使读者继续阅读` : ''}

## 卷级设计要求

### 核心冲突设计
- 设计一个多层次的核心冲突，包含外部对抗、内心挣扎和价值观碰撞
- 冲突必须与主角的核心需求和恐惧直接相关
- 冲突应随情节推进逐步升级，在卷末达到高潮

### 情感弧线设计
- 设计一条主情感弧线和2-3条副情感弧线
- 主情感弧线关联核心冲突，副情感弧线关联角色成长和关系发展
- 情感变化必须通过具体事件和选择体现，避免突兀转变

### 关键事件设计（30-50个）
每个关键事件必须包含以下元素：
1. 具体场景和氛围描述
2. 明确的冲突和阻碍
3. 角色的选择和行动
4. 事件的直接后果和情感影响
5. 与主线的关联和推进

### 结构平衡
- 开篇部分（约20%）：建立情境、引入冲突
- 发展部分（约60%）：冲突升级、角色成长
- 高潮部分（约15%）：核心冲突爆发
- 结尾部分（约5%）：情感余韵、埋下伏笔

## 输出要求
请创建一个引人入胜的卷级蓝图，包含：
- title: 富有吸引力和主题暗示的卷标题
- coreConflict: 多层次、具体生动的核心冲突
- emotionalArc: 清晰的情感发展轨迹
- keyEvents: 30-50个具体、生动、富有画面感的关键事件（每个事件100-200字）

**创作提示：**
- 想象你正在为一部畅销小说系列设计新一卷，这一卷必须既能独立成篇，又能与整体故事紧密相连
- 关键事件应该像电影场景一样具体可视，让读者能在脑海中"看到"故事发生
- 避免使用模板化、公式化的情节，追求新颖独特的故事体验
- 每个关键事件都应该推动故事向前发展，不要有无关紧要的"填充"事件
`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return VOLUME_RESPONSE_FORMAT;
  }
} 