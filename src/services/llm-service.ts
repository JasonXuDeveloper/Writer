import { Env } from "..";
import { ChatPayload } from "../agents/llm-agent";

interface LLMResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: any;
}

class LLMService {
  async chat(payload: ChatPayload, env: Env): Promise<string> {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY 未配置");
    }

    // 使用 fetch 直接调用 OpenRouter API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API 错误: ${response.status} - ${errorText}`);
    }
    try {
      const data = (await response.json()) as LLMResponse;
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error("OpenRouter API 返回结构异常", error);
    }

    throw new Error("OpenRouter API 返回结构异常");
  }
}

export const llmService = new LLMService();
