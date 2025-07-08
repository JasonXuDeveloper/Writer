export interface BasicSettings {
  title: string;
  total_word_count: number;
  chapter_word_count: number;
  writing_style: string;
  narrative_perspective: string;
  central_theme: string;
}

export interface PowerSystem {
  levels: string[];
  energy_source: string;
  cultivation_methods: string[];
}

export interface WorldBuilding {
  era_setting: string;
  world_map: string[];
  power_system: PowerSystem;
  social_structure: string;
  special_rules: string[];
}

export interface PlotStructure {
  central_conflict: string;
  core_hook: string;
  main_quest: string;
  ending_type: string;
}

export interface Protagonist {
  name: string;
  appearance: string;
  personality_traits: string[];
  motivation: string;
  growth_arc: string;
  special_ability: string;
}

export interface Antagonist {
  name: string;
  antagonist_type: string;
  conflict_point: string;
}

export interface SupportingCharacter {
  role: string;
  relation_to_protagonist: string;
}

export interface CharacterSystem {
  protagonist: Protagonist;
  antagonists: Antagonist[];
  supporting_characters: SupportingCharacter[];
}

export interface ChapterStructure {
  hook_requirements: string;
  cliffhanger_frequency: string;
}

export interface MarketPositioning {
  target_audience: string;
  genre_tags: string[];
  competitive_analysis: string;
}

export interface PublicationSettings {
  chapter_structure: ChapterStructure;
  market_positioning: MarketPositioning;
}

export interface CreativeElements {
  signature_features: string[];
  cultural_references: string[];
  unique_settings: string[];
}

export interface NovelConfig {
  basic_settings: BasicSettings;
  world_building: WorldBuilding;
  plot_structure: PlotStructure;
  character_system: CharacterSystem;
  publication_settings: PublicationSettings;
  creative_elements: CreativeElements;
}

export interface NovelConfigFile {
  novel_config: NovelConfig;
}
