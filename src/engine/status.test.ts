import { describe, expect, it } from "vitest";
import { createGame } from "./game";
import { calculateBusinessStatus } from "./status";

describe("business status", () => {
  it("shows the expected production and fixed costs in integers", () => {
    const status = calculateBusinessStatus(createGame("beginner", 1).financial);
    expect(status.expectedRevenue).toBe(1_821_600);
    expect(status.productionCost).toBe(Math.round(status.expectedRevenue * .43));
    expect(Number.isInteger(status.totalMonthlyCost)).toBe(true);
  });

  it("calculates the revenue needed to cover monthly costs", () => {
    const financial = createGame("beginner", 1).financial;
    const status = calculateBusinessStatus(financial);
    const contribution = status.breakEvenRevenue * (1 - financial.variableCostRate);
    expect(contribution).toBeCloseTo(financial.monthlyFixedCosts + status.depreciation + status.interest, -1);
  });

  it("connects working capital to receivables, inventory and payables", () => {
    const financial = createGame("standard", 1).financial;
    const status = calculateBusinessStatus(financial);
    expect(status.workingCapital).toBe(financial.balance.receivables + financial.balance.inventory - financial.balance.payables);
  });
});
