import type { ResponseFormat } from "../llm-agent";

export const GEN_CHAPTER_CONTENT_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "ChapterContent",
    strict: true,
    schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "章节正文内容，纯文本格式，不包含非小说正文格式语法（如markdown）。**正文需按照中文小说分段习惯，每一段之间用一个空行隔开**",
        },
      },
      required: ["content"],
    },
  },
}; 