export interface Identity {
  current_name: string;
  known_aliases: string[];
  role_type: "protagonist" | "antagonist" | "supporting" | "minor";
  age: number;
  gender: "male" | "female" | "other";
  appearance: {
    height: string;
    build: string;
    hair: string;
    eyes: string;
    distinctive_features: string[];
    typical_attire: string;
  };
}

export interface Personality {
  core_traits: string[];
  moral_alignment: string;
  fears: string[];
  motivations: string[];
  quirks: string[];
}

export interface Relationship {
  target_id: string;
  target_name: string;
  relation_type: string;
  affinity_level: number;
}

export interface Skill {
  skill_id: string;
  name: string;
  level: number;
  progress: number;
  last_used: number;
  description: string;
  limitations?: string[];
}

export interface Abilities {
  skills: Skill[];
  special_traits: string[];
}

export interface InventoryItem {
  item_id: string;
  name: string;
  description: string;
  effects?: string[];
}

export interface EmotionalComponent {
  emotion: string;
  target?: string;
  intensity: number;
}

export interface EmotionalState {
  overall_mood: string;
  intensity: number;
  components: EmotionalComponent[];
}

export interface VoiceProfile {
  speech_patterns: string[];
  catchphrases: string[];
  vocabulary_style: string;
  recent_dialogue_example: string;
}

export interface Character {
  character_id: string;
  identity: Identity;
  personality: Personality;
  relationships: Relationship[];
  abilities: Abilities;
  inventory: InventoryItem[];
  emotional_state: EmotionalState;
  voice_profile: VoiceProfile;
}

export interface CharacterGroupRelationship {
  target_group: string;
  relation: string;
  tension_level: number;
}

export interface CharacterGroup {
  group_id: string;
  name: string;
  members: string[];
  faction_alignment: string;
  group_relationships: CharacterGroupRelationship[];
}

export interface CharacterState {
  characters: Character[];
  character_groups: CharacterGroup[];
}
