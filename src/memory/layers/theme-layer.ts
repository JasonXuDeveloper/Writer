import { Env } from "../..";
import { CreativeElements } from "../../types/novel-config";
import { MemoryLayer } from "../memory-layer";

/**
 * ThemeLayer is a memory layer that stores the central theme of the novel.
 */
export class ThemeLayer extends MemoryLayer<any, {
  theme: string;
  creative_elements: CreativeElements;
}, any> {
  type = "theme" as const;
  weight = 0.8;

  public constructor() {
    super();
  }

  async fetch(query: any, env: Env): Promise<{
    theme: string;
    creative_elements: CreativeElements;
  }> {
    return {
      theme: env.NOVEL_CONFIG.basic_settings.central_theme,
      creative_elements: env.NOVEL_CONFIG.creative_elements,
    };
  }

  async update(content: any, env: Env): Promise<void> {
    return;
  }
}
