/**
 * Enriched demo data for screenshots and store previews.
 *
 * Activated via ?screenshots=true URL parameter.
 * Never overwrites real user data. Only used when explicitly requested.
 * Clearly labeled in the UI as "Screenshot demo mode".
 */

import { ledgerData } from "./seed";
import type { LedgerData } from "./types";

function cents(n: number) {
  return Math.round(n * 100) / 100;
}

export function createScreenshotLedgerData(): LedgerData {
  // Start with base demo data and enrich it
  const accounts = [
    { id: "chequing", name: "Chequing", kind: "chequing" as const, subtitle: "Main everyday account", balance: 3617.42, currency: "CAD" as const },
    { id: "savings", name: "Savings", kind: "savings" as const, subtitle: "Emergency fund", balance: 10720.80, currency: "CAD" as const },
    { id: "cash", name: "Cash", kind: "cash" as const, subtitle: "On hand", balance: 240.00, currency: "CAD" as const },
    { id: "crypto", name: "Crypto", kind: "crypto" as const, subtitle: "Long term", balance: 1853.15, currency: "CAD" as const },
    { id: "credit", name: "Credit Card", kind: "credit-card" as const, subtitle: "2 accounts", balance: -1086.72, currency: "CAD" as const },
    { id: "loans", name: "Student Loan", kind: "loan" as const, subtitle: "Repayment plan", balance: -11850.00, currency: "CAD" as const },
  ];

  const budgets = [
    { id: "budget-groceries", category: "Groceries", month: "2026-06", amount: cents(800), spent: cents(542.30) },
    { id: "budget-dining", category: "Food delivery", month: "2026-06", amount: cents(300), spent: cents(267.80) },
    { id: "budget-transport", category: "Transport", month: "2026-06", amount: cents(200), spent: cents(88.50) },
    { id: "budget-shopping", category: "Shopping", month: "2026-06", amount: cents(250), spent: cents(312.45) },
    { id: "budget-health", category: "Health", month: "2026-06", amount: cents(150), spent: cents(63.20) },
    { id: "budget-utilities", category: "Utilities", month: "2026-06", amount: cents(350), spent: cents(345.10) },
  ];

  const goals = [
    { id: "goal-emergency", name: "Emergency fund target", targetAmount: cents(15000), currentAmount: cents(10720.80), targetDate: "2026-12-31", createdAt: "2026-01-15" },
    { id: "goal-vacation", name: "Summer vacation", targetAmount: cents(3000), currentAmount: cents(1200), targetDate: "2026-08-15", createdAt: "2026-03-01" },
    { id: "goal-loan", name: "Student loan prepayment", targetAmount: cents(5000), currentAmount: cents(1500), targetDate: "2026-11-01", createdAt: "2026-04-10" },
  ];

  // More realistic transaction data
  const transactions = [
    // June 2026 — recent
    { id: "st1", date: "2026-06-20", description: "Metro Grocery", category: "Groceries", accountId: "chequing", amount: cents(-82.45), merchant: "Metro", source: "manual" as const },
    { id: "st2", date: "2026-06-19", description: "Tim Hortons", category: "Food & Drink", accountId: "chequing", amount: cents(-5.82), merchant: "Tim Hortons", source: "manual" as const },
    { id: "st3", date: "2026-06-19", description: "Salary Deposit", category: "Income", accountId: "chequing", amount: cents(2715.00), merchant: "Employer", source: "manual" as const },
    { id: "st4", date: "2026-06-18", description: "Uber Eats", category: "Food delivery", accountId: "credit", amount: cents(-24.37), merchant: "Uber Eats", note: "Late work dinner", source: "manual" as const },
    { id: "st5", date: "2026-06-17", description: "Shell Gas", category: "Transport", accountId: "credit", amount: cents(-58.20), merchant: "Shell", source: "manual" as const },
    { id: "st6", date: "2026-06-16", description: "Phone Bill", category: "Utilities", accountId: "chequing", amount: cents(-85.00), merchant: "Telus", source: "manual" as const },
    { id: "st7", date: "2026-06-15", description: "Rent Transfer", category: "Rent", accountId: "chequing", amount: cents(-1600.00), merchant: "Landlord", source: "manual" as const },
    { id: "st8", date: "2026-06-14", description: "Costco Wholesale", category: "Groceries", accountId: "credit", amount: cents(-156.30), merchant: "Costco", source: "manual" as const },
    { id: "st9", date: "2026-06-13", description: "Netflix", category: "Subscriptions", accountId: "credit", amount: cents(-18.99), merchant: "Netflix", source: "manual" as const },
    { id: "st10", date: "2026-06-12", description: "RBC Insurance", category: "Health", accountId: "chequing", amount: cents(-112.50), merchant: "RBC Insurance", source: "manual" as const },
    { id: "st11", date: "2026-06-11", description: "Amazon.ca", category: "Shopping", accountId: "credit", amount: cents(-67.43), merchant: "Amazon", source: "manual" as const },
    { id: "st12", date: "2026-06-10", description: "Loblaws", category: "Groceries", accountId: "chequing", amount: cents(-98.72), merchant: "Loblaws", source: "manual" as const },
    { id: "st13", date: "2026-06-09", description: "SkipTheDishes", category: "Food delivery", accountId: "credit", amount: cents(-42.15), merchant: "Skip", source: "manual" as const },
    { id: "st14", date: "2026-06-08", description: "Hydro Bill", category: "Utilities", accountId: "chequing", amount: cents(-78.40), merchant: "Hydro One", source: "manual" as const },
    { id: "st15", date: "2026-06-07", description: "GoodLife Fitness", category: "Subscriptions", accountId: "chequing", amount: cents(-29.00), merchant: "GoodLife", source: "manual" as const },
    { id: "st16", date: "2026-06-05", description: "Shoppers Drug Mart", category: "Health", accountId: "credit", amount: cents(-34.29), merchant: "Shoppers", source: "manual" as const },
    { id: "st17", date: "2026-06-03", description: "TTC Monthly Pass", category: "Transport", accountId: "chequing", amount: cents(-143.00), merchant: "TTC", source: "manual" as const },
    { id: "st18", date: "2026-06-01", description: "Internet", category: "Subscriptions", accountId: "chequing", amount: cents(-69.99), merchant: "TekSavvy", source: "manual" as const },
    // May 2026 — historical
    { id: "st19", date: "2026-05-28", description: "Grocery Run", category: "Groceries", accountId: "chequing", amount: cents(-73.18), source: "manual" as const },
    { id: "st20", date: "2026-05-25", description: "Salary Deposit", category: "Income", accountId: "chequing", amount: cents(2715.00), source: "manual" as const },
    { id: "st21", date: "2026-05-22", description: "Restaurant", category: "Food delivery", accountId: "credit", amount: cents(-56.80), source: "manual" as const },
    { id: "st22", date: "2026-05-20", description: "Transfer to Savings", category: "Income", accountId: "savings", amount: cents(500.00), note: "Auto-save", source: "manual" as const },
    { id: "st23", date: "2026-05-15", description: "Rent", category: "Rent", accountId: "chequing", amount: cents(-1600.00), source: "manual" as const },
    { id: "st24", date: "2026-05-10", description: "Amazon.ca", category: "Shopping", accountId: "credit", amount: cents(-42.99), source: "manual" as const },
    { id: "st25", date: "2026-05-05", description: "Mobile Plan", category: "Utilities", accountId: "chequing", amount: cents(-59.00), source: "manual" as const },
    // April 2026
    { id: "st26", date: "2026-04-30", description: "Interest Payment", category: "Income", accountId: "savings", amount: cents(18.42), source: "manual" as const },
    { id: "st27", date: "2026-04-28", description: "Specialty Foods", category: "Groceries", accountId: "credit", amount: cents(-124.50), source: "manual" as const },
    { id: "st28", date: "2026-04-25", description: "Salary Deposit", category: "Income", accountId: "chequing", amount: cents(2610.00), source: "manual" as const },
    { id: "st29", date: "2026-04-22", description: "WiFi Upgrade", category: "Shopping", accountId: "chequing", amount: cents(-199.99), source: "manual" as const },
    { id: "st30", date: "2026-04-15", description: "Rent", category: "Rent", accountId: "chequing", amount: cents(-1600.00), source: "manual" as const },
  ];

  return {
    ...ledgerData,
    accounts,
    budgets,
    goals,
    transactions,
  };
}
