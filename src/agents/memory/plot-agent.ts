import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";
import { PlotConfig } from "../../types/memory/plot";
import { PlotUpdateInput } from "../../memory/layers/plot-layer";

// JSON schema for plot memory update output
const PLOT_MEMORY_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "PlotMemory",
    strict: true,
    schema: {
      type: "object",
      properties: {
        foreshadowings: {
          description: "章节中的伏笔列表",
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string", description: "伏笔内容描述" },
              progress: {
                type: "number",
                description: "伏笔完成进度，范围 [0,1]",
                minimum: 0.0,
                maximum: 1.0,
              },
            },
            required: ["description", "progress"],
          },
        },
        conflicts: {
          description: "章节中的冲突列表",
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string", description: "冲突描述" },
              intensity: {
                type: "number",
                description: "冲突强度，范围 [0,1]",
                minimum: 0.0,
                maximum: 1.0,
              },
              parties: {
                type: "array",
                items: { type: "string", description: "冲突参与方列表" },
              },
            },
            required: ["description", "intensity", "parties"],
          },
        },
        character_goals: {
          description: "章节中角色目标列表",
          type: "array",
          items: {
            type: "object",
            properties: {
              character: { type: "string", description: "角色名称" },
              goal: { type: "string", description: "角色目标描述" },
              progress: {
                type: "number",
                description: "目标完成进度，范围 [0,1]",
                minimum: 0.0,
                maximum: 1.0,
              },
            },
            required: ["character", "goal", "progress"],
          },
        },
      },
      required: ["foreshadowings", "conflicts", "character_goals"],
    },
  },
};

// LLM configuration for plot memory agent
const PLOT_MEMORY_AGENT_CONFIG: AgentConfig = {
  models: ["microsoft/mai-ds-r1:free"],
  temperature: 0,
  max_tokens: 60000,
  stream: false,
};

/**
 * PlotMemoryAgent - generates an updated plot memory JSON object based on previous memory and a new chapter.
 */
export class PlotAgent extends LLMBaseAgent<PlotUpdateInput, PlotConfig> {
  name = "PlotAgent";
  category = "memory" as const;

  constructor() {
    super(PLOT_MEMORY_AGENT_CONFIG);
  }

  protected generatePrompt(input: PlotUpdateInput): Prompt {
    const system = `你是一个情节记忆代理。根据当前的情节记忆和新生成的章节内容，生成更新后的情节记忆 JSON 对象。注意，已完成的伏笔和冲突需要从情节记忆中删除。请严格遵循给定的 JSON Schema，不要输出任何多余文字。`;
    const user = `当前情节记忆：
${JSON.stringify(input.curPlot, null, 2)}

新章节内容：
章节 ${input.newChapter.chapterNumber} 标题：${input.newChapter.title}
${input.newChapter.text}

请返回新的情节记忆 JSON 对象。`;
    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return PLOT_MEMORY_RESPONSE_FORMAT;
  }
}
