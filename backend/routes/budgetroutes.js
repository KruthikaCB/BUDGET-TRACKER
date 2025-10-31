import express from "express";
import Budget from "../models/budget.js";

const router = express.Router();

// Add new budget
router.post("/", async (req, res) => {
  try {
    const budget = new Budget({
      userId: "tempUser",
      budgetMonth: req.body.budgetMonth,
      budgetAmount: req.body.budgetAmount,
    });
    const saved = await budget.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving budget:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all budgets
router.get("/", async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.json(budgets);
  } catch (err) {
    console.error("Error fetching budgets:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
