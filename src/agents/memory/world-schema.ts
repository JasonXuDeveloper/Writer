import type { ResponseFormat } from "../llm-agent";

export const WORLD_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "World",
    strict: true,
    schema: {
      type: "object",
      properties: {
        geography: {
          description: "世界地理信息，包括大陆及其区域定义",
          type: "object",
          properties: {
            continents: {
              description: "大陆对象映射，键为大陆标识，值为大陆详情",
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  name: { type: "string", description: "大陆名称" },
                  climate: { type: "string", description: "气候类型" },
                  regions: {
                    description: "该大陆下的区域映射",
                    type: "object",
                    additionalProperties: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "区域名称" },
                        elevation: {
                          type: "string",
                          description: "区域海拔信息",
                        },
                        special_rules: {
                          type: "array",
                          items: { type: "string" },
                          description: "区域特殊规则列表",
                        },
                      },
                      required: ["name", "elevation", "special_rules"],
                    },
                  },
                },
                required: ["name", "climate", "regions"],
              },
            },
          },
          required: ["continents"],
        },
        magic_systems: {
          description: "魔法系统映射，键为系统标识，值为系统详情",
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              name: { type: "string", description: "魔法系统名称" },
              rules: {
                description: "该魔法系统的规则映射",
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    requirements: {
                      type: "array",
                      items: { type: "string" },
                      description: "规则前置条件列表",
                    },
                    limitations: {
                      type: "array",
                      items: { type: "string" },
                      description: "规则限制列表",
                    },
                  },
                  required: ["requirements", "limitations"],
                },
              },
            },
            required: ["name", "rules"],
          },
        },
        factions: {
          description: "派系映射，键为派系标识，值为派系详情",
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              name: { type: "string", description: "派系名称" },
              hierarchy: {
                type: "array",
                items: { type: "string" },
                description: "派系列表结构",
              },
              territories: {
                type: "array",
                items: { type: "string" },
                description: "派系领地列表",
              },
              special_abilities: {
                type: "array",
                items: { type: "string" },
                description: "派系特殊能力列表",
              },
            },
            required: ["name", "hierarchy", "territories", "special_abilities"],
          },
        },
        artifacts: {
          description: "神器映射，键为神器标识，值为神器详情",
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              name: { type: "string", description: "神器名称" },
              type: { type: "string", description: "神器类型" },
              origin: { type: "string", description: "神器来源" },
              abilities: {
                type: "array",
                items: { type: "string" },
                description: "神器能力列表",
              },
              limitations: {
                type: "array",
                items: { type: "string" },
                description: "神器限制列表",
              },
            },
            required: ["name", "type", "origin", "abilities", "limitations"],
          },
        },
        cultural_rules: {
          description: "文化规则映射，键为区域/族群标识，值为文化规则详情",
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              taboos: {
                type: "array",
                items: { type: "string" },
                description: "文化禁忌列表",
              },
              customs: {
                type: "array",
                items: { type: "string" },
                description: "文化习俗列表",
              },
              social_hierarchy: {
                type: "array",
                items: { type: "string" },
                description: "社会等级结构",
              },
            },
            required: ["taboos", "customs", "social_hierarchy"],
          },
        },
        physical_laws: {
          description: "物理法则定义",
          type: "object",
          properties: {
            general: {
              description: "通用物理法则",
              type: "object",
              properties: {
                gravity: { type: "string", description: "重力加速度" },
                magic_permeability: {
                  type: "string",
                  description: "魔法渗透率",
                },
              },
              required: ["gravity", "magic_permeability"],
            },
            special_zones: {
              description: "特殊区域映射，键为区域标识，值为区域规则",
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  location: { type: "string", description: "特殊区域位置标识" },
                  rules: {
                    type: "array",
                    items: { type: "string" },
                    description: "特殊区域规则列表",
                  },
                },
                required: ["location", "rules"],
              },
            },
          },
          required: ["general", "special_zones"],
        },
      },
      required: [
        "geography",
        "magic_systems",
        "factions",
        "artifacts",
        "cultural_rules",
        "physical_laws",
      ],
    },
  },
};
