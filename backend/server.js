// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "./models/user.js";
import Budget from "./models/budget.js";
import Income from "./models/income.js";
import Expense from "./models/expense.js";

const app = express();
const PORT = 5000;
const JWT_SECRET = "your_secret_key_here"; // Change this to a secure secret

// ---------------- Middleware ----------------
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ---------------- MongoDB Connection ----------------
const MONGODB_URI = "mongodb+srv://kruthikaUser:Kalpana%2A1234@cluster0.x1he6qj.mongodb.net/budgetTrackerDB?retryWrites=true&w=majority";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:");
    console.error(err);
    process.exit(1);
  });

// ---------------- Auth Middleware ----------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.userId = user.id;
    next();
  });
};

// ---------------- Auth Routes ----------------

// Signup
app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: "User created successfully",
      token,
      userId: user._id,
      email: user.email
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Login successful",
      token,
      userId: user._id,
      email: user.email
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Income Routes ----------------
app.post("/income", authenticateToken, async (req, res) => {
  const { source, amount, income_date } = req.body;
  try {
    const income = new Income({ 
      userId: req.userId,
      source, 
      amount, 
      income_date 
    });
    await income.save();
    res.json(income);
  } catch (err) {
    console.error("Income Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/income", authenticateToken, async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.userId }).sort({ income_date: -1 });
    res.json(incomes);
  } catch (err) {
    console.error("Fetch Income Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update income
app.put("/income/:id", authenticateToken, async (req, res) => {
  try {
    const { source, amount, income_date } = req.body;
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { source, amount, income_date },
      { new: true, runValidators: true }
    );
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }
    res.json(income);
  } catch (err) {
    console.error("Update Income Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/income/:id", authenticateToken, async (req, res) => {
  try {
    await Income.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete Income Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Expense Routes ----------------
app.post("/expense", authenticateToken, async (req, res) => {
  const { category, amount, expense_date } = req.body;
  try {
    const expense = new Expense({ 
      userId: req.userId,
      category, 
      amount, 
      expense_date 
    });
    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error("Expense Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/expense", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId }).sort({ expense_date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error("Fetch Expense Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update expense
app.put("/expense/:id", authenticateToken, async (req, res) => {
  try {
    const { category, amount, expense_date } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { category, amount, expense_date },
      { new: true }
    );
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(expense);
  } catch (err) {
    console.error("Update Expense Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/expense/:id", authenticateToken, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete Expense Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Budget Routes ----------------
app.post("/budget", authenticateToken, async (req, res) => {
  const { budgetMonth, budgetAmount } = req.body;
  try {
    const budget = new Budget({ 
      userId: req.userId,
      budgetMonth, 
      budgetAmount 
    });
    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error("Budget Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/budget", authenticateToken, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId }).sort({ budgetMonth: -1 });
    res.json(budgets);
  } catch (err) {
    console.error("Fetch Budget Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update budget
app.put("/budget/:id", authenticateToken, async (req, res) => {
  try {
    const { budgetMonth, budgetAmount } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { budgetMonth, budgetAmount },
      { new: true, runValidators: true }
    );
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    res.json(budget);
  } catch (err) {
    console.error("Update Budget Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete budget
app.delete("/budget/:id", authenticateToken, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete Budget Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Start Server ----------------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
