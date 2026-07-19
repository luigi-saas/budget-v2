// ── Category types ──────────────────────────────────────────────────────────
export const VARIABLE_TYPES = [
  "Groceries", "Transport", "Restaurants", "Entertainment",
  "Beauty", "Family", "Shopping", "Health", "Education", "Other",
] as const;

export const FIXED_TYPES = [
  "Rent", "Utilities", "Internet", "Phone", "Insurance", "Subscriptions", "Other",
] as const;

export type ExpenseType = string;
export type FixedType = string;

// ── Money places ─────────────────────────────────────────────────────────────
export type MoneyPlace = "bank" | "home" | "wallet";
export const MONEY_PLACES: MoneyPlace[] = ["bank", "home", "wallet"];
export const MONEY_PLACE_LABEL: Record<MoneyPlace, string> = {
  bank: "Bank",
  home: "Home",
  wallet: "Wallet",
};

// ── Category Colors ──────────────────────────────────────────────────────────
export const CAT_COLOR: Record<string, string> = {
  Groceries: "#D6A75C",
  Transport: "#7B9E8E",
  Restaurants: "#C9695A",
  Entertainment: "#B9925A",
  Beauty: "#C98A8F",
  Family: "#8FA37E",
  Shopping: "#C9695A",
  Health: "#5FA97A",
  Education: "#7B9E8E",
  Other: "#8A8175",
  Rent: "#D6A75C",
  Utilities: "#7B9E8E",
  Internet: "#5FA97A",
  Phone: "#B9925A",
  Insurance: "#C98A8F",
  Subscriptions: "#8A8175",
};

// ── Currencies ───────────────────────────────────────────────────────────────
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
];

export function formatCurrency(amount: number, currency: string = "USD"): string {
  const c = CURRENCIES.find(x => x.code === currency);
  const sym = c?.symbol ?? currency;
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Onboarding Strategies ────────────────────────────────────────────────────
export interface ManagementStrategy {
  id: string;
  name: string;
  tagline: string;
  description: string;
  homeShare: number;
  bankShare: number;
  recommended?: boolean;
}

export const MANAGEMENT_STRATEGIES: ManagementStrategy[] = [
  { id: "50-30-20", name: "50/30/20 Rule", recommended: true, tagline: "Recommended — balanced & beginner-friendly", description: "50% needs, 30% wants, 20% savings.", homeShare: 0.3, bankShare: 0.2 },
  { id: "zero-based", name: "Zero-Based Budgeting", tagline: "Best for tight control", description: "Give every dollar a job so nothing is unaccounted.", homeShare: 0.35, bankShare: 0.1 },
  { id: "envelope", name: "Envelope System", tagline: "Best for cash spenders", description: "Keep separate cash envelopes per category.", homeShare: 0.55, bankShare: 0.05 },
  { id: "pay-yourself-first", name: "Pay Yourself First", tagline: "Best for saving goals", description: "Set money aside the moment you're paid.", homeShare: 0.25, bankShare: 0.3 },
];

export interface CategorySuggestion {
  type: string;
  hint: string;
  sharePct: number;
  recommended: boolean;
}

export const SUGGESTED_VARIABLE_CATEGORIES: CategorySuggestion[] = [
  { type: "Groceries", hint: "Groceries & everyday food", sharePct: 12, recommended: true },
  { type: "Transport", hint: "Fuel & transport", sharePct: 5, recommended: true },
  { type: "Restaurants", hint: "Eating out", sharePct: 4, recommended: true },
  { type: "Family", hint: "Family activities", sharePct: 5, recommended: true },
  { type: "Shopping", hint: "Clothing & purchases", sharePct: 6, recommended: true },
  { type: "Other", hint: "Miscellaneous", sharePct: 3, recommended: true },
  { type: "Entertainment", hint: "Nights out & fun", sharePct: 3, recommended: false },
  { type: "Beauty", hint: "Personal care", sharePct: 3, recommended: false },
  { type: "Health", hint: "Medical & pharmacy", sharePct: 3, recommended: false },
  { type: "Education", hint: "Courses & books", sharePct: 2, recommended: false },
];

export const SUGGESTED_FIXED_CATEGORIES: CategorySuggestion[] = [
  { type: "Rent", hint: "Rent or mortgage", sharePct: 30, recommended: true },
  { type: "Utilities", hint: "Electricity, water, gas", sharePct: 3, recommended: true },
  { type: "Internet", hint: "Home internet", sharePct: 2, recommended: true },
  { type: "Phone", hint: "Mobile plan", sharePct: 2, recommended: true },
  { type: "Insurance", hint: "Insurance premiums", sharePct: 3, recommended: false },
  { type: "Subscriptions", hint: "Streaming & tools", sharePct: 1, recommended: false },
  { type: "Other", hint: "Other recurring bills", sharePct: 2, recommended: false },
];

// ── Month helpers ─────────────────────────────────────────────────────────────
export function currentMonthId(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(id: string): string {
  const [y, m] = id.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function prevMonthId(id: string): string {
  const [y, m] = id.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function nextMonthId(id: string): string {
  const [y, m] = id.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
