import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  serial,
  vector,
  index,
} from "drizzle-orm/pg-core";
import { World } from "../types/memory/world";
import type { PlotConfig } from "../types/memory/plot";
import type { CharacterState as CharacterStateType } from "../types/memory/character";
import type { Timeline } from "../types/memory/timeline";

/** 代表一卷的顶层规划 */
export const volumes = pgTable("volumes", {
  volumeNumber: integer("volume_number").notNull().primaryKey(),
  title: text("title").notNull(),
  coreConflict: text("core_conflict").notNull(),
  emotionalArc: text("emotional_arc").notNull(),
  keyEvents: jsonb("key_events")
    .$type<string[]>()
    .notNull(),
});

/** 代表一个情节段的中层规划 */
export const arcs = pgTable("arcs", {
  arcNumberInVolume: integer("arc_number_in_volume").notNull().primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  goal: jsonb("goal").$type<string[]>().notNull(),
  volumeNumber: integer("volume_number")
    .notNull()
    .references(() => volumes.volumeNumber),
});

/** 代表一个章节 */
export const chapters = pgTable("chapters", {
  chapterNumber: integer("chapter_number").notNull().primaryKey(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  summary: text("summary").notNull(),
  wordCount: integer("word_count").notNull(),
  arcNumberInVolume: integer("arc_number_in_volume")
    .notNull()
    .references(() => arcs.arcNumberInVolume),
  volumeNumber: integer("volume_number")
    .notNull()
    .references(() => volumes.volumeNumber),
});

/**
 * A log of agent activities.
 */
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  agent: text("agent").notNull(),
  category: text("category").notNull(),
  model: text("model").notNull(),
  input: jsonb("input").notNull(),
  output: jsonb("output").notNull(),
  request_time: timestamp("request_time").notNull(),
  respond_time: timestamp("respond_time").notNull(),
  elapsed: integer("elapsed").notNull(),
});

// Add world_states table for world state memory layer
export const world_states = pgTable("world_states", {
  current_chapter: integer("current_chapter").notNull().primaryKey(),
  last_updated: timestamp("last_updated").notNull(),
  world: jsonb("world").$type<World>().notNull(),
});

// Add plot_memories table for plot memory layer
export const plots = pgTable("plots", {
  current_chapter: integer("current_chapter").notNull().primaryKey(),
  last_updated: timestamp("last_updated").notNull(),
  plot: jsonb("plot").$type<PlotConfig>().notNull(),
});

// Add character_states table for character memory layer
export const character_states = pgTable("character_states", {
  current_chapter: integer("current_chapter").notNull().primaryKey(),
  last_updated: timestamp("last_updated").notNull(),
  state: jsonb("state").$type<CharacterStateType>().notNull(),
});

// Add timelines table for timeline memory layer
export const timelines = pgTable("timelines", {
  current_chapter: integer("current_chapter").notNull().primaryKey(),
  last_updated: timestamp("last_updated").notNull(),
  timeline: jsonb("timeline").$type<Timeline>().notNull(),
});

// Add semantic_chunks table for vector storage
export const semantic_chunks = pgTable("semantic_chunks", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 768 }).notNull(), // 使用 vector 类型而不是 text
  metadata: jsonb("metadata").notNull(),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
]);

/**
 * All database tables are defined in this object.
 * Drizzle Kit uses this to generate and push schema changes.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const schema = {
  volumes,
  arcs,
  chapters,
  logs,
  world_states,
  plots,
  character_states,
  timelines,
  semantic_chunks,
};

/**
 * A generic helper type to get the `Select` model of any table.
 * This is the recommended and most type-safe way to get your types.
 * @example
 * type Chapter = SelectModel<typeof chapters>;
 */
export type SelectModel<T extends { $inferSelect: any }> = T["$inferSelect"];

/**
 * A generic helper type to get the `Insert` model of any table.
 * @example
 * type NewChapter = InsertModel<typeof chapters>;
 */
export type InsertModel<T extends { $inferInsert: any }> = T["$inferInsert"];

// Aliases for convenience
export type Chapter = SelectModel<typeof chapters>;
export type NewChapter = InsertModel<typeof chapters>;
export type Volume = SelectModel<typeof volumes>;
export type NewVolume = InsertModel<typeof volumes>;
export type Arc = SelectModel<typeof arcs>;
export type NewArc = InsertModel<typeof arcs>;
export type Log = SelectModel<typeof logs>;
export type NewLog = InsertModel<typeof logs>;

export type WorldState = SelectModel<typeof world_states>;
export type NewWorldState = InsertModel<typeof world_states>;

export type Plot = SelectModel<typeof plots>;
export type NewPlot = InsertModel<typeof plots>;

export type CharacterState = SelectModel<typeof character_states>;
export type NewCharacterState = InsertModel<typeof character_states>;

export type TimelineState = SelectModel<typeof timelines>;
export type NewTimelineState = InsertModel<typeof timelines>;

export type SemanticChunk = SelectModel<typeof semantic_chunks>;
export type NewSemanticChunk = InsertModel<typeof semantic_chunks>;
