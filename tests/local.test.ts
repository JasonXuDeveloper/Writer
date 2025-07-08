/// <reference types="jest" />
// @ts-nocheck
import { initializeTestEnv, TestEnv } from "./utils/test-env";
import { CharacterLayer } from "../src/memory/layers/character-layer";
import { PlotLayer } from "../src/memory/layers/plot-layer";
import { TimelineLayer } from "../src/memory/layers/timeline-layer";
import { WorldStateLayer } from "../src/memory/layers/world-state-layer";
import { ThemeLayer } from "../src/memory/layers/theme-layer";
import { SemanticLayer, SemanticLayerType } from "../src/memory/layers/semantic-layer";
import { EpisodicLayer } from "../src/memory/layers/episodic-layer";

describe('Memory layers fetch', () => {
  let env: TestEnv;
  beforeAll(async () => { env = initializeTestEnv(); await env.DATABASE_SERVICE.initializeDatabase(); });
  afterAll(async () => { await env.DATABASE_SERVICE.close(); });

  it('CharacterLayer.fetch does not throw', async () => {
    await expect(CharacterLayer.getInstance().fetch({ currentChapter: 0 }, env as any)).resolves.not.toThrow();
  });
  it('PlotLayer.fetch does not throw', async () => {
    await expect(PlotLayer.getInstance().fetch({ currentChapter: 0 }, env as any)).resolves.not.toThrow();
  });
  it('TimelineLayer.fetch does not throw', async () => {
    await expect(TimelineLayer.getInstance().fetch({ currentChapter: 0 }, env as any)).resolves.not.toThrow();
  });
  it('WorldStateLayer.fetch does not throw', async () => {
    await expect(WorldStateLayer.getInstance().fetch({ currentChapter: 0 }, env as any)).resolves.not.toThrow();
  });
  it('ThemeLayer.fetch does not throw', async () => {
    await expect(ThemeLayer.getInstance().fetch({}, env as any)).resolves.not.toThrow();
  });
  it('SemanticLayer.fetch does not throw', async () => {
    // semantic fetch requires existing chapter text, skip if none
    await expect(SemanticLayer.getInstance().fetch({ query: '测试', type: SemanticLayerType.CHAPTER_CONTENT, maxResults: 1 }, env as any)).resolves.not.toThrow();
  });
  it('EpisodicLayer.fetch does not throw', async () => {
    await expect(EpisodicLayer.getInstance().fetch({ chapterNumber: 1, windowSize: 3 }, env as any)).resolves.not.toThrow();
  });
}, 1200000);

jest.setTimeout(1200000); 