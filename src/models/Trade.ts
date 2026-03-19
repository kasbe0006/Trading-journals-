import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const TradeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    entry: { type: Number, required: true },
    stopLoss: { type: Number, required: true },
    takeProfit: { type: Number, required: true },
    direction: { type: String, enum: ["LONG", "SHORT"], required: true },
    rrRatio: { type: Number, required: true },
    result: { type: String, enum: ["win", "loss", "breakeven"], default: "breakeven" },
    pnl: { type: Number, default: 0 },
    strategyTag: { type: String, default: "" },
    notes: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    tags: [{ type: String }],
    emotion: {
      type: String,
      enum: ["fear", "confidence", "greed", "calm", "frustration"],
      default: "calm",
    },
    followedPlan: { type: Boolean, default: true },
    riskPercent: { type: Number, default: 1 },
    replayNotes: { type: String, default: "" },
    aiReview: { type: String, default: "" },
  },
  { timestamps: true }
);

TradeSchema.index({ userId: 1, createdAt: -1 });
TradeSchema.index({ userId: 1, strategyTag: 1 });

export type ITrade = InferSchemaType<typeof TradeSchema> & { _id: mongoose.Types.ObjectId };

export const Trade: Model<ITrade> =
  (mongoose.models.Trade as Model<ITrade>) || mongoose.model<ITrade>("Trade", TradeSchema);
