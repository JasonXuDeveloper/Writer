import type { ResponseFormat } from "../llm-agent";

export const CHARACTER_STATE_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "CharacterState",
    strict: true,
    schema: {
      type: "object",
      properties: {
        characters: {
          description: "角色对象数组",
          type: "array",
          items: {
            type: "object",
            properties: {
              character_id: {
                type: "string",
                description: "唯一标识符，格式: char_<拼音>",
              },
              identity: {
                description: "身份信息",
                type: "object",
                properties: {
                  current_name: { type: "string", description: "当前使用名称" },
                  known_aliases: {
                    type: "array",
                    items: { type: "string" },
                    description: "别名/称号列表",
                  },
                  role_type: {
                    type: "string",
                    enum: ["protagonist", "antagonist", "supporting", "minor"],
                    description: "角色类型",
                  },
                  age: { type: "integer", description: "年龄" },
                  gender: {
                    type: "string",
                    enum: ["male", "female", "other"],
                    description: "性别",
                  },
                  appearance: {
                    description: "外貌",
                    type: "object",
                    properties: {
                      height: { type: "string", description: "身高" },
                      build: { type: "string", description: "体型" },
                      hair: { type: "string", description: "发型" },
                      eyes: { type: "string", description: "眼睛颜色" },
                      distinctive_features: {
                        type: "array",
                        items: { type: "string" },
                        description: "显著特征",
                      },
                      typical_attire: {
                        type: "string",
                        description: "典型服饰",
                      },
                    },
                    required: [
                      "height",
                      "build",
                      "hair",
                      "eyes",
                      "distinctive_features",
                      "typical_attire",
                    ],
                  },
                },
                required: [
                  "current_name",
                  "known_aliases",
                  "role_type",
                  "age",
                  "gender",
                  "appearance",
                ],
              },
              personality: {
                description: "性格特征",
                type: "object",
                properties: {
                  core_traits: {
                    type: "array",
                    items: { type: "string" },
                    description: "核心性格特征，最多5个",
                  },
                  moral_alignment: { type: "string", description: "道德倾向" },
                  fears: {
                    type: "array",
                    items: { type: "string" },
                    description: "恐惧的事物",
                  },
                  motivations: {
                    type: "array",
                    items: { type: "string" },
                    description: "核心动机",
                  },
                  quirks: {
                    type: "array",
                    items: { type: "string" },
                    description: "行为怪癖",
                  },
                },
                required: [
                  "core_traits",
                  "moral_alignment",
                  "fears",
                  "motivations",
                  "quirks",
                ],
              },
              relationships: {
                description: "关系网络",
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    target_id: { type: "string", description: "目标角色ID" },
                    target_name: {
                      type: "string",
                      description: "目标当前名称",
                    },
                    relation_type: { type: "string", description: "关系类型" },
                    affinity_level: {
                      type: "number",
                      description: "亲密度/敌意度，0.0-1.0",
                      minimum: 0.0,
                      maximum: 1.0,
                    },
                  },
                  required: [
                    "target_id",
                    "target_name",
                    "relation_type",
                    "affinity_level",
                  ],
                  description: "关系网络",
                },
              },
              abilities: {
                description: "能力系统",
                type: "object",
                properties: {
                  skills: {
                    description: "技能",
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill_id: {
                          type: "string",
                          description: "技能ID，格式: skill_<描述>",
                        },
                        name: { type: "string", description: "技能名称" },
                        level: {
                          type: "integer",
                          description: "技能等级，1-5",
                        },
                        progress: {
                          type: "number",
                          description: "进度，0.0-1.0",
                          minimum: 0.0,
                          maximum: 1.0,
                        },
                        last_used: {
                          type: "integer",
                          description: "最后使用章节",
                        },
                        description: {
                          type: "string",
                          description: "技能描述",
                        },
                        limitations: {
                          type: "array",
                          items: { type: "string" },
                          description: "限制",
                        },
                      },
                      required: [
                        "skill_id",
                        "name",
                        "level",
                        "progress",
                        "last_used",
                        "description",
                      ],
                    },
                  },
                  special_traits: {
                    type: "array",
                    items: { type: "string" },
                    description: "特质",
                  },
                },
                required: ["skills", "special_traits"],
              },
              inventory: {
                description: "角色拥有的物品列表",
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    item_id: {
                      type: "string",
                      description: "物品ID，格式: item_<描述>",
                    },
                    name: { type: "string", description: "物品名称" },
                    description: { type: "string", description: "物品描述" },
                    effects: {
                      type: "array",
                      items: { type: "string" },
                      description: "特殊效果",
                    },
                  },
                  required: [
                    "item_id",
                    "name",
                    "description",
                  ],
                  description: "角色拥有的物品",
                },
              },

              emotional_state: {
                type: "object",
                properties: {
                  overall_mood: { type: "string", description: "整体情绪" },
                  intensity: {
                    type: "number",
                    description: "情绪强度，0.0-1.0",
                    minimum: 0.0,
                    maximum: 1.0,
                  },
                  components: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        emotion: { type: "string", description: "具体情绪" },
                        target: { type: "string", description: "情绪对象ID" },
                        intensity: {
                          type: "number",
                          description: "情感强度，0.0-1.0",
                          minimum: 0.0,
                          maximum: 1.0,
                        },
                      },
                      required: ["emotion", "intensity"],
                    },
                  },
                },
                required: ["overall_mood", "intensity", "components"],
                description: "情感状态",
              },

              voice_profile: {
                type: "object",
                properties: {
                  speech_patterns: {
                    type: "array",
                    items: { type: "string" },
                    description: "说话模式",
                  },
                  catchphrases: {
                    type: "array",
                    items: { type: "string" },
                    description: "口头禅",
                  },
                  vocabulary_style: { type: "string", description: "词汇风格" },
                  recent_dialogue_example: {
                    type: "string",
                    description: "对话示例",
                  },
                },
                required: [
                  "speech_patterns",
                  "catchphrases",
                  "vocabulary_style",
                  "recent_dialogue_example",
                ],
                description: "语音特征",
              },

            },
            required: [
              "character_id",
              "identity",
              "personality",
              "relationships",
              "abilities",
              "inventory",
              "emotional_state",
              "voice_profile",
            ],
          },
        },
        character_groups: {
          description: "角色组",
          type: "array",
          items: {
            type: "object",
            properties: {
              group_id: {
                type: "string",
                description: "组ID，格式: group_<名称>",
              },
              name: { type: "string", description: "组名称" },
              members: {
                type: "array",
                items: { type: "string" },
                description: "成员角色ID数组",
              },
              faction_alignment: { type: "string", description: "阵营倾向" },
              group_relationships: {
                description: "组间关系",
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    target_group: { type: "string", description: "目标组ID" },
                    relation: { type: "string", description: "关系类型" },
                    tension_level: {
                      type: "number",
                      description: "紧张程度，0.0-1.0",
                      minimum: 0.0,
                      maximum: 1.0,
                    },
                  },
                  required: ["target_group", "relation", "tension_level"],
                },
              },
            },
            required: [
              "group_id",
              "name",
              "members",
              "faction_alignment",
              "group_relationships",
            ],
          },
        },
      },
      required: ["characters", "character_groups"],
    },
  },
};
