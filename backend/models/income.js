import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, required: true },
    amount: { type: Number, required: true },
    income_date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Income", incomeSchema);
