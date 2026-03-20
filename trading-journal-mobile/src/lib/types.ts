export type User = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
};

export type Trade = {
  _id?: string;
  id?: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entry: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize?: number;
  rrRatio?: number;
  pnl?: number;
  result?: "WIN" | "LOSS" | "BREAKEVEN";
  strategyTag?: string;
  notes?: string;
  tradedAt?: string;
};

export type CreateTradePayload = {
  symbol: string;
  direction: "LONG" | "SHORT";
  entry: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  strategyTag?: string;
  notes?: string;
};
