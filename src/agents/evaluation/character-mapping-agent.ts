import { Agent } from "../agent";
import { Env } from "../..";
import { CharacterState, Character, CharacterGroup } from "../../types/memory/character";
import { CharacterName } from "./character-name-extraction-agent";

export interface CharacterMappingInput {
    characterNames: CharacterName[]; // 需要检索的角色名
    characterState: CharacterState; // 上一章的角色状态
}

export interface CharacterMappingResult {
    characters: Character[];
    characterGroups: CharacterGroup[];
}

export class CharacterMappingAgent extends Agent<CharacterMappingInput, CharacterMappingResult> {
    name = "CharacterMappingAgent";
    category = "evaluation" as const;

    public constructor() {
        super();
    }

    async execute(input: CharacterMappingInput, env: Env): Promise<CharacterMappingResult> {
        const { characterNames, characterState } = input;
        const allCharacters = characterState.characters;
        const allCharacterGroups = characterState.character_groups;

        if (!characterNames.length || (!allCharacters.length && !allCharacterGroups.length)) {
            return { characters: [], characterGroups: [] };
        }

        // 去重：移除重复的角色名
        const uniqueCharacterNames = characterNames.filter((name, index, self) =>
            index === self.findIndex(n => n.name === name.name)
        );

        // 1. 为每个角色的主名和所有别名都生成向量
        // 结构：[{ character, name, embedding }]
        const characterNameEmbeddings: Array<{
            character: Character,
            name: string,
            embedding: number[]
        }> = [];
        for (const char of allCharacters) {
            const allNames = [char.identity.current_name, ...(char.identity.known_aliases || [])];
            for (const name of allNames) {
                const embedding = await env.EMBEDDING_SERVICE.generateEmbedding(name);
                characterNameEmbeddings.push({
                    character: char,
                    name,
                    embedding: embedding[0].values!
                });
            }
        }

        // 2. 为每个输入角色名单独生成向量
        const nameEmbeddings = await Promise.all(
            uniqueCharacterNames.map(async name => {
                const embedding = await env.EMBEDDING_SERVICE.generateEmbedding(name.name);
                return {
                    name: name.name,
                    embedding: embedding[0].values!
                };
            })
        );

        // 3. 先匹配角色
        const matchedCharacters: Character[] = [];
        const matchedCharacterIds = new Set<string>();

        for (let i = 0; i < nameEmbeddings.length; i++) {
            const { name: extractedName, embedding: nameVec } = nameEmbeddings[i];

            // 匹配角色（遍历所有角色的所有名字向量，取最大分数）
            let bestChar: Character | null = null;
            let bestCharScore = -Infinity;
            let bestCharName = "";
            for (const item of characterNameEmbeddings) {
                const score = cosineSimilarity(nameVec, item.embedding);
                if (score > bestCharScore) {
                    bestCharScore = score;
                    bestChar = item.character;
                    bestCharName = item.name;
                }
            }

            // 阈值
            const charThreshold = 0.5;
            if (bestChar && bestCharScore > charThreshold) {
                if (!matchedCharacterIds.has(bestChar.character_id)) {
                    matchedCharacters.push(bestChar);
                    matchedCharacterIds.add(bestChar.character_id);
                }
            }
        }

        // 4. 再匹配角色组：遍历已匹配的角色，找到它们所属的角色组
        const matchedCharacterGroups: CharacterGroup[] = [];
        const matchedGroupIds = new Set<string>();

        for (const matchedChar of matchedCharacters) {
            // 查找该角色所属的所有角色组
            for (const group of allCharacterGroups) {
                if (group.members.includes(matchedChar.character_id)) {
                    if (!matchedGroupIds.has(group.group_id)) {
                        matchedCharacterGroups.push(group);
                        matchedGroupIds.add(group.group_id);
                    }
                }
            }
        }

        return {
            characters: matchedCharacters,
            characterGroups: matchedCharacterGroups
        };
    }
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
} 