import type { ResponseFormat } from "../llm-agent";

export const ARC_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "Arc",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "情节段标题，应体现本段的核心事件或主题，不要包含章节号或序号",
        },
        summary: {
          type: "string",
          description: "情节段概要，描述本段的主要内容和进展，不要包含章节号或序号",
        },
        goal: {
          type: "array",
          items: { type: "string" },
          description: "情节段目标，列出本段要达成的具体目标或解决的问题，每个目标为一项，目标内容不能安排在某一具体章节，不要包含章节号或序号。各目标之间需要有连贯性，不能内容有跳跃。",
        },
      },
      required: ["title", "summary", "goal"],
    },
  },
}; 