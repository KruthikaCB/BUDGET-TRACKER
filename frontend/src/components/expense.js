import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:5000";

function Expense() {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({ category: '', amount: '', expense_date: '' });
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetchExpenses();
    calculateBalance();
  }, []);

  const fetchExpenses = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE}/expense`, { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(response.data);
      calculateBalance(); // recalc balance
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const calculateBalance = async () => {
    const token = localStorage.getItem('token');
    try {
      const [incomeRes, expenseRes] = await Promise.all([
        axios.get(`${API_BASE}/income`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/expense`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const today = new Date();
      const month = today.getMonth();
      const year = today.getFullYear();

      const monthlyIncome = incomeRes.data
        .filter(i => { const d = new Date(i.income_date); return d.getMonth() === month && d.getFullYear() === year })
        .reduce((sum, i) => sum + i.amount, 0);

      const monthlyExpense = expenseRes.data
        .filter(e => { const d = new Date(e.expense_date); return d.getMonth() === month && d.getFullYear() === year })
        .reduce((sum, e) => sum + e.amount, 0);

      setBalance(monthlyIncome - monthlyExpense);
    } catch (error) {
      console.error("Error calculating balance:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(formData.amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (numericAmount > balance) {
      setError(`Expense exceeds available balance of ₹${balance.toFixed(2)}.`);
      return;
    }

    setError("");

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_BASE}/expense`, { ...formData, amount: numericAmount }, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ category: '', amount: '', expense_date: '' });
      fetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense");
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE}/expense/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="expense">
      <h2>Add Expense</h2>
      <p>Available balance for this month: ₹{balance.toFixed(2)}</p>
      <form onSubmit={handleSubmit}>
        <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
        <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} min="0.01" step="0.01" required />
        <input type="date" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
        <button type="submit">Add Expense</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      <h2>Expense Table</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(e => (
            <tr key={e._id}>
              <td>{e.category}</td>
              <td>{e.amount}</td>
              <td>{new Date(e.expense_date).toLocaleDateString()}</td>
              <td><button onClick={() => handleDelete(e._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Expense;
