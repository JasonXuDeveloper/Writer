/// <reference types="jest" />
// @ts-nocheck
import { initializeTestEnv, TestEnv } from "./utils/test-env";
import { GenVolumeAgent } from "../src/agents/planning/gen-volume-agent";
import { CharacterLayer } from "../src/memory/layers/character-layer";
import { TimelineLayer } from "../src/memory/layers/timeline-layer";
import { WorldStateLayer } from "../src/memory/layers/world-state-layer";
import { PlotLayer } from "../src/memory/layers/plot-layer";
import { ThemeLayer } from "../src/memory/layers/theme-layer";

jest.setTimeout(1200000);

describe('GenVolumeAgent interface', () => {
  let env: TestEnv;

  beforeAll(async () => {
    env = initializeTestEnv();
    await env.DATABASE_SERVICE.initializeDatabase();
  });

  afterAll(async () => {
    await env.DATABASE_SERVICE.close();
  });

  it('execute does not throw', async () => {
    const agent = GenVolumeAgent.getInstance();
    const cs = await CharacterLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const tl = await TimelineLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const ws = await WorldStateLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const pc = await PlotLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const theme = await ThemeLayer.getInstance().fetch({}, env as any);

    const input = {
      novelConfig: env.NOVEL_CONFIG,
      currentWordCount: 0,
      targetWordCount: env.NOVEL_CONFIG.basic_settings.total_word_count,
      characterState: cs.state,
      timeline: tl.timeline,
      worldState: ws.world,
      plotConfig: pc.plot,
      theme,
    };

    await expect(agent.execute(input, env as any)).resolves.not.toThrow();
  }, 600000);
}); 