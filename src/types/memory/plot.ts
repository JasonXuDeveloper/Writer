export interface Foreshadowing {
  description: string;
  progress: number;
}

export interface Conflict {
  description: string;
  intensity: number;
  parties: string[];
}

export interface CharacterGoal {
  character: string;
  goal: string;
  progress: number;
}

export interface PlotConfig {
  foreshadowings: Foreshadowing[];
  conflicts: Conflict[];
  character_goals: CharacterGoal[];
}
