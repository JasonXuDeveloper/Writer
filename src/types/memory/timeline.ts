export interface TimeUnit {
  /** 年的定义 */
  year: string;
  /** 月的定义 */
  month: string;
  /** 日的定义 */
  day: string;
  /** 时辰的定义 */
  hour?: string;
}

export interface GenesisPoint {
  /** 创世时间点名称 */
  name: string;
  /** 创世时间点描述 */
  description: string;
  /** 元年开始的标志事件 */
  founding_event: string;
  /** 时间计算规则 */
  calendar_rules: string[];
}

export interface TimelineEvent {
  /** 事件唯一ID */
  event_id: string;
  /** 事件发生时间（相对于创世时间点的年数） */
  year: number;
  /** 事件发生的月份（可选） */
  month?: number;
  /** 事件发生的日期（可选） */
  day?: number;
  /** 事件名称 */
  name: string;
  /** 事件描述 */
  description: string;
  /** 事件类型 */
  type:
    | "political"
    | "war"
    | "natural"
    | "personal"
    | "magical"
    | "cultural"
    | "economic"
    | "other";
  /** 事件重要程度 */
  importance: "critical" | "major" | "minor";
  /** 涉及的角色ID列表 */
  involved_characters: string[];
  /** 涉及的地点 */
  locations: string[];
  /** 事件的影响 */
  consequences: string[];
  /** 相关内容描述（不应包含具体章节信息，应描述事件的相关内容、影响或关联元素） */
  related_content: string[];
  /** 是否已经在小说中描述 */
  is_described: boolean;
}

export interface TimePeriod {
  /** 时期ID */
  period_id: string;
  /** 时期名称 */
  name: string;
  /** 开始年份 */
  start_year: number;
  /** 结束年份 */
  end_year: number;
  /** 时期特征 */
  characteristics: string[];
  /** 主要事件ID列表 */
  major_events: string[];
}

export interface TimelineConsistencyRule {
  /** 规则ID */
  rule_id: string;
  /** 规则描述 */
  description: string;
  /** 规则类型 */
  type: "causality" | "chronology" | "character_age" | "travel_time" | "other";
  /** 检查条件 */
  check_conditions: string[];
  /** 违规处理方式 */
  violation_handling: string;
}

export interface Timeline {
  /** 创世时间点定义 */
  genesis_point: GenesisPoint;
  /** 时间单位定义 */
  time_units: TimeUnit;
  /** 事件列表 */
  events: TimelineEvent[];
  /** 时间段定义 */
  periods: TimePeriod[];
  /** 时间线一致性规则 */
  consistency_rules: TimelineConsistencyRule[];
  /** 当前故事时间点（相对于创世时间点的年数） */
  current_story_time: {
    year: number;
    month?: number;
    day?: number;
  };
}
