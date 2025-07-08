import { Env } from "..";

export abstract class Agent<I = any, O = any> {
  /** 統一代理名稱，用於日志 */
  abstract name: string;
  /**
   * 代理类别标签，供编排器基于职责进行路由。
   * - planning：宏观规划 (blueprint, arc)
   * - creation：内容生成 (summary, chapter, improvement)
   * - validator：规则或知识一致性校验
   * - memory：写入/维护记忆层
   * - evaluation：决策、打分或监控
   */
  abstract category:
    | "planning"
    | "creation"
    | "validator"
    | "memory"
    | "evaluation";
  abstract execute(input: I, env: Env): Promise<O>;

  private static instances: Map<any, any> = new Map();

  public static getInstance<T extends Agent<any, any>>(
    this: new (...args: any[]) => T,
    ...args: any[]
  ): T {
    if (!Agent.instances.has(this)) {
      Agent.instances.set(this, new this(...args));
    }
    return Agent.instances.get(this);
  }

  protected constructor() {
    Agent.instances.set(this.constructor, this);
  }
}
