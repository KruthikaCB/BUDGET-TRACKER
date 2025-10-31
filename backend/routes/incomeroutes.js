import express from "express";
import Income from "../models/income.js";

const router = express.Router();

// Add new income
router.post("/", async (req, res) => {
  try {
    const income = new Income({
      userId: "tempUser", // placeholder until auth added
      source: req.body.source,
      amount: req.body.amount,
      income_date: req.body.income_date,
    });
    const saved = await income.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving income:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all income
router.get("/", async (req, res) => {
  try {
    const incomes = await Income.find();
    res.json(incomes);
  } catch (err) {
    console.error("Error fetching income:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete income
router.delete("/:id", async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting income:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
