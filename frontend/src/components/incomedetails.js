import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Details.css';

const API_BASE = "http://localhost:5000";

function IncomeDetails() {
  const [incomes, setIncomes] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('September');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    budget: 0,
    balance: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    source: '',
    amount: '',
    income_date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchIncomes();
    fetchStats();
  }, []);

  const fetchIncomes = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE}/income`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncomes(response.data);
    } catch (error) {
      console.error("Error fetching incomes:", error);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [incomeRes, expenseRes, budgetRes] = await Promise.all([
        axios.get(`${API_BASE}/income`, config),
        axios.get(`${API_BASE}/expense`, config),
        axios.get(`${API_BASE}/budget`, config)
      ]);

      const totalIncome = incomeRes.data.reduce((sum, i) => sum + i.amount, 0);
      const totalExpense = expenseRes.data.reduce((sum, e) => sum + e.amount, 0);
      const budget = budgetRes.data.reduce((sum, b) => sum + b.budgetAmount, 0);
      const balance = totalIncome - totalExpense;

      setStats({ totalIncome, totalExpense, budget, balance });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleEdit = (income) => {
    setEditingId(income._id);
    setEditForm({
      source: income.source,
      amount: income.amount,
      income_date: new Date(income.income_date).toISOString().split('T')[0]
    });
  };

  const handleUpdate = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`${API_BASE}/income/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        setEditingId(null);
        fetchIncomes();
        fetchStats();
        showToast('Income updated successfully!');
      }
    } catch (error) {
      console.error("Error updating income:", error);
      if (error.response) {
        alert(`Failed to update: ${error.response.data.message || error.response.data.error}`);
      } else {
        alert("Failed to update income. Please check your connection.");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ source: '', amount: '', income_date: '' });
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE}/income/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchIncomes();
      fetchStats();
      setDeleteConfirm(null);
      showToast('Income deleted successfully!');
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const downloadReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Source of Income,Amount,Date of Income,Date of Entry\n";
    
    filteredAndSortedIncomes().forEach(income => {
      const row = [
        income.source,
        income.amount,
        new Date(income.income_date).toLocaleDateString(),
        new Date(income.createdAt).toLocaleString()
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `income_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report downloaded successfully!');
  };

  const filteredAndSortedIncomes = () => {
    let filtered = incomes.filter(income =>
      income.source.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'amount-high') return b.amount - a.amount;
      if (sortBy === 'amount-low') return a.amount - b.amount;
      if (sortBy === 'date') return new Date(b.income_date) - new Date(a.income_date);
      return 0;
    });

    return filtered;
  };

  return (
    <div className="details-container">
      <div className="details-header">
        <h2>INCOME DETAILS</h2>
        <div className="stats-bar">
          <div className="stat-item">
            <span>Total Income: {stats.totalIncome}</span>
          </div>
          <div className="stat-item">
            <span>Total Expense: {stats.totalExpense}</span>
          </div>
          <div className="stat-item">
            <span>Budget to be maintained: {stats.budget.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className={stats.balance >= 0 ? 'positive' : 'negative'}>
              Balance: {stats.balance}
            </span>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search by source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-sort">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Sort by Date</option>
            <option value="amount-high">Amount (High to Low)</option>
            <option value="amount-low">Amount (Low to High)</option>
          </select>
        </div>

        <button className="download-btn" onClick={downloadReport}>
          📥 Download Report
        </button>
      </div>

      <div className="details-table">
        {filteredAndSortedIncomes().length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Income Entries Found</h3>
            <p>Start tracking your income by adding entries in the Income Entry tab.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Source of Income</th>
                <th>Amount</th>
                <th>Date of Income</th>
                <th>Date of Entry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedIncomes().map((income) => (
                <tr key={income._id}>
                  {editingId === income._id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editForm.source}
                          onChange={(e) => setEditForm({...editForm, source: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={editForm.income_date}
                          onChange={(e) => setEditForm({...editForm, income_date: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>{new Date(income.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="save-btn" onClick={() => handleUpdate(income._id)}>
                          ✓ Save
                        </button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          ✕ Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{income.source}</td>
                      <td>₹{income.amount}</td>
                      <td>{new Date(income.income_date).toLocaleDateString()}</td>
                      <td>{new Date(income.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEdit(income)}>
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => setDeleteConfirm(income._id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this income entry?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="confirm-delete-btn" onClick={() => handleDelete(deleteConfirm)}>
                Yes, Delete
              </button>
              <button className="cancel-modal-btn" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncomeDetails;
