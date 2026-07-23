export type Difficulty = "beginner" | "standard" | "advanced";
export type Screen = "title" | "game" | "result" | "final";
export type ActionCategory = "sales" | "cost" | "workingCapital" | "investment" | "finance";

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  initialCash: number;
  initialDebt: number;
  receivableMonths: number;
  duration: number;
  eventSeverity: number;
  eventChance: number;
  tutorial: boolean;
}

export interface IncomeStatement {
  revenue: number; cogs: number; grossProfit: number; payroll: number; marketing: number;
  rent: number; otherFixed: number; depreciation: number; interest: number; operatingProfit: number;
  pretaxProfit: number; tax: number; netIncome: number;
}
export interface BalanceSheet {
  cash: number; receivables: number; inventory: number; equipment: number; otherAssets: number;
  payables: number; shortDebt: number; longDebt: number; equity: number;
}
export interface CashFlowStatement {
  netIncome: number; depreciation: number; receivablesChange: number; inventoryChange: number;
  payablesChange: number; operatingCF: number; capex: number; investingCF: number;
  borrowing: number; repayment: number; equityRaised: number; financingCF: number;
  freeCF: number; cashChange: number;
}
export interface FinancialState {
  income: IncomeStatement;
  balance: BalanceSheet;
  cashFlow: CashFlowStatement;
  baseRevenue: number;
  growthRate: number;
  variableCostRate: number;
  monthlyFixedCosts: number;
  interestRate: number;
  receivableMonths: number;
  payableMonths: number;
}
export interface ActionEffect {
  revenueMultiplier?: number; fixedCostChange?: number; variableCostRateChange?: number;
  growthChange?: number; inventoryChange?: number; receivableMonthsChange?: number;
  payableMonthsChange?: number; capex?: number; borrowing?: number; repayment?: number;
  equityRaised?: number; creditChange?: number;
}
export interface PlayerAction {
  id: string; name: string; category: ActionCategory; ap: number; cashCost: number;
  risk: "低" | "中" | "高"; duration: number; delay: number; description: string; effect: ActionEffect;
  permanentEffect?: ActionEffect;
}
export interface EventResponse {
  id: string; label: string; description: string; cashCost: number; effect: ActionEffect;
}
export interface GameEvent {
  id: string; title: string; description: string; probability: number; minMonth?: number;
  advancedOnly?: boolean; effect: ActionEffect; duration: number; lesson: string;
  responses?: EventResponse[];
}
export interface ActiveEffect {
  source: string; remaining: number; startsIn: number; effect: ActionEffect;
  permanentEffect?: ActionEffect;
}
export interface MonthlyResult {
  month: number; openingCash: number; income: IncomeStatement; balance: BalanceSheet;
  cashFlow: CashFlowStatement; selectedActions: string[]; event?: GameEvent;
  lesson: string; goodDecision: string; improvement: string;
}
export interface GameState {
  version: 1; screen: Screen; difficulty: Difficulty; seed: number; rngState: number;
  month: number; duration: number; actionPoints: number; selectedActionIds: string[];
  selectedEventResponseId?: string;
  financial: FinancialState; creditScore: number; activeEffects: ActiveEffect[];
  currentEvent?: GameEvent; history: MonthlyResult[]; decisionHistory: string[];
  cumulativeRevenue: number; cumulativeProfit: number; cumulativeOperatingCF: number;
  cumulativeFreeCF: number; peakCashShortfall: number; insolventMonths: number;
  gameOverReason?: string;
}
export interface GameScore {
  rank: "S" | "A" | "B" | "C" | "D"; score: number; equityRatio: number;
  cashToSales: number; growth: number; stability: number; risk: string; type: string;
}
export interface SaveData { version: 1; savedAt: string; state: GameState; }
