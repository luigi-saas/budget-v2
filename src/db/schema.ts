import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  serial,
  json,
  real,
  uuid,
} from "drizzle-orm/pg-core";

// ── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").default(""),
  displayName: varchar("display_name", { length: 255 }).notNull().default("User"),
  photoURL: text("photo_url"),
  plan: varchar("plan", { length: 20 }).notNull().default("free"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  locale: varchar("locale", { length: 10 }).notNull().default("en-US"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  darkMode: boolean("dark_mode").notNull().default(false),
  notifications: boolean("notifications").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Month Budgets ───────────────────────────────────────────────────────────
export const monthBudgets = pgTable("month_budgets", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  monthId: varchar("month_id", { length: 7 }).notNull(), // e.g. "2025-01"
  label: varchar("label", { length: 50 }).notNull(),
  totalBudget: real("total_budget").notNull().default(0),
  homePart: real("home_part").notNull().default(0),
  walletPart: real("wallet_part").notNull().default(0),
  bankPart: real("bank_part").notNull().default(0),
  variableCategoryBases: json("variable_category_bases").notNull().default({}),
  fixedCategoryBases: json("fixed_category_bases").notNull().default({}),
  activeVariableCategories: json("active_variable_categories").notNull().default([]),
  activeFixedCategories: json("active_fixed_categories").notNull().default([]),
  categoryColors: json("category_colors").notNull().default({}),
  categoryIcons: json("category_icons").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Variable Expenses ───────────────────────────────────────────────────────
export const variableExpenses = pgTable("variable_expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  monthBudgetId: integer("month_budget_id").notNull().references(() => monthBudgets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  amount: real("amount").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  person: varchar("person", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Fixed Expenses ──────────────────────────────────────────────────────────
export const fixedExpenses = pgTable("fixed_expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  monthBudgetId: integer("month_budget_id").notNull().references(() => monthBudgets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  amount: real("amount").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  base: real("base").notNull().default(0),
  date: varchar("date", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Saving Goals ────────────────────────────────────────────────────────────
export const savingGoals = pgTable("saving_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  target: real("target").notNull(),
  current: real("current").notNull().default(0),
  source: varchar("source", { length: 20 }).notNull().default("BANK"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
