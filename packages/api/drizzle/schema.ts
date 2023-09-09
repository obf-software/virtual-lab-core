import { relations } from 'drizzle-orm';
import {
    date,
    integer,
    pgEnum,
    pgTable,
    serial,
    text,
    varchar,
    primaryKey,
} from 'drizzle-orm/pg-core';

// ENUMS

export const userRole = pgEnum('user_role', ['USER', 'ADMIN']);

// TABLES

export const user = pgTable('user', {
    id: serial('id').primaryKey().notNull(),
    username: varchar('username', { length: 128 }).unique().notNull(),
    role: userRole('role').notNull(),
    createdAt: date('created_at').defaultNow().notNull(),
    updatedAt: date('updated_at').defaultNow().notNull(),
    lastLoginAt: date('last_login_at').notNull(),
});

export const quota = pgTable('quota', {
    id: serial('id').primaryKey().notNull(),
    userId: serial('user_id')
        .notNull()
        .references(() => user.id),
    maxInstances: integer('max_instances').default(2).notNull(),
});

export const group = pgTable('group', {
    id: serial('id').primaryKey().notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description').notNull(),
    portfolioId: varchar('portfolio_id', { length: 100 }).notNull(),
    createdAt: date('created_at').defaultNow().notNull(),
    updatedAt: date('updated_at').defaultNow().notNull(),
});

// JOIN TABLES

export const userToGroup = pgTable(
    'user_to_group',
    {
        userId: integer('user_id')
            .notNull()
            .references(() => user.id),
        groupId: integer('group_id')
            .notNull()
            .references(() => group.id),
    },
    (t) => ({ pk: primaryKey(t.userId, t.groupId) }),
);

// RELATIONS

export const userRelations = relations(user, ({ one, many }) => ({
    quota: one(quota, {
        fields: [user.id],
        references: [quota.userId],
    }),
    userToGroup: many(userToGroup),
}));

export const groupRelations = relations(group, ({ many }) => ({
    userToGroup: many(userToGroup),
}));

export const userToGroupRelations = relations(userToGroup, ({ one }) => ({
    user: one(user, {
        fields: [userToGroup.userId],
        references: [user.id],
    }),
    group: one(group, {
        fields: [userToGroup.groupId],
        references: [group.id],
    }),
}));
