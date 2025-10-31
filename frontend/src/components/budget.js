import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:5000";

function Budget({ onBalanceChange }) {
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({ budgetMonth: '', budgetAmount: '' });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE}/budget`, { headers: { Authorization: `Bearer ${token}` } });
      setBudgets(response.data);
      if (onBalanceChange) onBalanceChange(); // update balance whenever budgets change
    } catch (error) {
      console.error("Error fetching budgets:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(formData.budgetAmount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Budget amount must be greater than zero.");
      return;
    }

    setError("");

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_BASE}/budget`, { ...formData, budgetAmount: numericAmount }, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ budgetMonth: '', budgetAmount: '' });
      fetchBudgets();
    } catch (error) {
      console.error("Error adding budget:", error);
      alert("Failed to save budget");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="budget">
      <h2>Set Budget</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="month"
          name="budgetMonth"
          value={formData.budgetMonth}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="budgetAmount"
          placeholder="Budget Amount"
          value={formData.budgetAmount}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          required
        />
        <button type="submit">Save Budget</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      <h2>Budget Table</h2>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((budget) => (
            <tr key={budget._id}>
              <td>{budget.budgetMonth}</td>
              <td>{budget.budgetAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Budget;
