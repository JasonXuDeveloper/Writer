import type { ResponseFormat } from "../llm-agent";

export const VOLUME_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "Volume",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "卷标题，应体现本卷的核心主题或关键事件",
        },
        coreConflict: {
          type: "string",
          description: "本卷的核心冲突，描述主要矛盾和对立，不要包含章节号或序号",
        },
        emotionalArc: {
          type: "string",
          description: "本卷的情感弧线，描述情感发展的起承转合，不要包含章节号或序号",
        },
        keyEvents: {
          type: "array",
          description: "本卷的关键事件列表，根据当前字数进度合理分配，必须包含30-50个关键事件，每个事件描述要具体可执行，不要包含章节号或序号，事件之间要有连贯性形成完整故事链条",
          items: {
            type: "string",
            description: "关键事件的详细描述，不要包含章节号或序号，要与前后事件形成因果关系",
          },
          minItems: 30,
          maxItems: 50,
        },
      },
      required: ["title", "coreConflict", "emotionalArc", "keyEvents"],
    },
  },
}; 