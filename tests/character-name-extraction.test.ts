/// <reference types="jest" />
// @ts-nocheck
import { initializeTestEnv, TestEnv } from "./utils/test-env";
import { CharacterNameExtractionAgent } from "../src/agents/evaluation/character-name-extraction-agent";
import { CharacterMappingAgent } from "../src/agents/evaluation/character-mapping-agent";
import { CharacterState } from "../src/types/memory/character";

jest.setTimeout(1200000);

describe('CharacterNameExtractionAgent', () => {
  let env: TestEnv;

  beforeAll(async () => {
    env = initializeTestEnv();
    await env.DATABASE_SERVICE.initializeDatabase();
  });

  it('Test Case 1: Simple character extraction', async () => {
    const agent = CharacterNameExtractionAgent.getInstance();
    const testChapter1 = `
萧瑾宸站在山巅，望着远方的云海。他的剑术已经达到了一个新的境界。
"师父，我明白了。"他对身旁的老者说道。
老者点了点头："瑾宸，你的悟性很高。"
`;
    await expect(
      agent.execute({ chapterText: testChapter1 }, env as any)
    ).resolves.not.toThrow();
  });

  it('Test Case 2: Complex character extraction', async () => {
    const agent = CharacterNameExtractionAgent.getInstance();
    const testChapter2 = `
萧瑾宸缓缓走来，萧兄认出了他。
"师父，您怎么来了？"瑾宸问道。
老者微笑着说："来看看你的进步。"
这时，林小月也走了过来。
`;
    await expect(
      agent.execute({ chapterText: testChapter2 }, env as any)
    ).resolves.not.toThrow();
  });

  it('Test Case 3: Simple character extraction', async () => {
    const agent = CharacterNameExtractionAgent.getInstance();
    const testChapter3 = `
林小月走进房间，看到张明正在看书。
"张明，吃饭了。"林小月说道。
王老师从外面走了进来。
`;
    await expect(
      agent.execute({ chapterText: testChapter3 }, env as any)
    ).resolves.not.toThrow();
  });
});

describe('CharacterMappingAgent full extraction + mapping', () => {
  let env: TestEnv;

  beforeAll(async () => {
    env = initializeTestEnv();
    await env.DATABASE_SERVICE.initializeDatabase();
  });

  afterAll(async () => {
    await env.DATABASE_SERVICE.close();
  });

  it('Extracted names map to correct characters and groups', async () => {
    const extractionAgent = CharacterNameExtractionAgent.getInstance();
    const mappingAgent = CharacterMappingAgent.getInstance();

    // 模拟角色状态数据
    const mockCharacterState: CharacterState = {
      characters: [
        {
          character_id: "char_xiaojinchen",
          identity: {
            current_name: "萧瑾宸",
            known_aliases: ["瑾宸", "萧兄"],
            role_type: "protagonist",
            age: 25,
            gender: "male",
            appearance: { height: "", build: "", hair: "", eyes: "", distinctive_features: [], typical_attire: "" }
          },
          personality: { core_traits: [], moral_alignment: "", fears: [], motivations: [], quirks: [] },
          relationships: [],
          abilities: { skills: [], special_traits: [] },
          inventory: [],
          emotional_state: { overall_mood: "", intensity: 0, components: [] },
          voice_profile: { speech_patterns: [], catchphrases: [], vocabulary_style: "", recent_dialogue_example: "" }
        },
        {
          character_id: "char_linxiaoyue",
          identity: {
            current_name: "林小月",
            known_aliases: ["小月"],
            role_type: "supporting",
            age: 20,
            gender: "female",
            appearance: { height: "", build: "", hair: "", eyes: "", distinctive_features: [], typical_attire: "" }
          },
          personality: { core_traits: [], moral_alignment: "", fears: [], motivations: [], quirks: [] },
          relationships: [],
          abilities: { skills: [], special_traits: [] },
          inventory: [],
          emotional_state: { overall_mood: "", intensity: 0, components: [] },
          voice_profile: { speech_patterns: [], catchphrases: [], vocabulary_style: "", recent_dialogue_example: "" }
        }
      ],
      character_groups: [
        {
          group_id: "group_qingyunmen",
          name: "青云门",
          members: ["char_xiaojinchen", "char_linxiaoyue"],
          faction_alignment: "正道",
          group_relationships: []
        }
      ]
    };

    const testChapter = `
萧瑾宸站在山巅，望着远方的云海。他的剑术已经达到了一个新的境界。
"师父，我明白了。"他对身旁的老者说道。
老者点了点头："瑾宸，你的悟性很高。"
这时，林小月也走了过来，她手里拿着一束草药。
"小月，你采药回来了？"萧兄问道。
"是的，今天收获不错。"小月微笑着回答。
`;

    const extractedNames = await extractionAgent.execute({ chapterText: testChapter }, env as any);
    const mappingResult = await mappingAgent.execute({ characterNames: extractedNames, characterState: mockCharacterState }, env as any);

    const matchedCharacterNames = mappingResult.characters.map(c => c.identity.current_name);
    const matchedGroupNames = mappingResult.characterGroups.map(g => g.name);

    expect(matchedCharacterNames).toContain("萧瑾宸");
    expect(matchedCharacterNames).toContain("林小月");
    expect(matchedGroupNames).toContain("青云门");
  });
});