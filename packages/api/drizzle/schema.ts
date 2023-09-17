import { relations } from 'drizzle-orm';
import {
    integer,
    pgEnum,
    pgTable,
    serial,
    text,
    varchar,
    primaryKey,
    timestamp,
} from 'drizzle-orm/pg-core';

// ENUMS

export const userRole = pgEnum('user_role', ['NONE', 'PENDING', 'USER', 'ADMIN']);

export const instanceConnectionType = pgEnum('instance_connection_type', ['SSH', 'VNC', 'RDP']);

// TABLES

export const user = pgTable('user', {
    id: serial('id').primaryKey().notNull(),
    username: varchar('username', { length: 128 }).unique().notNull(),
    role: userRole('role').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
});

export const quota = pgTable('quota', {
    id: serial('id').primaryKey().notNull(),
    userId: integer('user_id')
        .notNull()
        .references(() => user.id),
    maxInstances: integer('max_instances').default(2).notNull(),
});

export const group = pgTable('group', {
    id: serial('id').primaryKey().notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description').notNull(),
    awsPortfolioId: varchar('aws_portfolio_id', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const instance = pgTable('instance', {
    id: serial('id').primaryKey().notNull(),
    userId: integer('user_id')
        .notNull()
        .references(() => user.id),
    awsInstanceId: varchar('aws_instance_id', { length: 50 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description'),
    connectionType: instanceConnectionType('connection_type').notNull(),
    platform: varchar('platform', { length: 100 }).notNull(), // Linux, Windows, etc
    distribution: varchar('distribution', { length: 100 }).notNull(), // Ubuntu, Windows Server 2019, etc
    instanceType: varchar('instance_type', { length: 50 }).notNull(), // t2.micro, t3.small, etc
    cpu: varchar('cpu_size_in_gb', { length: 10 }).notNull(), // 1, 2, 4, etc
    memoryInGb: varchar('memory_in_gb', { length: 10 }).notNull(), // 1, 2, 4, etc
    storageInGb: varchar('storage_in_gb', { length: 10 }).notNull(), // 16, 32, 64, etc
    tags: text('tags'), // comma separated list of software names
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastConnectionAt: timestamp('last_connection_at'),
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
    instances: many(instance),
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

export const instanceRelations = relations(instance, ({ one }) => ({
    user: one(user, {
        fields: [instance.userId],
        references: [user.id],
    }),
}));
