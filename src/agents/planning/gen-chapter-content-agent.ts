import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { CreativeElements, NovelConfig } from "../../types/novel-config";
import { ChapterSummaryBlueprint } from "./gen-chapter-summary-agent";
import { GEN_CHAPTER_CONTENT_RESPONSE_FORMAT } from "./chapter-content-schema";
import { CharacterState } from "../../types/memory/character";
import { Timeline } from "../../types/memory/timeline";
import { World } from "../../types/memory/world";
import { PlotConfig } from "../../types/memory/plot";

// 定义LLM生成的章节内容类型
export interface ChapterContentBlueprint {
  content: string;
}

const CHAPTER_CONTENT_AGENT_CONFIG: AgentConfig = {
  models: ["deepseek/deepseek-r1-0528-qwen3-8b:free", "microsoft/mai-ds-r1:free"],
  temperature: 0.5,
  max_tokens: 80000,
  stream: false,
};

export interface ChapterContentInput {
  novelConfig: NovelConfig;
  chapterSummary: ChapterSummaryBlueprint;
  targetWordCount: number;
  characterState?: CharacterState;
  timeline?: Timeline;
  worldState?: World;
  plotConfig?: PlotConfig;
  theme?: {
    theme: string;
    creative_elements: CreativeElements;
  };
  episodicMemory?: {
    chapters: string[];
  };
}

export class GenChapterContentAgent extends LLMBaseAgent<
  ChapterContentInput,
  ChapterContentBlueprint
> {
  name = "GenChapterContentAgent";
  category = "creation" as const;

  constructor() {
    super(CHAPTER_CONTENT_AGENT_CONFIG);
  }

  protected generatePrompt(input: ChapterContentInput): Prompt {
    const {
      novelConfig,
      chapterSummary,
      targetWordCount,
      characterState,
      timeline,
      worldState,
      plotConfig,
      theme,
      episodicMemory,
    } = input;

    const system = `你是一位才华横溢的小说家，擅长创作引人入胜的章节内容。你的任务是根据章节摘要，创作出生动、具体、富有画面感的章节正文。

**创作核心原则：**
1. 遵循"展示，不要讲述"的黄金法则，通过具体场景和细节展现故事
2. 角色必须栩栩如生，通过对话、行动和内心活动展现性格
3. 场景描写必须具体、鲜活，创造沉浸式阅读体验
4. 情感描写必须真实、细腻，避免空洞的概括
5. 对话必须自然、生动，反映角色性格和关系
6. 节奏必须有快有慢，紧张与舒缓相结合
7. 语言风格必须符合小说整体风格和叙事视角
8. 内容必须与前文保持连贯，与整体故事保持一致
9. 字数必须严格控制在目标范围内，通过合理的细节描写和情节展开达到要求
10. 禁止使用概括性描述，必须通过具体场景和细节展现故事

**字数控制策略：**
- **目标字数：${targetWordCount}字（必须达到）**
- 允许误差范围：±5%（即${Math.round(targetWordCount * 0.95)}-${Math.round(targetWordCount * 1.05)}字）
- **如内容不足，通过以下方式扩充：**
  1. 增加多感官环境描写，创造沉浸感
  2. 深化角色内心活动和心理变化
  3. 丰富对话内容，增加情感层次
  4. 添加细节描写，提升画面感
  5. 展现世界观细节，增强世界感

**输出格式要求：**
- 纯文本格式，不包含任何格式标记
- 按照中文小说分段习惯，每段之间用一个空行隔开
- 内容长度必须达到${targetWordCount}字左右
- 不包含章节标题或其他格式标记`;

    const user = `# 章节内容创作指南

## 小说基本信息
- 小说标题：${novelConfig.basic_settings.title}
- 写作风格：${novelConfig.basic_settings.writing_style}
- 叙事视角：${novelConfig.basic_settings.narrative_perspective}
- 目标字数：${targetWordCount}字（允许误差±5%）

## 章节摘要信息
- 章节标题：${chapterSummary.title}
- 章节摘要：${chapterSummary.summary}

## 世界设定核心要素
${JSON.stringify(novelConfig.world_building, null, 2)}

## 角色系统核心要素
${JSON.stringify(novelConfig.character_system, null, 2)}

## 创意元素
${JSON.stringify(novelConfig.creative_elements, null, 2)}

## 当前状态信息
${characterState ? JSON.stringify(characterState, null, 2) : "无角色状态信息"}
${worldState ? JSON.stringify(worldState, null, 2) : "无世界状态信息"}

## 前文回顾
${episodicMemory && episodicMemory.chapters.length > 0
  ? `最近章节结尾：
${episodicMemory.chapters.map((chapter, index) => `第${index + 1}章结尾：${chapter.substring(chapter.length - 300)}`).join('\n')}`
  : "无前文章节"}

## 创作要求

### 内容结构
创作一个完整的章节内容，包含：
1. **引人入胜的开场**（10%）：迅速抓住读者注意力
2. **情境建立**（15%）：设定场景、氛围和角色状态
3. **冲突发展**（45%）：推进核心冲突，角色面临挑战
4. **关键时刻**（20%）：决定性的行动、选择或发现
5. **余韵与悬念**（10%）：留下情感余韵或引人思考的悬念

### 场景创作
- 创建3-5个具体场景，每个场景有明确的地点、时间、氛围
- 通过多感官描写（视觉、听觉、嗅觉、触觉、味觉）创造沉浸感
- 场景描写必须与情节和情感相呼应，创造沉浸感
- 场景之间的转换必须流畅自然，避免生硬跳转

### 角色塑造
- 角色对话必须自然、生动，反映性格和关系
- 角色行动必须源于明确的动机和目标
- 角色内心活动必须真实、细腻，避免空洞的概括
- 角色反应必须符合其性格和价值观

### 语言风格
- 符合小说整体风格和叙事视角
- 根据场景和情感需要，灵活运用不同的语言节奏
- 重要时刻适当放慢节奏，增加细节描写
- 过渡部分适当加快节奏，避免内容拖沓

### 字数控制策略
- 目标字数：${targetWordCount}字（允许误差±5%）
- 如内容不足，通过以下方式扩充：
  1. 增加环境描写和氛围营造
  2. 深化角色内心活动
  3. 丰富对话内容和互动
  4. 添加细节描写和感官体验
  5. 展现世界观细节

## 输出要求
请创作一个引人入胜的章节内容，格式要求：
- 纯文本格式，不包含任何格式标记
- 按照中文小说分段习惯，每段之间用一个空行隔开
- 内容长度必须达到${targetWordCount}字左右（允许误差±5%）

**创作提示：**
- 想象你正在为一部热门小说系列创作新的章节
- 遵循"展示，不要讲述"的原则，通过具体场景和细节展现故事
- 角色对话和行动必须符合其性格和动机
- 场景描写必须具体、鲜活，创造沉浸式阅读体验
- 结尾必须留有悬念或情感余韵，引导读者继续阅读`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return GEN_CHAPTER_CONTENT_RESPONSE_FORMAT;
  }
} 