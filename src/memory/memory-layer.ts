import { Env } from "..";

/**
 * 记忆层抽象基类，实现单例模式
 * 所有记忆层都应该继承这个基类以获得单例功能
 */
export abstract class MemoryLayer<FetchInput, FetchOutput, UpdateInput> {
  /** 静态实例管理映射 */
  private static instances: Map<any, any> = new Map();

  /** 层的唯一标识符 */
  abstract type:
    | "episodic"
    | "semantic"
    | "worldState"
    | "plot"
    | "character"
    | "theme"
    | "timeline";

  /** 该层的默认权重 */
  abstract weight: number;

  /**
   * 单例获取方法
   * @param args 构造函数参数
   * @returns 单例实例
   */
  public static getInstance<T extends MemoryLayer<any, any, any>>(
    this: new (...args: any[]) => T,
    ...args: any[]
  ): T {
    if (!MemoryLayer.instances.has(this)) {
      MemoryLayer.instances.set(this, new this(...args));
    }
    return MemoryLayer.instances.get(this);
  }

  /**
   * 受保护的构造函数，确保只能通过getInstance创建实例
   */
  protected constructor() {
    MemoryLayer.instances.set(this.constructor, this);
  }

  /**
   * 根据查询，从该层获取相关的记忆片段，用于组装上下文。
   * @param query 描述当前上下文需求的查询对象。
   * @returns 一个包含相关记忆文本片段的字符串数组。
   */
  abstract fetch(query: FetchInput, env: Env): Promise<FetchOutput>;

  /**
   * 在新章节生成后，用新信息更新该层。
   * 实现方式因层而异（例如，代理驱动或直接注入）。
   * @param content 最新生成的、已校验的章节内容。
   */
  abstract update(content: UpdateInput, env: Env): Promise<void>;
}
