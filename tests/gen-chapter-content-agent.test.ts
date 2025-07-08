/// <reference types="jest" />
// @ts-nocheck
import { initializeTestEnv, TestEnv } from "./utils/test-env";
import { GenChapterContentAgent } from "../src/agents/planning/gen-chapter-content-agent";
import { CharacterLayer } from "../src/memory/layers/character-layer";
import { TimelineLayer } from "../src/memory/layers/timeline-layer";
import { WorldStateLayer } from "../src/memory/layers/world-state-layer";
import { PlotLayer } from "../src/memory/layers/plot-layer";
import { ThemeLayer } from "../src/memory/layers/theme-layer";
import { EpisodicLayer } from "../src/memory/layers/episodic-layer";
import { GenVolumeAgent } from "../src/agents/planning/gen-volume-agent";
import { GenArcAgent } from "../src/agents/planning/gen-arc-agent";
import { GenChapterSummaryAgent } from "../src/agents/planning/gen-chapter-summary-agent";

jest.setTimeout(1200000);

describe('GenChapterContentAgent interface', () => {
  let env: TestEnv;
  let volume: any;
  let arc: any;
  let chapterSummary: any;

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
    console.log('生成的卷:', JSON.stringify(volume, null, 2));
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
    console.log('生成的情节段:', JSON.stringify(arc, null, 2));
    // 生成章节摘要
    const summaryBlueprint = await GenChapterSummaryAgent.getInstance().execute({
      novelConfig: env.NOVEL_CONFIG,
      volume,
      arc,
      chapterNumber: 1,
      currentWordCount: 0,
      targetWordCount: env.NOVEL_CONFIG.basic_settings.total_word_count,
      characterState: csVol.state,
      timeline: tlVol.timeline,
      worldState: wsVol.world,
      plotConfig: pcVol.plot,
      theme: themeVol,
    }, env as any);
    chapterSummary = { title: (summaryBlueprint as any).title, summary: (summaryBlueprint as any).summary };
    console.log('生成的章节摘要:', JSON.stringify(chapterSummary, null, 2));
  });

  afterAll(async () => {
    await env.DATABASE_SERVICE.close();
  });

  it('execute does not throw', async () => {
    const agent = GenChapterContentAgent.getInstance();
    const cs = await CharacterLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const tl = await TimelineLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const ws = await WorldStateLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const pc = await PlotLayer.getInstance().fetch({ currentChapter: 0 }, env as any);
    const theme = await ThemeLayer.getInstance().fetch({}, env as any);
    const em = await EpisodicLayer.getInstance().fetch({ chapterNumber: 1, windowSize: 3 }, env as any);

    const input = {
      novelConfig: env.NOVEL_CONFIG,
      chapterSummary,
      targetWordCount: env.NOVEL_CONFIG.basic_settings.chapter_word_count,
      characterState: cs.state,
      timeline: tl.timeline,
      worldState: ws.world,
      plotConfig: pc.plot,
      theme,
      episodicMemory: em,
    };

    const result = await agent.execute(input, env as any);
    // 打印目标字数和生成字数
    const targetWordCount = env.NOVEL_CONFIG.basic_settings.chapter_word_count;
    // 统计生成正文的字数（中文按字符数，英文可用 split）
    const content = result.content;
    // 简单中文字数统计（不含标点）
    const generatedWordCount = content.replace(/\s/g, '').length;
    console.log('目标字数:', targetWordCount, '生成字数:', generatedWordCount);

    // 检查换行（段落分隔）
    let displayContent = content;
    // 如果没有出现两个换行，尝试用句号、问号、感叹号后加换行分段
    if (!/\n\s*\n/.test(content)) {
      displayContent = content.replace(/([。！？])([^\n])/g, '$1\n\n$2');
      console.log('【警告】原始内容无空行分段，已自动分段显示');
    }
    console.log('生成的章节正文:', displayContent);
    expect(result).toBeDefined();
  });
}); 