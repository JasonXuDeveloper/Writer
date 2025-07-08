import { Agent } from "./agent";
import { llmService } from "../services/llm-service";
import { Env } from "..";
import { logs } from "../db/schema";
import { DatabaseService } from "../services/database-service";

// 定义了代理所需的 LLM 参数
export interface AgentConfig {
  models: string[]; // 支持多个模型
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

// 定义了 Prompt 的结构，分离了 system-level 指令和 user-level 输入
export interface Prompt {
  system: string;
  user: string;
}

// 定义了期望从 LLM 得到的 JSON 响应格式
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string; // Schema 的名称
    strict?: boolean; // 是否强制严格遵循 Schema
    schema: object; // JSON Schema 定义对象
  };
}

export type ChatPayload = Omit<AgentConfig, "models"> & {
  model: string;
  messages: {
    role: "system" | "user";
    content: string;
  }[];
  response_format: ResponseFormat;
  stream?: boolean;
  reasoning?: {
    exclude?: boolean;
  };
};

export abstract class LLMBaseAgent<I, O> extends Agent<I, O> {
  // 子类在构造时提供其特定的 LLM 配置
  constructor(protected config: AgentConfig) {
    super();
  }

  name = this.constructor.name;
  abstract category:
    | "planning"
    | "creation"
    | "validator"
    | "memory"
    | "evaluation";

  async execute(input: I, env: Env): Promise<O> {
    const { system, user } = this.generatePrompt(input);
    const response_format = this.getResponseFormat();
    const db = DatabaseService.getInstance().getDb();
    const requestTime = new Date();

    // 并发发起所有模型请求，收集 promise
    const tasks = this.config.models.map((model) => {
      const { models, ...restConfig } = this.config;
      const requestPayload: ChatPayload = {
        ...restConfig,
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: response_format,
        reasoning: { exclude: true }
      };
      return (async () => {
        let raw = "";
        let respondTime: Date;
        let elapsed = 0;
        try {
          console.log("开始请求", this.name, model);
          raw = await llmService.chat(requestPayload, env);
          respondTime = new Date();
          elapsed = respondTime.getTime() - requestTime.getTime();
          return { model, raw, respondTime, elapsed };
        } catch (error) {
          respondTime = new Date();
          elapsed = respondTime.getTime() - requestTime.getTime();
          throw { error, model, raw, respondTime, elapsed };
        }
      })();
    });

    // 竞速逻辑：谁先 parse 成功用谁，否则全部失败才报错
    const pending = tasks.map((p, i) => ({ p, i }));
    const failedLogs: any[] = [];
    while (pending.length > 0) {
      // 取最快 settle 的 promise
      const raceArr = pending.map(({ p }, idx) => p.then(
        v => ({ status: "fulfilled" as const, value: v, idx }),
        e => ({ status: "rejected" as const, reason: e, idx })
      ));
      const settled = await Promise.race(raceArr);
      const { idx } = settled;
      // 移除已 settle 的 promise
      pending.splice(idx, 1);
      if (settled.status === "fulfilled") {
        const { model, raw, respondTime, elapsed } = settled.value;
        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch (parseError) {
          // parse 失败，缓存失败日志，继续下一个
          failedLogs.push({
            agent: this.name,
            category: this.category,
            model,
            input: input as any,
            output: {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              raw: raw,
            },
            request_time: requestTime,
            respond_time: respondTime,
            elapsed: elapsed,
          });
          continue;
        }
        // parse 成功，插入日志并返回
        try {
          await db.insert(logs).values({
            agent: this.name,
            category: this.category,
            model,
            input: input as any,
            output: parsed,
            request_time: requestTime,
            respond_time: respondTime,
            elapsed: elapsed,
          });
        } catch (logErr) {
          console.error("插入成功日志时出错", logErr);
        }
        return parsed as O;
      } else {
        // 请求失败，缓存失败日志
        const { error, model, raw, respondTime, elapsed } = settled.reason;
        failedLogs.push({
          agent: this.name,
          category: this.category,
          model,
          input: input as any,
          output: {
            error: error instanceof Error ? error.message : String(error),
            raw: raw,
          },
          request_time: requestTime,
          respond_time: respondTime,
          elapsed: elapsed,
        });
      }
    }
    // 全部失败，批量插入所有失败日志
    if (failedLogs.length > 0) {
      try {
        await db.insert(logs).values(failedLogs);
      } catch (logErr) {
        console.error("插入全部失败日志时出错", logErr);
      }
    }
    throw new Error(`所有模型请求均失败: ${failedLogs.map(l => l.output?.error).join('; ')}`);
  }

  // 每个具体代理必须实现自己的提示生成逻辑
  protected abstract generatePrompt(input: I): Prompt;

  // 每个具体代理可以定义自己期望的 JSON 输出格式。
  protected abstract getResponseFormat(): ResponseFormat;
}
