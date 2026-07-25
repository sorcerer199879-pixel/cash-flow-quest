import type { FinancialState } from "../types";

export interface BusinessStatus {
  expectedRevenue: number;
  productionCost: number;
  grossProfit: number;
  payroll: number;
  rent: number;
  otherFixed: number;
  depreciation: number;
  interest: number;
  totalMonthlyCost: number;
  breakEvenRevenue: number;
  monthlyGrowthRate: number;
  annualizedGrowthRate: number;
  cashRunwayMonths: number;
  workingCapital: number;
  equityRatio: number;
}

export function calculateBusinessStatus(financial: FinancialState): BusinessStatus {
  const expectedRevenue = Math.max(0, Math.round(financial.baseRevenue * (1 + financial.growthRate)));
  const productionCost = Math.round(expectedRevenue * financial.variableCostRate);
  const grossProfit = expectedRevenue - productionCost;
  const payroll = Math.round(financial.monthlyFixedCosts * .55);
  const rent = Math.round(financial.monthlyFixedCosts * .2);
  const otherFixed = financial.monthlyFixedCosts - payroll - rent;
  const depreciation = Math.round(financial.balance.equipment / 60);
  const debt = financial.balance.shortDebt + financial.balance.longDebt;
  const interest = Math.round(debt * financial.interestRate / 12);
  const totalMonthlyCost = productionCost + financial.monthlyFixedCosts + depreciation + interest;
  const contributionMarginRate = Math.max(.01, 1 - financial.variableCostRate);
  const breakEvenRevenue = Math.round((financial.monthlyFixedCosts + depreciation + interest) / contributionMarginRate);
  const annualizedGrowthRate = Math.pow(1 + financial.growthRate, 12) - 1;
  const cashRunwayMonths = financial.balance.cash / Math.max(1, financial.monthlyFixedCosts);
  const workingCapital = financial.balance.receivables + financial.balance.inventory - financial.balance.payables;
  const totalAssets = financial.balance.cash + financial.balance.receivables + financial.balance.inventory +
    financial.balance.equipment + financial.balance.otherAssets;
  const equityRatio = financial.balance.equity / Math.max(1, totalAssets);
  return {
    expectedRevenue, productionCost, grossProfit, payroll, rent, otherFixed, depreciation, interest,
    totalMonthlyCost, breakEvenRevenue, monthlyGrowthRate: financial.growthRate, annualizedGrowthRate,
    cashRunwayMonths, workingCapital, equityRatio
  };
}

