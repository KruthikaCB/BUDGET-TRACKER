import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Details.css';

const API_BASE = "http://localhost:5000";

function ExpenseDetails() {
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('September');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    budget: 0,
    balance: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    category: '',
    amount: '',
    expense_date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, []);

  const fetchExpenses = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE}/expense`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
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

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setEditForm({
      category: expense.category,
      amount: expense.amount,
      expense_date: new Date(expense.expense_date).toISOString().split('T')[0]
    });
  };

  const handleUpdate = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`${API_BASE}/expense/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        setEditingId(null);
        fetchExpenses();
        fetchStats();
        showToast('Expense updated successfully!');
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      if (error.response) {
        alert(`Failed to update: ${error.response.data.message || error.response.data.error}`);
      } else {
        alert("Failed to update expense. Please check your connection.");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ category: '', amount: '', expense_date: '' });
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE}/expense/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchExpenses();
      fetchStats();
      setDeleteConfirm(null);
      showToast('Expense deleted successfully!');
    } catch (error) {
      console.error("Error deleting expense:", error);
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
    csvContent += "Category,Amount,Date of Expense,Date of Entry\n";
    
    filteredAndSortedExpenses().forEach(expense => {
      const row = [
        expense.category,
        expense.amount,
        new Date(expense.expense_date).toLocaleDateString(),
        new Date(expense.createdAt).toLocaleString()
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expense_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report downloaded successfully!');
  };

  const filteredAndSortedExpenses = () => {
    let filtered = expenses.filter(expense =>
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'amount-high') return b.amount - a.amount;
      if (sortBy === 'amount-low') return a.amount - b.amount;
      if (sortBy === 'date') return new Date(b.expense_date) - new Date(a.expense_date);
      return 0;
    });

    return filtered;
  };

  return (
    <div className="details-container">
      <div className="details-header">
        <h2>EXPENSE DETAILS</h2>
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
            placeholder="🔍 Search by category..."
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
        {filteredAndSortedExpenses().length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <h3>No Expense Entries Found</h3>
            <p>Start tracking your expenses by adding entries in the Expense Entry tab.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Date of Expense</th>
                <th>Date of Entry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedExpenses().map((expense) => (
                <tr key={expense._id}>
                  {editingId === expense._id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) => setEditForm({...editForm, category: e.target.value})}
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
                          value={editForm.expense_date}
                          onChange={(e) => setEditForm({...editForm, expense_date: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>{new Date(expense.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="save-btn" onClick={() => handleUpdate(expense._id)}>
                          ✓ Save
                        </button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          ✕ Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{expense.category}</td>
                      <td>₹{expense.amount}</td>
                      <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                      <td>{new Date(expense.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEdit(expense)}>
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => setDeleteConfirm(expense._id)}
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
            <p>Are you sure you want to delete this expense entry?</p>
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

export default ExpenseDetails;
