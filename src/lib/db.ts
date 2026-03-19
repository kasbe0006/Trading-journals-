import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
};

type TradeRow = {
  id: string;
  user_id: string;
  symbol: string;
  traded_at: string;
  entry: number;
  exit_price: number;
  stop_loss: number;
  take_profit: number;
  direction: "LONG" | "SHORT";
  rr_ratio: number;
  result: "win" | "loss" | "breakeven";
  pnl: number;
  strategy_tag: string;
  notes: string;
  image_url: string;
  tags: string[];
  emotion: "fear" | "confidence" | "greed" | "calm" | "frustration";
  followed_plan: boolean;
  risk_percent: number;
  replay_notes: string;
  ai_review: string;
  created_at: string;
  updated_at: string;
};

export type DbUser = {
  _id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DbTrade = {
  _id: string;
  userId: string;
  symbol: string;
  tradedAt: Date;
  entry: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  direction: "LONG" | "SHORT";
  rrRatio: number;
  result: "win" | "loss" | "breakeven";
  pnl: number;
  strategyTag: string;
  notes: string;
  imageUrl: string;
  tags: string[];
  emotion: "fear" | "confidence" | "greed" | "calm" | "frustration";
  followedPlan: boolean;
  riskPercent: number;
  replayNotes: string;
  aiReview: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreateTradeInput = {
  userId: string;
  symbol: string;
  tradedAt: Date;
  entry: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  direction: "LONG" | "SHORT";
  rrRatio: number;
  result: "win" | "loss" | "breakeven";
  pnl: number;
  strategyTag?: string;
  notes?: string;
  imageUrl?: string;
  tags?: string[];
  emotion?: "fear" | "confidence" | "greed" | "calm" | "frustration";
  followedPlan?: boolean;
  riskPercent?: number;
  replayNotes?: string;
  aiReview?: string;
};

type UpdateTradeInput = Partial<Omit<CreateTradeInput, "userId">>;

declare global {
  var pgReadyPromise: Promise<void> | null;
}

function getSql() {
  if (!env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL (or DATABASE_URL) is not configured");
  }
  return neon(env.POSTGRES_URL);
}

if (!global.pgReadyPromise) {
  global.pgReadyPromise = null;
}

function mapUser(row: UserRow): DbUser {
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapTrade(row: TradeRow): DbTrade {
  return {
    _id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    tradedAt: new Date(row.traded_at),
    entry: Number(row.entry),
    exitPrice: Number(row.exit_price),
    stopLoss: Number(row.stop_loss),
    takeProfit: Number(row.take_profit),
    direction: row.direction,
    rrRatio: Number(row.rr_ratio),
    result: row.result,
    pnl: Number(row.pnl),
    strategyTag: row.strategy_tag,
    notes: row.notes,
    imageUrl: row.image_url,
    tags: row.tags ?? [],
    emotion: row.emotion,
    followedPlan: row.followed_plan,
    riskPercent: Number(row.risk_percent),
    replayNotes: row.replay_notes,
    aiReview: row.ai_review,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function connectDB() {
  if (!env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL (or DATABASE_URL) is not configured");
  }

  if (!global.pgReadyPromise) {
    global.pgReadyPromise = initializePg();
  }

  await global.pgReadyPromise;
}

async function initializePg() {
  const sql = getSql();
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol text NOT NULL,
      traded_at timestamptz NOT NULL DEFAULT now(),
      entry double precision NOT NULL,
      exit_price double precision NOT NULL,
      stop_loss double precision NOT NULL,
      take_profit double precision NOT NULL,
      direction text NOT NULL CHECK (direction IN ('LONG','SHORT')),
      rr_ratio double precision NOT NULL,
      result text NOT NULL DEFAULT 'breakeven' CHECK (result IN ('win','loss','breakeven')),
      pnl double precision NOT NULL DEFAULT 0,
      strategy_tag text NOT NULL DEFAULT '',
      notes text NOT NULL DEFAULT '',
      image_url text NOT NULL DEFAULT '',
      tags text[] NOT NULL DEFAULT '{}',
      emotion text NOT NULL DEFAULT 'calm' CHECK (emotion IN ('fear','confidence','greed','calm','frustration')),
      followed_plan boolean NOT NULL DEFAULT true,
      risk_percent double precision NOT NULL DEFAULT 1,
      replay_notes text NOT NULL DEFAULT '',
      ai_review text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''`;

  await sql`CREATE INDEX IF NOT EXISTS trades_user_traded_idx ON trades (user_id, traded_at DESC, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS trades_user_strategy_idx ON trades (user_id, strategy_tag)`;

  if (env.AUTH_ENABLED && env.DEFAULT_ADMIN_ENABLED) {
    await ensureDefaultAdminUser();
  }
}

async function ensureDefaultAdminUser() {
  try {
    const sql = getSql();
    const username = env.DEFAULT_ADMIN_USERNAME.trim();
    const email = env.DEFAULT_ADMIN_EMAIL.trim().toLowerCase();
    const password = env.DEFAULT_ADMIN_PASSWORD;

    if (!username || !email || !password || password.length < 6) {
      console.warn("[db] Default admin skipped due to invalid DEFAULT_ADMIN_* values");
      return;
    }

    const existing = (await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`) as UserRow[];
    if (existing.length > 0) {
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    await sql`INSERT INTO users (name, email, password) VALUES (${username}, ${email}, ${hash})`;
    console.log(`[db] Default admin ensured for ${email}`);
  } catch (error) {
    console.error("[db] Failed to ensure default admin user", error);
  }
}

export async function findUserByIdentifier(identifier: string) {
  await connectDB();
  const sql = getSql();
  const trimmed = identifier.trim();
  const lower = trimmed.toLowerCase();
  const rows = (await sql`
    SELECT *
    FROM users
    WHERE lower(email) = ${lower} OR lower(name) = ${lower}
    LIMIT 1
  `) as UserRow[];
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserById(userId: string) {
  await connectDB();
  const sql = getSql();
  const rows = (await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`) as UserRow[];
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function listTradesByUser(userId: string) {
  await connectDB();
  const sql = getSql();
  const rows = (await sql`
    SELECT *
    FROM trades
    WHERE user_id = ${userId}
    ORDER BY traded_at DESC, created_at DESC
  `) as TradeRow[];
  return rows.map(mapTrade);
}

export async function findTradeById(userId: string, tradeId: string) {
  await connectDB();
  const sql = getSql();
  const rows = (await sql`
    SELECT *
    FROM trades
    WHERE id = ${tradeId} AND user_id = ${userId}
    LIMIT 1
  `) as TradeRow[];
  return rows[0] ? mapTrade(rows[0]) : null;
}

export async function createTrade(input: CreateTradeInput) {
  await connectDB();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO trades (
      user_id,
      symbol,
      traded_at,
      entry,
      exit_price,
      stop_loss,
      take_profit,
      direction,
      rr_ratio,
      result,
      pnl,
      strategy_tag,
      notes,
      image_url,
      tags,
      emotion,
      followed_plan,
      risk_percent,
      replay_notes,
      ai_review
    ) VALUES (
      ${input.userId},
      ${input.symbol.trim().toUpperCase()},
      ${input.tradedAt},
      ${input.entry},
      ${input.exitPrice},
      ${input.stopLoss},
      ${input.takeProfit},
      ${input.direction},
      ${input.rrRatio},
      ${input.result},
      ${input.pnl},
      ${input.strategyTag ?? ""},
      ${input.notes ?? ""},
      ${input.imageUrl ?? ""},
      ${input.tags ?? []},
      ${input.emotion ?? "calm"},
      ${input.followedPlan ?? true},
      ${input.riskPercent ?? 1},
      ${input.replayNotes ?? ""},
      ${input.aiReview ?? ""}
    )
    RETURNING *
  `) as TradeRow[];
  return mapTrade(rows[0]);
}

export async function updateTrade(userId: string, tradeId: string, input: UpdateTradeInput) {
  await connectDB();
  const sql = getSql();
  const rows = (await sql`
    UPDATE trades
    SET
      symbol = COALESCE(${input.symbol?.trim().toUpperCase() ?? null}, symbol),
      traded_at = COALESCE(${input.tradedAt ?? null}, traded_at),
      entry = COALESCE(${input.entry ?? null}, entry),
      exit_price = COALESCE(${input.exitPrice ?? null}, exit_price),
      stop_loss = COALESCE(${input.stopLoss ?? null}, stop_loss),
      take_profit = COALESCE(${input.takeProfit ?? null}, take_profit),
      direction = COALESCE(${input.direction ?? null}, direction),
      rr_ratio = COALESCE(${input.rrRatio ?? null}, rr_ratio),
      result = COALESCE(${input.result ?? null}, result),
      pnl = COALESCE(${input.pnl ?? null}, pnl),
      strategy_tag = COALESCE(${input.strategyTag ?? null}, strategy_tag),
      notes = COALESCE(${input.notes ?? null}, notes),
      image_url = COALESCE(${input.imageUrl ?? null}, image_url),
      tags = COALESCE(${input.tags ?? null}, tags),
      emotion = COALESCE(${input.emotion ?? null}, emotion),
      followed_plan = COALESCE(${input.followedPlan ?? null}, followed_plan),
      risk_percent = COALESCE(${input.riskPercent ?? null}, risk_percent),
      replay_notes = COALESCE(${input.replayNotes ?? null}, replay_notes),
      ai_review = COALESCE(${input.aiReview ?? null}, ai_review),
      updated_at = now()
    WHERE id = ${tradeId} AND user_id = ${userId}
    RETURNING *
  `) as TradeRow[];
  return rows[0] ? mapTrade(rows[0]) : null;
}

export async function deleteTrade(userId: string, tradeId: string) {
  await connectDB();
  const sql = getSql();
  const rows = (await sql`
    DELETE FROM trades
    WHERE id = ${tradeId} AND user_id = ${userId}
    RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function insertTradesBulk(inputs: CreateTradeInput[]) {
  await connectDB();
  for (const input of inputs) {
    await createTrade(input);
  }
}
