import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:5000";

function Income({ onBalanceChange }) { // receives a function to update balance
  const [incomes, setIncomes] = useState([]);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    income_date: ''
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE}/income`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncomes(response.data);
      if (onBalanceChange) onBalanceChange(); // update balance whenever incomes load
    } catch (error) {
      console.error("Error fetching incomes:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(formData.amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    setError("");

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_BASE}/income`, { ...formData, amount: numericAmount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({ source: '', amount: '', income_date: '' });
      fetchIncomes();
    } catch (error) {
      console.error("Error adding income:", error);
      alert("Failed to add income");
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE}/income/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchIncomes();
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="income">
      <h2>Add Income</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="source"
          placeholder="Source"
          value={formData.source}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          required
        />
        <input
          type="date"
          name="income_date"
          value={formData.income_date}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Income</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <h2>Income Table</h2>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {incomes.map(i => (
            <tr key={i._id}>
              <td>{i.source}</td>
              <td>{i.amount}</td>
              <td>{new Date(i.income_date).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleDelete(i._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Income;
