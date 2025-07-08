import {
  LLMBaseAgent,
  AgentConfig,
  Prompt,
  ResponseFormat,
} from "../llm-agent";

const CHARACTER_NAME_EXTRACTION_CONFIG: AgentConfig = {
  models: ["microsoft/mai-ds-r1:free"],
  temperature: 0,
  max_tokens: 20000,
  stream: false,
};

export interface CharacterName {
  name: string;
}

export interface CharacterNameExtractionInput {
  chapterText: string;
}

export class CharacterNameExtractionAgent extends LLMBaseAgent<
  CharacterNameExtractionInput,
  CharacterName[]
> {
  name = "CharacterNameExtractionAgent";
  category = "evaluation" as const;

  constructor() {
    super(CHARACTER_NAME_EXTRACTION_CONFIG);
  }

  protected generatePrompt(input: CharacterNameExtractionInput): Prompt {
    const system = `你是一个角色名提取代理，负责从章节文本中准确识别所有出现的角色名称。

**重要规则：**
1. 只提取有明确名字的角色
2. 不提取代词（他、她、它等）
3. 不提取模糊描述（那个剑客、那个女子等）
4. 提取所有出现的具体人名，包括别名
5. 如果文本中没有具体人名，返回空数组

**输出格式：** 返回角色名对象数组，每个对象包含name字段，例如：[{"name": "萧瑾宸"}, {"name": "瑾宸"}, {"name": "师父"}, {"name": "林小月"}]`;

    const user = `# 角色名提取指令

## 章节内容
${input.chapterText}

## 提取要求
请提取文本中所有有具体名字的角色。

## 提取范围
- ✅ 具体人名：萧瑾宸、林小月、张明等
- ✅ 别名：瑾宸、萧兄、小月等  
- ✅ 称号：师父、师兄、先生等（如果有具体名字）
- ❌ 代词：他、她、它等
- ❌ 模糊描述：那个剑客、那个女子等

## 输出格式
返回角色名对象数组，每个对象包含name字段，例如：
[{"name": "萧瑾宸"}, {"name": "瑾宸"}, {"name": "师父"}, {"name": "林小月"}]

如果文本中没有具体人名，返回空数组：[]`;

    return { system, user };
  }

  protected getResponseFormat(): ResponseFormat {
    return {
      type: "json_schema",
      json_schema: {
        name: "CharacterNames",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "提取到的角色名称"
              }
            },
            required: ["name"]
          }
        }
      }
    };
  }
} 