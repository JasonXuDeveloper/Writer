import type { ResponseFormat } from "../llm-agent";

export const TIMELINE_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "Timeline",
    strict: true,
    schema: {
      type: "object",
      properties: {
        genesis_point: {
          description: "创世时间点定义，包含元年开始的标志事件及时间计算规则",
          type: "object",
          properties: {
            name: { type: "string", description: "创世时间点名称" },
            description: { type: "string", description: "创世时间点描述" },
            founding_event: {
              type: "string",
              description: "元年开始的标志事件",
            },
            calendar_rules: {
              type: "array",
              items: { type: "string" },
              description: "时间计算规则",
            },
          },
          required: ["name", "description", "founding_event", "calendar_rules"],
        },
        time_units: {
          description: "时间单位定义，包含年、月、日、时辰等",
          type: "object",
          properties: {
            year: { type: "string", description: "年的定义" },
            month: { type: "string", description: "月的定义" },
            day: { type: "string", description: "日的定义" },
            hour: { type: "string", description: "时辰的定义" },
          },
          required: ["year", "month", "day"],
        },
        events: {
          description: "时间线事件列表，每个事件包含时间、描述、影响等",
          type: "array",
          items: {
            type: "object",
            properties: {
              event_id: {
                type: "string",
                description: "事件唯一ID，格式: evt_<描述>",
              },
              year: {
                type: "integer",
                description: "事件发生时间（相对于创世时间点的年数）",
              },
              month: { type: "integer", description: "事件发生的月份（可选）" },
              day: { type: "integer", description: "事件发生的日期（可选）" },
              name: { type: "string", description: "事件名称" },
              description: { type: "string", description: "事件描述" },
              type: {
                type: "string",
                enum: [
                  "political",
                  "war",
                  "natural",
                  "personal",
                  "magical",
                  "cultural",
                  "economic",
                  "other",
                ],
                description: "事件类型",
              },
              importance: {
                type: "string",
                enum: ["critical", "major", "minor"],
                description: "事件重要程度",
              },
              involved_characters: {
                type: "array",
                items: { type: "string" },
                description: "涉及的角色ID列表",
              },
              locations: {
                type: "array",
                items: { type: "string" },
                description: "涉及的地点",
              },
              consequences: {
                type: "array",
                items: { type: "string" },
                description: "事件的影响",
              },
              related_content: {
                type: "array",
                items: { type: "string" },
                description: "相关内容描述（不应包含具体章节信息，应描述事件的相关内容、影响或关联元素）",
              },
              is_described: {
                type: "boolean",
                description: "是否已经在小说中描述",
              },
            },
            required: [
              "event_id",
              "year",
              "name",
              "description",
              "type",
              "importance",
              "involved_characters",
              "locations",
              "consequences",
              "related_content",
              "is_described",
            ],
          },
        },
        periods: {
          description: "时间段定义数组，包含历史时期及其特征",
          type: "array",
          items: {
            type: "object",
            properties: {
              period_id: {
                type: "string",
                description: "时期ID，格式: period_<名称>",
              },
              name: { type: "string", description: "时期名称" },
              start_year: { type: "integer", description: "开始年份" },
              end_year: { type: "integer", description: "结束年份" },
              characteristics: {
                type: "array",
                items: { type: "string" },
                description: "时期特征",
              },
              major_events: {
                type: "array",
                items: { type: "string" },
                description: "主要事件ID列表",
              },
            },
            required: [
              "period_id",
              "name",
              "start_year",
              "end_year",
              "characteristics",
              "major_events",
            ],
          },
        },
        consistency_rules: {
          description: "时间线一致性规则数组，维护时间轴的逻辑一致性",
          type: "array",
          items: {
            type: "object",
            properties: {
              rule_id: {
                type: "string",
                description: "规则ID，格式: rule_<类型>_<描述>",
              },
              description: { type: "string", description: "规则描述" },
              type: {
                type: "string",
                enum: [
                  "causality",
                  "chronology",
                  "character_age",
                  "travel_time",
                  "other",
                ],
                description: "规则类型",
              },
              check_conditions: {
                type: "array",
                items: { type: "string" },
                description: "检查条件",
              },
              violation_handling: {
                type: "string",
                description: "违规处理方式",
              },
            },
            required: [
              "rule_id",
              "description",
              "type",
              "check_conditions",
              "violation_handling",
            ],
          },
        },
        current_story_time: {
          description: "当前故事时间点，相对于创世时间点的时间",
          type: "object",
          properties: {
            year: { type: "integer", description: "当前故事年份" },
            month: { type: "integer", description: "当前故事月份" },
            day: { type: "integer", description: "当前故事日期" },
          },
          required: ["year"],
        },
      },
      required: [
        "genesis_point",
        "time_units",
        "events",
        "periods",
        "consistency_rules",
        "current_story_time",
      ],
    },
  },
};
