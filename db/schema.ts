import { relations, type InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cache_table = sqliteTable("caches", {
  key: text().unique().primaryKey(),
  value: text().notNull(),
  created_at: integer({ mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer({ mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const sessions_table = sqliteTable("sessions", {
  id: text().primaryKey(),
  data: text({ mode: "json" }).notNull(),
});

export const service_table = sqliteTable("services", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text().unique().notNull(),
  link: text().unique().notNull(),
  is_premium: integer({ mode: "boolean" }).default(false).notNull(),
  use: integer({ mode: "boolean" }).default(true).notNull(),
  created_at: integer({ mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer({ mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type Service = typeof service_table.$inferSelect;

export const style_lookup_table = sqliteTable("styles", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text().unique(),
});

export type DbStyle = InferSelectModel<typeof style_lookup_table>;

export const properties_table = sqliteTable("properties", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  url: text().unique().notNull(),
  title: text().notNull(),
  price: text(),
  style_lookup_id: integer().references(() => style_lookup_table.id),
  service_id: integer().references(() => service_table.id),
  concelho_id: integer().references(() => concelhos_table.id),
  created_at: integer({ mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
  updated_at: integer({ mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export type DbProperty = InferSelectModel<typeof properties_table>;

export const districts_table = sqliteTable("distritos", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text().unique().notNull(),
});

export type DbDistrict = InferSelectModel<typeof districts_table>;

export const concelhos_table = sqliteTable("concelhos", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text().unique().notNull(),
  distrito_id: integer()
    .references(() => districts_table.id)
    .notNull(),
});

export type DbMunicipality = InferSelectModel<typeof concelhos_table>;

export const style_relations = relations(style_lookup_table, ({ many }) => ({
  estates: many(properties_table),
}));

export const concelhosRelations = relations(
  concelhos_table,
  ({ one, many }) => ({
    distrito: one(districts_table, {
      fields: [concelhos_table.distrito_id],
      references: [districts_table.id],
    }),
    properties: many(properties_table),
  })
);

export const distritosRelations = relations(districts_table, ({ many }) => ({
  concelhos: many(concelhos_table),
}));

export const property_relations = relations(properties_table, ({ one }) => ({
  style: one(style_lookup_table, {
    fields: [properties_table.style_lookup_id],
    references: [style_lookup_table.id],
  }),
  service: one(service_table, {
    fields: [properties_table.service_id],
    references: [service_table.id],
  }),
  concelho: one(concelhos_table, {
    fields: [properties_table.concelho_id],
    references: [concelhos_table.id],
  }),
}));

export const service_relations = relations(service_table, ({ many }) => ({
  estates: many(properties_table),
}));
