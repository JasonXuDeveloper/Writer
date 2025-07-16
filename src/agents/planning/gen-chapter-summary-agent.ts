import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { CreativeElements, NovelConfig } from "../../types/novel-config";
import { NewVolume, NewArc, NewChapter } from "../../db/schema";
import { GEN_CHAPTER_SUMMARY_RESPONSE_FORMAT } from "./chapter-summary-schema";
import { CharacterState } from "../../types/memory/character";
import { Timeline } from "../../types/memory/timeline";
import { World } from "../../types/memory/world";
import { PlotConfig } from "../../types/memory/plot";

// 定义LLM生成的章节概要类型
export interface ChapterSummaryBlueprint {
  title: string;
  summary: string;
}

const CHAPTER_SUMMARY_AGENT_CONFIG: AgentConfig = {
  models: ["deepseek/deepseek-r1-0528-qwen3-8b:free", "microsoft/mai-ds-r1:free"],
  temperature: 0.3,
  max_tokens: 40000,
  stream: false,
};

export interface ChapterSummaryInput {
  novelConfig: NovelConfig;
  volume: NewVolume;
  arc: NewArc;
  chapterNumber: number;
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
  previousChapters?: NewChapter[];
}

export class GenChapterSummaryAgent extends LLMBaseAgent<
  ChapterSummaryInput,
  ChapterSummaryBlueprint
> {
  name = "GenChapterSummaryAgent";
  category = "planning" as const;

  constructor() {
    super(CHAPTER_SUMMARY_AGENT_CONFIG);
  }

  protected generatePrompt(input: ChapterSummaryInput): Prompt {
    const {
      novelConfig,
      volume,
      arc,
      chapterNumber,
      characterState,
      timeline,
      worldState,
      plotConfig,
      previousChapters,
    } = input;

    // 整理前几章摘要
    let prevSummaries = '';
    if (previousChapters && previousChapters.length > 0) {
      prevSummaries = previousChapters.map(
        (ch, idx) => `第${ch.chapterNumber}章摘要：${ch.summary}`
      ).join('\n');
    }

    const system = `你是一位精通章节设计的小说编辑，负责将情节段落细化为具体章节。你的任务是创建一个引人入胜、结构完整的章节摘要。

**章节设计核心原则：**
1. 每个章节必须是一个完整的阅读单元，有明确的开始、发展和结束
2. 章节必须围绕一个核心情感或事件展开，避免内容过于分散
3. 章节开头必须迅速抓住读者注意力，结尾必须留下悬念或情感余韵
4. 章节内容必须推进情节段目标，但不必完全实现一个目标
5. 角色行动必须源于明确的动机和目标，避免无意义的行为
6. 场景转换必须流畅自然，避免生硬跳转
7. 章节节奏必须有快有慢，紧张与舒缓相结合
8. 禁止使用概括性描述，必须通过具体场景和细节展现故事
9. 章节必须与前文保持连贯，与整体故事保持一致`;

    const user = `# 章节摘要设计指南

## 小说基本信息
- 小说标题：${novelConfig.basic_settings.title}
- 写作风格：${novelConfig.basic_settings.writing_style}
- 叙事视角：${novelConfig.basic_settings.narrative_perspective}

## 情节段信息
- 情节段标题：${arc.title}
- 情节段概要：${arc.summary}
- 情节段目标：${Array.isArray(arc.goal) ? arc.goal.map((g, i) => `${i + 1}. ${g}`).join('\n') : arc.goal}

## 当前章节定位
- 章节编号：第${chapterNumber}章
- 在情节段中的位置：${chapterNumber % 3 === 1 ? '开始' : chapterNumber % 3 === 2 ? '发展' : '结束'}
- 预计字数：${novelConfig.basic_settings.chapter_word_count}字左右

## 前文回顾
${previousChapters && previousChapters.length > 0
  ? previousChapters.slice(-2).map((ch) => `### 第${ch.chapterNumber}章：${ch.title}\n${ch.summary}`).join('\n')
  : "无前文章节"}

${chapterNumber <= 3 ? `## 开篇三章特殊要求
- 第一章：创造强烈的视觉冲击和情感共鸣，迅速建立读者与主角的连接
- 第二章：深化主角形象，展现其核心特质和价值观，引入世界设定
- 第三章：引爆核心冲突，展现故事的核心吸引力，确立主角的核心目标` : ''}

## 章节设计要求

### 核心结构
设计一个完整的章节单元，包含：
1. **引人入胜的开场**（10%）：迅速抓住读者注意力
2. **情境建立**（20%）：设定场景、氛围和角色状态
3. **冲突发展**（40%）：推进核心冲突，角色面临挑战
4. **关键时刻**（20%）：决定性的行动、选择或发现
5. **余韵与悬念**（10%）：留下情感余韵或引人思考的悬念

### 场景设计
- 设计2-3个具体场景，每个场景有明确的地点、时间、氛围
- 场景之间的转换必须流畅自然，避免生硬跳转
- 场景描写必须与情节和情感相呼应，创造沉浸感

### 角色互动
- 角色对话必须自然、生动，反映性格和关系
- 角色行动必须源于明确的动机和目标
- 角色反应必须符合其性格和价值观

### 节奏控制
- 根据内容需要，合理安排紧张与舒缓的节奏
- 重要时刻适当放慢节奏，增加细节描写
- 过渡部分适当加快节奏，避免内容拖沓

## 输出要求
请创建一个引人入胜的章节摘要，包含：
- title: 富有吸引力和暗示性的章节标题
- summary: 详细的章节内容摘要（500-800字），包含完整的章节故事

**创作提示：**
- 想象你正在为一部热门小说系列创作新的章节
- 通过具体场景和细节展现故事，避免概括性描述
- 章节必须与前文保持连贯，与整体故事保持一致
- 章节必须围绕一个核心情感或事件展开，避免内容过于分散
- 结尾必须留有悬念或情感余韵，引导读者继续阅读`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return GEN_CHAPTER_SUMMARY_RESPONSE_FORMAT;
  }
} 