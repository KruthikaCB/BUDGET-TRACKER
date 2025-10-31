import express from "express";
import Expense from "../models/expense.js";

const router = express.Router();

// Add new expense
router.post("/", async (req, res) => {
  try {
    const expense = new Expense({
      userId: "tempUser",
      category: req.body.category,
      amount: req.body.amount,
      expense_date: req.body.expense_date,
    });
    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving expense:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete expense
router.delete("/:id", async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
