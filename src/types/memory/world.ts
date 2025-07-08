export interface Region {
  name: string;
  elevation: string;
  special_rules: string[];
}

export interface Continent {
  name: string;
  climate: string;
  regions: Record<string, Region>;
}

export interface Geography {
  continents: Record<string, Continent>;
}

export interface RuleDetail {
  requirements: string[];
  limitations: string[];
}

export interface MagicSystem {
  name: string;
  rules: Record<string, RuleDetail>;
}

export interface MagicSystems {
  [key: string]: MagicSystem;
}

export interface Faction {
  name: string;
  hierarchy: string[];
  territories: string[];
  special_abilities: string[];
}

export interface Factions {
  [key: string]: Faction;
}

export interface Artifact {
  name: string;
  type: string;
  origin: string;
  abilities: string[];
  limitations: string[];
}

export interface Artifacts {
  [key: string]: Artifact;
}

export interface CulturalRule {
  taboos: string[];
  customs: string[];
  social_hierarchy: string[];
}

export interface CulturalRules {
  [key: string]: CulturalRule;
}

export interface Zone {
  location: string;
  rules: string[];
}

export interface SpecialZones {
  [key: string]: Zone;
}

export interface PhysicalLaws {
  general: {
    gravity: string;
    magic_permeability: string;
  };
  special_zones: SpecialZones;
}

export interface World {
  geography: Geography;
  magic_systems: MagicSystems;
  factions: Factions;
  artifacts: Artifacts;
  cultural_rules: CulturalRules;
  physical_laws: PhysicalLaws;
}
