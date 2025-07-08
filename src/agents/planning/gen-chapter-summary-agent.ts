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

    const system = `你是一个小说章节摘要生成代理。你的任务是根据卷级蓝图、情节段蓝图、记忆层数据和前文摘要，生成本章的剧情梗概。

**输出要求：**
- 记忆层数据是本章的剧情推进依据，必须严格遵守和参考
- 只写剧情发展和主要事件，不要写任何结构性、评价性、流程性内容
- 概要需对照情节段目标，体现本章对目标的推进（一个目标可能分多章推进）
- 参考前几章摘要，保证剧情连贯
- 概要需具备吸引力，能激发读者兴趣
- 只描述本章发生了什么，角色做了什么，发生了哪些关键事件
- 不要出现"节奏紧凑""推进蓝图""确保一致"等总结性语句
- 只输出title和summary字段`;

    const user = `# 章节剧情摘要生成指令

## 小说基本信息
- 小说标题：${novelConfig.basic_settings.title}
- 核心主题：${novelConfig.basic_settings.central_theme}

## 卷级蓝图
- 卷标题：${volume.title}
- 核心冲突：${volume.coreConflict}

## 情节段蓝图
- 情节段标题：${arc.title}
- 情节段概要：${arc.summary}
- 情节段目标：${Array.isArray(arc.goal) ? arc.goal.map((g, i) => `${i + 1}. ${g}`).join('\\n') : arc.goal}

## 当前章节信息
- 章节编号：${chapterNumber}
- 是否前三章：${chapterNumber <= 3 ? "是" : "否"}

## 前文摘要
${prevSummaries || '无'}

## 记忆层数据
${characterState ? `角色状态：${JSON.stringify(characterState, null, 2)}` : ""}
${timeline ? `时间线：${JSON.stringify(timeline, null, 2)}` : ""}
${worldState ? `世界状态：${JSON.stringify(worldState, null, 2)}` : ""}
${plotConfig ? `情节配置：${JSON.stringify(plotConfig, null, 2)}` : ""}

## 生成要求
- 如果本章是前三章，必须严格遵循中文网络小说的黄金三章原则：开篇要有强烈的吸引力，快速建立主角特色，在第三章引爆核心冲突
- 只写剧情梗概，详细描述本章发生的主要事件和角色互动
- 概要需对照情节段目标，体现目标推进进度
- 参考前文摘要，保证剧情连贯
- 概要需具备吸引力，能激发读者兴趣
- 不要写任何结构性、评价性、流程性内容
- 不要出现"节奏""推进蓝图""确保一致"等话术
- 只输出title和summary字段`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return GEN_CHAPTER_SUMMARY_RESPONSE_FORMAT;
  }
} 