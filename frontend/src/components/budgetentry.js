import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Details.css';

const API_BASE = "http://localhost:5000";

function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    budgetMonth: '',
    budgetAmount: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    budget: 0,
    balance: 0
  });

  useEffect(() => {
    fetchBudgets();
    fetchStats();
  }, []);

  const fetchBudgets = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE}/budget`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(response.data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
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

  const handleEdit = (budget) => {
    setEditingId(budget._id);
    setEditForm({
      budgetMonth: budget.budgetMonth,
      budgetAmount: budget.budgetAmount
    });
  };

  const handleUpdate = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`${API_BASE}/budget/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        setEditingId(null);
        fetchBudgets();
        fetchStats();
        showToast('Budget updated successfully!');
      }
    } catch (error) {
      console.error("Error updating budget:", error);
      if (error.response) {
        alert(`Failed to update: ${error.response.data.message || error.response.data.error}`);
      } else {
        alert("Failed to update budget. Please check your connection.");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ budgetMonth: '', budgetAmount: '' });
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE}/budget/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBudgets();
      fetchStats();
      setDeleteConfirm(null);
      showToast('Budget deleted successfully!');
    } catch (error) {
      console.error("Error deleting budget:", error);
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
    csvContent += "Month,Budget Amount\n";
    
    budgets.forEach(budget => {
      const row = [
        budget.budgetMonth,
        budget.budgetAmount
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budget_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report downloaded successfully!');
  };

  return (
    <div className="details-container">
      <div className="details-header">
        <h2>Budget Management</h2>
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
        <p style={{color: 'white', fontSize: '14px', flex: 1}}>
          💡 View and manage your monthly budgets. Use "Budget Entry" tab to add new budgets.
        </p>
        <button className="download-btn" onClick={downloadReport}>
          📥 Download Report
        </button>
      </div>

      <div className="details-table">
        {budgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No Budgets Set</h3>
            <p>Go to "Budget Entry" tab to set your first monthly budget!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Budget Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => (
                <tr key={budget._id}>
                  {editingId === budget._id ? (
                    <>
                      <td>
                        <input
                          type="month"
                          value={editForm.budgetMonth}
                          onChange={(e) => setEditForm({...editForm, budgetMonth: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.budgetAmount}
                          onChange={(e) => setEditForm({...editForm, budgetAmount: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <button className="save-btn" onClick={() => handleUpdate(budget._id)}>
                          ✓ Save
                        </button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          ✕ Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{budget.budgetMonth}</td>
                      <td>₹{budget.budgetAmount}</td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEdit(budget)}>
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => setDeleteConfirm(budget._id)}
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
            <p>Are you sure you want to delete this budget?</p>
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

export default Budget;
