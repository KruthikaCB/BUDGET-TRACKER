import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  budgetMonth: { type: String, required: true }, // e.g., "2025-10"
  budgetAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Budget", budgetSchema);
