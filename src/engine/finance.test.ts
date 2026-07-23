import { describe,expect,it } from "vitest";
import { calculateMonth, emptyCashFlow, emptyIncome } from "./finance";
import type { FinancialState } from "../types";
const base=():FinancialState=>({income:{...emptyIncome(),cogs:400000},cashFlow:emptyCashFlow(),balance:{cash:5_000_000,receivables:1_000_000,inventory:800_000,equipment:2_000_000,otherAssets:0,payables:400_000,shortDebt:0,longDebt:1_000_000,equity:7_400_000},baseRevenue:2_000_000,growthRate:0,variableCostRate:.4,monthlyFixedCosts:500_000,interestRate:.03,receivableMonths:1,payableMonths:1});
describe("financial model",()=>{
 it("cash equation always reconciles",()=>{const p=base(),n=calculateMonth(p,[],0);expect(n.balance.cash).toBe(p.balance.cash+n.cashFlow.operatingCF+n.cashFlow.investingCF+n.cashFlow.financingCF)});
 it("calculates operating CF from profit and working capital",()=>{const n=calculateMonth(base(),[],0),cf=n.cashFlow;expect(cf.operatingCF).toBe(cf.netIncome+cf.depreciation-cf.receivablesChange-cf.inventoryChange+cf.payablesChange)});
 it("reflects receivable terms",()=>{const n=calculateMonth(base(),[{receivableMonthsChange:1}],0);expect(n.balance.receivables).toBe(n.income.revenue*2);expect(n.cashFlow.receivablesChange).toBe(n.balance.receivables-1_000_000)});
 it("reflects inventory movement",()=>{const n=calculateMonth(base(),[{inventoryChange:500_000}],0);expect(n.cashFlow.inventoryChange).toBe(n.balance.inventory-800_000);expect(n.balance.inventory).toBeGreaterThan(800_000)});
 it("reflects payable movement",()=>{const n=calculateMonth(base(),[{payableMonthsChange:1}],0);expect(n.balance.payables).toBe(n.income.cogs*2);expect(n.cashFlow.payablesChange).toBe(n.balance.payables-400_000)});
 it("handles borrowing and repayment",()=>{const n=calculateMonth(base(),[{borrowing:2_000_000,repayment:500_000}],0);expect(n.cashFlow.financingCF).toBe(1_500_000);expect(n.balance.longDebt).toBe(2_500_000)});
 it("capitalizes investment and records investing CF",()=>{const n=calculateMonth(base(),[{capex:1_200_000}],0);expect(n.cashFlow.investingCF).toBe(-1_200_000);expect(n.balance.equipment).toBeGreaterThan(2_000_000)});
});
