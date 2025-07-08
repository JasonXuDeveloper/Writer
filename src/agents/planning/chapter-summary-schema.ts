import type { ResponseFormat } from "../llm-agent";

export const GEN_CHAPTER_SUMMARY_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "ChapterSummary",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "章节标题，应体现本章的核心事件或主题，不要包含章节号或序号",
        },
        summary: {
          type: "string",
          description: "章节概要，详细描述本章的主要内容和进展，包含具体的角色互动和事件发展，不要包含章节号或序号",
        },
      },
      required: ["title", "summary"],
    },
  },
}; 