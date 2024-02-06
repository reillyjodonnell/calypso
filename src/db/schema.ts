import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { db } from '../utils/db.ts';
import {
  foreignKey,
  integer,
  numeric,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), //discord_id
  gamesWon: integer('games_won').notNull(),
  gamesLost: integer('games_lost').notNull(),
  //activeWeaponId: text('active_weapons_id').references(() => weapons.id),
});

export type SelectUsers = InferSelectModel<typeof users>;
export type InsertUsers = InferInsertModel<typeof users>;

export const weapons = sqliteTable('weapons', {
  id: text('id').primaryKey(),
  name: text('weapon_name').notNull(),
  damage: text('weapon_damage').notNull(),
  price: integer('price').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  emoji: text('emoji').notNull(),
});
//rarity should be a FK in a rarity table
