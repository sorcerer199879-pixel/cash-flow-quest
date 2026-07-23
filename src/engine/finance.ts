import type { ActionEffect, CashFlowStatement, FinancialState, IncomeStatement } from "../types";

const round = Math.round;
export const emptyIncome = (): IncomeStatement => ({revenue:0,cogs:0,grossProfit:0,payroll:0,marketing:0,rent:0,otherFixed:0,depreciation:0,interest:0,operatingProfit:0,pretaxProfit:0,tax:0,netIncome:0});
export const emptyCashFlow = (): CashFlowStatement => ({netIncome:0,depreciation:0,receivablesChange:0,inventoryChange:0,payablesChange:0,operatingCF:0,capex:0,investingCF:0,borrowing:0,repayment:0,equityRaised:0,financingCF:0,freeCF:0,cashChange:0});

export function calculateMonth(previous: FinancialState, effects: ActionEffect[], directCosts: number) {
  const sum = (key: keyof ActionEffect) => effects.reduce((n, e) => n + Number(e[key] ?? 0), 0);
  const revenueMultiplier = sum("revenueMultiplier");
  const growthRate = Math.max(-.05, previous.growthRate + sum("growthChange"));
  const revenue = Math.max(0, round(previous.baseRevenue * (1 + growthRate) * (1 + revenueMultiplier)));
  const variableCostRate = Math.min(.8, Math.max(.15, previous.variableCostRate + sum("variableCostRateChange")));
  const cogs = round(revenue * variableCostRate);
  const fixed = Math.max(0, previous.monthlyFixedCosts + sum("fixedCostChange"));
  const payroll = round(fixed * .55), rent = round(fixed * .2), otherFixed = fixed - payroll - rent;
  const marketing = directCosts;
  const capex = Math.max(0, sum("capex"));
  const equipmentBeforeDep = previous.balance.equipment + capex;
  const depreciation = round(equipmentBeforeDep / 60);
  const debt = previous.balance.shortDebt + previous.balance.longDebt;
  const interest = round(debt * previous.interestRate / 12);
  const grossProfit = revenue - cogs;
  const operatingProfit = grossProfit - payroll - marketing - rent - otherFixed - depreciation;
  const pretaxProfit = operatingProfit - interest;
  const tax = pretaxProfit > 0 ? round(pretaxProfit * .25) : 0;
  const netIncome = pretaxProfit - tax;
  const income: IncomeStatement = {revenue,cogs,grossProfit,payroll,marketing,rent,otherFixed,depreciation,interest,operatingProfit,pretaxProfit,tax,netIncome};

  const receivableMonths = Math.max(0, previous.receivableMonths + sum("receivableMonthsChange"));
  const payableMonths = Math.max(0, previous.payableMonths + sum("payableMonthsChange"));
  const receivables = round(revenue * receivableMonths);
  const inventory = Math.max(0, round(previous.balance.inventory + (cogs - previous.income.cogs) * .45 + sum("inventoryChange")));
  const payables = round(cogs * payableMonths);
  const receivablesChange = receivables - previous.balance.receivables;
  const inventoryChange = inventory - previous.balance.inventory;
  const payablesChange = payables - previous.balance.payables;
  const operatingCF = netIncome + depreciation - receivablesChange - inventoryChange + payablesChange;
  const investingCF = -capex;
  const borrowing = Math.max(0, sum("borrowing"));
  const requestedRepayment = Math.max(0, sum("repayment"));
  const repayment = Math.min(debt + borrowing, requestedRepayment);
  const equityRaised = Math.max(0, sum("equityRaised"));
  const financingCF = borrowing - repayment + equityRaised;
  const freeCF = operatingCF + investingCF;
  const cashChange = operatingCF + investingCF + financingCF;
  const cash = previous.balance.cash + cashChange;
  const longDebt = Math.max(0, previous.balance.longDebt + borrowing - repayment);
  const equipment = Math.max(0, equipmentBeforeDep - depreciation);
  const totalAssets = cash + receivables + inventory + equipment + previous.balance.otherAssets;
  const equity = totalAssets - payables - previous.balance.shortDebt - longDebt;
  const cashFlow: CashFlowStatement = {netIncome,depreciation,receivablesChange,inventoryChange,payablesChange,operatingCF,capex,investingCF,borrowing,repayment,equityRaised,financingCF,freeCF,cashChange};
  return {
    income, cashFlow,
    balance:{cash,receivables,inventory,equipment,otherAssets:previous.balance.otherAssets,payables,shortDebt:previous.balance.shortDebt,longDebt,equity},
    baseRevenue:Math.max(0,round(previous.baseRevenue*(1+growthRate*.45))), growthRate,
    variableCostRate:Math.max(.15, previous.variableCostRate + sum("variableCostRateChange")*.22),
    monthlyFixedCosts:Math.max(0, previous.monthlyFixedCosts + sum("fixedCostChange")*.5),
    interestRate:previous.interestRate, receivableMonths:previous.receivableMonths, payableMonths:previous.payableMonths
  } satisfies FinancialState;
}
