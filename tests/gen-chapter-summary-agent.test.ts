/// <reference types="jest" />
// @ts-nocheck
import { initializeTestEnv, TestEnv } from "./utils/test-env";
import { GenChapterSummaryAgent } from "../src/agents/planning/gen-chapter-summary-agent";
import { CharacterLayer } from "../src/memory/layers/character-layer";
import { TimelineLayer } from "../src/memory/layers/timeline-layer";
import { WorldStateLayer } from "../src/memory/layers/world-state-layer";
import { PlotLayer } from "../src/memory/layers/plot-layer";
import { ThemeLayer } from "../src/memory/layers/theme-layer";
import { GenVolumeAgent } from "../src/agents/planning/gen-volume-agent";
import { GenArcAgent } from "../src/agents/planning/gen-arc-agent";

jest.setTimeout(1200000);

describe('GenChapterSummaryAgent interface', () => {
  let env: TestEnv;
  let volume: any;
  let arc: any;

  beforeAll(async () => {
    env = initializeTestEnv();
    await env.DATABASE_SERVICE.initializeDatabase();
    // 生成卷
    const csVol = await CharacterLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const tlVol = await TimelineLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const wsVol = await WorldStateLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const pcVol = await PlotLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const themeVol = await ThemeLayer.getInstance().fetch({}, env as any);
    const volBlueprint = await GenVolumeAgent.getInstance().execute({
      novelConfig: env.NOVEL_CONFIG,
      currentWordCount: 0,
      targetWordCount: env.NOVEL_CONFIG.basic_settings.total_word_count,
      characterState: csVol.state,
      timeline: tlVol.timeline,
      worldState: wsVol.world,
      plotConfig: pcVol.plot,
      theme: themeVol,
    }, env as any);
    volume = { volumeNumber: 1, ...volBlueprint };
    // 生成情节段
    const arcBlueprint = await GenArcAgent.getInstance().execute({
      novelConfig: env.NOVEL_CONFIG,
      volume,
      arcNumberInVolume: 1,
      currentWordCount: 0,
      targetWordCount: env.NOVEL_CONFIG.basic_settings.total_word_count,
      characterState: csVol.state,
      timeline: tlVol.timeline,
      worldState: wsVol.world,
      plotConfig: pcVol.plot,
      theme: themeVol,
    }, env as any);
    arc = { arcNumberInVolume: 1, volumeNumber: 1, ...arcBlueprint };
  });

  afterAll(async () => {
    await env.DATABASE_SERVICE.close();
  });

  it('execute does not throw', async () => {
    const agent = GenChapterSummaryAgent.getInstance();
    const cs = await CharacterLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const tl = await TimelineLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const ws = await WorldStateLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const pc = await PlotLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const theme = await ThemeLayer.getInstance().fetch({}, env as any);

    const input = {
      novelConfig: env.NOVEL_CONFIG,
      volume,
      arc,
      chapterNumber: 1,
      currentWordCount: 0,
      targetWordCount: env.NOVEL_CONFIG.basic_settings.total_word_count,
      characterState: cs.state,
      timeline: tl.timeline,
      worldState: ws.world,
      plotConfig: pc.plot,
      theme,
    };

    await expect(agent.execute(input, env as any)).resolves.not.toThrow();
  });
}); 