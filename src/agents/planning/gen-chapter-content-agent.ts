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

    const system = `你是一个章节内容生成代理，负责根据章节概要、记忆层数据和小说设定，生成符合字数要求的章节正文。

**重要原则：**
1. 严格按照章节概要的标题和内容生成正文，优先参照章节概要，其次参照记忆层数据，最后参照小说设定
2. **必须生成${targetWordCount}字左右的内容，这是硬性要求**
3. 与记忆层数据保持设定一致性
4. 生成纯文本格式，不包含任何格式语法
5. 内容要生动有趣，符合小说风格
6. 角色对话和行为要符合角色设定
7. 世界设定和规则要准确体现
8. **正文需按照中文小说分段习惯，每一段之间用一个空行隔开**
9. **正文内容应自然分段，便于阅读**

**字数控制策略：**
- **目标字数：${targetWordCount}字（必须达到）**
- 允许误差范围：±10%（即${Math.round(targetWordCount * 0.9)}-${Math.round(targetWordCount * 1.1)}字）
- **如果内容不足，必须通过以下方式扩充：**
  1. 增加详细的环境描写和氛围营造
  2. 加入角色的内心独白和心理活动
  3. 丰富对话内容，增加角色互动
  4. 添加动作描写和细节刻画
  5. 插入世界观设定和背景信息
  6. 增加情节铺垫和伏笔设置

**生成要求：**
- 内容要完全符合章节概要的描述
- **字数必须达到${targetWordCount}字左右**
- 角色对话要自然流畅
- 场景描写要生动具体
- 情节发展要符合逻辑
- 保持与记忆层数据的一致性
- **必须通过丰富细节来达到目标字数**

**输出格式要求：**
- 只输出纯文本内容，不包含非小说正文格式语法（如markdown）
- 内容要完整，包含完整的章节正文
- 不要包含章节标题或其他格式标记
- **内容长度必须达到${targetWordCount}字左右**
- **正文需按照中文小说分段习惯，每一段之间用一个空行隔开**
- **正文内容应自然分段，便于阅读**`;

    const user = `# 章节内容生成指令

## 小说基本信息
- 小说标题：${novelConfig.basic_settings.title}
- 核心主题：${novelConfig.basic_settings.central_theme}
- 写作风格：${novelConfig.basic_settings.writing_style}
- 叙事视角：${novelConfig.basic_settings.narrative_perspective}
- 目标字数：${targetWordCount}字

## 章节概要信息
- 章节标题：${chapterSummary.title}
- 章节概要：${chapterSummary.summary}

## 小说设定
### 基本设定
${JSON.stringify(novelConfig.basic_settings, null, 2)}

### 世界设定
${JSON.stringify(novelConfig.world_building, null, 2)}

### 角色系统
${JSON.stringify(novelConfig.character_system, null, 2)}

### 情节结构
${JSON.stringify(novelConfig.plot_structure, null, 2)}

### 创意元素
${JSON.stringify(novelConfig.creative_elements, null, 2)}

### 发布设定
${JSON.stringify(novelConfig.publication_settings, null, 2)}

## 记忆层数据
### 角色状态
${characterState ? JSON.stringify(characterState, null, 2) : "无角色状态信息"}

### 时间线信息
${timeline ? JSON.stringify(timeline, null, 2) : "无时间线信息"}

### 世界状态
${worldState ? JSON.stringify(worldState, null, 2) : "无世界状态信息"}

### 情节配置
${plotConfig ? JSON.stringify(plotConfig, null, 2) : "无情节配置信息"}

### 主题信息
${theme ? `- 核心主题：${theme.theme}
- 创意元素：${JSON.stringify(theme.creative_elements, null, 2)}` : "无主题信息"}

### 情节记忆
${episodicMemory && episodicMemory.chapters.length > 0
        ? `最近章节内容：
${episodicMemory.chapters.map((chapter, index) => `第${index + 1}章：${chapter.substring(0, 200)}...`).join('\n')}`
        : "无情节记忆信息"}

## 生成要求

### 1. 内容要求
- 严格按照章节概要的标题和内容生成正文，优先参照章节概要，其次参照记忆层数据，最后参照小说设定
- 确保内容完整，包含章节概要中描述的所有情节
- 角色对话和行为要符合角色设定
- 场景描写要生动具体，符合世界设定
- 情节发展要符合逻辑，保持连贯性

### 2. 字数控制
- **目标字数：${targetWordCount}字（必须达到）**
- 允许误差范围：±10%（即${Math.round(targetWordCount * 0.9)}-${Math.round(targetWordCount * 1.1)}字）
- **如果内容不足，必须通过以下方式扩充：**
  1. 增加详细的环境描写和氛围营造
  2. 加入角色的内心独白和心理活动
  3. 丰富对话内容，增加角色互动
  4. 添加动作描写和细节刻画
  5. 插入世界观设定和背景信息
  6. 增加情节铺垫和伏笔设置
- **字数不足时，优先增加细节描写和角色互动**

### 3. 风格要求
- 符合小说配置中的写作风格
- 使用指定的叙事视角
- 保持与小说整体风格的一致性
- 语言要生动有趣，吸引读者

### 4. 设定一致性
- 角色行为要符合角色状态设定
- 时间线要符合历史发展
- 世界设定要准确体现
- 情节要符合情节配置
- 主题要贯穿始终

### 5. 内容结构
- 情节发展要有起伏
- 结尾要有适当的悬念或总结
- 对话要自然流畅
- 描写要具体生动

## 输出格式
请严格按照JSON Schema生成章节内容，只包含：
- content: 章节正文内容（纯文本格式，不包含任何格式语法）
- 正文需按照中文小说分段习惯，每一段之间用一个空行隔开
- 正文内容应自然分段，便于阅读

**重要要求：**
1. 内容必须完全符合章节概要的描述
2. **字数必须达到${targetWordCount}字左右（这是硬性要求）**
3. 只输出纯文本内容，不包含任何格式语法
4. 不要包含章节标题或其他标记
5. 内容要完整，包含完整的章节正文
6. 保持与所有记忆层数据的一致性
7. **必须通过丰富细节来达到目标字数**
8. **如果内容不足，优先增加环境描写、角色互动、内心独白和动作细节**`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return GEN_CHAPTER_CONTENT_RESPONSE_FORMAT;
  }
} 